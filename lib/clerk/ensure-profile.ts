import "server-only";

import { createAdminClient } from "@/utils/supabase/admin";

/**
 * Ensure a `profiles` row exists for this Clerk user (replaces Supabase Auth trigger).
 */
export async function ensureClerkProfile(params: {
  userId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
}) {
  const { userId, email, firstName, lastName } = params;
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existing) return;

  const full_name = [firstName, lastName].filter(Boolean).join(" ").trim();

  await supabase.from("profiles").insert({
    id: userId,
    full_name: full_name || (email?.split("@")[0] ?? "Driver"),
    phone_number: "",
    role: "driver",
    is_verified: false,
    is_restricted: false,
    car_model: "",
    car_number: "",
  });
}
