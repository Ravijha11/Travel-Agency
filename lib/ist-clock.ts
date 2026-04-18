/** 12-hour clock helpers for IST wall times (used in trip wizard UI). */

export type Meridiem = "AM" | "PM";

export function hour24To12(h24: number): { clockHour: number; meridiem: Meridiem } {
  if (h24 === 0) return { clockHour: 12, meridiem: "AM" };
  if (h24 < 12) return { clockHour: h24, meridiem: "AM" };
  if (h24 === 12) return { clockHour: 12, meridiem: "PM" };
  return { clockHour: h24 - 12, meridiem: "PM" };
}

export function hour12To24(clockHour: number, meridiem: Meridiem): number {
  if (meridiem === "AM") {
    return clockHour === 12 ? 0 : clockHour;
  }
  return clockHour === 12 ? 12 : clockHour + 12;
}
