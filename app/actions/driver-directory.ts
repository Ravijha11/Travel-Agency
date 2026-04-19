"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";

function normalizePhone(raw: string) {
  return raw.replace(/\D/g, "").slice(-10);
}

function isValidIndianMobile(phone10: string) {
  return /^[6-9]\d{9}$/.test(phone10);
}

async function requireAdmin() {
  const { userId } = await auth();
  const supabase = createAdminClient();
  if (!userId) return { supabase, userId: null, profile: null };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.role !== "admin") return { supabase, userId, profile: null };
  return { supabase, userId, profile };
}

export async function adminUpsertDriverDirectoryEntry(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) return { ok: false as const, error: "Forbidden" };

  const id = String(formData.get("id") ?? "").trim() || null;
  const phoneRaw = String(formData.get("phone_number") ?? "").trim();
  const phone_number = normalizePhone(phoneRaw);
  const display_name = String(formData.get("display_name") ?? "").trim();
  const car_model = String(formData.get("car_model") ?? "").trim();
  const car_number = String(formData.get("car_number") ?? "").trim();
  const default_seats = Number(String(formData.get("default_seats") ?? "").trim());
  const default_price_per_seat = Number(
    String(formData.get("default_price_per_seat") ?? "").trim(),
  );
  const is_active =
    String(formData.get("is_active") ?? "true").trim() !== "false";

  if (!isValidIndianMobile(phone_number)) {
    return {
      ok: false as const,
      error: "Phone must be a valid 10-digit Indian mobile (starts with 6–9)",
    };
  }
  if (!display_name) return { ok: false as const, error: "Name is required" };
  if (!Number.isFinite(default_seats) || default_seats < 0 || default_seats > 12) {
    return { ok: false as const, error: "Seats must be between 0 and 12" };
  }
  if (
    !Number.isFinite(default_price_per_seat) ||
    default_price_per_seat < 0 ||
    default_price_per_seat > 100000
  ) {
    return { ok: false as const, error: "Price must be between 0 and 100000" };
  }

  const payload = {
    phone_number,
    display_name,
    car_model,
    car_number,
    default_seats,
    default_price_per_seat,
    is_active,
  };

  const q = id
    ? supabase.from("driver_directory").upsert({ id, ...payload }).eq("id", id)
    : supabase.from("driver_directory").insert(payload);
  const { error } = await q;

  if (!error) {
    revalidatePath("/admin/driver-directory");
    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true as const };
  }

  return { ok: false as const, error: error.message ?? "Could not save" };
}

export async function adminDeleteDriverDirectoryEntry(id: string) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) return { ok: false as const, error: "Forbidden" };
  const { error } = await supabase.from("driver_directory").delete().eq("id", id);
  if (!error) {
    revalidatePath("/admin/driver-directory");
    revalidatePath("/admin");
    return { ok: true as const };
  }
  return { ok: false as const, error: error.message ?? "Could not delete" };
}

