-- Admin-managed car catalog (photos + alias spellings).
-- Hybrid strategy: UI uses this table when populated; otherwise falls back to local defaults.

CREATE TABLE IF NOT EXISTS public.car_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  image_src text NOT NULL,
  aliases text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- updated_at trigger (reuses existing function from 001_init.sql / 006 migration)
DROP TRIGGER IF EXISTS car_models_set_updated_at ON public.car_models;
CREATE TRIGGER car_models_set_updated_at
BEFORE UPDATE ON public.car_models
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE INDEX IF NOT EXISTS car_models_label_idx
ON public.car_models (label);

CREATE INDEX IF NOT EXISTS car_models_aliases_gin_idx
ON public.car_models
USING gin (aliases);

ALTER TABLE public.car_models ENABLE ROW LEVEL SECURITY;

-- Public read (feed + driver forms need it)
DROP POLICY IF EXISTS "car_models_select_public" ON public.car_models;
CREATE POLICY "car_models_select_public"
ON public.car_models
FOR SELECT
USING (true);

-- Admin writes
DROP POLICY IF EXISTS "car_models_insert_admin" ON public.car_models;
CREATE POLICY "car_models_insert_admin"
ON public.car_models
FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "car_models_update_admin" ON public.car_models;
CREATE POLICY "car_models_update_admin"
ON public.car_models
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "car_models_delete_admin" ON public.car_models;
CREATE POLICY "car_models_delete_admin"
ON public.car_models
FOR DELETE
USING (public.is_admin());

