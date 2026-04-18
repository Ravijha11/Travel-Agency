import type { Metadata } from "next";
import { BRAND_NAME, BRAND_TAGLINE, LOGO_PATH, SITE_URL } from "@/lib/branding";

export const SEO_KEYWORDS = [
  "Lahar",
  "Gwalior",
  "Lahar to Gwalior",
  "Gwalior to Lahar",
  "Bhind",
  "Bhind district",
  "Madhya Pradesh",
  "MP",
  "car",
  "taxi",
  "shared ride",
  "ride sharing",
  "carpool",
  "bus",
  "travel",
] as const;

export function defaultSeoMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: BRAND_NAME,
      template: `%s · ${BRAND_NAME}`,
    },
    description: BRAND_TAGLINE,
    applicationName: BRAND_NAME,
    verification: {
      google: "rsB7yd4etDJpr4HOwTsU0DUMPPhhxe76igsmAYkcBXk",
    },
    keywords: [...SEO_KEYWORDS],
    alternates: {
      canonical: "/",
    },
    icons: {
      icon: [
        { url: LOGO_PATH, type: "image/png", sizes: "512x512" },
        { url: "/favicon.ico", sizes: "48x48" },
      ],
      apple: [{ url: LOGO_PATH, sizes: "180x180", type: "image/png" }],
    },
    openGraph: {
      type: "website",
      url: SITE_URL,
      siteName: BRAND_NAME,
      title: BRAND_NAME,
      description: BRAND_TAGLINE,
      images: [{ url: LOGO_PATH, width: 512, height: 512, alt: BRAND_NAME }],
      locale: "en_IN",
    },
    twitter: {
      card: "summary",
      title: BRAND_NAME,
      description: BRAND_TAGLINE,
      images: [LOGO_PATH],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: BRAND_NAME,
    },
  };
}

export function jsonLdWebsite() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND_NAME,
    url: SITE_URL,
    description: BRAND_TAGLINE,
    inLanguage: "en-IN",
  };
}

export function jsonLdLocalBusiness() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: BRAND_NAME,
    url: SITE_URL,
    image: new URL(LOGO_PATH, SITE_URL).toString(),
    areaServed: [
      { "@type": "AdministrativeArea", name: "Bhind district" },
      { "@type": "State", name: "Madhya Pradesh" },
      { "@type": "City", name: "Lahar" },
      { "@type": "City", name: "Gwalior" },
    ],
    knowsAbout: [
      "Lahar to Gwalior rides",
      "Gwalior to Lahar rides",
      "Shared cars",
      "Taxi",
      "Bus travel",
    ],
  };
}

export function jsonLdFaqPage(
  faqs: { question: string; answer: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}

export function noIndexMetadata(title: string): Metadata {
  return {
    title,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}

