# Lahar Connect — Telegram bot

Node.js bot that reads driver trip messages from a Telegram **supergroup** (or from the **owner’s private chat**), parses Hindi/English text, and writes rows into the same Supabase `trips` table the Next.js site uses. Active trips with a future `departure_time` appear on [laharconnect.online](https://laharconnect.online) automatically.

## Security

- Put secrets only in `telegram-bot/.env` (never commit `.env`).
- **If a bot token was pasted into a chat, log, or repo, revoke it in [@BotFather](https://t.me/BotFather) and create a new token.**

## Prerequisites

1. Supabase project with migrations applied, including **`010_telegram_trip_fields.sql`** (adds `listing_source`, `raw_message`, Telegram metadata, `is_urgent`, `is_daily_listing`).
2. Supabase **service role** key (server-side only; the bot is a trusted backend).
3. Telegram bot token from BotFather.

## Synthetic driver profiles

The website expects each trip to reference `profiles.id` (`driver_id`). For Telegram listings the bot upserts a profile per phone:

- `id`: `tg_<10-digit phone>`
- `phone_number`: the same number (calls from the site use this)
- `is_verified`: `true` so listings behave like trusted feed entries
- `full_name`: **Telegram display name** of the person who posted in the drivers group (`first_name` + `last_name`, or `@username`). In **owner DM** backups, the name parsed from the message (e.g. “मिश्रा जी”) is preferred when present, otherwise the owner’s Telegram name.
- `car_model`: matched against Supabase **`car_models`** (`label` + `aliases`, same fuzzy rules as the website). Wrong spellings often still map to the correct catalog row so feed **photos** match. If the catalog is empty, `Other` is stored.

### Parsed from the message (trips + defaults)

- **Seats** — e.g. `3 seat`, `5 seats`, `5 सीट`, `खाली 4`, Hindi `तीन सीट` → `available_seats` (default **4** if not found).
- **Price** — e.g. `₹200`, `charge 200`, `चार्ज 250`, `Rs 300`, `200/-`, `per seat 250`, `प्रति सीट 200`, `किराया 300`, `दाम 300`, `मात्र 200` → `price_per_seat` (default **0** if not found; phone numbers are stripped first so mobiles are not read as prices).

## Setup

1. Open [@BotFather](https://t.me/BotFather) → `/newbot` → copy the HTTP token.
2. Create a Telegram group **“Lahar Connect Drivers”**, turn it into a **supergroup** if Telegram offers that, and add drivers.
3. Add `@YourBot` to the group and promote it to **administrator** (so it can read all messages and reply).
4. In **private chat** with the bot, send `/start` then `/id` → copy your numeric **user id** → this is `ALLOWED_CHAT_ID`.
5. Send any message **in the drivers group** while the bot is running locally → watch the console for `chatId` → set `DRIVER_GROUP_ID` to that value (often a negative number like `-1001234567890`).
6. Copy `telegram-bot/.env.example` to `telegram-bot/.env` and fill:

   - `TELEGRAM_BOT_TOKEN`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `ALLOWED_CHAT_ID`
   - `DRIVER_GROUP_ID`

7. Install and run:

```bash
cd telegram-bot
npm install
npm start
```

Deploy the same `telegram-bot` folder on [Railway](https://railway.app) or [Render](https://render.com): set **Variables** (same keys as `.env.example`) in the dashboard — **do not rely on a `.env` file** in the container; the bot reads `process.env` when no file is present. Start command `npm start`, long polling (no webhook required).

## Behaviour summary

| Context | Who | Parsing | Reply |
|--------|-----|---------|--------|
| Drivers group (`DRIVER_GROUP_ID`) | Any member | Needs **phone** + route-like text (`Lahar`/`Gwalior`/`से`/`to`, etc.) | Short “Trip added” on success only |
| Private chat | `ALLOWED_CHAT_ID` only | Always tries to parse non-commands | Full confirmation, or what’s missing |
| Other private chats | — | — | `Unauthorized` |

The bot **does not** reply to random chatter in the group (no phone / no route hint → silent).

### Commands

**In the drivers group**

- `/trips` — today’s active trips from this group; each entry includes the **full trip id** (for `/delete`).
- `/delete <trip-uuid>` — **Owner:** any trip. **Driver:** only a trip they posted via the bot in this group (matched by Telegram user id).
- `/delete_last` — deletes **your** most recent active bot-listed trip in this chat (same matching rules as above).
- `/help`

**Owner private chat**

- `/start`, `/id`, `/help`
- `/today` — trips created today (any source).
- `/pending` — upcoming listings ingested from Telegram.
- `/stats` — trips created in the last 7 days.
- `/delete <trip-uuid>` — delete any trip by id.
- `/delete_last` — delete the latest bot-listed trip you created from this private chat (after pasting a listing).

## How drivers use it

Drivers stay in the Telegram group and post the same Hindi/English blurbs they already use. If the message includes a route and a mobile number, the bot adds one row per **(phone × direction)** for today’s implied schedule (IST). Customers refresh the website and tap **Call now**.

## IST and parsing notes

- All scheduling logic assumes **Asia/Kolkata (IST)**.
- Relative phrases like **“30 मिनट में”** set an urgent departure at now + 30 minutes.
- Ambiguous times like **“5:30”** with no AM/PM: if that clock already passed this morning and it is still before 1:00 PM IST, the bot prefers **same-day PM**; from **1:00 PM IST** onward it prefers **next morning** for a small morning-style clock (see `timeHelper.js`).

## Repo layout

```
telegram-bot/
├── bot.js
├── parser.js
├── timeHelper.js
├── supabase.js
├── commands.js
├── package.json
├── .env.example
└── README.md
```
