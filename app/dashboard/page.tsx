import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { ensureClerkProfile } from "@/lib/clerk/ensure-profile";
import { isDriverProfileIncomplete } from "@/lib/driver-profile-fields";
import { TripPostWizard } from "@/components/trip-post-wizard";
import { DriverTripRow } from "@/components/driver-trip-row";
import { DriverProfileForm } from "@/components/driver-profile-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getActiveCarModels } from "@/lib/car-models-db";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    return (
      <p className="text-sm text-muted-foreground">
        Sign in required. Use{" "}
        <Link href="/sign-in?redirect_url=/dashboard" className="underline">
          Sign in
        </Link>{" "}
        to manage trips.
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
  const carCatalog = await getActiveCarModels();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, is_verified, is_restricted, role, phone_number, car_model, car_number",
    )
    .eq("id", user.id)
    .maybeSingle();

  const profileIncomplete =
    profile?.role === "driver" &&
    isDriverProfileIncomplete({
      full_name: profile.full_name,
      phone_number: profile.phone_number,
      car_model: profile.car_model,
      car_number: profile.car_number,
    });

  const canPostTrips =
    profile?.role === "driver" &&
    profile.is_verified &&
    !profileIncomplete;

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
      {profile?.role === "driver" && profileIncomplete ? (
        <section className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4 dark:bg-primary/10">
          <div>
            <h2 className="text-base font-semibold">Finish your profile first</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your name, calling number, and car details once. Riders see this
              on the home feed. You can change it later from{" "}
              <strong>Trip updates</strong> → Profile.
            </p>
          </div>
          <DriverProfileForm
            variant="onboarding"
            initial={{
              full_name: profile?.full_name ?? "",
              phone_number: profile?.phone_number ?? "",
              car_model: profile?.car_model ?? "",
              car_number: profile?.car_number ?? "",
            }}
            carCatalog={carCatalog}
          />
        </section>
      ) : null}

      {profile?.role === "driver" && !profileIncomplete && !profile.is_verified ? (
        <div className="rounded-xl border bg-card p-4 text-sm">
          <p className="font-medium">Waiting for admin verification</p>
          <p className="mt-1 text-muted-foreground">
            Your details are saved. An admin will verify your account so you can
            post trips on the home feed.
          </p>
          <Link
            href="/account"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "mt-3 inline-flex",
            )}
          >
            Open profile & settings
          </Link>
        </div>
      ) : null}

      {canPostTrips ? <TripPostWizard /> : null}

      {profile?.role === "driver" && !profileIncomplete ? (
        <section className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Tip:</span> use{" "}
          <Link href="/account" className="underline">
            Profile
          </Link>{" "}
          for account email and sign out. Trip times use 12-hour (am/pm) India
          time.
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Your active listings</h2>
        {!trips?.length ? (
          <p className="text-sm text-muted-foreground">
            No active trips.{" "}
            {canPostTrips
              ? "Post one above to appear on the home feed."
              : "Complete the steps above to post trips."}
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
