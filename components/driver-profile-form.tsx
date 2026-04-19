"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { updateMyDriverProfile } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CarCatalogImageThumb } from "@/components/car-catalog-image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createCarSuggester } from "@/lib/car-models";
import {
  isIndia91TenDigitStored,
  normalizePhoneForStorage,
  tenDigitIndiaLocalPart,
} from "@/lib/driver-profile-fields";

export type CarCatalogItem = {
  label: string;
  image_src: string;
  aliases: string[];
};

export type DriverProfileFormValues = {
  full_name: string;
  phone_number: string;
  car_model: string;
  car_number: string;
};

export function DriverProfileForm({
  initial,
  variant = "settings",
  carCatalog,
}: {
  initial: DriverProfileFormValues;
  variant?: "onboarding" | "settings";
  carCatalog?: CarCatalogItem[];
}) {
  const router = useRouter();
  const [full_name, setFullName] = useState(initial.full_name);
  /** 10-digit local mobile for +91 UI; falls back to free-form if stored number is not standard India mobile. */
  const [intlPhoneMode, setIntlPhoneMode] = useState(
    () =>
      Boolean(
        initial.phone_number?.trim() &&
          !isIndia91TenDigitStored(initial.phone_number),
      ),
  );
  const [phone_local_10, setPhoneLocal10] = useState(() =>
    tenDigitIndiaLocalPart(initial.phone_number),
  );
  const [phone_intl_freeform, setPhoneIntlFreeform] = useState(
    () =>
      (initial.phone_number?.trim() &&
      !isIndia91TenDigitStored(initial.phone_number)
        ? initial.phone_number
        : "") ?? "",
  );
  const [car_model, setCarModel] = useState(initial.car_model);
  const [car_number, setCarNumber] = useState(initial.car_number);
  const [message, setMessage] = useState<string | null>(null);
  const [carHint, setCarHint] = useState<{
    suggestion: string | null;
    imageSrc: string;
    label: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setFullName(initial.full_name);
    const local = tenDigitIndiaLocalPart(initial.phone_number);
    setPhoneLocal10(local);
    const intl =
      !!(initial.phone_number?.trim()) &&
      !isIndia91TenDigitStored(initial.phone_number);
    setIntlPhoneMode(intl);
    if (intl) {
      setPhoneIntlFreeform(initial.phone_number ?? "");
    } else {
      setPhoneIntlFreeform("");
      setPhoneLocal10(tenDigitIndiaLocalPart(initial.phone_number));
    }
    setCarModel(initial.car_model);
    setCarNumber(initial.car_number);
  }, [
    initial.full_name,
    initial.phone_number,
    initial.car_model,
    initial.car_number,
  ]);

  function onPhoneLocalInput(v: string) {
    let d = v.replace(/\D/g, "");
    if (d.startsWith("91") && d.length >= 12) d = d.slice(-10);
    if (d.length > 10) d = d.slice(0, 10);
    setPhoneLocal10(d);
  }

  function mergedPhoneForSubmit(): string {
    if (intlPhoneMode) {
      return normalizePhoneForStorage(phone_intl_freeform);
    }
    if (phone_local_10.length === 10) {
      return normalizePhoneForStorage(`+91${phone_local_10}`);
    }
    return "";
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      setMessage(null);
      const fd = new FormData();
      fd.set("full_name", full_name);
      fd.set("phone_number", mergedPhoneForSubmit());
      fd.set("car_model", car_model);
      fd.set("car_number", car_number);
      try {
        const res = await updateMyDriverProfile(fd);
        if (!res.ok) {
          setMessage(res.error ?? "Could not save. Please try again.");
          return;
        }
        setMessage("Saved.");
        router.refresh();
      } catch {
        setMessage(
          "Network error. Check your connection and try again in a moment.",
        );
      }
    });
  }

  const isOnboarding = variant === "onboarding";
  const suggest = createCarSuggester(carCatalog);
  const carListId = "driver-car-model-suggestions";

  return (
    <Card className="overflow-hidden border-primary/20 shadow-md shadow-primary/5">
      <div className="h-1.5 bg-gradient-to-r from-primary via-sky-500 to-violet-500" aria-hidden />
      <CardHeader>
        <CardTitle className="text-lg">
          {isOnboarding ? "Your driver details" : "Driver details"}
        </CardTitle>
        <CardDescription>
          {isOnboarding
            ? "Fill every field so riders can find and trust you. You can edit later from Trip updates → Profile."
            : "Riders see your name, car, and call button on the home feed. Use your real calling number (WhatsApp-capable is fine)."}
        </CardDescription>
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">English:</span> save your real details once.
          <br />
          <span className="font-medium text-foreground">हिंदी:</span> सही जानकारी भरें — राइडर आपको
          कॉल कर सकें।
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dp-full_name">Your name / आपका नाम</Label>
            <Input
              id="dp-full_name"
              name="full_name"
              required
              maxLength={120}
              value={full_name}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Name shown to riders"
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={intlPhoneMode ? "dp-phone-intl" : "dp-phone-local"}>
              Calling number / कॉलिंग नंबर
            </Label>
            {!intlPhoneMode ? (
              <div className="flex min-h-10 w-full flex-wrap items-stretch gap-0 overflow-hidden rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <span className="flex items-center border-r bg-muted/60 px-3 text-sm font-semibold tabular-nums text-foreground">
                  +91
                </span>
                <Input
                  id="dp-phone-local"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={10}
                  value={phone_local_10}
                  onChange={(e) => onPhoneLocalInput(e.target.value)}
                  placeholder="9876543210"
                  className="min-w-0 flex-1 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  aria-describedby="dp-phone-help"
                />
              </div>
            ) : (
              <Input
                id="dp-phone-intl"
                type="tel"
                inputMode="tel"
                maxLength={20}
                value={phone_intl_freeform}
                onChange={(e) => setPhoneIntlFreeform(e.target.value)}
                placeholder="+1… or other country"
                autoComplete="tel"
              />
            )}
            <p id="dp-phone-help" className="text-xs text-muted-foreground">
              English: type 10 digits — we save as{" "}
              <span className="font-medium text-foreground">+91…</span> automatically. You can still paste
              a full number with +91.
              <br />
              हिंदी: 10 अंक डालें — हम <span className="font-medium text-foreground">+91</span> अपने आप जोड़
              देंगे।
            </p>
            <button
              type="button"
              className="text-xs font-medium text-primary underline-offset-2 hover:underline"
              onClick={() => {
                if (intlPhoneMode) {
                  setIntlPhoneMode(false);
                  setPhoneLocal10(
                    tenDigitIndiaLocalPart(phone_intl_freeform || ""),
                  );
                  setPhoneIntlFreeform("");
                } else {
                  setIntlPhoneMode(true);
                  setPhoneIntlFreeform(
                    phone_local_10.length === 10
                      ? `+91${phone_local_10}`
                      : "+",
                  );
                }
              }}
            >
              {intlPhoneMode
                ? "Use simple +91 India number / भारत +91 सरल नंबर"
                : "International number instead / अंतरराष्ट्रीय नंबर"}
            </button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dp-car_model">Car / model / कार मॉडल</Label>
            {carCatalog && carCatalog.length > 0 ? (
              <datalist id={carListId}>
                {carCatalog.map((c) => (
                  <option key={c.label} value={c.label} />
                ))}
              </datalist>
            ) : null}
            <Input
              id="dp-car_model"
              name="car_model"
              maxLength={80}
              list={carCatalog && carCatalog.length > 0 ? carListId : undefined}
              value={car_model}
              onChange={(e) => {
                setCarModel(e.target.value);
                setCarHint(null);
              }}
              onBlur={() => {
                const { suggestion, info } = suggest(car_model);
                setCarHint({
                  suggestion,
                  imageSrc: info.imageSrc,
                  label: info.label,
                });
              }}
              placeholder="e.g. Swift Dzire — type or pick from suggestions"
            />
            {carHint ? (
              <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-2">
                <div className="relative h-12 w-20 overflow-hidden rounded-md border bg-background">
                  <CarCatalogImageThumb
                    src={carHint.imageSrc}
                    alt={carHint.label}
                  />
                </div>
                <div className="min-w-0 flex-1 text-xs text-muted-foreground">
                  {carHint.suggestion ? (
                    <p>
                      Did you mean{" "}
                      <button
                        type="button"
                        className="font-semibold text-foreground underline underline-offset-2"
                        onClick={() => setCarModel(carHint.suggestion ?? car_model)}
                      >
                        {carHint.suggestion}
                      </button>
                      ?
                    </p>
                  ) : (
                    <p>
                      We’ll show this as{" "}
                      <span className="font-semibold text-foreground">
                        {carHint.label}
                      </span>{" "}
                      on your card.
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dp-car_number">Car number (plate) / नंबर प्लेट</Label>
            <Input
              id="dp-car_number"
              name="car_number"
              maxLength={40}
              value={car_number}
              onChange={(e) => setCarNumber(e.target.value.toUpperCase())}
              onBlur={() =>
                setCarNumber((c) =>
                  c
                    .toUpperCase()
                    .replace(/\s+/g, " ")
                    .trim(),
                )
              }
              placeholder="e.g. MP07AB1234 or MP 07 AB 1234"
              className="font-mono text-base tracking-wide"
            />
            <p className="text-xs text-muted-foreground">
              English: use your real plate — riders recognize your car.
              <br />
              हिंदी: असली नंबर प्लेट लिखें।
            </p>
          </div>
          {message ? (
            <p
              className={
                message === "Saved."
                  ? "text-sm text-emerald-600 dark:text-emerald-400"
                  : "text-sm text-destructive"
              }
              role={message === "Saved." ? "status" : "alert"}
            >
              {message}
            </p>
          ) : null}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Saving…" : isOnboarding ? "Save and continue" : "Save profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
