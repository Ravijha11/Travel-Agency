import type { Metadata } from "next";

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
        <li>Email: <span className="text-foreground">support@example.com</span></li>
        <li>Phone: <span className="text-foreground">+91-XXXXXXXXXX</span></li>
      </ul>
      <p className="text-xs text-muted-foreground">
        Replace these placeholders with your real support contact details before
        going live.
      </p>
    </main>
  );
}

