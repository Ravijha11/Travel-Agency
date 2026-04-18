# Local setup

## Prerequisites
- Node.js 18+ (recommended) and npm
- A Supabase project

## 1) Install dependencies

```bash
npm install
```

## 2) Environment variables
Create `.env.local` (or `.env`) with:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

You can find these in Supabase: **Project Settings → API**.

## 3) Set up the database
Run the SQL migration in Supabase SQL editor:

- `[f:/LahartoGwalior/supabase/migrations/001_init.sql](f:/LahartoGwalior/supabase/migrations/001_init.sql)`

This creates:
- `public.profiles`
- `public.trips`
- RLS policies
- helper functions (`public.is_admin`, `public.increment_trip_call_count`)

## 4) Create your first admin user
1. Sign up / sign in once in the app (so `profiles` row is created by trigger).
2. In Supabase SQL editor, promote your user id (UUID from `auth.users`):

```sql
UPDATE public.profiles SET role = 'admin' WHERE id = '<your-user-uuid>';
```

## 5) Run the dev server

```bash
npm run dev
```

Open `http://localhost:3000`.

## Common issues
### “Could not load trips…”
This usually means:
- env vars are missing/wrong, or
- RLS is blocking access because the migration was not applied correctly.

