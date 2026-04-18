"use client";

import { useEffect, useState } from "react";

function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return "Departing now";
  const s = totalSeconds % 60;
  const m = Math.floor(totalSeconds / 60) % 60;
  const h = Math.floor(totalSeconds / 3600) % 24;
  const d = Math.floor(totalSeconds / 86_400);
  if (d > 0) return `${d}d ${h}h left`;
  if (h > 0) return `${h}h ${m}m left`;
  if (m > 0) return `${m}m ${s}s left`;
  return `${s}s left`;
}

export function DepartureCountdown({
  departureIso,
  className,
}: {
  departureIso: string;
  className?: string;
}) {
  const [label, setLabel] = useState<string>(() => {
    const ms = new Date(departureIso).getTime() - Date.now();
    return formatCountdown(Math.floor(ms / 1000));
  });

  useEffect(() => {
    function tick() {
      const ms = new Date(departureIso).getTime() - Date.now();
      setLabel(formatCountdown(Math.floor(ms / 1000)));
    }
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [departureIso]);

  return (
    <p
      className={className}
      aria-live="polite"
      title="Time until departure (India time)"
      suppressHydrationWarning
    >
      {label === "Departing now" ? label : `Departs in ${label}`}
    </p>
  );
}
