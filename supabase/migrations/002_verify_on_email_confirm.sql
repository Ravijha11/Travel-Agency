-- Auto-verify drivers on email confirmation

-- Allow system-triggered updates (auth.uid() is null) to bypass privileged-field checks
CREATE OR REPLACE FUNCTION public.enforce_profile_privileged_fields()
RETURNS trigger AS $$
BEGIN
  -- When this update is triggered internally (e.g. auth schema triggers),
  -- auth.uid() may be NULL. RLS still protects user-initiated updates.
  IF auth.uid() IS NULL THEN
    RETURN new;
  END IF;

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

-- When auth.users email is confirmed, mark profile as verified
CREATE OR REPLACE FUNCTION public.handle_email_confirmed()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
  SET is_verified = true
  WHERE id = new.id AND role = 'driver' AND is_verified = false;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;

CREATE TRIGGER on_auth_user_email_confirmed
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
WHEN (old.email_confirmed_at IS NULL AND new.email_confirmed_at IS NOT NULL)
EXECUTE PROCEDURE public.handle_email_confirmed();

