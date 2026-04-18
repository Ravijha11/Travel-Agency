-- 007 reintroduced auth.uid() vs text Clerk ids; restore JWT sub pattern from 006 and keep feed_priority guard.

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
     OR new.is_verified IS DISTINCT FROM old.is_verified
     OR new.feed_priority IS DISTINCT FROM old.feed_priority THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql;
