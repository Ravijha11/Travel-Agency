"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { isDepartureAllowedIso } from "@/lib/departure-ist";

export async function incrementTripCallCount(tripId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("increment_trip_call_count", {
    p_trip_id: tripId,
  });
  if (!error) {
    revalidatePath("/");
  }
  return { ok: !error, error: error?.message };
}

export async function createTrip(formData: FormData) {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in" };

  const route_direction = String(formData.get("route_direction") ?? "");
  const origin = String(formData.get("origin") ?? "").trim();
  const destination = String(formData.get("destination") ?? "").trim();
  const departure_time = String(formData.get("departure_time") ?? "");
  const available_seats = Number(formData.get("available_seats"));
  const price_per_seat = Number(formData.get("price_per_seat"));

  if (
    !["lahar_to_gwalior", "gwalior_to_lahar"].includes(route_direction) ||
    !origin ||
    !destination ||
    !departure_time ||
    Number.isNaN(available_seats) ||
    available_seats < 0 ||
    Number.isNaN(price_per_seat) ||
    price_per_seat < 0
  ) {
    return { ok: false, error: "Invalid trip details" };
  }

  if (!isDepartureAllowedIso(new Date(departure_time).toISOString())) {
    return {
      ok: false,
      error:
        "Departure must be at least 1 minute from now, on a 15-minute mark (IST).",
    };
  }

  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_restricted, is_verified")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return { ok: false, error: "Profile not found" };
  if (profile.role !== "driver") return { ok: false, error: "Not a driver" };
  if (profile.is_restricted) return { ok: false, error: "Account restricted" };
  if (!profile.is_verified)
    return { ok: false, error: "Waiting for admin verification" };

  const { error } = await supabase.from("trips").insert({
    driver_id: userId,
    origin,
    destination,
    route_direction,
    departure_time: new Date(departure_time).toISOString(),
    available_seats,
    price_per_seat,
    status: "active",
  });

  if (!error) {
    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/my-trips");
  }

  return { ok: !error, error: error?.message };
}

export async function markTripFull(tripId: string) {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in" };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("trips")
    .update({ status: "full" })
    .eq("id", tripId)
    .eq("driver_id", userId);

  if (!error) {
    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/my-trips");
  }

  return { ok: !error, error: error?.message };
}

export async function markTripCompleted(tripId: string) {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in" };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("trips")
    .update({ status: "completed" })
    .eq("id", tripId)
    .eq("driver_id", userId);

  if (!error) {
    revalidatePath("/dashboard");
    revalidatePath("/my-trips");
  }

  return { ok: !error, error: error?.message };
}
