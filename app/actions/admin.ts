"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { parseDriverProfileFormData } from "@/lib/driver-profile-fields";

async function requireAdmin() {
  const { userId } = await auth();
  const supabase = createAdminClient();
  if (!userId) return { supabase, userId: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profile?.role !== "admin") {
    return { supabase, userId, profile: null };
  }

  return { supabase, userId, profile };
}

export async function adminSetDriverVerified(
  driverId: string,
  is_verified: boolean,
) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) return { ok: false, error: "Forbidden" };

  const { error } = await supabase
    .from("profiles")
    .update({ is_verified })
    .eq("id", driverId)
    .eq("role", "driver");

  if (!error) {
    revalidatePath("/admin");
    revalidatePath("/");
  }
  return { ok: !error, error: error?.message };
}

export async function adminSetDriverRestricted(
  driverId: string,
  is_restricted: boolean,
) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) return { ok: false, error: "Forbidden" };

  const { error } = await supabase
    .from("profiles")
    .update({ is_restricted })
    .eq("id", driverId)
    .eq("role", "driver");

  if (!error) {
    revalidatePath("/admin");
    revalidatePath("/");
  }
  return { ok: !error, error: error?.message };
}

export async function adminSetDriverFeedPriority(
  driverId: string,
  feed_priority: number,
) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) return { ok: false, error: "Forbidden" };

  if (
    !Number.isFinite(feed_priority) ||
    !Number.isInteger(feed_priority) ||
    feed_priority < 1 ||
    feed_priority > 9999
  ) {
    return { ok: false, error: "Priority must be a whole number from 1 to 9999" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ feed_priority })
    .eq("id", driverId)
    .eq("role", "driver");

  if (!error) {
    revalidatePath("/admin");
    revalidatePath("/");
  }
  return { ok: !error, error: error?.message };
}

export async function adminUpdateDriverProfile(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) return { ok: false, error: "Forbidden" };

  const driverId = String(formData.get("driver_id") ?? "").trim();
  if (!driverId) return { ok: false, error: "Missing driver" };

  const parsed = parseDriverProfileFormData(formData);
  if (!parsed.ok) return parsed;

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      phone_number: parsed.data.phone_number,
      car_model: parsed.data.car_model,
      car_number: parsed.data.car_number,
    })
    .eq("id", driverId)
    .eq("role", "driver");

  if (!error) {
    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/account");
    revalidatePath("/dashboard");
    revalidatePath("/my-trips");
  }

  return { ok: !error, error: error?.message };
}
