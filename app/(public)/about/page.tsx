import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Lahar Connect",
  description:
    "Lahar Connect is a coordination-only directory for shared rides between Lahar and Gwalior. Browse listings and call drivers directly.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 pt-6">
      <h1 className="text-xl font-semibold">About</h1>
      <p className="text-sm text-muted-foreground">
        Lahar connect is a simple directory for shared car rides between
        Lahar and Gwalior. Drivers post upcoming trips, and riders contact
        drivers directly to coordinate seats and fare.
      </p>
      <p className="text-sm text-muted-foreground">
        This platform is coordination-only: we do not take payments or guarantee
        bookings inside the app.
      </p>
    </main>
  );
}

