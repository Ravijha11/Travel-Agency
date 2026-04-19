"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, PartyPopper } from "lucide-react";
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
import { cn } from "@/lib/utils";

const steps = ["Route & time", "Seats & price", "Confirm"] as const;

const stepsHi = ["रूट और समय", "सीट और किराया", "कन्फर्म"] as const;

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

function TimePickSkeleton() {
  return (
    <div
      className="grid animate-pulse grid-cols-2 gap-3 sm:grid-cols-4"
      aria-hidden
    >
      <div className="col-span-2 h-10 rounded-md bg-muted sm:col-span-1" />
      <div className="h-10 rounded-md bg-muted" />
      <div className="h-10 rounded-md bg-muted" />
      <div className="col-span-2 h-10 rounded-md bg-muted sm:col-span-1" />
    </div>
  );
}

export function TripPostWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [routeDirection, setRouteDirection] =
    useState<RouteDirection>("lahar_to_gwalior");
  const [origin, setOrigin] = useState("Lahar");
  const [destination, setDestination] = useState("Gwalior");
  const [dep, setDep] = useState<DepParts | null>(null);
  const [seats, setSeats] = useState("3");
  const [price, setPrice] = useState("200");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const floor = nextQuarterHourAfterNow();
    setDep(clampBooking(floor, floor));
  }, []);

  useEffect(() => {
    if (!successMessage) return;
    const t = window.setTimeout(() => setSuccessMessage(null), 12_000);
    return () => window.clearTimeout(t);
  }, [successMessage]);

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
    setErrorMessage(null);
  }

  async function onConfirm() {
    if (!dep) return;
    setLoading(true);
    setErrorMessage(null);
    const departureIso = istLocalDateTimeToIso(dep.dateYmd, dep.hour, dep.minute);
    if (!isDepartureAllowedIso(departureIso)) {
      setLoading(false);
      setErrorMessage(
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
      setErrorMessage(
        "Network error. Check your connection and try again in a moment.",
      );
      return;
    }
    setLoading(false);
    if (!res.ok) {
      setErrorMessage(res.error ?? "Could not post trip");
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(
      "Published! Your trip will appear on the home feed. / पब्लिश हो गया — अब होम फीड पर दिखेगा।",
    );
    setStep(0);
    {
      const floor = nextQuarterHourAfterNow();
      setDep(clampBooking(floor, floor));
    }
    setSeats("3");
    setPrice("200");
    applyDirection("lahar_to_gwalior");
    router.refresh();
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
    <Card className="overflow-hidden border-emerald-500/20 shadow-lg shadow-emerald-500/10">
      <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-sky-500 to-violet-500" aria-hidden />
      {successMessage ? (
        <div className="flex items-start gap-2 border-b border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-100">
          <PartyPopper className="mt-0.5 size-5 shrink-0" aria-hidden />
          <p role="status">{successMessage}</p>
        </div>
      ) : null}
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          Post a trip
          <span className="text-sm font-normal text-muted-foreground">/ ट्रिप पोस्ट</span>
        </CardTitle>
        <CardDescription>
          Step {step + 1} of {steps.length}: {steps[step]} · {stepsHi[step]}. Today or tomorrow only
          (India time).
        </CardDescription>
        <ol className="flex flex-wrap gap-2 pt-1" aria-label="Steps">
          {steps.map((label, i) => (
            <li key={label}>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  i === step
                    ? "border-primary bg-primary/15 text-primary"
                    : i < step
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                      : "border-muted bg-muted/40 text-muted-foreground",
                )}
              >
                {i < step ? (
                  <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
                ) : (
                  <span className="tabular-nums">{i + 1}</span>
                )}
                {label}
              </span>
            </li>
          ))}
        </ol>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 0 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Direction / दिशा</Label>
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
              <Label htmlFor="origin">Origin / शुरुआत</Label>
              <Input
                id="origin"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">Destination / मंज़िल</Label>
              <Input
                id="destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <Label className="block">Departure (India · IST) / निकलने का समय</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={snapToNextSlot}
                >
                  Next slot / अगला स्लॉट
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                English: 12-hour clock, minutes only 00 / 15 / 30 / 45. Date = today or tomorrow.
                <br />
                हिंदी: 12 घंटे, मिनट सिर्फ 00, 15, 30, 45। तारीख आज या कल।
              </p>
              {dep && minDate !== maxDate ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={dep.dateYmd === minDate ? "default" : "secondary"}
                    className="rounded-full"
                    onClick={() =>
                      setDep((prev) =>
                        prev
                          ? clampBooking(floorNow(), {
                              dateYmd: minDate,
                              hour: prev.hour,
                              minute: prev.minute,
                            })
                          : prev,
                      )
                    }
                  >
                    Today / आज
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={dep.dateYmd === maxDate ? "default" : "secondary"}
                    className="rounded-full"
                    onClick={() =>
                      setDep((prev) =>
                        prev
                          ? clampBooking(floorNow(), {
                              dateYmd: maxDate,
                              hour: prev.hour,
                              minute: prev.minute,
                            })
                          : prev,
                      )
                    }
                  >
                    Tomorrow / कल
                  </Button>
                </div>
              ) : null}
              {!dep ? (
                <TimePickSkeleton />
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="col-span-2 space-y-1.5 sm:col-span-1">
                    <Label htmlFor="dep-date" className="text-xs">
                      Date / तारीख
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
                      Hour / घंटा
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
                      Minute / मिनट
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
              <Label htmlFor="seats">Available seats / खाली सीटें</Label>
              <div className="flex flex-wrap gap-2">
                {([1, 2, 3, 4, 5, 6, 7] as const).map((n) => (
                  <Button
                    key={n}
                    type="button"
                    size="sm"
                    variant={seats === String(n) ? "default" : "outline"}
                    className="h-10 min-w-10 rounded-full px-3"
                    onClick={() => setSeats(String(n))}
                  >
                    {n}
                  </Button>
                ))}
              </div>
              <Input
                id="seats"
                inputMode="numeric"
                type="number"
                min={0}
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
                className="max-w-[8rem]"
              />
              <p className="text-xs text-muted-foreground">
                Tap a number or type manually. / नंबर दबाएँ या लिखें।
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price per seat (₹) / प्रति सीट किराया</Label>
              <div className="flex flex-wrap gap-2">
                {([150, 180, 200, 250, 300] as const).map((n) => (
                  <Button
                    key={n}
                    type="button"
                    size="sm"
                    variant={price === String(n) ? "default" : "outline"}
                    className="h-10 rounded-full px-3"
                    onClick={() => setPrice(String(n))}
                  >
                    ₹{n}
                  </Button>
                ))}
              </div>
              <Input
                id="price"
                inputMode="decimal"
                type="number"
                min={0}
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="max-w-[8rem]"
              />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-3 rounded-xl border border-dashed border-primary/30 bg-muted/30 p-3 text-sm">
            <p className="text-xs text-muted-foreground">
              English: check everything, then publish to the home feed.
              <br />
              हिंदी: सब ठीक हो तो पब्लिश करें — होम फीड पर चला जाएगा।
            </p>
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

        {errorMessage ? (
          <p className="text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {step > 0 ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setErrorMessage(null);
              setStep((s) => Math.max(0, s - 1));
            }}
          >
            Back / पीछे
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
                  setErrorMessage(
                    "Pick today or tomorrow (India time), at least 1 minute ahead, on :00, :15, :30, or :45.",
                  );
                  return;
                }
                setErrorMessage(null);
              }
              setStep((s) => Math.min(2, s + 1));
            }}
          >
            Continue / आगे
          </Button>
        ) : (
          <Button
            type="button"
            className="min-h-11 flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:from-emerald-700 hover:to-teal-700"
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? "Publishing… / पब्लिश…" : "Publish to home feed / होम पर भेजें"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
