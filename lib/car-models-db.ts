import "server-only";

import { cache } from "react";
import { createClient } from "@/utils/supabase/server";

export type CarModelRow = {
  label: string;
  image_src: string;
  aliases: string[];
  is_active: boolean;
};

export const getActiveCarModels = cache(async (): Promise<CarModelRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("car_models")
    .select("label, image_src, aliases, is_active")
    .eq("is_active", true)
    .order("label", { ascending: true });
  return (data ?? []) as CarModelRow[];
});

