-- Require admin verification to post/manage trips

-- Unverified drivers can still sign in and view their dashboard,
-- but they cannot create/update/delete trip listings until verified.

DROP POLICY IF EXISTS "trips_insert_driver" ON public.trips;
CREATE POLICY "trips_insert_driver"
ON public.trips FOR INSERT
WITH CHECK (
  driver_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'driver'
      AND NOT p.is_restricted
      AND p.is_verified
  )
);

DROP POLICY IF EXISTS "trips_update_own_driver" ON public.trips;
CREATE POLICY "trips_update_own_driver"
ON public.trips FOR UPDATE
USING (
  driver_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'driver'
      AND NOT p.is_restricted
      AND p.is_verified
  )
)
WITH CHECK (
  driver_id = auth.uid()
);

DROP POLICY IF EXISTS "trips_delete_own_driver" ON public.trips;
CREATE POLICY "trips_delete_own_driver"
ON public.trips FOR DELETE
USING (
  driver_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'driver'
      AND NOT p.is_restricted
      AND p.is_verified
  )
);

