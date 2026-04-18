import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

const isDashboard = createRouteMatcher(["/dashboard(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isDriverOnlyArea = createRouteMatcher(["/account(.*)", "/my-trips(.*)"]);

const skipRestrictedRedirect = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/suspended(.*)",
  "/login(.*)",
  "/api(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req)) {
    await auth.protect();
    const { userId } = await auth();
    if (!userId) return NextResponse.next();

    const supabase = createAdminClient();
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (data?.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  if (isDriverOnlyArea(req)) {
    await auth.protect();
    const { userId } = await auth();
    if (!userId) return NextResponse.next();

    const supabase = createAdminClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_restricted")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.is_restricted) {
      return NextResponse.redirect(new URL("/suspended", req.url));
    }
    if (
      profile &&
      profile.role !== "driver" &&
      profile.role !== "admin"
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  if (isDashboard(req)) {
    await auth.protect();
    const { userId } = await auth();
    if (!userId) return NextResponse.next();

    const supabase = createAdminClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_restricted")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.role === "admin") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    if (profile == null || profile.role === "driver") {
      if (profile?.is_restricted) {
        return NextResponse.redirect(new URL("/suspended", req.url));
      }
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  const { userId } = await auth();
  if (
    userId &&
    !skipRestrictedRedirect(req) &&
    (await isProfileRestricted(userId))
  ) {
    return NextResponse.redirect(new URL("/suspended", req.url));
  }

  return NextResponse.next();
});

async function isProfileRestricted(userId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("is_restricted")
    .eq("id", userId)
    .maybeSingle();
  return Boolean(data?.is_restricted);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
