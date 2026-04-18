import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser client for Supabase Auth (PKCE, session cookies).
 * Do not pass a custom `cookies` object here — @supabase/ssr uses `document.cookie`
 * with proper parse/serialize (including chunked cookies for the code verifier).
 * A hand-rolled cookie adapter breaks PKCE exchange on `/auth/callback`.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
