import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How it works",
};

export default function HowItWorksPage() {
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 pt-6">
      <h1 className="text-xl font-semibold">How it works</h1>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">For riders</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Open the Home feed and choose direction.</li>
          <li>Pick a trip that matches your time and seats.</li>
          <li>Tap “Call now” and coordinate directly with the driver.</li>
        </ol>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">For drivers</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Sign in from the Account tab.</li>
          <li>Open the Driver dashboard and post your trip.</li>
          <li>Update status when seats are full or trip is completed.</li>
        </ol>
      </section>
    </main>
  );
}

