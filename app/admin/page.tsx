import { currentUser } from "@clerk/nextjs/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { ensureClerkProfile } from "@/lib/clerk/ensure-profile";
import { AdminDriversList } from "@/components/admin-drivers-list";
import { DEFAULT_FEED_PRIORITY } from "@/lib/feed-priority";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AdminPage() {
  const user = await currentUser();
  if (!user) {
    return (
      <p className="text-sm text-muted-foreground">
        Sign in required. Open Account to sign in.
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

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (adminProfile?.role !== "admin") {
    return (
      <p className="text-sm text-muted-foreground">
        Admin access required.
      </p>
    );
  }

  const [{ data: drivers }, { data: trips }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, full_name, phone_number, car_model, car_number, is_verified, is_restricted, feed_priority, updated_at",
      )
      .eq("role", "driver")
      .order("full_name", { ascending: true }),
    supabase.from("trips").select("driver_id, call_count"),
  ]);

  const totalCallClicks =
    trips?.reduce((sum, t) => sum + (t.call_count ?? 0), 0) ?? 0;

  const callClicksByDriverId = new Map<string, number>();
  for (const t of trips ?? []) {
    if (!t.driver_id) continue;
    callClicksByDriverId.set(
      t.driver_id,
      (callClicksByDriverId.get(t.driver_id) ?? 0) + (t.call_count ?? 0),
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Call clicks (all trips)</CardTitle>
          <CardDescription>
            Total taps on “Call now” across the platform — share this number
            with drivers to show demand.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-semibold tabular-nums">
            {totalCallClicks.toLocaleString("en-IN")}
          </p>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Registered drivers</h2>
        <AdminDriversList
          drivers={(drivers ?? []).map((d) => ({
            ...d,
            feed_priority: d.feed_priority ?? DEFAULT_FEED_PRIORITY,
            updated_at: d.updated_at ?? undefined,
            call_clicks: callClicksByDriverId.get(d.id) ?? 0,
          }))}
        />
      </section>
    </>
  );
}
