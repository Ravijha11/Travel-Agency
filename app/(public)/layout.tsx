import { currentUser } from "@clerk/nextjs/server";
import { BottomNav, type BottomNavMode } from "@/components/bottom-nav";
import { PwaInstallHint } from "@/components/pwa-install-hint";
import { SiteFooter } from "@/components/site-footer";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  let navMode: BottomNavMode = "guest";
  if (user) navMode = "driver";

  return (
    <div className="relative pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
      {children}
      <SiteFooter />
      <PwaInstallHint />
      <BottomNav mode={navMode} />
    </div>
  );
}
