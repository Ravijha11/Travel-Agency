const IST = "Asia/Kolkata";

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
