import Image from "next/image";
import { cn } from "@/lib/utils";
import { BRAND_NAME, LOGO_PATH } from "@/lib/branding";

type BrandLogoProps = {
  className?: string;
  /** Width/height hints for Next/Image layout (image scales with CSS). */
  width?: number;
  height?: number;
  priority?: boolean;
};

export function BrandLogo({
  className,
  width = 160,
  height = 48,
  priority = false,
}: BrandLogoProps) {
  return (
    <Image
      src={LOGO_PATH}
      alt={BRAND_NAME}
      width={width}
      height={height}
      priority={priority}
      className={cn("h-full w-auto object-contain object-left", className)}
    />
  );
}
