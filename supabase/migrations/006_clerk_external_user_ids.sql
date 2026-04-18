-- Clerk user IDs are strings (e.g. user_xxx), not Supabase auth.users UUIDs.
-- Policies must be dropped before ALTER COLUMN (Postgres error 0A000).

-- 1) Drop trigger that depends on profiles row shape
DROP TRIGGER IF EXISTS profiles_enforce_privileged_fields ON public.profiles;

-- 2) Drop all RLS policies on profiles and trips (they reference id / driver_id)
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_active_drivers_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;

DROP POLICY IF EXISTS "trips_select_public_active" ON public.trips;
DROP POLICY IF EXISTS "trips_select_own_driver" ON public.trips;
DROP POLICY IF EXISTS "trips_select_admin" ON public.trips;
DROP POLICY IF EXISTS "trips_insert_driver" ON public.trips;
DROP POLICY IF EXISTS "trips_update_own_driver" ON public.trips;
DROP POLICY IF EXISTS "trips_update_admin" ON public.trips;
DROP POLICY IF EXISTS "trips_delete_own_driver" ON public.trips;

-- 3) Supabase Auth triggers (no longer used with Clerk)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_email_confirmed() CASCADE;

-- 4) Foreign keys, then column types
ALTER TABLE public.trips DROP CONSTRAINT IF EXISTS trips_driver_id_fkey;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.trips ALTER COLUMN driver_id TYPE text USING driver_id::text;

ALTER TABLE public.trips
  ADD CONSTRAINT trips_driver_id_fkey
  FOREIGN KEY (driver_id) REFERENCES public.profiles (id) ON DELETE CASCADE;

-- 5) Helper + trigger function (JWT sub = Clerk user id)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (auth.jwt() ->> 'sub')
      AND p.role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.enforce_profile_privileged_fields()
RETURNS trigger AS $$
DECLARE
  sub text;
BEGIN
  IF public.is_admin() THEN
    RETURN new;
  END IF;

  sub := auth.jwt() ->> 'sub';

  IF sub IS NULL THEN
    RETURN new;
  END IF;

  IF sub IS DISTINCT FROM old.id THEN
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

-- 6) Recreate RLS policies (same rules as 001 + 003, with JWT sub)
CREATE POLICY "profiles_select_own_or_admin"
ON public.profiles FOR SELECT
USING (
  id = (auth.jwt() ->> 'sub')
  OR public.is_admin()
);

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
USING (id = (auth.jwt() ->> 'sub'))
WITH CHECK (id = (auth.jwt() ->> 'sub'));

CREATE POLICY "profiles_update_admin"
ON public.profiles FOR UPDATE
USING (public.is_admin());

CREATE POLICY "trips_select_public_active"
ON public.trips FOR SELECT
USING (
  status = 'active'
  AND departure_time > now()
);

CREATE POLICY "trips_select_own_driver"
ON public.trips FOR SELECT
USING (driver_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "trips_select_admin"
ON public.trips FOR SELECT
USING (public.is_admin());

CREATE POLICY "trips_insert_driver"
ON public.trips FOR INSERT
WITH CHECK (
  driver_id = (auth.jwt() ->> 'sub')
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (auth.jwt() ->> 'sub')
      AND p.role = 'driver'
      AND NOT p.is_restricted
      AND p.is_verified
  )
);

CREATE POLICY "trips_update_own_driver"
ON public.trips FOR UPDATE
USING (
  driver_id = (auth.jwt() ->> 'sub')
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (auth.jwt() ->> 'sub')
      AND p.role = 'driver'
      AND NOT p.is_restricted
      AND p.is_verified
  )
)
WITH CHECK (driver_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "trips_update_admin"
ON public.trips FOR UPDATE
USING (public.is_admin());

CREATE POLICY "trips_delete_own_driver"
ON public.trips FOR DELETE
USING (
  driver_id = (auth.jwt() ->> 'sub')
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (auth.jwt() ->> 'sub')
      AND p.role = 'driver'
      AND NOT p.is_restricted
      AND p.is_verified
  )
);
