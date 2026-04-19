const path = require("path");
const fs = require("fs");

const envPath = path.join(__dirname, ".env");
if (!fs.existsSync(envPath)) {
  console.error(
    `Missing .env file at:\n  ${envPath}\n` +
      `Create it from .env.example. On Windows, ensure the name is ".env" (not ".env.txt").`,
  );
  process.exit(1);
}
require("dotenv").config({ path: envPath });

const { Telegraf } = require("telegraf");
const { parseTripMessage } = require("./parser");
const { makeSupabase, saveParsedTrips } = require("./supabase");
const {
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
} = require("./commands");

const token = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
if (!token) {
  console.error(
    "TELEGRAM_BOT_TOKEN is empty or not set.\n" +
      "Open telegram-bot/.env and add a line exactly:\n" +
      "  TELEGRAM_BOT_TOKEN=paste_token_here\n" +
      "(no quotes, no spaces around =). Then save and run npm start again.",
  );
  process.exit(1);
}

let supabase;
try {
  supabase = makeSupabase();
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

function isOwner(ctx) {
  const a = process.env.ALLOWED_CHAT_ID;
  if (a == null || a === "") return false;
  return String(ctx.from?.id) === String(a);
}

function isDriverGroup(ctx) {
  const gid = process.env.DRIVER_GROUP_ID;
  if (gid == null || gid === "") return false;
  return String(ctx.chat?.id) === String(gid);
}

function chatKind(ctx) {
  const t = ctx.chat?.type;
  if (t === "private") return "private";
  if (t === "group" || t === "supergroup") return "group";
  return "other";
}

/** Display name from Telegram account (group poster or owner in DM). */
function telegramAuthorName(from) {
  if (!from || typeof from !== "object") return "";
  const parts = [from.first_name, from.last_name]
    .map((s) => String(s || "").trim())
    .filter(Boolean);
  if (parts.length) return parts.join(" ");
  if (from.username) return `@${String(from.username).trim()}`;
  return "";
}

async function tryIngestText(ctx, text, opts) {
  const now = new Date();
  const parsed = parseTripMessage(text, {
    strictRoute: opts.strictRoute,
    now,
  });

  if (parsed.silent) {
    console.log("skip: no route (group silent)");
    return false;
  }
  if (parsed.skip && !parsed.ok) {
    console.log("skip: no phones");
    return false;
  }
  if (!parsed.ok) {
    if (opts.replyErrors) {
      await ctx.reply(
        `Could not parse this message.\n\n${parsed.reasons.join("\n")}`,
      );
    }
    return false;
  }

  const meta = {
    listingSource: opts.listingSource,
    rawMessage: text,
    telegramUserId: ctx.from?.id != null ? String(ctx.from.id) : null,
    telegramUsername: ctx.from?.username || null,
    telegramChatId: ctx.chat?.id != null ? String(ctx.chat.id) : null,
    telegramDisplayName: telegramAuthorName(ctx.from),
  };

  const { saved, resolvedCarLabel } = await saveParsedTrips(
    supabase,
    parsed,
    meta,
  );
  parsed.resolvedCarLabel = resolvedCarLabel;
  if (opts.replyErrors) {
    await ctx.reply(formatPrivateSavedSummary(saved, parsed));
  } else {
    await ctx.reply(formatGroupShortReply(saved, parsed));
  }
  console.log("ingest ok", { count: saved.length, chat: meta.telegramChatId });
  return true;
}

const bot = new Telegraf(token);

bot.catch((err, ctx) => {
  console.error("bot error", err, ctx?.update);
});

bot.start(async (ctx) => {
  try {
    await cmdStart(ctx, isOwner(ctx));
  } catch (e) {
    console.error(e);
    try {
      await ctx.reply("Something went wrong. Check logs.");
    } catch (_) {}
  }
});

bot.command("help", async (ctx) => {
  try {
    await cmdHelp(ctx, isOwner(ctx), chatKind(ctx) === "group");
  } catch (e) {
    console.error(e);
  }
});

bot.command("id", async (ctx) => {
  try {
    await cmdId(ctx, isOwner(ctx));
  } catch (e) {
    console.error(e);
  }
});

bot.command("today", async (ctx) => {
  try {
    await cmdToday(ctx, supabase, isOwner(ctx));
  } catch (e) {
    console.error(e);
  }
});

bot.command("pending", async (ctx) => {
  try {
    await cmdPending(ctx, supabase, isOwner(ctx));
  } catch (e) {
    console.error(e);
  }
});

bot.command("stats", async (ctx) => {
  try {
    await cmdStats(ctx, supabase, isOwner(ctx));
  } catch (e) {
    console.error(e);
  }
});

bot.command("trips", async (ctx) => {
  try {
    if (chatKind(ctx) !== "group") {
      await ctx.reply("Use /trips inside the drivers group.");
      return;
    }
    await cmdTrips(ctx, supabase);
  } catch (e) {
    console.error(e);
  }
});

bot.command("delete", async (ctx) => {
  try {
    await cmdDelete(ctx, supabase, {
      isOwner: isOwner(ctx),
      chatKind: chatKind(ctx),
      isDriverGroup: isDriverGroup(ctx),
    });
  } catch (e) {
    console.error(e);
  }
});

bot.command("delete_last", async (ctx) => {
  try {
    await cmdDeleteLast(ctx, supabase, {
      isOwner: isOwner(ctx),
      chatKind: chatKind(ctx),
      isDriverGroup: isDriverGroup(ctx),
    });
  } catch (e) {
    console.error(e);
  }
});

bot.on("message", async (ctx, next) => {
  try {
    const text =
      ("text" in ctx.message && ctx.message.text) ||
      ("caption" in ctx.message && ctx.message.caption) ||
      "";
    if (!text) return next();

    const kind = chatKind(ctx);
    console.log("message", {
      kind,
      chatId: ctx.chat?.id,
      from: ctx.from?.id,
      preview: text.slice(0, 80),
    });

    if (kind === "private") {
      if (!isOwner(ctx)) {
        await ctx.reply("⛔ Unauthorized");
        return;
      }
      if (text.startsWith("/")) return next();
      await tryIngestText(ctx, text, {
        strictRoute: false,
        replyErrors: true,
        listingSource: "telegram_dm",
      });
      return;
    }

    if (kind === "group") {
      if (!isDriverGroup(ctx)) {
        return;
      }
      if (text.startsWith("/")) return next();
      const hasPhone = /\b[6-9]\d{9}\b/.test(text);
      const routeHints =
        /lahar|gwalior|लहार|लाहर|लहर|ग्वालियर/i.test(text) &&
        /(to|से|from)/i.test(text);
      if (!hasPhone || !routeHints) {
        console.log("group skip: need phone + route-ish text");
        return;
      }
      await tryIngestText(ctx, text, {
        strictRoute: true,
        replyErrors: false,
        listingSource: "telegram_group",
      });
      return;
    }
  } catch (e) {
    console.error("message handler", e);
    try {
      if (chatKind(ctx) === "private" && isOwner(ctx)) {
        await ctx.reply(`Error: ${e.message || e}`);
      }
    } catch (_) {}
  }
});

bot
  .launch()
  .then(() => {
    console.log("Lahar Connect Telegram bot is running.");
    if (!process.env.DRIVER_GROUP_ID) {
      console.warn("DRIVER_GROUP_ID is not set — group ingestion disabled.");
    }
    if (!process.env.ALLOWED_CHAT_ID) {
      console.warn("ALLOWED_CHAT_ID is not set — owner DMs disabled.");
    }
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
