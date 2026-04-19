import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { KeyRound, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = noIndexMetadata("Driver login");

export default function SignInPage() {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-32 right-[-120px] h-[520px] w-[520px] rounded-full bg-sky-500/15 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/30" />
      </div>

      <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 p-4">
        <header className="space-y-2 text-center">
          <div className="mx-auto inline-flex max-w-full items-center justify-center gap-2 rounded-2xl border bg-card/70 px-3 py-2 shadow-sm backdrop-blur">
            <BrandLogo width={140} height={40} className="h-9 max-h-10 max-w-[10rem]" />
            <span className="text-sm font-semibold tracking-tight">Driver sign-in</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Driver login</h1>
          <p className="text-sm text-muted-foreground">
            For <span className="font-medium text-foreground">car owners / drivers</span> who want to post rides.
          </p>
        </header>

        <Card className="bg-card/70 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="size-4 text-primary" aria-hidden />
              Sign in to continue
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              First time here? Create a driver account, register your car, and fill your details.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <SignIn
                routing="path"
                path="/sign-in"
                forceRedirectUrl="/dashboard"
                signUpFallbackRedirectUrl="/dashboard"
              />
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Link
                href="/sign-up"
                className={cn(buttonVariants({ variant: "default" }), "w-full justify-center")}
              >
                Register your car (Sign up)
              </Link>
              <Link
                href="/"
                className={cn(buttonVariants({ variant: "outline" }), "w-full justify-center")}
              >
                View rides (Customer)
              </Link>
            </div>

            <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 size-4 text-muted-foreground" aria-hidden />
                <p>
                  After sign-up, open <span className="font-medium text-foreground">Trip updates</span> to fill
                  name, calling number, car model, and plate. Admin verification is required before posting.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
