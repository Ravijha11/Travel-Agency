import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lahar ↔ Gwalior Rides",
    short_name: "L-G Rides",
    description: "Find shared car rides between Lahar and Gwalior.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f4f5",
    theme_color: "#166534",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
