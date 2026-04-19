import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/branding";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/account", "/my-trips", "/sign-in", "/sign-up"],
    },
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
    host: new URL(SITE_URL).hostname,
  };
}

