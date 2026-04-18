import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { ensureClerkProfile } from "@/lib/clerk/ensure-profile";
import { isDriverProfileIncomplete } from "@/lib/driver-profile-fields";
import { TripPostWizard } from "@/components/trip-post-wizard";
import { DriverTripRow } from "@/components/driver-trip-row";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    return (
      <p className="text-sm text-muted-foreground">
        Sign in required. Use Account → Sign in.
      </p>
    );
  }

  await ensureClerkProfile({
    userId: user.id,
    email: user.primaryEmailAddress?.emailAddress ?? null,
    firstName: user.firstName,
    lastName: user.lastName,
  });

  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "is_verified, is_restricted, role, phone_number, car_model, car_number",
    )
    .eq("id", user.id)
    .maybeSingle();

  const profileIncomplete =
    profile?.role === "driver" &&
    isDriverProfileIncomplete({
      phone_number: profile.phone_number,
      car_model: profile.car_model,
      car_number: profile.car_number,
    });

  const { data: trips } = await supabase
    .from("trips")
    .select(
      "id, route_direction, origin, destination, departure_time, available_seats, price_per_seat, status",
    )
    .eq("driver_id", user.id)
    .in("status", ["active", "full"])
    .order("departure_time", { ascending: true });

  return (
    <>
      {profileIncomplete ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          <p className="font-medium">Complete your driver profile</p>
          <p className="mt-1 text-amber-900/90 dark:text-amber-100/90">
            Add your calling number, car model, and plate on Account so riders
            can reach you and trust your listing.
          </p>
          <Link
            href="/account"
            className={cn(
              buttonVariants({ variant: "secondary", size: "sm" }),
              "mt-3 inline-flex",
            )}
          >
            Go to Account
          </Link>
        </div>
      ) : null}
      {profile?.role === "driver" && profile?.is_verified ? (
        <TripPostWizard />
      ) : (
        <div className="rounded-xl border bg-card p-4 text-sm">
          <p className="font-medium">Waiting for admin verification</p>
          <p className="mt-1 text-muted-foreground">
            Your driver profile must be verified by admin before you can post
            trips.
          </p>
        </div>
      )}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Your active listings</h2>
        {!trips?.length ? (
          <p className="text-sm text-muted-foreground">
            No active trips. Post one above to appear on the home feed.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {trips.map((t) => (
              <li key={t.id}>
                <DriverTripRow trip={t} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
