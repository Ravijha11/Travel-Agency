import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy policy for Lahar Connect. Learn what data we collect and how it is used for trip listings and coordination.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 pt-6">
      <h1 className="text-xl font-semibold">Privacy Policy</h1>

      <p className="text-sm text-muted-foreground">
        This policy explains what data we collect and how we use it.
      </p>

      <section className="space-y-2 text-sm">
        <h2 className="text-base font-semibold">Data we collect</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Account identifiers from authentication provider</li>
          <li>Name and phone number (driver profile)</li>
          <li>Car model/number (driver profile)</li>
          <li>Trip listings you post (drivers)</li>
        </ul>
      </section>

      <section className="space-y-2 text-sm">
        <h2 className="text-base font-semibold">How we use data</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Show trip listings and enable rider-driver coordination</li>
          <li>Prevent abuse and enforce restrictions</li>
          <li>Support and troubleshooting</li>
        </ul>
      </section>

      <section className="space-y-2 text-sm">
        <h2 className="text-base font-semibold">Public display</h2>
        <p className="text-muted-foreground">
          Driver contact information may be shown to the public only when the
          driver has active upcoming trips (per database policy).
        </p>
      </section>

      <section className="space-y-2 text-sm">
        <h2 className="text-base font-semibold">Contact</h2>
        <p className="text-muted-foreground">
          Privacy contact: privacy@laharconnect.online
        </p>
      </section>

      <p className="text-xs text-muted-foreground">
        This is a template. Please review with a legal professional before
        launch.
      </p>
    </main>
  );
}

