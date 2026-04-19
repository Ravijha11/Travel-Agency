import type { Metadata } from "next";
import { jsonLdFaqPage } from "@/lib/seo";

export const metadata: Metadata = {
  title: "FAQ",
};

export default function FaqPage() {
  const faqs = [
    {
      question: "Do I pay inside the app?",
      answer:
        "No. Lahar connect is coordination-only. Riders and drivers agree fare and seats directly.",
    },
    {
      question: "Are seats guaranteed?",
      answer:
        "No. Availability is confirmed with the driver when you call.",
    },
    {
      question: "What does “Verified” mean?",
      answer:
        "It means the driver has been reviewed by admin. It is not a safety guarantee.",
    },
    {
      question: "I see no trips. What should I do?",
      answer:
        "Try switching direction (Lahar → Gwalior or Gwalior → Lahar). Trips show only when drivers post upcoming listings for today or tomorrow (India time).",
    },
    {
      question: "Do drivers use a Telegram bot?",
      answer:
        "Yes. Verified drivers can be added to the Lahar Connect drivers Telegram group; a bot reads trip messages (Hindi or English), saves listings to the same database as the website, and riders see them on laharconnect.online. Drivers can also use /trips and /delete_last in the group to manage bot-posted listings.",
    },
  ];

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 pt-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaqPage(faqs)) }}
      />
      <h1 className="text-xl font-semibold">FAQ</h1>

      <section className="space-y-3 text-sm">
        <div>
          <h2 className="font-semibold">Do I pay inside the app?</h2>
          <p className="text-muted-foreground">
            No. This is coordination-only. Riders and drivers agree fare and
            seats directly.
          </p>
        </div>
        <div>
          <h2 className="font-semibold">Are seats guaranteed?</h2>
          <p className="text-muted-foreground">
            No. Availability is confirmed with the driver when you call.
          </p>
        </div>
        <div>
          <h2 className="font-semibold">What does “Verified” mean?</h2>
          <p className="text-muted-foreground">
            It means the driver has been reviewed by admin. It is not a safety
            guarantee.
          </p>
        </div>
        <div>
          <h2 className="font-semibold">I see no trips</h2>
          <p className="text-muted-foreground">
            Try switching direction. Trips only show when drivers post upcoming
            listings.
          </p>
        </div>
        <div>
          <h2 className="font-semibold">Do drivers use a Telegram bot?</h2>
          <p className="text-muted-foreground">
            Yes. Drivers in the official Telegram group can post normal trip
            messages; the bot parses them and publishes trips to this site
            (today and tomorrow, India time). Use /trips and /delete_last in
            the group for bot-posted listings.
          </p>
        </div>
      </section>
    </main>
  );
}

