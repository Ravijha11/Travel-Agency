import Link from "next/link";
import { cn } from "@/lib/utils";
import type { RouteDirection } from "@/lib/constants";
import { ROUTE_LABELS } from "@/lib/constants";

type Props = {
  current: RouteDirection;
};

const directions: RouteDirection[] = ["lahar_to_gwalior", "gwalior_to_lahar"];

export function RouteToggle({ current }: Props) {
  return (
    <div className="flex rounded-xl border bg-muted/40 p-1 text-sm font-medium">
      {directions.map((dir) => {
        const active = dir === current;
        const href = `/?dir=${dir}`;
        return (
          <Link
            key={dir}
            href={href}
            className={cn(
              "flex min-h-11 flex-1 items-center justify-center rounded-lg px-2 py-2.5 text-center transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {ROUTE_LABELS[dir]}
          </Link>
        );
      })}
    </div>
  );
}
