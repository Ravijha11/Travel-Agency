import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { ensureClerkProfile } from "@/lib/clerk/ensure-profile";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROUTE_LABELS, type RouteDirection } from "@/lib/constants";
import { formatIst12h } from "@/lib/format-ist-time";

export default async function MyTripsPage() {
  const user = await currentUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-lg px-4 pt-6">
        <Card>
          <CardHeader>
            <CardTitle>My trips</CardTitle>
            <CardDescription>
              Sign in as a driver to see trips you have posted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/sign-in?redirect_url=/my-trips"
              className={cn(buttonVariants(), "inline-flex w-full justify-center")}
            >
              Sign in
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  await ensureClerkProfile({
    userId: user.id,
    email: user.primaryEmailAddress?.emailAddress ?? null,
    firstName: user.firstName,
    lastName: user.lastName,
  });

  const supabase = createAdminClient();
  const { data: trips } = await supabase
    .from("trips")
    .select(
      "id, origin, destination, route_direction, departure_time, available_seats, price_per_seat, status",
    )
    .eq("driver_id", user.id)
    .in("status", ["active", "full"])
    .order("departure_time", { ascending: true });

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 pt-4">
      <h1 className="text-xl font-semibold">My trips</h1>
      {!trips?.length ? (
        <p className="text-sm text-muted-foreground">
          You have no active listings.{" "}
          <Link href="/dashboard" className="text-primary underline">
            Post a trip
          </Link>
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {trips.map((t) => (
            <li key={t.id}>
              <Card>
                <CardHeader className="space-y-2 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">
                      {ROUTE_LABELS[t.route_direction as RouteDirection]}
                    </CardTitle>
                    <Badge
                      variant={
                        t.status === "active" ? "default" : "secondary"
                      }
                    >
                      {t.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {formatIst12h(t.departure_time)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {t.origin} → {t.destination} · {t.available_seats} seats · ₹
                  {t.price_per_seat}/seat
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
