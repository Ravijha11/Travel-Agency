import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 pt-6">
      <h1 className="text-xl font-semibold">Terms of Service</h1>

      <p className="text-sm text-muted-foreground">
        Lahar connect is a coordination-only directory for shared rides between
        Lahar and Gwalior. By using the site, you agree to these terms.
      </p>

      <section className="space-y-2 text-sm">
        <h2 className="text-base font-semibold">Coordination only</h2>
        <p className="text-muted-foreground">
          The platform does not provide transportation services, does not
          guarantee seat availability, and does not process payments. Riders and
          drivers coordinate directly.
        </p>
      </section>

      <section className="space-y-2 text-sm">
        <h2 className="text-base font-semibold">User responsibilities</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Provide accurate information.</li>
          <li>Follow local laws and safety best practices.</li>
          <li>Do not misuse contact details or harass other users.</li>
        </ul>
      </section>

      <section className="space-y-2 text-sm">
        <h2 className="text-base font-semibold">Suspension</h2>
        <p className="text-muted-foreground">
          We may restrict access for abuse, fraud, harassment, or policy
          violations.
        </p>
      </section>

      <section className="space-y-2 text-sm">
        <h2 className="text-base font-semibold">Contact</h2>
        <p className="text-muted-foreground">
          Replace this with your company contact details: support@example.com
        </p>
      </section>

      <p className="text-xs text-muted-foreground">
        This is a template. Please review with a legal professional before
        launch.
      </p>
    </main>
  );
}

