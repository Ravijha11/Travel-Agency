import type { Metadata } from "next";
import { SITE_URL } from "@/lib/branding";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 pt-6">
      <h1 className="text-xl font-semibold">Contact</h1>
      <p className="text-sm text-muted-foreground">
        For support, please contact:
      </p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        <li>
          Email:{" "}
          <span className="text-foreground">support@laharconnect.online</span>
        </li>
        <li>Website: <span className="text-foreground">{SITE_URL}</span></li>
      </ul>
      <p className="text-xs text-muted-foreground">
        For fastest support, message the same number you call for the ride, or email us.
      </p>
    </main>
  );
}

