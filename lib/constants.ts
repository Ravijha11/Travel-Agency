export const ROUTE_DIRECTIONS = [
  "lahar_to_gwalior",
  "gwalior_to_lahar",
] as const;

export type RouteDirection = (typeof ROUTE_DIRECTIONS)[number];

export const ROUTE_LABELS: Record<RouteDirection, string> = {
  lahar_to_gwalior: "Lahar → Gwalior",
  gwalior_to_lahar: "Gwalior → Lahar",
};
