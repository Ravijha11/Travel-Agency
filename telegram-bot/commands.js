const { formatIstClockLabel, formatIstDateLabel } = require("./timeHelper");
const {
  listTripsForChatToday,
  listTripsCreatedToday,
  listPendingStyleTrips,
  countTripsThisWeek,
  deleteTripById,
  getTripById,
  deleteLastOwnTelegramTripInChat,
} = require("./supabase");

const ROUTE_LABELS = {
  lahar_to_gwalior: "Lahar → Gwalior",
  gwalior_to_lahar: "Gwalior → Lahar",
};

function routeLine(dir) {
  return ROUTE_LABELS[dir] ?? dir;
}

function formatPrivateSavedSummary(saved, parsed) {
  const lines = [];
  lines.push(`✅ ${saved.length} Trip${saved.length === 1 ? "" : "s"} Added!\n`);
  const byRoute = new Map();
  for (const row of saved) {
    const k = row.routeDirection;
    if (!byRoute.has(k)) byRoute.set(k, []);
    byRoute.get(k).push(row);
  }
  for (const [dir, rows] of byRoute) {
    lines.push(`📍 Route: ${routeLine(dir)}`);
    lines.push(`📞 Phones: ${[...new Set(rows.map((r) => r.phone))].join(", ")}`);
  }
  const dep = parsed.departure;
  if (dep && !Number.isNaN(dep.getTime())) {
    let timeLine = `🕐 Departure: ${formatIstClockLabel(dep.toISOString())}`;
    if (parsed.end && !Number.isNaN(parsed.end.getTime())) {
      timeLine += ` → ${formatIstClockLabel(parsed.end.toISOString())}`;
    }
    lines.push(timeLine);
    lines.push(`📅 Date: ${formatIstDateLabel(dep.toISOString())}`);
  }
  const carLabel =
    parsed.resolvedCarLabel ||
    [parsed.carType, parsed.isAc ? "AC" : null].filter(Boolean).join(" · ") ||
    "Not specified";
  lines.push(`🚙 Car (catalog): ${carLabel}`);
  lines.push(
    `💺 Seats: ${parsed.availableSeats != null ? parsed.availableSeats : 4}`,
  );
  lines.push(
    `💰 Price/seat: ₹${parsed.pricePerSeat != null ? parsed.pricePerSeat : 0}`,
  );
  lines.push(`⚡ Urgent: ${parsed.isUrgent ? "Yes" : "No"}`);
  lines.push(`🔁 Daily: ${parsed.isDaily ? "Yes" : "No"}`);
  lines.push("\nSaved to laharconnect.online ✅");
  return lines.join("\n");
}

function formatGroupShortReply(saved, parsed) {
  const first = saved[0];
  const dep = parsed.departure;
  const time =
    dep && !Number.isNaN(dep.getTime())
      ? formatIstClockLabel(dep.toISOString())
      : "—";
  const route = first ? routeLine(first.routeDirection) : "—";
  const phone = first?.phone ?? "—";
  const seats = parsed.availableSeats != null ? parsed.availableSeats : 4;
  const price = parsed.pricePerSeat != null ? parsed.pricePerSeat : 0;
  return (
    `✅ Trip added to website!\n` +
    `📍 ${route} | 🕐 ${time} | 📞 ${phone}\n` +
    `💺 ${seats} seats | 💰 ₹${price}/seat`
  );
}

async function cmdStart(ctx, isOwner) {
  const id = ctx.from?.id;
  if (!isOwner) {
    await ctx.reply("⛔ Unauthorized.");
    return;
  }
  await ctx.reply(
    `Welcome to Lahar Connect bot.\n\n` +
      `Your chat id: \`${id}\`\n` +
      `Paste forwarded driver messages here to publish trips.\n\n` +
      `Use /help for commands.`,
    { parse_mode: "Markdown" },
  );
}

async function cmdId(ctx, isOwner) {
  if (!isOwner) {
    await ctx.reply("⛔ Unauthorized.");
    return;
  }
  await ctx.reply(`Your chat id: \`${ctx.from?.id}\``, {
    parse_mode: "Markdown",
  });
}

async function cmdHelp(ctx, isOwner, inGroup) {
  if (inGroup) {
    await ctx.reply(
      `Group commands:\n` +
        `/trips — today's trips from this group (with full ids)\n` +
        `/delete <trip-uuid> — delete a trip you posted via the bot, or owner can delete any\n` +
        `/delete_last — delete your most recent active listing from this group\n` +
        `/help — this message`,
    );
    return;
  }
  if (!isOwner) {
    await ctx.reply("⛔ Unauthorized.");
    return;
  }
  await ctx.reply(
    `Owner commands:\n` +
      `/start — welcome + chat id\n` +
      `/id — chat id\n` +
      `/today — trips created today\n` +
      `/pending — upcoming bot listings\n` +
      `/delete <trip-uuid> — remove any trip (by id)\n` +
      `/delete_last — remove your last bot-listed trip from this chat\n` +
      `/stats — trips created in the last 7 days\n` +
      `/help — this message`,
  );
}

async function cmdToday(ctx, supabase, isOwner) {
  if (!isOwner) {
    await ctx.reply("⛔ Unauthorized.");
    return;
  }
  const { data, error } = await listTripsCreatedToday(supabase);
  if (error) {
    await ctx.reply(`Could not load: ${error.message}`);
    return;
  }
  if (!data.length) {
    await ctx.reply("No trips created today yet.");
    return;
  }
  const lines = data.slice(0, 40).map((t) => {
    const r = routeLine(t.route_direction);
    const when = formatIstClockLabel(t.departure_time);
    return `• ${t.id.slice(0, 8)}… ${r} ${when} (${t.listing_source})`;
  });
  await ctx.reply(`Today (${data.length}):\n\n${lines.join("\n")}`);
}

async function cmdPending(ctx, supabase, isOwner) {
  if (!isOwner) {
    await ctx.reply("⛔ Unauthorized.");
    return;
  }
  const { data, error } = await listPendingStyleTrips(supabase);
  if (error) {
    await ctx.reply(`Could not load: ${error.message}`);
    return;
  }
  if (!data.length) {
    await ctx.reply("No upcoming Telegram-sourced trips.");
    return;
  }
  const lines = data.map((t) => {
    const r = routeLine(t.route_direction);
    const when = formatIstClockLabel(t.departure_time);
    const u = t.is_urgent ? " ⚡" : "";
    return `• ${t.id.slice(0, 8)}… ${r} ${when}${u}`;
  });
  await ctx.reply(`Upcoming bot listings:\n\n${lines.join("\n")}`);
}

async function cmdStats(ctx, supabase, isOwner) {
  if (!isOwner) {
    await ctx.reply("⛔ Unauthorized.");
    return;
  }
  const { count, error } = await countTripsThisWeek(supabase);
  if (error) {
    await ctx.reply(`Could not load: ${error.message}`);
    return;
  }
  await ctx.reply(`Trips created in the last 7 days: ${count}`);
}

async function cmdTrips(ctx, supabase) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  const { data, error } = await listTripsForChatToday(supabase, chatId);
  if (error) {
    await ctx.reply(`Could not load: ${error.message}`);
    return;
  }
  if (!data.length) {
    await ctx.reply("No active trips from this group for today.");
    return;
  }
  const lines = data.map((t) => {
    const when = formatIstClockLabel(t.departure_time);
    const u = t.is_urgent ? " ⚡" : "";
    return `${routeLine(t.route_direction)} ${when}${u}\n${t.id}`;
  });
  await ctx.reply(
    `Today's trips (this group). Copy an id to run /delete <id>, or use /delete_last:\n\n${lines.join("\n\n")}`,
  );
}

async function cmdDelete(ctx, supabase, opts) {
  const { isOwner, chatKind, isDriverGroup } = opts;
  const parts = (ctx.message?.text || "").trim().split(/\s+/);
  const id = parts[1];
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    await ctx.reply(
      "Usage: /delete <trip-uuid>\n\nUse /trips to see ids, or /delete_last to remove your last listing.",
    );
    return;
  }

  const { data: trip, error: fe } = await getTripById(supabase, id);
  if (fe) {
    await ctx.reply(`Could not load trip: ${fe.message}`);
    return;
  }
  if (!trip) {
    await ctx.reply("Trip not found.");
    return;
  }

  let canDelete = false;
  if (isOwner) {
    canDelete = true;
  } else if (
    chatKind === "group" &&
    isDriverGroup &&
    ["telegram_group", "telegram_dm"].includes(trip.listing_source) &&
    String(trip.telegram_user_id || "") === String(ctx.from?.id ?? "") &&
    String(trip.telegram_chat_id || "") === String(ctx.chat?.id ?? "")
  ) {
    canDelete = true;
  }

  if (!canDelete) {
    await ctx.reply(
      "⛔ You can only delete trips you posted with this bot in this group. The owner can delete any trip by id.",
    );
    return;
  }

  const { ok, error } = await deleteTripById(supabase, id);
  if (!ok) {
    await ctx.reply(`Delete failed: ${error?.message || "unknown"}`);
    return;
  }
  await ctx.reply("🗑️ Trip deleted.");
}

async function cmdDeleteLast(ctx, supabase, opts) {
  const { isOwner, chatKind, isDriverGroup } = opts;
  const chatId = ctx.chat?.id;
  const uid = ctx.from?.id;
  if (chatId == null || uid == null) return;

  if (chatKind === "group" && !isDriverGroup) {
    await ctx.reply("Use /delete_last in the Lahar Connect drivers group.");
    return;
  }
  if (chatKind === "private" && !isOwner) {
    await ctx.reply("⛔ Unauthorized.");
    return;
  }

  const { ok, error } = await deleteLastOwnTelegramTripInChat(
    supabase,
    chatId,
    uid,
  );
  if (!ok) {
    await ctx.reply(`Could not delete: ${error?.message || "unknown"}`);
    return;
  }
  await ctx.reply("🗑️ Your latest bot-listed trip in this chat was deleted.");
}

module.exports = {
  ROUTE_LABELS,
  formatPrivateSavedSummary,
  formatGroupShortReply,
  cmdStart,
  cmdId,
  cmdHelp,
  cmdToday,
  cmdPending,
  cmdStats,
  cmdTrips,
  cmdDelete,
  cmdDeleteLast,
};
