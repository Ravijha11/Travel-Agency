"use client";

import { useEffect, useState } from "react";
import { createTrip } from "@/app/actions/trips";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTE_LABELS, type RouteDirection } from "@/lib/constants";
import {
  QUARTERS,
  type QuarterMinute,
  istLocalDateTimeToIso,
  istMaxBookingDateYmd,
  isDepartureAllowedIso,
  nextQuarterHourAfterNow,
} from "@/lib/departure-ist";
import { hour12To24, hour24To12 } from "@/lib/ist-clock";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const steps = ["Route & time", "Seats & price", "Confirm"] as const;

type DepParts = { dateYmd: string; hour: number; minute: QuarterMinute };

function clampDeparture(floor: DepParts, dateYmd: string, hour: number, m: QuarterMinute): DepParts {
  if (dateYmd < floor.dateYmd) return { ...floor };
  if (dateYmd > floor.dateYmd) return { dateYmd, hour, minute: m };
  if (hour < floor.hour || (hour === floor.hour && m < floor.minute)) {
    return { dateYmd, hour: floor.hour, minute: floor.minute };
  }
  return { dateYmd, hour, minute: m };
}

function clampBooking(floor: DepParts, p: DepParts): DepParts {
  const maxY = istMaxBookingDateYmd();
  const dateYmd = p.dateYmd > maxY ? maxY : p.dateYmd;
  return clampDeparture(floor, dateYmd, p.hour, p.minute);
}

export function TripPostWizard() {
  const [step, setStep] = useState(0);
  const [routeDirection, setRouteDirection] =
    useState<RouteDirection>("lahar_to_gwalior");
  const [origin, setOrigin] = useState("Lahar");
  const [destination, setDestination] = useState("Gwalior");
  const [dep, setDep] = useState<DepParts | null>(null);
  const [seats, setSeats] = useState("3");
  const [price, setPrice] = useState("200");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const floor = nextQuarterHourAfterNow();
    setDep(clampBooking(floor, floor));
  }, []);

  function applyDirection(dir: RouteDirection) {
    setRouteDirection(dir);
    if (dir === "lahar_to_gwalior") {
      setOrigin("Lahar");
      setDestination("Gwalior");
    } else {
      setOrigin("Gwalior");
      setDestination("Lahar");
    }
  }

  function floorNow() {
    return nextQuarterHourAfterNow();
  }

  function snapToNextSlot() {
    const floor = nextQuarterHourAfterNow();
    setDep(clampBooking(floor, floor));
    setMessage(null);
  }

  async function onConfirm() {
    if (!dep) return;
    setLoading(true);
    setMessage(null);
    const departureIso = istLocalDateTimeToIso(dep.dateYmd, dep.hour, dep.minute);
    if (!isDepartureAllowedIso(departureIso)) {
      setLoading(false);
      setMessage(
        "Departure must be today or tomorrow (India time), at least 1 minute ahead, on :00, :15, :30, or :45.",
      );
      return;
    }
    const fd = new FormData();
    fd.set("route_direction", routeDirection);
    fd.set("origin", origin);
    fd.set("destination", destination);
    fd.set("departure_time", departureIso);
    fd.set("available_seats", seats);
    fd.set("price_per_seat", price);
    let res: Awaited<ReturnType<typeof createTrip>>;
    try {
      res = await createTrip(fd);
    } catch {
      setLoading(false);
      setMessage(
        "Network error. Check your connection and try again in a moment.",
      );
      return;
    }
    setLoading(false);
    if (!res.ok) {
      setMessage(res.error ?? "Could not post trip");
      return;
    }
    setMessage(null);
    setStep(0);
    {
      const floor = nextQuarterHourAfterNow();
      setDep(clampBooking(floor, floor));
    }
    setSeats("3");
    setPrice("200");
    applyDirection("lahar_to_gwalior");
  }

  const minDate = floorNow().dateYmd;
  const maxDate = istMaxBookingDateYmd();

  const departurePreview =
    dep &&
    new Date(istLocalDateTimeToIso(dep.dateYmd, dep.hour, dep.minute)).toLocaleString(
      "en-IN",
      {
        timeZone: "Asia/Kolkata",
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      },
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Post a trip</CardTitle>
        <CardDescription>
          Step {step + 1} of {steps.length}: {steps[step]}. You can only list
          departures for today or tomorrow (India time).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 0 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Direction</Label>
              <Tabs
                value={routeDirection}
                onValueChange={(v) => applyDirection(v as RouteDirection)}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="lahar_to_gwalior">
                    {ROUTE_LABELS.lahar_to_gwalior}
                  </TabsTrigger>
                  <TabsTrigger value="gwalior_to_lahar">
                    {ROUTE_LABELS.gwalior_to_lahar}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="space-y-2">
              <Label htmlFor="origin">Origin</Label>
              <Input
                id="origin"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <Label className="block">Departure (India · IST)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={snapToNextSlot}
                >
                  Next 15 min slot
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                India (IST), 12-hour clock. Minutes: 00, 15, 30, or 45 only. Date
                must be today or tomorrow — not later.
              </p>
              {!dep ? (
                <p className="text-sm text-muted-foreground">Loading calendar…</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="col-span-2 space-y-1.5 sm:col-span-1">
                    <Label htmlFor="dep-date" className="text-xs">
                      Date
                    </Label>
                    <Input
                      id="dep-date"
                      type="date"
                      min={minDate}
                      max={maxDate}
                      value={dep.dateYmd}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (!v) return;
                        setDep((prev) =>
                          prev
                            ? clampBooking(floorNow(), {
                                dateYmd: v,
                                hour: prev.hour,
                                minute: prev.minute,
                              })
                            : prev,
                        );
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dep-hour12" className="text-xs">
                      Hour
                    </Label>
                    <select
                      id="dep-hour12"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={hour24To12(dep.hour).clockHour}
                      onChange={(e) => {
                        const clockHour = Number(e.target.value);
                        setDep((prev) => {
                          if (!prev) return prev;
                          const mer = hour24To12(prev.hour).meridiem;
                          const h24 = hour12To24(clockHour, mer);
                          return clampBooking(floorNow(), {
                            dateYmd: prev.dateYmd,
                            hour: h24,
                            minute: prev.minute,
                          });
                        });
                      }}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dep-min" className="text-xs">
                      Minute
                    </Label>
                    <select
                      id="dep-min"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={dep.minute}
                      onChange={(e) => {
                        const m = Number(e.target.value) as QuarterMinute;
                        setDep((prev) =>
                          prev
                            ? clampBooking(floorNow(), {
                                dateYmd: prev.dateYmd,
                                hour: prev.hour,
                                minute: m,
                              })
                            : prev,
                        );
                      }}
                    >
                      {QUARTERS.map((q) => (
                        <option key={q} value={q}>
                          {q.toString().padStart(2, "0")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 space-y-1.5 sm:col-span-1">
                    <Label htmlFor="dep-mer" className="text-xs">
                      am / pm
                    </Label>
                    <select
                      id="dep-mer"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={hour24To12(dep.hour).meridiem}
                      onChange={(e) => {
                        const mer = e.target.value as "AM" | "PM";
                        setDep((prev) => {
                          if (!prev) return prev;
                          const { clockHour } = hour24To12(prev.hour);
                          const h24 = hour12To24(clockHour, mer);
                          return clampBooking(floorNow(), {
                            dateYmd: prev.dateYmd,
                            hour: h24,
                            minute: prev.minute,
                          });
                        });
                      }}
                    >
                      <option value="AM">am</option>
                      <option value="PM">pm</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seats">Available seats</Label>
              <Input
                id="seats"
                inputMode="numeric"
                type="number"
                min={0}
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price per seat (₹)</Label>
              <Input
                id="price"
                inputMode="decimal"
                type="number"
                min={0}
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Route:</span>{" "}
              {ROUTE_LABELS[routeDirection]}
            </p>
            <p>
              <span className="text-muted-foreground">Stops:</span> {origin} →{" "}
              {destination}
            </p>
            <p>
              <span className="text-muted-foreground">Departure:</span>{" "}
              {departurePreview ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Seats:</span> {seats}
            </p>
            <p>
              <span className="text-muted-foreground">Price / seat:</span> ₹
              {price}
            </p>
          </div>
        ) : null}

        {message ? (
          <p className="text-sm text-destructive" role="alert">
            {message}
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {step > 0 ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Back
          </Button>
        ) : null}
        {step < 2 ? (
          <Button
            type="button"
            className="min-h-11 flex-1"
            disabled={step === 0 && !dep}
            onClick={() => {
              if (step === 0) {
                if (!dep) return;
                const iso = istLocalDateTimeToIso(dep.dateYmd, dep.hour, dep.minute);
                if (!isDepartureAllowedIso(iso)) {
                  setMessage(
                    "Pick today or tomorrow (India time), at least 1 minute ahead, on :00, :15, :30, or :45.",
                  );
                  return;
                }
                setMessage(null);
              }
              setStep((s) => Math.min(2, s + 1));
            }}
          >
            Continue
          </Button>
        ) : (
          <Button
            type="button"
            className="min-h-11 flex-1 bg-green-600 text-white hover:bg-green-700"
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? "Posting…" : "Confirm & publish"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
