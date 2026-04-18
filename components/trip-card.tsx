"use client";

import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { incrementTripCallCount } from "@/app/actions/trips";
import { toTelHref } from "@/lib/phone";
import { Phone } from "lucide-react";
import { VerifiedBadge } from "@/components/verified-badge";

export type TripCardProps = {
  tripId: string;
  departureLabel: string;
  carModel: string;
  carNumber: string;
  driverName: string;
  phone: string;
  origin: string;
  destination: string;
  seats: number;
  priceLabel: string;
  verified: boolean;
  sponsored?: boolean;
};

export function TripCard({
  tripId,
  departureLabel,
  carModel,
  carNumber,
  driverName,
  phone,
  origin,
  destination,
  seats,
  priceLabel,
  verified,
  sponsored = false,
}: TripCardProps) {
  const [pending, startTransition] = useTransition();
  const tel = toTelHref(phone);

  function handleCall() {
    startTransition(async () => {
      await incrementTripCallCount(tripId);
      if (tel !== "#") {
        window.location.href = tel;
      }
    });
  }

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardHeader className="space-y-1 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            {sponsored ? (
              <Badge
                variant="outline"
                className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Sponsored
              </Badge>
            ) : null}
            <p className="text-2xl font-semibold tabular-nums tracking-tight">
              {departureLabel}
            </p>
            <p className="text-sm text-muted-foreground">
              {origin} → {destination}
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {seats} seat{seats === 1 ? "" : "s"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pb-3">
        <div className="space-y-0.5 text-base font-medium">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span>{carModel || "Car"}</span>
            {carNumber ? (
              <span className="text-sm font-semibold tracking-wide text-muted-foreground">
                {carNumber}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{driverName}</span>
          {verified ? <VerifiedBadge size="sm" className="translate-y-px" /> : null}
          <span className="text-foreground">{priceLabel}</span>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button
          type="button"
          className="h-14 w-full bg-green-600 text-lg font-semibold text-white hover:bg-green-700"
          disabled={pending || tel === "#"}
          onClick={handleCall}
        >
          <Phone className="mr-2 size-5" aria-hidden />
          {pending ? "Connecting…" : "Call now"}
        </Button>
      </CardFooter>
    </Card>
  );
}
