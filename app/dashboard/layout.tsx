import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_20%_10%,hsl(var(--primary)/0.20),transparent_55%),radial-gradient(circle_at_90%_0%,rgba(59,130,246,0.12),transparent_45%),linear-gradient(to_bottom,transparent,rgba(0,0,0,0.02))] dark:bg-[radial-gradient(circle_at_20%_10%,hsl(var(--primary)/0.16),transparent_55%),radial-gradient(circle_at_90%_0%,rgba(99,102,241,0.10),transparent_45%),linear-gradient(to_bottom,transparent,rgba(255,255,255,0.02))]">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo width={120} height={36} className="h-8 max-h-8" />
            <h1 className="text-lg font-semibold leading-tight">Trip updates</h1>
          </div>
          <nav
            aria-label="Driver tools"
            className="flex flex-wrap items-center gap-2"
          >
            <Link
              href="/my-trips"
              className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
            >
              My trips
            </Link>
            <Link
              href="/account"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Profile
            </Link>
            <Link
              href="/"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Home
            </Link>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-lg space-y-6 px-4 py-4">{children}</div>
    </div>
  );
}
