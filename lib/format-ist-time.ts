import { istAddCalendarDays, istCalendarDateString } from "@/lib/departure-ist";

const IST = "Asia/Kolkata";

/** Calendar day of departure in IST as Today / Tomorrow / short date. */
export function istTripDayRelativeLabel(
  iso: string | Date,
  from: Date = new Date(),
): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const depDay = istCalendarDateString(d);
  const today = istCalendarDateString(from);
  const tomorrow = istAddCalendarDays(today, 1);
  if (depDay === today) return "Today";
  if (depDay === tomorrow) return "Tomorrow";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(d);
}

/** e.g. "Today · 4:15 pm" for trip cards (12-hour, India). */
export function formatIst12hTodayTomorrow(
  iso: string | Date,
  from: Date = new Date(),
): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const day = istTripDayRelativeLabel(iso, from);
  const time = new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
  return `${day} · ${time}`;
}

/** Current clock in India (12-hour); use for headers. */
export function formatIstNowClock12h(from: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(from);
}

/** e.g. "Sat, 18 Apr, 4:15 pm" for drivers (12-hour, India). */
export function formatIst12h(
  iso: string | Date,
  opts?: { weekday?: boolean },
): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    weekday: opts?.weekday === false ? undefined : "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}
