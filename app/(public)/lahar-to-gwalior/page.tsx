import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Lahar to Gwalior rides (Car, Taxi, Bus)",
  description:
    "Find Lahar to Gwalior rides today or tomorrow. Browse cars/taxi listings and call drivers directly. Serving Lahar (Bhind, MP) to Gwalior route.",
  alternates: { canonical: "/lahar-to-gwalior" },
};

export default function LaharToGwaliorLanding() {
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 pt-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Lahar → Gwalior rides
        </h1>
        <p className="text-sm text-muted-foreground">
          Cars, taxi and shared rides for <strong>Lahar (Bhind, MP)</strong> to{" "}
          <strong>Gwalior</strong>. Listings show for today &amp; tomorrow only
          (India time).
        </p>
      </header>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          href="/?dir=lahar_to_gwalior"
          className={cn(buttonVariants({ variant: "default", size: "lg" }), "h-11 justify-center")}
        >
          View live listings
        </Link>
        <Link
          href="/sign-up"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 justify-center")}
        >
          Driver: register your car
        </Link>
      </div>

      <section className="space-y-2 rounded-2xl border bg-card p-4 text-sm">
        <h2 className="text-base font-semibold">How it works</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Pick a listing that matches your time and seats.</li>
          <li>Tap <strong>Call now</strong> and confirm fare + pickup point.</li>
          <li>No payments inside the website — coordination only.</li>
        </ul>
      </section>

      <p className="text-xs text-muted-foreground">
        Tip: also check{" "}
        <Link className="underline" href="/gwalior-to-lahar">
          Gwalior → Lahar
        </Link>{" "}
        rides.
      </p>
    </main>
  );
}

