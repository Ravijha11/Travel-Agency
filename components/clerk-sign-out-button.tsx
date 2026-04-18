"use client";

import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function ClerkSignOutButton({
  variant = "outline",
  className,
}: {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  className?: string;
}) {
  return (
    <SignOutButton signOutOptions={{ redirectUrl: "/" }}>
      <Button type="button" variant={variant} className={className}>
        Sign out
      </Button>
    </SignOutButton>
  );
}
