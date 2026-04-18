# Architecture

## Tech stack
- **Next.js 14** (App Router)
- **Supabase** (Auth + Postgres + RLS)
- **Tailwind CSS** + **shadcn/ui**
- **PWA** via `@ducanh2912/next-pwa`

## App Router structure
- `app/layout.tsx`: root layout + global metadata
- `app/(public)/*`: public routes rendered with bottom navigation
- `app/(auth)/*`: auth pages (login)
- `app/dashboard/*`: driver tools
- `app/admin/*`: admin tools
- `app/auth/*`: auth callback + signout route

## Data flow (high level)
### Public feed
1. Server Component page loads in `[app/(public)/page.tsx]`.
2. Reads trips from `public.trips` (RLS allows public read for active upcoming trips).
3. Derives driver ids and reads matching `public.profiles` fields for drivers with active trips.

### Driver tools
1. Authenticated driver loads `[app/dashboard/page.tsx]`.
2. `supabase.auth.getUser()` determines current user.
3. Driver posts trips via server actions in `[app/actions/trips.ts]` and sees their trips.

### Admin tools
1. Admin loads `[app/admin/page.tsx]`.
2. Admin toggles verified/restricted via server actions in `[app/actions/admin.ts]`.

## Auth + routing protection
All requests pass through middleware:
- `[f:/LahartoGwalior/middleware.ts](f:/LahartoGwalior/middleware.ts)`
- `[f:/LahartoGwalior/utils/supabase/middleware.ts](f:/LahartoGwalior/utils/supabase/middleware.ts)`

Middleware enforces:
- `/admin` requires admin
- `/dashboard` requires driver and not restricted
- restricted users are redirected to `/suspended`

