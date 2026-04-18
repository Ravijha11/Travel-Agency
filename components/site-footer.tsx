import Link from "next/link";
import { BRAND_NAME } from "@/lib/branding";
import { BrandLogo } from "@/components/brand-logo";

const links = [
  { href: "/about", label: "About" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/safety", label: "Safety" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-lg px-4 pb-4 pt-10 text-sm text-muted-foreground">
      <div className="mb-6">
        <BrandLogo width={160} height={48} className="h-10 max-h-12 w-auto max-w-[12rem]" />
        <p className="sr-only">{BRAND_NAME}</p>
      </div>
      <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-2">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="hover:text-foreground">
            {l.label}
          </Link>
        ))}
      </nav>
      <p className="mt-4 text-xs">
        Coordination only — riders and drivers agree fare and seats directly.
      </p>
    </footer>
  );
}

