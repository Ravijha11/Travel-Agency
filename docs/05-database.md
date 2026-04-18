# Database

The database schema and RLS rules are defined in:
- `[f:/LahartoGwalior/supabase/migrations/001_init.sql](f:/LahartoGwalior/supabase/migrations/001_init.sql)`

## Tables
### `public.profiles`
One row per Supabase Auth user.

Key fields:
- `id` (uuid): same as `auth.users.id`
- `full_name`, `phone_number`
- `role`: `admin` | `driver`
- `is_verified`: trust badge (admin toggled)
- `is_restricted`: access suspension (admin toggled)
- `car_model`, `car_number`

### `public.trips`
Driver trip listings.

Key fields:
- `driver_id` (uuid): references `profiles.id`
- `origin`, `destination`
- `route_direction`: `lahar_to_gwalior` | `gwalior_to_lahar`
- `departure_time` (timestamptz)
- `available_seats` (int)
- `price_per_seat` (numeric)
- `status`: `active` | `full` | `completed`
- `call_count` (int): total “call now” taps

## Functions
### `public.is_admin()`
Security definer function used by RLS policies to check admin role without recursion.

### `public.increment_trip_call_count(p_trip_id uuid)`
Security definer function to increment `trips.call_count` safely without granting broad `UPDATE` permissions.

## RLS overview
### Profiles
- Drivers can select their own profile.
- Admin can select any profile.
- Public can read driver contact only if that driver has an active upcoming trip.

### Trips
- Public can read only active upcoming trips.
- Drivers can insert/update/delete only their own trips.
- Admin can read/update any trips.

