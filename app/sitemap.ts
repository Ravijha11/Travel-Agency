import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/branding";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    "/",
    "/lahar-to-gwalior",
    "/gwalior-to-lahar",
    "/about",
    "/how-it-works",
    "/faq",
    "/safety",
    "/contact",
    "/terms",
    "/privacy",
    "/disclaimer",
    "/driver-agreement",
  ];

  return routes.map((path) => ({
    url: new URL(path, SITE_URL).toString(),
    lastModified: now,
    changeFrequency: path === "/" ? "hourly" : "monthly",
    priority: path === "/" ? 1 : 0.6,
  }));
}

