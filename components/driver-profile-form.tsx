"use client";

import { useState, useTransition } from "react";
import { updateMyDriverProfile } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type DriverProfileFormValues = {
  full_name: string;
  phone_number: string;
  car_model: string;
  car_number: string;
};

export function DriverProfileForm({ initial }: { initial: DriverProfileFormValues }) {
  const [full_name, setFullName] = useState(initial.full_name);
  const [phone_number, setPhoneNumber] = useState(initial.phone_number);
  const [car_model, setCarModel] = useState(initial.car_model);
  const [car_number, setCarNumber] = useState(initial.car_number);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      setMessage(null);
      const fd = new FormData();
      fd.set("full_name", full_name);
      fd.set("phone_number", phone_number);
      fd.set("car_model", car_model);
      fd.set("car_number", car_number);
      const res = await updateMyDriverProfile(fd);
      if (!res.ok) {
        setMessage(res.error ?? "Could not save");
        return;
      }
      setMessage("Saved.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Driver details</CardTitle>
        <CardDescription>
          Riders see your name, car, and call button on the home feed. Use your
          real calling number (WhatsApp-capable is fine).
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
              onChange={(e) => setCarModel(e.target.value)}
              placeholder="e.g. Swift Dzire"
            />
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
                  ? "text-sm text-emerald-600"
                  : "text-sm text-destructive"
              }
              role={message === "Saved." ? "status" : "alert"}
            >
              {message}
            </p>
          ) : null}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
