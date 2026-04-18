"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";

const BUCKET = "car-photos";

function normalizeAliases(raw: string) {
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
}

function isValidImageSrc(s: string) {
  const t = s?.trim();
  if (!t) return false;
  if (t.startsWith("/")) return true;
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

async function uploadCarPhoto(
  supabase: ReturnType<typeof createAdminClient>,
  label: string,
  file: File,
) {
  const extFromType =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";
  const ext =
    (file.name.split(".").pop() || "").toLowerCase().slice(0, 5) ||
    extFromType;
  const path = `${slugify(label) || "car"}-${Date.now()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || undefined });
  if (upErr) {
    return { ok: false as const, error: upErr.message ?? "Upload failed" };
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const url = data?.publicUrl ?? "";
  if (!url) return { ok: false as const, error: "Could not get public URL" };
  return { ok: true as const, url };
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

export async function adminUpsertCarModel(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) return { ok: false as const, error: "Forbidden" };

  const id = String(formData.get("id") ?? "").trim() || null;
  const label = String(formData.get("label") ?? "").trim();
  let image_src = String(formData.get("image_src") ?? "").trim();
  const aliasesCsv = String(formData.get("aliases") ?? "").trim();
  const is_active =
    String(formData.get("is_active") ?? "true").trim() !== "false";
  const file = formData.get("image_file");

  if (!label) return { ok: false as const, error: "Label is required" };

  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/")) {
      return { ok: false as const, error: "Please upload an image file" };
    }
    const up = await uploadCarPhoto(supabase, label, file);
    if (!up.ok) return { ok: false as const, error: up.error };
    image_src = up.url;
  }

  if (!isValidImageSrc(image_src)) {
    return {
      ok: false as const,
      error:
        "Add a photo URL (https or http) or upload an image. Paths under /public are also allowed.",
    };
  }

  const aliases = normalizeAliases(aliasesCsv);

  const payload = { label, image_src, aliases, is_active };
  const q = id
    ? supabase.from("car_models").upsert({ id, ...payload }).eq("id", id)
    : supabase.from("car_models").insert(payload);
  const { error } = await q;

  if (!error) {
    revalidatePath("/admin/cars");
    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/account");
    return { ok: true as const };
  }
  return { ok: false as const, error: error.message ?? "Could not save" };
}

export async function adminDeleteCarModel(id: string) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) return { ok: false as const, error: "Forbidden" };
  const { error } = await supabase.from("car_models").delete().eq("id", id);
  if (!error) {
    revalidatePath("/admin/cars");
    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/account");
    return { ok: true as const };
  }
  return { ok: false as const, error: error.message ?? "Could not delete" };
}

