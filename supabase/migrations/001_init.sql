-- Lahar–Gwalior car sharing: profiles, trips, RLS, helpers

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiles (1:1 with auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone_number text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'driver' CHECK (role IN ('admin', 'driver')),
  is_restricted boolean NOT NULL DEFAULT false,
  is_verified boolean NOT NULL DEFAULT false,
  car_model text NOT NULL DEFAULT '',
  car_number text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
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

CREATE INDEX trips_feed_idx ON public.trips (route_direction, status, departure_time);
CREATE INDEX trips_driver_idx ON public.trips (driver_id);

-- Avoid RLS self-referential recursion when checking admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- updated_at touch
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- New auth user -> profile row (default driver)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone_number, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'phone_number', new.phone, ''),
    'driver'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Prevent drivers from changing privileged profile fields (admins bypass)
CREATE OR REPLACE FUNCTION public.enforce_profile_privileged_fields()
RETURNS trigger AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN new;
  END IF;

  IF auth.uid() IS DISTINCT FROM old.id THEN
    RAISE EXCEPTION 'invalid profile update';
  END IF;

  IF new.role IS DISTINCT FROM old.role
     OR new.is_restricted IS DISTINCT FROM old.is_restricted
     OR new.is_verified IS DISTINCT FROM old.is_verified THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_enforce_privileged_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE public.enforce_profile_privileged_fields();

-- Public call tracking (avoids broad UPDATE policies on trips)
CREATE OR REPLACE FUNCTION public.increment_trip_call_count(p_trip_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.trips
  SET call_count = call_count + 1
  WHERE id = p_trip_id AND status = 'active';
END;
$$;

REVOKE ALL ON FUNCTION public.increment_trip_call_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_trip_call_count(uuid) TO anon, authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- profiles policies
CREATE POLICY "profiles_select_own_or_admin"
ON public.profiles FOR SELECT
USING (
  id = auth.uid()
  OR public.is_admin()
);

-- Read driver contact if they currently have an active upcoming trip (public feed)
CREATE POLICY "profiles_select_active_drivers_public"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.trips t
    WHERE t.driver_id = profiles.id
      AND t.status = 'active'
      AND t.departure_time > now()
  )
);

CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_admin"
ON public.profiles FOR UPDATE
USING (public.is_admin());

-- trips policies
CREATE POLICY "trips_select_public_active"
ON public.trips FOR SELECT
USING (
  status = 'active'
  AND departure_time > now()
);

CREATE POLICY "trips_select_own_driver"
ON public.trips FOR SELECT
USING (driver_id = auth.uid());

CREATE POLICY "trips_select_admin"
ON public.trips FOR SELECT
USING (public.is_admin());

CREATE POLICY "trips_insert_driver"
ON public.trips FOR INSERT
WITH CHECK (
  driver_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'driver' AND NOT p.is_restricted)
);

CREATE POLICY "trips_update_own_driver"
ON public.trips FOR UPDATE
USING (driver_id = auth.uid())
WITH CHECK (driver_id = auth.uid());

CREATE POLICY "trips_update_admin"
ON public.trips FOR UPDATE
USING (public.is_admin());

CREATE POLICY "trips_delete_own_driver"
ON public.trips FOR DELETE
USING (driver_id = auth.uid());

-- Promote your first account to admin (run in SQL editor with your user id):
-- UPDATE public.profiles SET role = 'admin' WHERE id = '<uuid-from-auth.users>';
