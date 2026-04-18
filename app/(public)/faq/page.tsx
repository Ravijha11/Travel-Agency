import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
};

export default function FaqPage() {
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 pt-6">
      <h1 className="text-xl font-semibold">FAQ</h1>

      <section className="space-y-3 text-sm">
        <div>
          <h2 className="font-semibold">Do I pay inside the app?</h2>
          <p className="text-muted-foreground">
            No. This is coordination-only. Riders and drivers agree fare and
            seats directly.
          </p>
        </div>
        <div>
          <h2 className="font-semibold">Are seats guaranteed?</h2>
          <p className="text-muted-foreground">
            No. Availability is confirmed with the driver when you call.
          </p>
        </div>
        <div>
          <h2 className="font-semibold">What does “Verified” mean?</h2>
          <p className="text-muted-foreground">
            It means the driver has been reviewed by admin. It is not a safety
            guarantee.
          </p>
        </div>
        <div>
          <h2 className="font-semibold">I see no trips</h2>
          <p className="text-muted-foreground">
            Try switching direction. Trips only show when drivers post upcoming
            listings.
          </p>
        </div>
      </section>
    </main>
  );
}

