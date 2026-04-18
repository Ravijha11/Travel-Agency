"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { markTripCompleted, markTripFull } from "@/app/actions/trips";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTE_LABELS, type RouteDirection } from "@/lib/constants";
import { formatIst12h } from "@/lib/format-ist-time";

type Trip = {
  id: string;
  route_direction: string;
  origin: string;
  destination: string;
  departure_time: string;
  available_seats: number;
  price_per_seat: string | number;
  status: string;
};

export function DriverTripRow({ trip }: { trip: Trip }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  function runAction(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setActionError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        setActionError(
          res.error ??
            "Something went wrong. Check your connection and try again.",
        );
        return;
      }
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">
          {ROUTE_LABELS[trip.route_direction as RouteDirection]}
        </CardTitle>
        <Badge variant={trip.status === "active" ? "default" : "secondary"}>
          {trip.status}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-muted-foreground">
        <p className="text-foreground">{formatIst12h(trip.departure_time)}</p>
        <p>
          {trip.origin} → {trip.destination}
        </p>
        <p>
          {trip.available_seats} seats · ₹{trip.price_per_seat}/seat
        </p>
        {actionError ? (
          <p className="text-sm text-destructive" role="alert">
            {actionError}
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {trip.status === "active" ? (
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            className="min-h-11"
            onClick={() => runAction(() => markTripFull(trip.id))}
          >
            Mark as full
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => runAction(() => markTripCompleted(trip.id))}
        >
          Mark completed
        </Button>
      </CardFooter>
    </Card>
  );
}
