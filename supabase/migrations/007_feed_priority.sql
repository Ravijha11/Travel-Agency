-- Feed ordering: lower feed_priority surfaces earlier on the public trip list (monetization / boosts).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS feed_priority integer NOT NULL DEFAULT 100;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_feed_priority_range;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_feed_priority_range
  CHECK (feed_priority >= 1 AND feed_priority <= 9999);

COMMENT ON COLUMN public.profiles.feed_priority IS
  'Public feed rank: lower values sort before higher (1 = strongest boost). Default 100.';

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
     OR new.is_verified IS DISTINCT FROM old.is_verified
     OR new.feed_priority IS DISTINCT FROM old.feed_priority THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql;
