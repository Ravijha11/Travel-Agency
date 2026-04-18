# Auth and roles

## Supabase auth
Authentication is handled by Supabase Auth. Server-side pages use the SSR client in:
- `[f:/LahartoGwalior/utils/supabase/server.ts](f:/LahartoGwalior/utils/supabase/server.ts)`

Client-side auth (callback exchange) uses:
- `[f:/LahartoGwalior/utils/supabase/client.ts](f:/LahartoGwalior/utils/supabase/client.ts)`

## Profiles table
Every auth user has a `public.profiles` row created automatically by a database trigger:
- See `handle_new_user()` in `[f:/LahartoGwalior/supabase/migrations/001_init.sql](f:/LahartoGwalior/supabase/migrations/001_init.sql)`

## Roles and flags
`profiles.role`:
- `driver`: can post/manage own trips
- `admin`: can manage drivers and view aggregate metrics

`profiles.is_restricted`:
- If true, user is redirected to `/suspended` (middleware)

`profiles.is_verified`:
- Admin-controlled “blue tick” for drivers (UX trust signal)

## Route protection rules
Implemented in `[f:/LahartoGwalior/utils/supabase/middleware.ts](f:/LahartoGwalior/utils/supabase/middleware.ts)`:
- `/admin`: require signed-in user AND `role === "admin"`
- `/dashboard`: require signed-in user AND `role === "driver"` AND not restricted
- restricted users: allow only `/suspended` and auth routes, redirect everything else

## Promoting an admin (one-time)

```sql
UPDATE public.profiles SET role = 'admin' WHERE id = '<uuid>';
```

