-- Optional metadata for trips ingested from the Telegram bot (service role).
-- Website continues to read trips + profiles; new columns are additive.

ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS listing_source text NOT NULL DEFAULT 'web';

ALTER TABLE public.trips
  DROP CONSTRAINT IF EXISTS trips_listing_source_check;

ALTER TABLE public.trips
  ADD CONSTRAINT trips_listing_source_check
  CHECK (listing_source IN ('web', 'telegram_group', 'telegram_dm'));

ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS raw_message text;

ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS telegram_user_id text;

ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS telegram_username text;

ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS telegram_chat_id text;

ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS is_urgent boolean NOT NULL DEFAULT false;

ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS is_daily_listing boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS trips_telegram_chat_departure_idx
  ON public.trips (telegram_chat_id, departure_time)
  WHERE listing_source = 'telegram_group';

COMMENT ON COLUMN public.trips.listing_source IS
  'web = posted via site; telegram_* = ingested by Lahar Connect Telegram bot.';
