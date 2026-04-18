-- Firebase-auth-based schema (Supabase used as database only)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Driver profiles keyed by Firebase UID
CREATE TABLE IF NOT EXISTS public.driver_profiles (
  id text PRIMARY KEY,
  full_name text NOT NULL DEFAULT '',
  phone_number text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'driver' CHECK (role IN ('admin', 'driver')),
  is_restricted boolean NOT NULL DEFAULT false,
  is_verified boolean NOT NULL DEFAULT false,
  car_model text NOT NULL DEFAULT '',
  car_number text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trips keyed by driver_profiles.id (Firebase UID)
CREATE TABLE IF NOT EXISTS public.driver_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id text NOT NULL REFERENCES public.driver_profiles (id) ON DELETE CASCADE,
  origin text NOT NULL,
  destination text NOT NULL,
  route_direction text NOT NULL CHECK (route_direction IN ('lahar_to_gwalior', 'gwalior_to_lahar')),
  departure_time timestamptz NOT NULL,
  available_seats integer NOT NULL CHECK (available_seats >= 0),
  price_per_seat numeric(12, 2) NOT NULL CHECK (price_per_seat >= 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'full', 'completed')),
  call_count integer NOT NULL DEFAULT 0 CHECK (call_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS driver_trips_feed_idx
ON public.driver_trips (route_direction, status, departure_time);

CREATE INDEX IF NOT EXISTS driver_trips_driver_idx
ON public.driver_trips (driver_id);

-- Call tracking function (no Supabase Auth dependency)
CREATE OR REPLACE FUNCTION public.increment_driver_trip_call_count(p_trip_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.driver_trips
  SET call_count = call_count + 1
  WHERE id = p_trip_id AND status = 'active';
END;
$$;

REVOKE ALL ON FUNCTION public.increment_driver_trip_call_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_driver_trip_call_count(uuid) TO anon, authenticated;

-- RLS: allow public to read active upcoming trips (feed), prevent public writes.
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "driver_trips_select_public_active" ON public.driver_trips;
CREATE POLICY "driver_trips_select_public_active"
ON public.driver_trips FOR SELECT
USING (
  status = 'active'
  AND departure_time > now()
);

DROP POLICY IF EXISTS "driver_profiles_select_public_active_drivers" ON public.driver_profiles;
CREATE POLICY "driver_profiles_select_public_active_drivers"
ON public.driver_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.driver_trips t
    WHERE t.driver_id = driver_profiles.id
      AND t.status = 'active'
      AND t.departure_time > now()
  )
);

-- Block public writes (service role bypasses RLS for app writes)
DROP POLICY IF EXISTS "driver_trips_no_public_insert" ON public.driver_trips;
CREATE POLICY "driver_trips_no_public_insert"
ON public.driver_trips FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "driver_trips_no_public_update" ON public.driver_trips;
CREATE POLICY "driver_trips_no_public_update"
ON public.driver_trips FOR UPDATE
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "driver_trips_no_public_delete" ON public.driver_trips;
CREATE POLICY "driver_trips_no_public_delete"
ON public.driver_trips FOR DELETE
USING (false);

DROP POLICY IF EXISTS "driver_profiles_no_public_update" ON public.driver_profiles;
CREATE POLICY "driver_profiles_no_public_update"
ON public.driver_profiles FOR UPDATE
USING (false)
WITH CHECK (false);

