"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  return Boolean(
    (window.navigator as Navigator & { standalone?: boolean }).standalone,
  );
}

/**
 * Chrome/Edge/Android: surfaces the browser install prompt when available.
 * iOS Safari has no beforeinstallprompt; users can still use Share → Add to Home Screen.
 */
export function PwaInstallHint() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  if (dismissed || !deferred || isStandalone()) return null;

  return (
    <div
      className="pointer-events-auto fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-3 right-3 z-50 mx-auto max-w-lg rounded-xl border bg-card/95 p-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:left-auto sm:right-4 sm:mx-0"
      role="region"
      aria-label="Install app"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium leading-snug">
          Install Lahar connect for faster access to rides
        </p>
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setDismissed(true)}>
            Not now
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-emerald-700 text-white hover:bg-emerald-800"
            onClick={async () => {
              try {
                await deferred.prompt();
                await deferred.userChoice;
              } finally {
                setDismissed(true);
                setDeferred(null);
              }
            }}
          >
            Install
          </Button>
        </div>
      </div>
    </div>
  );
}
