import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Safety",
};

export default function SafetyPage() {
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 pt-6">
      <h1 className="text-xl font-semibold">Safety</h1>
      <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
        <li>
          Always confirm the driver name, car model/number, pickup point, and
          fare before you start.
        </li>
        <li>Prefer meeting in a public place and sharing trip details with family.</li>
        <li>
          If something feels unsafe or suspicious, do not travel and contact
          support.
        </li>
        <li>
          “Verified” is a trust signal. It is not a guarantee of safety or
          service quality.
        </li>
      </ul>
      <p className="text-sm text-muted-foreground">
        This platform helps you find contact details for coordination; the ride
        itself is arranged directly between rider and driver.
      </p>
    </main>
  );
}

