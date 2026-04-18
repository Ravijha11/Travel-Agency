import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lahar ↔ Gwalior Rides",
    short_name: "L-G Rides",
    description: "Find shared car rides between Lahar and Gwalior. Call drivers instantly.",
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
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
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
