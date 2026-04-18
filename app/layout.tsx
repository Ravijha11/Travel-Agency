import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import "./globals.css";
import { cn } from "@/lib/utils";
import { BRAND_NAME, BRAND_TAGLINE, LOGO_PATH, SITE_URL } from "@/lib/branding";
import { BrandLogo } from "@/components/brand-logo";
import { buttonVariants } from "@/components/ui/button";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: BRAND_NAME,
    template: `%s · ${BRAND_NAME}`,
  },
  description: BRAND_TAGLINE,
  applicationName: BRAND_NAME,
  manifest: "/manifest.webmanifest",
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

export const viewport: Viewport = {
  themeColor: "#166534",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geistSans.variable)}>
      <body className="min-h-dvh antialiased">
        <ClerkProvider>
          <header className="border-b bg-background">
            <div className="mx-auto flex max-w-3xl flex-col gap-2 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/"
              className="flex min-w-0 max-w-[min(100%,26rem)] items-center rounded-lg py-1 outline-offset-2 hover:bg-muted/50"
            >
              <BrandLogo
                priority
                width={280}
                height={80}
                className="h-16 w-auto max-w-[min(100%,26rem)] sm:h-12"
              />
              <span className="sr-only">{BRAND_NAME}</span>
            </Link>
            <div className="flex flex-col gap-1 sm:items-end">
              <Show when="signed-out">
                <p className="text-xs text-muted-foreground">
                  Drivers: register once to post trips. Already registered? Sign in.
                </p>
                <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
                  <SignUpButton>
                    <span
                      className={cn(
                        buttonVariants({ variant: "default", size: "lg" }),
                        "h-11 flex-1 justify-center sm:flex-none",
                      )}
                    >
                      Register your car (Sign up)
                    </span>
                  </SignUpButton>
                  <SignInButton>
                    <span
                      className={cn(
                        buttonVariants({ variant: "outline", size: "lg" }),
                        "h-11 flex-1 justify-center sm:flex-none",
                      )}
                    >
                      Already registered? Sign in
                    </span>
                  </SignInButton>
                </div>
              </Show>
              <Show when="signed-in">
                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <Link
                    href="/dashboard"
                    className={cn(
                      buttonVariants({ variant: "secondary", size: "lg" }),
                      "h-11",
                    )}
                  >
                    Trip updates
                  </Link>
                  <UserButton />
                </div>
              </Show>
            </div>
            </div>
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
