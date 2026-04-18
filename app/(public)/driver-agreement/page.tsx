import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Driver Agreement",
};

export default function DriverAgreementPage() {
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 pt-6">
      <h1 className="text-xl font-semibold">Driver Agreement</h1>

      <p className="text-sm text-muted-foreground">
        By posting trips on Lahar ↔ Gwalior Rides, you agree to the following
        requirements.
      </p>

      <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
        <li>Post accurate route, time, seats, and price information.</li>
        <li>Follow local laws and drive safely.</li>
        <li>Be respectful. No harassment, threats, or discrimination.</li>
        <li>
          Update your listing status when it is full or completed (to keep the
          feed accurate).
        </li>
        <li>
          If you are verified, do not misuse that badge or claim guarantees.
        </li>
      </ul>

      <p className="text-xs text-muted-foreground">
        This is a template. Please review with a legal professional before
        launch.
      </p>
    </main>
  );
}

