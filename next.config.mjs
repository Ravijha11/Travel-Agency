import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  // Service worker is off in dev (faster reloads). Production build registers SW + precache.
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

/** @type {import('next').NextConfig} */
let supabaseHost = null;
try {
  supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
} catch {
  supabaseHost = null;
}

const nextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/**",
          },
        ]
      : [],
  },
};

export default withPWA(nextConfig);
