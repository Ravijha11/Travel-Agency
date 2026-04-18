export type CarModelInfo = {
  /** Canonical model label to show to users. */
  label: string;
  /** Public URL (Supabase Storage, external https, or path under /public). */
  imageSrc: string;
  /** Common aliases/spellings. */
  aliases: string[];
};

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const DEFAULT_CAR_PLACEHOLDER: CarModelInfo = {
  label: "Car",
  imageSrc: "",
  aliases: [],
};

function levenshtein(a: string, b: string) {
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

export function getCarModelInfo(raw: string | null | undefined): CarModelInfo {
  return createCarResolver()(raw);
}

export function createCarResolver(
  modelsFromDb?: { label: string; image_src: string; aliases: string[] }[],
) {
  const cars: CarModelInfo[] = (modelsFromDb ?? []).map((m) => ({
    label: m.label,
    imageSrc: m.image_src,
    aliases: m.aliases ?? [],
  }));

  return (raw: string | null | undefined): CarModelInfo => {
    const q = normalize(raw ?? "");
    if (!q) return DEFAULT_CAR_PLACEHOLDER;

    // Exact alias match first.
    for (const car of cars) {
      if (car.aliases.some((a) => normalize(a) === q)) return car;
      if (normalize(car.label) === q) return car;
    }

    // Fuzzy match against aliases.
    let best: { car: CarModelInfo; score: number } | null = null;
    for (const car of cars) {
      for (const alias of [car.label, ...car.aliases]) {
        const s = levenshtein(q, normalize(alias));
        if (!best || s < best.score) best = { car, score: s };
      }
    }

    // Heuristic: accept if close enough.
    if (best && best.score <= Math.max(2, Math.floor(q.length / 5)))
      return best.car;

    return {
      label: raw?.trim() || DEFAULT_CAR_PLACEHOLDER.label,
      imageSrc: DEFAULT_CAR_PLACEHOLDER.imageSrc,
      aliases: [],
    };
  };
}

export function suggestCarModel(raw: string | null | undefined): {
  suggestion: string | null;
  info: CarModelInfo;
} {
  const info = createCarResolver()(raw);
  if (!raw?.trim()) return { suggestion: null, info };
  const q = normalize(raw);
  const labelN = normalize(info.label);
  if (q && labelN && q !== labelN) {
    return { suggestion: info.label, info };
  }
  return { suggestion: null, info };
}

export function createCarSuggester(
  modelsFromDb?: { label: string; image_src: string; aliases: string[] }[],
) {
  const resolve = createCarResolver(modelsFromDb);
  return (raw: string | null | undefined) => {
    const info = resolve(raw);
    if (!raw?.trim()) return { suggestion: null, info };
    const q = normalize(raw);
    const labelN = normalize(info.label);
    if (q && labelN && q !== labelN) {
      return { suggestion: info.label, info };
    }
    return { suggestion: null, info };
  };
}
