import { createClient } from "@/utils/supabase/server";
import { RouteToggle } from "@/components/route-toggle";
import { TripCard } from "@/components/trip-card";
import type { RouteDirection } from "@/lib/constants";
import { ROUTE_DIRECTIONS } from "@/lib/constants";
import {
  DEFAULT_FEED_PRIORITY,
  isFeedSponsored,
} from "@/lib/feed-priority";
import { getActiveCarModels } from "@/lib/car-models-db";
import { createCarResolver } from "@/lib/car-models";
import { istDayAfterTomorrowMidnightIso } from "@/lib/departure-ist";
import Image from "next/image";

type Search = { [key: string]: string | string[] | undefined };

function parseDirection(searchParams: Search): RouteDirection {
  const raw = searchParams.dir;
  const dir = Array.isArray(raw) ? raw[0] : raw;
  if (dir && (ROUTE_DIRECTIONS as readonly string[]).includes(dir)) {
    return dir as RouteDirection;
  }
  return "lahar_to_gwalior";
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const direction = parseDirection(await searchParams);
  const supabase = await createClient();
  const dbCars = await getActiveCarModels();
  const resolveCar = createCarResolver(dbCars);

  const feedUpper = istDayAfterTomorrowMidnightIso();
  const { data: trips, error } = await supabase
    .from("trips")
    .select(
      "id, origin, destination, departure_time, available_seats, price_per_seat, driver_id, status",
    )
    .eq("route_direction", direction)
    .eq("status", "active")
    .gt("departure_time", new Date().toISOString())
    .lt("departure_time", feedUpper)
    .order("departure_time", { ascending: true });

  const driverIds = Array.from(
    new Set((trips ?? []).map((t) => t.driver_id)),
  );
  let profileById: Record<
    string,
    {
      full_name: string;
      phone_number: string;
      car_model: string;
      car_number: string;
      is_verified: boolean;
      feed_priority: number;
    }
  > = {};

  if (driverIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select(
        "id, full_name, phone_number, car_model, car_number, is_verified, feed_priority",
      )
      .in("id", driverIds);

    profileById = Object.fromEntries(
      (profiles ?? []).map((p) => [p.id, p] as const),
    );
  }

  const sortedTrips = [...(trips ?? [])].sort((a, b) => {
    const pa = profileById[a.driver_id]?.feed_priority ?? DEFAULT_FEED_PRIORITY;
    const pb = profileById[b.driver_id]?.feed_priority ?? DEFAULT_FEED_PRIORITY;
    if (pa !== pb) return pa - pb;
    return (
      new Date(a.departure_time).getTime() -
      new Date(b.departure_time).getTime()
    );
  });

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 pt-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">
          {"Rides today & tomorrow"}
        </h1>

        <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] h-[38vh] min-h-[220px] w-screen max-h-[520px]">
          <Image
            src="/Firefly_Remove%20Hindi%20text%20of%20lahar%20keep%20Lahar%20In%20which%20is%20writtenn%20in%20english%20928299.png"
            alt="Lahar"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Coordination only — agree fare and seats directly with the driver.
        </p>
      </header>

      <RouteToggle current={direction} />

      {error ? (
        <p className="text-sm text-destructive">
          Could not load trips. Check Supabase env and RLS.
        </p>
      ) : null}

      <section className="flex flex-col gap-3">
        {!trips?.length ? (
          <p className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
            No trips for today or tomorrow on this route yet. Drivers can post
            from the dashboard (India dates only).
          </p>
        ) : (
          sortedTrips.map((trip) => {
            const profile = profileById[trip.driver_id];
            const car = resolveCar(profile?.car_model ?? "");
            return (
              <TripCard
                key={trip.id}
                tripId={trip.id}
                departureIso={trip.departure_time}
                departureLabel={formatTime(trip.departure_time)}
                carModel={profile?.car_model ?? ""}
                carNumber={profile?.car_number ?? ""}
                carLabel={car.label}
                carImageSrc={car.imageSrc}
                driverName={profile?.full_name || "Driver"}
                phone={profile?.phone_number ?? ""}
                origin={trip.origin}
                destination={trip.destination}
                seats={trip.available_seats}
                priceLabel={`${formatPrice(Number(trip.price_per_seat))} / seat`}
                verified={Boolean(profile?.is_verified)}
                sponsored={isFeedSponsored(profile?.feed_priority)}
              />
            );
          })
        )}
      </section>
    </main>
  );
}
