"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, Home, LogIn, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export type BottomNavMode = "guest" | "driver" | "admin";

type NavLink = {
  href: string;
  label: string;
  Icon: typeof Home;
};

const guestLinks: NavLink[] = [
  { href: "/", label: "Home", Icon: Home },
  {
    href: "/sign-in?redirect_url=/dashboard",
    label: "Sign in",
    Icon: LogIn,
  },
];

const driverLinks: NavLink[] = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/dashboard", label: "Trip updates", Icon: CalendarClock },
];

const adminLinks: NavLink[] = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/admin", label: "Admin", Icon: Shield },
];

export function BottomNav({ mode }: { mode: BottomNavMode }) {
  const pathname = usePathname();
  const links =
    mode === "admin" ? adminLinks : mode === "driver" ? driverLinks : guestLinks;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] dark:border-neutral-200 dark:bg-white dark:shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
      <div
        className={cn(
          "mx-auto flex max-w-lg items-stretch gap-1 px-2 py-2",
          links.length === 2 ? "justify-around" : "justify-around",
        )}
      >
        {links.map(({ href, label, Icon }) => {
          const base = href.split("?")[0] ?? href;
          const active =
            base === "/"
              ? pathname === "/"
              : pathname === base || pathname.startsWith(`${base}/`);
          const yellowBrand = label === "Home" || label === "Trip updates";
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-12 min-w-[4.5rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg text-xs font-medium transition-colors",
                yellowBrand
                  ? active
                    ? "text-yellow-600"
                    : "text-yellow-500 hover:text-yellow-600"
                  : active
                    ? "text-emerald-700"
                    : "text-neutral-500 hover:text-neutral-800",
              )}
            >
              <Icon
                className={cn(
                  "size-5 shrink-0",
                  yellowBrand && "stroke-[2.25px]",
                )}
                aria-hidden
              />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
