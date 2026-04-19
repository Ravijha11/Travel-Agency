"use client";

import { useEffect, useState } from "react";
import { formatIstNowClock12h } from "@/lib/format-ist-time";

/** Updates India time on the client so the header stays current. */
export function IstLiveClock() {
  const [label, setLabel] = useState(() => formatIstNowClock12h());

  useEffect(() => {
    const tick = () => setLabel(formatIstNowClock12h());
    const id = window.setInterval(tick, 30_000);
    tick();
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="tabular-nums tracking-tight" suppressHydrationWarning>
      {label}
    </span>
  );
}
