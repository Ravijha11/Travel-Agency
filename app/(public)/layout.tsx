import { BottomNav } from "@/components/bottom-nav";
import { SiteFooter } from "@/components/site-footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
      {children}
      <SiteFooter />
      <BottomNav />
    </div>
  );
}
