import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { BadgeCheck, UserPlus } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function SignUpPage() {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-[-120px] h-[520px] w-[520px] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/30" />
      </div>

      <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 p-4">
        <header className="space-y-2 text-center">
          <div className="mx-auto inline-flex max-w-full items-center justify-center gap-2 rounded-2xl border bg-card/70 px-3 py-2 shadow-sm backdrop-blur">
            <BrandLogo width={140} height={40} className="h-9 max-h-10 max-w-[10rem]" />
            <span className="text-sm font-semibold tracking-tight">Driver registration</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Register your car</h1>
          <p className="text-sm text-muted-foreground">
            Create a driver account to post rides on the home feed.
          </p>
        </header>

        <Card className="bg-card/70 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="size-4 text-primary" aria-hidden />
              Sign up
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              After sign-up: open <span className="font-medium text-foreground">Trip updates</span>, fill
              your details, and get verified.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <SignUp
                routing="path"
                path="/sign-up"
                forceRedirectUrl="/dashboard"
                signInFallbackRedirectUrl="/dashboard"
                signInForceRedirectUrl="/dashboard"
              />
            </div>

            <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <BadgeCheck className="mt-0.5 size-4" aria-hidden />
                <p>
                  You’ll need to add: <span className="font-medium text-foreground">name</span>,{" "}
                  <span className="font-medium text-foreground">calling number</span>,{" "}
                  <span className="font-medium text-foreground">car model</span>, and{" "}
                  <span className="font-medium text-foreground">plate</span>. Once verified, you can post trips.
                </p>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Already registered?{" "}
              <Link
                href="/sign-in"
                className={cn("font-medium text-foreground underline underline-offset-2")}
              >
                Driver login
              </Link>
            </p>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Link
                href="/sign-in"
                className={cn(buttonVariants({ variant: "secondary" }), "w-full justify-center")}
              >
                Driver login
              </Link>
              <Link
                href="/"
                className={cn(buttonVariants({ variant: "outline" }), "w-full justify-center")}
              >
                View rides (Customer)
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
