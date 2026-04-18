import type { MetadataRoute } from "next";
import { BRAND_NAME, BRAND_TAGLINE, LOGO_PATH } from "@/lib/branding";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND_NAME,
    short_name: BRAND_NAME,
    description: BRAND_TAGLINE,
    id: "/",
    scope: "/",
    start_url: "/",
    display: "standalone",
    display_override: ["standalone", "browser"],
    background_color: "#f4f4f5",
    theme_color: "#166534",
    orientation: "portrait-primary",
    lang: "en",
    dir: "ltr",
    categories: ["travel", "transit"],
    icons: [
      {
        src: LOGO_PATH,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: LOGO_PATH,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
        purpose: "any",
      },
    ],
  };
}
