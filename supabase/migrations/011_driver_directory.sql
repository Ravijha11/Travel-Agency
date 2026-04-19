-- Admin-managed driver directory keyed by phone number.
-- Used as a fallback source for Telegram ingestion until a real user profile exists.

CREATE TABLE IF NOT EXISTS public.driver_directory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL UNIQUE,
  display_name text NOT NULL DEFAULT '',
  car_model text NOT NULL DEFAULT '',
  car_number text NOT NULL DEFAULT '',
  default_seats integer NOT NULL DEFAULT 4 CHECK (default_seats >= 0),
  default_price_per_seat numeric(12, 2) NOT NULL DEFAULT 250 CHECK (default_price_per_seat >= 0),
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS driver_directory_phone_idx ON public.driver_directory (phone_number);

-- Touch updated_at on changes (reuse existing function from 001_init.sql).
DROP TRIGGER IF EXISTS driver_directory_set_updated_at ON public.driver_directory;
CREATE TRIGGER driver_directory_set_updated_at
BEFORE UPDATE ON public.driver_directory
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.driver_directory ENABLE ROW LEVEL SECURITY;

-- Admin-only management (reads/writes in control room).
DROP POLICY IF EXISTS "driver_directory_select_admin" ON public.driver_directory;
CREATE POLICY "driver_directory_select_admin"
ON public.driver_directory FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "driver_directory_insert_admin" ON public.driver_directory;
CREATE POLICY "driver_directory_insert_admin"
ON public.driver_directory FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "driver_directory_update_admin" ON public.driver_directory;
CREATE POLICY "driver_directory_update_admin"
ON public.driver_directory FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "driver_directory_delete_admin" ON public.driver_directory;
CREATE POLICY "driver_directory_delete_admin"
ON public.driver_directory FOR DELETE
USING (public.is_admin());

