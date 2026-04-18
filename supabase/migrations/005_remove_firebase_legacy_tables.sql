-- App uses public.profiles / public.trips (UUID, auth.users) from 001_init + follow-ups.
-- Remove Firebase-only tables (text Firebase UIDs) if migration 004 was applied.
-- Back up any data you need before running this in production.

DROP TABLE IF EXISTS public.driver_trips CASCADE;
DROP TABLE IF EXISTS public.driver_profiles CASCADE;
DROP FUNCTION IF EXISTS public.increment_driver_trip_call_count(uuid);
