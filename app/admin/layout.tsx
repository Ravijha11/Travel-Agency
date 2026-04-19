import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = noIndexMetadata("Admin");

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_20%_10%,hsl(var(--primary)/0.18),transparent_55%),radial-gradient(circle_at_90%_0%,rgba(59,130,246,0.12),transparent_45%),linear-gradient(to_bottom,transparent,rgba(0,0,0,0.02))] dark:bg-[radial-gradient(circle_at_20%_10%,hsl(var(--primary)/0.16),transparent_55%),radial-gradient(circle_at_90%_0%,rgba(99,102,241,0.10),transparent_45%),linear-gradient(to_bottom,transparent,rgba(255,255,255,0.02))]">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <BrandLogo width={100} height={32} className="h-7 max-h-7 shrink-0" />
            <h1 className="text-lg font-semibold leading-tight">Admin control room</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/driver-directory"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Driver directory
            </Link>
            <Link
              href="/admin/cars"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Car catalog
            </Link>
            <Link
              href="/"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Home
            </Link>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-4">{children}</div>
    </div>
  );
}
