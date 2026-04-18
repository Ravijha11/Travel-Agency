import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-muted/30">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2 px-4 py-3">
          <h1 className="text-lg font-semibold">Driver dashboard</h1>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Home
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-lg space-y-6 px-4 py-4">{children}</div>
    </div>
  );
}
