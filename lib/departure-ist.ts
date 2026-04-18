/** Helpers for trip departure in Asia/Kolkata (IST, UTC+5:30). */

const TZ = "Asia/Kolkata";
const QUARTERS = [0, 15, 30, 45] as const;

export type QuarterMinute = (typeof QUARTERS)[number];

export function istCalendarDateString(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function istWallClockParts(d: Date): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
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
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

/** ISO 8601 instant for `YYYY-MM-DD` + wall time in IST. */
export function istLocalDateTimeToIso(
  dateYmd: string,
  hour: number,
  minute: number,
): string {
  const [y, m, d] = dateYmd.split("-").map(Number);
  if (!y || !m || !d) return "";
  return new Date(
    `${y}-${pad2(m)}-${pad2(d)}T${pad2(hour)}:${pad2(minute)}:00+05:30`,
  ).toISOString();
}

export function nextQuarterHourAfterNow(): {
  dateYmd: string;
  hour: number;
  minute: QuarterMinute;
} {
  const minTs = Date.now() + MS_LEAD;
  let t = new Date(minTs);
  for (let i = 0; i < 96; i++) {
    const { year, month, day, hour, minute } = istWallClockParts(t);
    if (minute % 15 === 0 && t.getTime() >= minTs) {
      return {
        dateYmd: `${year}-${pad2(month)}-${pad2(day)}`,
        hour,
        minute: minute as QuarterMinute,
      };
    }
    t = new Date(t.getTime() + 60_000);
  }
  const { year, month, day, hour, minute } = istWallClockParts(
    new Date(minTs + 15 * 60_000),
  );
  return {
    dateYmd: `${year}-${pad2(month)}-${pad2(day)}`,
    hour,
    minute: (minute % 15 === 0 ? minute : 0) as QuarterMinute,
  };
}

export function isQuarterMinute(m: number): m is QuarterMinute {
  return (QUARTERS as readonly number[]).includes(m);
}

const MS_LEAD = 60_000;

export function isDepartureAllowedIso(iso: string): boolean {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  const { minute } = istWallClockParts(new Date(iso));
  if (!isQuarterMinute(minute)) return false;
  return t >= Date.now() + MS_LEAD;
}

export { QUARTERS };
