"use client";

import { useTransition } from "react";
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
  const [pending, startTransition] = useTransition();

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
        <p>
          {new Date(trip.departure_time).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
          })}
        </p>
        <p>
          {trip.origin} → {trip.destination}
        </p>
        <p>
          {trip.available_seats} seats · ₹{trip.price_per_seat}/seat
        </p>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {trip.status === "active" ? (
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            className="min-h-11"
            onClick={() =>
              startTransition(async () => {
                await markTripFull(trip.id);
              })
            }
          >
            Mark as full
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await markTripCompleted(trip.id);
            })
          }
        >
          Mark completed
        </Button>
      </CardFooter>
    </Card>
  );
}
