const { createClient } = require("@supabase/supabase-js");
const { resolveCarCatalogLabel } = require("./carResolve");
const {
  istCalendarDateString,
  istLocalDateTimeToUtcDate,
  istAddCalendarDays,
} = require("./timeHelper");

let carModelsCache = { at: 0, rows: /** @type {any[]} */ ([]) };
const CAR_CACHE_MS = 10 * 60 * 1000;

async function fetchCarModelsCached(supabase) {
  if (
    Date.now() - carModelsCache.at < CAR_CACHE_MS &&
    carModelsCache.rows.length
  ) {
    return carModelsCache.rows;
  }
  const { data, error } = await supabase
    .from("car_models")
    .select("label, image_src, aliases")
    .eq("is_active", true)
    .order("label", { ascending: true });
  if (error) {
    console.error("car_models fetch", error.message);
    carModelsCache = { at: Date.now(), rows: [] };
    return [];
  }
  carModelsCache = { at: Date.now(), rows: data ?? [] };
  return carModelsCache.rows;
}

function pickProfileDisplayName(meta, parsed) {
  const msg =
    (parsed.profileNameHint || "").trim() ||
    (parsed.businessName || "").trim();
  const ji =
    Object.values(parsed.driverNames || {}).find((v) => v && String(v).trim()) ||
    "";
  const fromMessage = msg || ji;
  const tg = (meta.telegramDisplayName || "").trim();
  if (meta.listingSource === "telegram_group") {
    return fromMessage || tg || "";
  }
  return fromMessage || tg || "";
}

function makeSupabase() {
  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY) are required.",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function syntheticDriverId(phone) {
  return `tg_${phone}`;
}

function routeEndpoints(routeDirection) {
  if (routeDirection === "lahar_to_gwalior")
    return { origin: "Lahar", destination: "Gwalior" };
  return { origin: "Gwalior", destination: "Lahar" };
}

async function upsertTelegramProfile(supabase, phone, fullName, carModel) {
  const id = syntheticDriverId(phone);
  const row = {
    id,
    full_name: (fullName || "").trim() || "Driver",
    phone_number: phone,
    role: "driver",
    is_restricted: false,
    is_verified: true,
    car_model: carModel || "Other",
    car_number: "",
  };
  const { error } = await supabase.from("profiles").upsert(row, {
    onConflict: "id",
  });
  return { error, id };
}

async function findTelegramTripSameDay(
  supabase,
  driverId,
  routeDirection,
  departureIso,
) {
  const day = istCalendarDateString(new Date(departureIso));
  const start = istLocalDateTimeToUtcDate(day, 0, 0).toISOString();
  const next = istAddCalendarDays(day, 1);
  const end = istLocalDateTimeToUtcDate(next, 0, 0).toISOString();
  const { data, error } = await supabase
    .from("trips")
    .select("id")
    .eq("driver_id", driverId)
    .eq("route_direction", routeDirection)
    .eq("status", "active")
    .in("listing_source", ["telegram_group", "telegram_dm"])
    .gte("departure_time", start)
    .lt("departure_time", end)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("findTelegramTripSameDay", error);
    return null;
  }
  return data?.id ?? null;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 */
async function saveParsedTrips(supabase, parsed, meta) {
  const saved = [];
  const models = await fetchCarModelsCached(supabase);
  const { label: resolvedCarLabel } = resolveCarCatalogLabel(
    models,
    parsed.carMatchQuery,
  );

  const seats =
    parsed.availableSeats != null &&
    parsed.availableSeats >= 1 &&
    parsed.availableSeats <= 12
      ? parsed.availableSeats
      : 4;
  const price =
    parsed.pricePerSeat != null &&
    !Number.isNaN(parsed.pricePerSeat) &&
    parsed.pricePerSeat >= 0
      ? parsed.pricePerSeat
      : 0;

  const displayName = pickProfileDisplayName(meta, parsed);
  const carModel = resolvedCarLabel || "Other";

  const { directions, phones, departure, isUrgent, isDaily } = parsed;

  for (const phone of phones) {
    const { error: pe, id: driverId } = await upsertTelegramProfile(
      supabase,
      phone,
      displayName,
      carModel,
    );
    if (pe) {
      console.error("profile upsert", pe);
      throw pe;
    }

    for (const routeDirection of directions) {
      const { origin, destination } = routeEndpoints(routeDirection);
      const existingId = await findTelegramTripSameDay(
        supabase,
        driverId,
        routeDirection,
        departure.toISOString(),
      );

      const row = {
        driver_id: driverId,
        origin,
        destination,
        route_direction: routeDirection,
        departure_time: departure.toISOString(),
        available_seats: seats,
        price_per_seat: price,
        status: "active",
        listing_source: meta.listingSource,
        raw_message: meta.rawMessage ?? null,
        telegram_user_id: meta.telegramUserId ?? null,
        telegram_username: meta.telegramUsername ?? null,
        telegram_chat_id: meta.telegramChatId ?? null,
        is_urgent: !!isUrgent,
        is_daily_listing: !!isDaily,
      };

      if (existingId) {
        const { data, error } = await supabase
          .from("trips")
          .update(row)
          .eq("id", existingId)
          .select("id")
          .single();
        if (error) throw error;
        console.log("trip saved", "update", data?.id, routeDirection, phone);
        saved.push({ ...data, routeDirection, phone, driverId });
      } else {
        const { data, error } = await supabase
          .from("trips")
          .insert(row)
          .select("id")
          .single();
        if (error) throw error;
        console.log("trip saved", "insert", data?.id, routeDirection, phone);
        saved.push({ ...data, routeDirection, phone, driverId });
      }
    }
  }
  return { saved, resolvedCarLabel };
}

async function deleteTripById(supabase, tripId) {
  const { error } = await supabase.from("trips").delete().eq("id", tripId);
  return { ok: !error, error };
}

async function getTripById(supabase, tripId) {
  const { data, error } = await supabase
    .from("trips")
    .select("id, telegram_user_id, telegram_chat_id, listing_source, status")
    .eq("id", tripId)
    .maybeSingle();
  return { data, error };
}

/** Latest active Telegram-ingested trip this user posted in this chat (group or private). */
async function deleteLastOwnTelegramTripInChat(
  supabase,
  chatId,
  telegramUserId,
) {
  const { data, error } = await supabase
    .from("trips")
    .select("id")
    .eq("telegram_chat_id", String(chatId))
    .eq("telegram_user_id", String(telegramUserId))
    .in("listing_source", ["telegram_group", "telegram_dm"])
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return { ok: false, error };
  if (!data?.id) {
    return {
      ok: false,
      error: { message: "No active bot-listed trip found for you in this chat." },
    };
  }
  return deleteTripById(supabase, data.id);
}

async function listTripsForChatToday(supabase, chatId) {
  const day = istCalendarDateString();
  const start = istLocalDateTimeToUtcDate(day, 0, 0).toISOString();
  const next = istAddCalendarDays(day, 1);
  const end = istLocalDateTimeToUtcDate(next, 0, 0).toISOString();
  const q = supabase
    .from("trips")
    .select(
      "id, route_direction, departure_time, driver_id, raw_message, is_urgent",
    )
    .eq("telegram_chat_id", String(chatId))
    .eq("status", "active")
    .gte("departure_time", start)
    .lt("departure_time", end)
    .order("departure_time", { ascending: true });
  const { data, error } = await q;
  return { data: data ?? [], error };
}

async function listTripsCreatedToday(supabase) {
  const day = istCalendarDateString();
  const start = istLocalDateTimeToUtcDate(day, 0, 0).toISOString();
  const next = istAddCalendarDays(day, 1);
  const end = istLocalDateTimeToUtcDate(next, 0, 0).toISOString();
  const { data, error } = await supabase
    .from("trips")
    .select(
      "id, route_direction, departure_time, driver_id, listing_source, created_at",
    )
    .gte("created_at", start)
    .lt("created_at", end)
    .order("created_at", { ascending: false });
  return { data: data ?? [], error };
}

async function listPendingStyleTrips(supabase) {
  const { data, error } = await supabase
    .from("trips")
    .select(
      "id, route_direction, departure_time, driver_id, listing_source, raw_message, is_urgent",
    )
    .in("listing_source", ["telegram_group", "telegram_dm"])
    .eq("status", "active")
    .gt("departure_time", new Date().toISOString())
    .order("departure_time", { ascending: true })
    .limit(25);
  return { data: data ?? [], error };
}

async function countTripsThisWeek(supabase) {
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { count, error } = await supabase
    .from("trips")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since);
  return { count: count ?? 0, error };
}

module.exports = {
  makeSupabase,
  syntheticDriverId,
  upsertTelegramProfile,
  saveParsedTrips,
  deleteTripById,
  getTripById,
  deleteLastOwnTelegramTripInChat,
  listTripsForChatToday,
  listTripsCreatedToday,
  listPendingStyleTrips,
  countTripsThisWeek,
};
