# Deploy

## Recommended: Vercel
This is a Next.js app; the simplest deployment is Vercel.

## 1) Create the deployment
- Push your code to GitHub
- Import the repo into Vercel

## Environment variables (required)
Set these in your hosting provider:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Database migration
Before production launch, apply:
- `[f:/LahartoGwalior/supabase/migrations/001_init.sql](f:/LahartoGwalior/supabase/migrations/001_init.sql)`

## 2) Configure Supabase Auth URLs (important)
In Supabase:
- **Authentication → URL Configuration**
  - Set **Site URL** to your production domain (e.g. `https://laharconnect.online`)
  - Add **Redirect URLs** for:
    - `https://laharconnect.online/auth/callback`

If you use a staging domain, add its callback URL too.

## PWA notes
PWA is enabled via `@ducanh2912/next-pwa` in:
- `[f:/LahartoGwalior/next.config.mjs](f:/LahartoGwalior/next.config.mjs)`

In development mode it is disabled (to avoid caching headaches).

If you ship a new service worker and a tester sees an “old UI”, ask them to:
- hard refresh, or
- uninstall and reinstall the PWA

## Pre-launch checklist
- Home page loads trips
- Auth callback works in production domain
- Admin account created and tested
- Legal pages published
- Support contact is visible

