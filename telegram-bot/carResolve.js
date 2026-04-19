/**
 * Mirrors lib/car-models.ts so Telegram saves the same canonical `label`
 * stored in admin car_models → feed images match.
 */

const normalize = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u0fff]+/g, " ")
    .trim();

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[m][n];
}

/**
 * @param {{ label: string; image_src?: string; aliases?: string[] }[]} modelsFromDb
 * @param {string | null | undefined} raw
 * @returns {{ label: string }}
 */
function resolveCarCatalogLabel(modelsFromDb, raw) {
  const cars = (modelsFromDb ?? []).map((m) => ({
    label: m.label,
    aliases: m.aliases ?? [],
  }));

  const q = normalize(raw ?? "");
  if (!q) return { label: "Other" };
  if (!cars.length) return { label: "Other" };

  for (const car of cars) {
    if (car.aliases.some((a) => normalize(a) === q)) return { label: car.label };
    if (normalize(car.label) === q) return { label: car.label };
  }

  let best = /** @type {{ car: { label: string }; score: number } | null} */ (
    null
  );
  for (const car of cars) {
    for (const alias of [car.label, ...car.aliases]) {
      const s = levenshtein(q, normalize(alias));
      if (!best || s < best.score) best = { car, score: s };
    }
  }

  if (best && best.score <= Math.max(2, Math.floor(q.length / 5))) {
    return { label: best.car.label };
  }

  const trimmed = String(raw ?? "").trim();
  return { label: trimmed || "Other" };
}

module.exports = { resolveCarCatalogLabel, normalize };
