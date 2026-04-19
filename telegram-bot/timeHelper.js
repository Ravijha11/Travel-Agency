/** Asia/Kolkata (IST) helpers and departure resolution for driver messages. */

const TZ = "Asia/Kolkata";

function pad2(n) {
  return n < 10 ? `0${n}` : String(n);
}

function istCalendarDateString(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function istWallClockParts(d) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(d);
  const get = (type) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

function istLocalDateTimeToUtcDate(dateYmd, hour, minute) {
  const [y, m, d] = dateYmd.split("-").map(Number);
  if (!y || !m || !d) return new Date(NaN);
  return new Date(
    `${y}-${pad2(m)}-${pad2(d)}T${pad2(hour)}:${pad2(minute)}:00+05:30`,
  );
}

function istAddCalendarDays(dateYmd, deltaDays) {
  const [y, m, d] = dateYmd.split("-").map(Number);
  if (!y || !m || !d) return dateYmd;
  const noon = new Date(`${y}-${pad2(m)}-${pad2(d)}T12:00:00+05:30`);
  noon.setTime(noon.getTime() + deltaDays * 86_400_000);
  return istCalendarDateString(noon);
}

/**
 * Pick the next valid instant for a wall time (IST), including “already passed” rules.
 * @param {Date} now
 * @param {number} hour24
 * @param {number} minute
 * @param {{ morning?: boolean, afternoon?: boolean, tomorrow?: boolean }} hint
 */
function nextIstOccurrence(now, hour24, minute, hint = {}) {
  const todayYmd = istCalendarDateString(now);
  const { hour: nowH } = istWallClockParts(now);

  if (hint.tomorrow) {
    const y = istAddCalendarDays(todayYmd, 1);
    return istLocalDateTimeToUtcDate(y, hour24, minute);
  }

  if (hint.afternoon) {
    const h = hour24 < 12 ? hour24 + 12 : hour24;
    let t = istLocalDateTimeToUtcDate(todayYmd, h, minute);
    if (t.getTime() <= now.getTime()) {
      const y = istAddCalendarDays(todayYmd, 1);
      t = istLocalDateTimeToUtcDate(y, h, minute);
    }
    return t;
  }

  if (hint.morning) {
    const h = hour24 >= 12 ? hour24 - 12 : hour24;
    let t = istLocalDateTimeToUtcDate(todayYmd, h, minute);
    if (t.getTime() <= now.getTime()) {
      const y = istAddCalendarDays(todayYmd, 1);
      t = istLocalDateTimeToUtcDate(y, h, minute);
    }
    return t;
  }

  let t = istLocalDateTimeToUtcDate(todayYmd, hour24, minute);
  if (t.getTime() > now.getTime()) return t;

  if (hour24 < 12) {
    if (nowH < 13) {
      const pm = istLocalDateTimeToUtcDate(todayYmd, hour24 + 12, minute);
      if (pm.getTime() > now.getTime()) return pm;
    }
    const y = istAddCalendarDays(todayYmd, 1);
    return istLocalDateTimeToUtcDate(y, hour24, minute);
  }

  const y = istAddCalendarDays(todayYmd, 1);
  return istLocalDateTimeToUtcDate(y, hour24, minute);
}

function parseRelativeUrgentDeparture(text, now) {
  const t = text.replace(/\s+/g, " ").trim();

  const minMatch = t.match(
    /(\d+)\s*(?:मिनट|min(?:ute)?s?)\s*(?:में|mein|me)/i,
  );
  if (minMatch) {
    const n = Number(minMatch[1]);
    if (n > 0 && n < 24 * 60) {
      return {
        departure: new Date(now.getTime() + n * 60_000),
        isUrgent: true,
        end: null,
      };
    }
  }

  const hrMatch = t.match(
    /(\d+)\s*(?:घंट|घंटे|hour|hr)s?\s*(?:में|mein|me)/i,
  );
  if (hrMatch) {
    const n = Number(hrMatch[1]);
    if (n > 0 && n <= 48) {
      return {
        departure: new Date(now.getTime() + n * 3_600_000),
        isUrgent: true,
        end: null,
      };
    }
  }

  if (/\b30\s*मिनट\s*में\b/u.test(t) || /\b30\s*min/i.test(t)) {
    return {
      departure: new Date(now.getTime() + 30 * 60_000),
      isUrgent: true,
      end: null,
    };
  }
  if (/\b1\s*घंटे?\s*में\b/u.test(t) || /\b1\s*hour\b/i.test(t)) {
    return {
      departure: new Date(now.getTime() + 60 * 60_000),
      isUrgent: true,
      end: null,
    };
  }

  return null;
}

/**
 * @returns {{ hour24: number, minute: number, endHour24?: number, endMinute?: number, morningHint: boolean, afternoonHint: boolean } | null}
 */
function extractFirstClock(text) {
  const morningHint =
    /सुबह|\bsubah\b|\bmorning\b|\bअभी\s+सुबह\b/i.test(text) ||
    (/सुबह/i.test(text) && /\d/.test(text));
  const afternoonHint =
    /शाम|\bshaam\b|\bevening\b|\bदोपहर\b|\bdopahar\b|\bnight\b|\brat\b|\bरात\b/i.test(
      text,
    );
  const explicitPm = /\bpm\b/i.test(text);
  const explicitAm = /\bam\b/i.test(text) && !explicitPm;

  const range = text.match(
    /(\d{1,2})\s*[:.]\s*(\d{2})\s*(?:बजे)?\s*(?:से|se|-)\s*(\d{1,2})\s*[:.]\s*(\d{2})/i,
  );
  let h;
  let m;
  let endH;
  let endM;
  if (range) {
    h = Number(range[1]);
    m = Number(range[2]);
    endH = Number(range[3]);
    endM = Number(range[4]);
  } else {
    const simple = text.match(/(\d{1,2})\s*[:.]\s*(\d{2})/);
    if (!simple) return null;
    h = Number(simple[1]);
    m = Number(simple[2]);
  }
  if (h > 23 || m > 59) return null;
  if (endH != null && (endH > 23 || endM > 59)) {
    endH = undefined;
    endM = undefined;
  }

  let hour24 = h;
  if (explicitPm && hour24 < 12) hour24 += 12;
  if (explicitAm && hour24 === 12) hour24 = 0;

  if (morningHint && hour24 > 12) hour24 -= 12;
  if ((afternoonHint || explicitPm) && hour24 < 12) hour24 += 12;

  let endHour24;
  if (endH != null) {
    endHour24 = endH;
    if (afternoonHint && endHour24 < 12) endHour24 += 12;
    // For “सुबह 10:30–12:00”, 12:00 is noon — do not fold 12 down to midnight.
    if (morningHint && endHour24 > 12) endHour24 -= 12;
  }

  return {
    hour24,
    minute: m,
    endHour24,
    endMinute: endM,
    morningHint,
    afternoonHint,
  };
}

function formatIstClockLabel(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

function formatIstDateLabel(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TZ,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

/**
 * @param {string} text
 * @param {Date} [now]
 */
function computeDepartureFromMessage(text, now = new Date()) {
  const rel = parseRelativeUrgentDeparture(text, now);
  if (rel) return rel;

  const clock = extractFirstClock(text);
  if (!clock) return { departure: null, isUrgent: false, end: null };

  const tomorrow = /\bkal\b|कल\b/i.test(text);
  const departure = nextIstOccurrence(now, clock.hour24, clock.minute, {
    morning: clock.morningHint,
    afternoon: clock.afternoonHint,
    tomorrow,
  });

  let end = null;
  if (clock.endHour24 != null && clock.endMinute != null) {
    const depYmd = istCalendarDateString(departure);
    end = istLocalDateTimeToUtcDate(
      depYmd,
      clock.endHour24,
      clock.endMinute,
    );
    if (end.getTime() <= departure.getTime()) {
      const nextY = istAddCalendarDays(depYmd, 1);
      end = istLocalDateTimeToUtcDate(
        nextY,
        clock.endHour24,
        clock.endMinute,
      );
    }
  }

  const isUrgent =
    /तत्काल|tatkal|\burgent\b/i.test(text) ||
    parseRelativeUrgentDeparture(text, now) != null;

  return {
    departure,
    isUrgent,
    end,
  };
}

module.exports = {
  TZ,
  istCalendarDateString,
  istWallClockParts,
  istLocalDateTimeToUtcDate,
  istAddCalendarDays,
  parseRelativeUrgentDeparture,
  computeDepartureFromMessage,
  formatIstClockLabel,
  formatIstDateLabel,
};
