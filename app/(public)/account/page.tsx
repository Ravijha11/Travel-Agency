import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createAdminClient } from "@/utils/supabase/admin";
import { ensureClerkProfile } from "@/lib/clerk/ensure-profile";
import { ClerkSignOutButton } from "@/components/clerk-sign-out-button";
import { DriverProfileForm } from "@/components/driver-profile-form";
import { VerifiedBadge } from "@/components/verified-badge";
import { getActiveCarModels } from "@/lib/car-models-db";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = noIndexMetadata("Account");

export default async function AccountPage() {
  const user = await currentUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-lg px-4 pt-6">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Sign in to manage your profile and driver tools.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/sign-in?redirect_url=/account"
              className={cn(buttonVariants(), "inline-flex w-full justify-center")}
            >
              Sign in
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  await ensureClerkProfile({
    userId: user.id,
    email: user.primaryEmailAddress?.emailAddress ?? null,
    firstName: user.firstName,
    lastName: user.lastName,
  });

  const supabase = createAdminClient();
  const carCatalog = await getActiveCarModels();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, phone_number, role, car_model, car_number, is_verified, is_restricted",
    )
    .eq("id", user.id)
    .single();

  const email = user.primaryEmailAddress?.emailAddress ?? null;

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 pt-4">
      <h1 className="text-xl font-semibold">
        {profile?.role === "driver" ? "Account & settings" : "Account"}
      </h1>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-lg">{profile?.full_name || "Driver"}</CardTitle>
            {profile?.is_verified ? <VerifiedBadge size="md" /> : null}
          </div>
          <CardDescription className="space-y-1.5">
            {profile?.role === "driver" ? (
              <>
                <span className="block">
                  Post trips and manage listings from{" "}
                  <Link
                    href="/dashboard"
                    className="font-medium text-foreground underline underline-offset-2"
                  >
                    Trip updates
                  </Link>
                  . Use this page for email, sign out, and editing driver details.
                </span>
                <span className="block text-muted-foreground">{email ?? "—"}</span>
              </>
            ) : (
              (email ?? profile?.phone_number ?? "—")
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Email:</span>{" "}
            {email ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Phone:</span>{" "}
            {profile?.phone_number || "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Role:</span>{" "}
            {profile?.role}
          </p>
          <p>
            <span className="text-muted-foreground">Car:</span>{" "}
            {profile?.car_model || "—"} · {profile?.car_number || "—"}
          </p>
          {profile?.is_verified ? (
            <p className="text-sm text-muted-foreground">
              Verified — blue badge on your public listings.
            </p>
          ) : null}
          {profile?.is_restricted ? (
            <p className="text-destructive">Your account is restricted.</p>
          ) : null}
        </CardContent>
      </Card>

      {profile?.role === "driver" ? (
        <DriverProfileForm
          initial={{
            full_name: profile?.full_name ?? "",
            phone_number: profile?.phone_number ?? "",
            car_model: profile?.car_model ?? "",
            car_number: profile?.car_number ?? "",
          }}
          carCatalog={carCatalog}
        />
      ) : null}

      <div className="flex flex-col gap-2">
        {profile?.role === "driver" ? (
          <Link
            href="/dashboard"
            className={cn(buttonVariants(), "inline-flex w-full justify-center")}
          >
            Open Trip updates
          </Link>
        ) : null}
        {profile?.role === "admin" ? (
          <Link
            href="/admin"
            className={cn(
              buttonVariants({ variant: "secondary" }),
              "inline-flex w-full justify-center",
            )}
          >
            Admin panel
          </Link>
        ) : null}
        <ClerkSignOutButton className="w-full" />
      </div>
    </main>
  );
}
