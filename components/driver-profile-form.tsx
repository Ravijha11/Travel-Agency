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
  const [phone_number, setPhoneNumber] = useState(initial.phone_number);
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
    setPhoneNumber(initial.phone_number);
    setCarModel(initial.car_model);
    setCarNumber(initial.car_number);
  }, [
    initial.full_name,
    initial.phone_number,
    initial.car_model,
    initial.car_number,
  ]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      setMessage(null);
      const fd = new FormData();
      fd.set("full_name", full_name);
      fd.set("phone_number", phone_number);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {isOnboarding ? "Your driver details" : "Driver details"}
        </CardTitle>
        <CardDescription>
          {isOnboarding
            ? "Fill every field so riders can find and trust you. You can edit later from Trip updates → Profile."
            : "Riders see your name, car, and call button on the home feed. Use your real calling number (WhatsApp-capable is fine)."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dp-full_name">Your name</Label>
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
            <Label htmlFor="dp-phone">Calling number</Label>
            <Input
              id="dp-phone"
              name="phone_number"
              type="tel"
              inputMode="tel"
              maxLength={20}
              value={phone_number}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+91XXXXXXXXXX or 10-digit mobile"
              autoComplete="tel"
            />
            <p className="text-xs text-muted-foreground">
              Used for the green “Call now” button on your listings.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dp-car_model">Car / model</Label>
            <Input
              id="dp-car_model"
              name="car_model"
              maxLength={80}
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
              placeholder="e.g. Swift Dzire"
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
            <Label htmlFor="dp-car_number">Car number (plate)</Label>
            <Input
              id="dp-car_number"
              name="car_number"
              maxLength={40}
              value={car_number}
              onChange={(e) => setCarNumber(e.target.value)}
              placeholder="e.g. MP 07 AB 1234"
            />
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
