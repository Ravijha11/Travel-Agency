import { cn } from "@/lib/utils";
import { useId } from "react";

type VerifiedBadgeProps = {
  className?: string;
  size?: "sm" | "md";
};

/** 12-peak seal path (24 alternating vertices), Twitter/Instagram-style. */
function sealPath(
  cx: number,
  cy: number,
  spikes: number,
  rOuter: number,
  rInner: number,
) {
  const n = spikes * 2;
  const seg: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / spikes;
    const r = i % 2 === 0 ? rOuter : rInner;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    seg.push(`${i === 0 ? "M" : "L"}${x.toFixed(3)} ${y.toFixed(3)}`);
  }
  return `${seg.join(" ")}Z`;
}

const VB = 24;
const SEAL_D = sealPath(VB / 2, VB / 2, 12, 10.6, 8.35);

const sizePx = { sm: 18, md: 22 } as const;

/**
 * Blue “official” seal with sawtooth edge and white check (reference-style).
 */
export function VerifiedBadge({ className, size = "md" }: VerifiedBadgeProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const gradId = `vbgrad-${uid}`;
  const px = sizePx[size];

  return (
    <span
      role="img"
      aria-label="Verified driver"
      title="Verified driver"
      className={cn("inline-flex shrink-0 align-middle", className)}
      style={{ width: px, height: px }}
    >
      <svg
        width={px}
        height={px}
        viewBox={`0 0 ${VB} ${VB}`}
        className="drop-shadow-sm"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#29B6F6" />
            <stop offset="55%" stopColor="#039BE5" />
            <stop offset="100%" stopColor="#0277BD" />
          </linearGradient>
        </defs>
        <path
          d={SEAL_D}
          fill={`url(#${gradId})`}
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="0.35"
        />
        <path
          d="M7.2 12.35 L10.4 15.45 L16.95 8.35"
          fill="none"
          stroke="white"
          strokeWidth="2.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
