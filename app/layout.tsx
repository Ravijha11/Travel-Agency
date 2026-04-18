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

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Lahar ↔ Gwalior Rides",
    template: "%s · Lahar ↔ Gwalior Rides",
  },
  description:
    "Find shared car rides between Lahar and Gwalior. Call drivers instantly.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Lahar Gwalior",
  },
  applicationName: "Lahar ↔ Gwalior Rides",
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
          <header className="flex items-center justify-end gap-2 border-b bg-background px-4 py-2">
            <Show when="signed-out">
              <SignInButton>Driver login</SignInButton>
              <SignUpButton>Register car (sign up)</SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Trip updates
              </Link>
              <UserButton />
            </Show>
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
