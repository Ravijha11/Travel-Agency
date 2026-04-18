import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer",
};

export default function DisclaimerPage() {
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 pt-6">
      <h1 className="text-xl font-semibold">Disclaimer</h1>

      <p className="text-sm text-muted-foreground">
        Lahar connect is a coordination-only directory. The platform is
        not a transport operator and does not provide transportation services.
      </p>

      <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
        <li>
          Riders and drivers coordinate directly; seat availability is confirmed
          by calling the driver.
        </li>
        <li>
          Fares are agreed directly between rider and driver; payments are
          handled off-platform.
        </li>
        <li>
          “Verified” is a trust signal only. It is not a guarantee of safety,
          identity, or service quality.
        </li>
        <li>
          Always follow safety best practices and local laws. If something feels
          unsafe, do not travel.
        </li>
      </ul>
    </main>
  );
}

