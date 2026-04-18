"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { parseDriverProfileFormData } from "@/lib/driver-profile-fields";

export async function updateMyDriverProfile(formData: FormData) {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in" };

  const parsed = parseDriverProfileFormData(formData);
  if (!parsed.ok) return parsed;

  const supabase = createAdminClient();

  const { data: row } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (!row || row.role !== "driver") {
    return { ok: false, error: "Only drivers can update this profile." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      phone_number: parsed.data.phone_number,
      car_model: parsed.data.car_model,
      car_number: parsed.data.car_number,
    })
    .eq("id", userId)
    .eq("role", "driver");

  if (!error) {
    revalidatePath("/");
    revalidatePath("/account");
    revalidatePath("/dashboard");
    revalidatePath("/my-trips");
    return { ok: true as const };
  }

  const raw = error.message ?? "";
  const friendly =
    raw.includes("violates") || raw.includes("check")
      ? "Could not save — please check all fields and try again."
      : raw.includes("JWT") || raw.includes("permission")
        ? "Session expired. Sign in again and retry."
        : raw || "Could not save your profile. Please try again.";

  return { ok: false as const, error: friendly };
}
