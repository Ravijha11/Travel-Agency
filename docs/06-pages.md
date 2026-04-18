# Pages

This is the current “site map” and what each page does.

## Public
- `/` — **Home feed** (browse trips by direction)
  - Source: `[f:/LahartoGwalior/app/(public)/page.tsx](f:/LahartoGwalior/app/(public)/page.tsx)`
- `/my-trips` — **Driver’s posted trips** (requires sign-in)
  - Source: `[f:/LahartoGwalior/app/(public)/my-trips/page.tsx](f:/LahartoGwalior/app/(public)/my-trips/page.tsx)`
- `/account` — **Account hub** (shows profile + links to dashboard/admin)
  - Source: `[f:/LahartoGwalior/app/(public)/account/page.tsx](f:/LahartoGwalior/app/(public)/account/page.tsx)`

## Driver
- `/dashboard` — **Post and manage trips**
  - Source: `[f:/LahartoGwalior/app/dashboard/page.tsx](f:/LahartoGwalior/app/dashboard/page.tsx)`

## Admin
- `/admin` — **Verify/restrict drivers + view call-clicks**
  - Source: `[f:/LahartoGwalior/app/admin/page.tsx](f:/LahartoGwalior/app/admin/page.tsx)`

## Auth / system
- `/login` — sign-in UI
  - Source: `[f:/LahartoGwalior/app/(auth)/login/page.tsx](f:/LahartoGwalior/app/(auth)/login/page.tsx)`
- `/auth/callback` — exchanges Supabase code for session
  - Source: `[f:/LahartoGwalior/app/auth/callback/page.tsx](f:/LahartoGwalior/app/auth/callback/page.tsx)`
- `/auth/signout` — POST route to sign out
  - Source: `[f:/LahartoGwalior/app/auth/signout/route.ts](f:/LahartoGwalior/app/auth/signout/route.ts)`
- `/suspended` — restricted user screen
  - Source: `[f:/LahartoGwalior/app/suspended/page.tsx](f:/LahartoGwalior/app/suspended/page.tsx)`

## QA checklist (quick)
- Home shows trips and driver contact; call click increments.
- Logged-out users can still browse home.
- Driver can sign in and post a trip.
- Driver can mark trip full/completed.
- Admin can verify/restrict driver and see it reflected in UI.

