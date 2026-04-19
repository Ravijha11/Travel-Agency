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
import { HERO_BANNER_PATH } from "@/lib/branding";
import { jsonLdLocalBusiness, jsonLdWebsite } from "@/lib/seo";
import { formatIst12hTodayTomorrow } from "@/lib/format-ist-time";
import { IstLiveClock } from "@/components/ist-live-clock";
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
      <script
        type="application/ld+json"
        // JSON-LD for local search (Lahar/Bhind/MP + route intent keywords)
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([jsonLdWebsite(), jsonLdLocalBusiness()]),
        }}
      />
      <header className="space-y-3">
        <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] h-[36vh] min-h-[210px] w-screen max-h-[520px] overflow-hidden">
          <Image
            src={HERO_BANNER_PATH}
            alt="Lahar"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent" />
        </div>

        <div className="rounded-2xl border bg-card/70 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold tracking-tight">
                Available trips
              </p>
              <p className="text-xs text-muted-foreground">
                Today & tomorrow only (India time). Tap a card to call the driver.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 text-right">
              <span className="rounded-full border bg-background px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Live feed
              </span>
              <p className="text-[11px] text-muted-foreground">
                India now:{" "}
                <IstLiveClock />
              </p>
            </div>
          </div>
        </div>
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
                departureLabel={formatIst12hTodayTomorrow(trip.departure_time)}
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
