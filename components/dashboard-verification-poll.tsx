"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * While verification is pending, periodically refresh server data so the
 * dashboard updates as soon as an admin flips is_verified — no manual reload.
 */
export function DashboardVerificationPoll({ enabled }: { enabled: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      router.refresh();
    }, 45_000);
    return () => window.clearInterval(id);
  }, [enabled, router]);

  return null;
}
