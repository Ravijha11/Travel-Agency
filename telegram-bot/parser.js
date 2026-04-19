const { computeDepartureFromMessage } = require("./timeHelper");

const RE_LAHAR_TO_GW = [
  /lahar\s*[-–]?\s*to\s*[-–]?\s*gwalior/i,
  /lahar\s+to\s+gwalior/i,
  /लहार\s+से\s+ग्वालियर/i,
  /लाहर\s+से\s+ग्वालियर/i,
  /लहर\s+से\s+ग्वालियर/i,
  /लहार\s+से\s+.*ग्वालियर/i,
  /लाहर\s+से\s+.*ग्वालियर/i,
  /लहर\s+से\s+.*ग्वालियर/i,
];

const RE_GW_TO_LAHAR = [
  /gwalior\s*[-–]?\s*to\s*[-–]?\s*lahar/i,
  /gwalior\s+to\s+lahar/i,
  /ग्वालियर\s+से\s+लहार/i,
  /ग्वालियर\s+से\s+लाहर/i,
  /ग्वालियर\s+से\s+लहर/i,
];

const RE_PHONE = /\b([6-9]\d{9})\b/g;

function normalizeText(text) {
  return String(text || "")
    .replace(/\u200c|\u200d/g, "")
    .trim();
}

/** Remove phones so price regex does not latch onto mobile numbers. */
function stripPhones(text) {
  return text.replace(/\b[6-9]\d{9}\b/g, " ");
}

function detectDirections(text) {
  const t = text;
  let toGw = false;
  let toLh = false;
  for (const r of RE_LAHAR_TO_GW) {
    if (r.test(t)) {
      toGw = true;
      break;
    }
  }
  for (const r of RE_GW_TO_LAHAR) {
    if (r.test(t)) {
      toLh = true;
      break;
    }
  }
  if (toGw && toLh) return ["lahar_to_gwalior", "gwalior_to_lahar"];
  if (toGw) return ["lahar_to_gwalior"];
  if (toLh) return ["gwalior_to_lahar"];
  return [];
}

function extractPhones(text) {
  const phones = [];
  const seen = new Set();
  let m;
  const re = new RegExp(RE_PHONE.source, "g");
  while ((m = re.exec(text)) !== null) {
    const p = m[1];
    if (!seen.has(p)) {
      seen.add(p);
      phones.push(p);
    }
  }
  return phones;
}

function extractDriverName(text, phone) {
  const lines = text.split(/[\n\r]+/);
  const nameRe =
    /([\u0900-\u0fffA-Za-zÀ-ÖØ-öø-ÿ][\u0900-\u0fffA-Za-zÀ-ÖØ-öø-ÿ\s]{0,40}?)\s*(?:जी|ji|Ji)\b/u;
  for (const line of lines) {
    if (line.includes(phone)) {
      const after = line.slice(line.indexOf(phone) + phone.length).trim();
      const ma = after.match(nameRe);
      if (ma) return ma[1].replace(/\s+/g, " ").trim();
      const before = line.slice(0, line.indexOf(phone)).trim();
      const mb = before.match(nameRe);
      if (mb) return mb[1].replace(/\s+/g, " ").trim();
    }
  }
  for (const line of lines) {
    const ma = line.match(nameRe);
    if (ma) return ma[1].replace(/\s+/g, " ").trim();
  }
  return "";
}

/**
 * @param {string} text
 * @returns {number | null} seat count 1–12, or null if not found
 */
function extractSeats(text) {
  const t = stripPhones(text);
  const patterns = [
    /(\d{1,2})\s*(?:seat|seats|सीट|सीटें?|सिट)\b/i,
    /(?:seat|seats|सीट|सीटें?)[:.\s]*(\d{1,2})\b/i,
    /(?:खाली|खाली\s*गाड़ी|खाली\s*gadi)[^\d]{0,25}(\d{1,2})\b/i,
    /(\d{1,2})\s*(?:की\s*सीट|की\s*सीटें|ki\s*seat)\b/i,
  ];
  for (const re of patterns) {
    const m = t.match(re);
    if (m) {
      const n = Number(m[1]);
      if (n >= 1 && n <= 12) return n;
    }
  }
  const hw = [
    ["एक", 1],
    ["दो", 2],
    ["तीन", 3],
    ["चार", 4],
    ["पांच", 5],
    ["पाँच", 5],
    ["पाच", 5],
    ["छह", 6],
    ["छः", 6],
    ["सात", 7],
    ["आठ", 8],
    ["नौ", 9],
    ["दस", 10],
  ];
  for (const [w, d] of hw) {
    if (new RegExp(`${w}\\s*(?:सीट|seat)`, "i").test(text)) return d;
  }
  return null;
}

/**
 * @param {string} text
 * @returns {number | null} INR per seat, or null
 */
function extractPricePerSeat(text) {
  const t = stripPhones(text);
  /** Order: more specific phrases first; avoids bare years like 2026. */
  const patterns = [
    /(?:₹|Rs\.?|INR|rs\.?|rupees?|रुपये|रूपए|रूपये|रु\.?)\s*(\d{2,5})\b/i,
    /\b(?:charge|चार्जे?)\b\s*[:\s]*(\d{2,5})\b/i,
    /चार्ज\s*[:\s]*(\d{2,5})\b/,
    /\b(\d{2,5})\s*(?:charge|चार्जे?)\b/i,
    /\b(?:किराया|kiraya|kiraye|किराये)[:.\s]*(\d{2,5})\b/i,
    /\b(?:भाड़ा|bhada|भाडा)[:.\s]*(\d{2,5})\b/i,
    /\b(?:दाम|daam|rate|रेट|रेटे)[:.\s]*(\d{2,5})\b/i,
    /\b(?:लगेगा|लगेगी|होगा|होगी|लगे)[:.\s]*(\d{2,5})\b/i,
    /\b(?:मात्र|matra|only)[:.\s]*(\d{2,5})\b/i,
    /\b(\d{2,5})\s*(?:मात्र|only)\b/i,
    /प्रति\s*सीट\s*(\d{2,5})\b/i,
    /\b(\d{2,5})\s*(?:per\s*seat|प्रति\s*सीट)\b/i,
    /\b(\d{2,5})\s*(?:₹|\/-|\/\s*seat|rs\.?|rupees?|रूप|रु)\b/i,
    /\b(?:seat|सीट)\s*(?:price|रेट|दाम)?[:.\s]*(\d{2,5})\b/i,
    /\b(?:price|प्राइस)[:.\s]*(\d{2,5})\b/i,
    /\b(\d{2,5})\s*\/\s*seat\b/i,
  ];
  for (const re of patterns) {
    const m = t.match(re);
    if (m) {
      const n = Number(m[1]);
      if (Number.isNaN(n) || n < 10 || n > 99_999) continue;
      return n;
    }
  }
  return null;
}

function detectCar(text) {
  const lower = text.toLowerCase();
  let carType = "";
  if (/ertiga/i.test(text)) carType = "Ertiga";
  else if (/innova/i.test(text)) carType = "Innova";
  else if (/sumo/i.test(text)) carType = "Sumo";
  else if (/travell?er|ट्रेवलर|ट्रैवलर/i.test(text))
    carType = "Traveller";
  else if (/luxury|लग्जरी/i.test(text)) carType = "Luxury";
  else if (/swift|शिप्ट|स्विफ्ट|dzire|डिजायर|डिज़ायर/i.test(text))
    carType = "Swift Dzire";
  if (/शिप्ट\s*डिजायर|shift\s*dzire/i.test(text)) carType = "Swift Dzire";
  const isAc =
    /\bac\b/i.test(lower) ||
    /ए\.?\s*सी\.?/i.test(text) ||
    /एसी/i.test(text);
  return { carType, isAc };
}

/** String passed to catalog resolver (admin `label` + `aliases` + fuzzy). */
function buildCarMatchQuery(text, { carType }) {
  if (carType) return carType;
  const stripped = stripPhones(text).replace(/\s+/g, " ").trim();
  return stripped.slice(0, 200);
}

function detectDaily(text) {
  return (
    /\bdaily\b/i.test(text) ||
    /डेली/i.test(text) ||
    /डेली\s+सर्विस/i.test(text)
  );
}

/**
 * @param {string} raw
 * @param {{ strictRoute?: boolean, now?: Date }} opts
 */
function parseTripMessage(raw, opts = {}) {
  const text = normalizeText(raw);
  const now = opts.now || new Date();
  const reasons = [];

  const phones = extractPhones(text);
  if (!phones.length) {
    reasons.push("No 10-digit Indian mobile found (must start with 6–9).");
    return { ok: false, reasons, skip: true };
  }

  let directions = detectDirections(text);
  if (!directions.length) {
    if (opts.strictRoute) {
      return { ok: false, skip: true, silent: true };
    }
    reasons.push("No explicit route; defaulting to Lahar → Gwalior.");
    directions = ["lahar_to_gwalior"];
  }

  const { departure, isUrgent: timeUrgent, end } =
    computeDepartureFromMessage(text, now);
  if (!departure || Number.isNaN(departure.getTime())) {
    reasons.push("Could not understand departure time from the message.");
    return { ok: false, reasons, skip: false, phones, directions };
  }

  const { carType, isAc } = detectCar(text);
  const carMatchQuery = buildCarMatchQuery(text, { carType });
  const isDaily = detectDaily(text);
  const isUrgent =
    timeUrgent || /तत्काल|tatkal|\burgent\b/i.test(text);

  const availableSeats = extractSeats(text);
  const pricePerSeat = extractPricePerSeat(text);

  const driverNames = {};
  for (const p of phones) {
    const n = extractDriverName(text, p);
    if (n) driverNames[p] = n;
  }

  return {
    ok: true,
    reasons,
    directions,
    phones,
    driverNames,
    departure,
    end,
    carType,
    isAc,
    carMatchQuery,
    isUrgent,
    isDaily,
    availableSeats,
    pricePerSeat,
  };
}

module.exports = {
  parseTripMessage,
  extractPhones,
  detectDirections,
  extractSeats,
  extractPricePerSeat,
};
