import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  let profile: {
    role: string;
    is_restricted: boolean;
  } | null = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("role, is_restricted")
      .eq("id", user.id)
      .maybeSingle();
    profile = data;
  }

  if (user && profile?.is_restricted) {
    const allowedWhenRestricted =
      pathname.startsWith("/suspended") ||
      pathname.startsWith("/auth/signout") ||
      pathname.startsWith("/auth/callback") ||
      pathname.startsWith("/auth/update-password");
    if (!allowedWhenRestricted) {
      const url = request.nextUrl.clone();
      url.pathname = "/suspended";
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (profile?.is_restricted) {
      const url = request.nextUrl.clone();
      url.pathname = "/suspended";
      return NextResponse.redirect(url);
    }
    if (profile?.role === "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
    if (profile?.role !== "driver") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
