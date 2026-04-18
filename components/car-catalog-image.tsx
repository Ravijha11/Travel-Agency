"use client";
/* External catalog URLs are rendered with <img> so hosts need not be listed in next.config images. */
/* eslint-disable @next/next/no-img-element */

import Image from "next/image";
import { CarFront } from "lucide-react";
import { cn } from "@/lib/utils";

function supabaseProjectHost(): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  try {
    return new URL(base).hostname;
  } catch {
    return null;
  }
}

/** How to render a catalog image URL without breaking Next/Image remote rules. */
export function pickCarCatalogImageMode(src: string): "next" | "external" | "empty" {
  const s = src?.trim();
  if (!s) return "empty";
  if (s.startsWith("/")) return "next";
  try {
    const u = new URL(s);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "empty";
    const host = u.hostname;
    const sh = supabaseProjectHost();
    if (sh && host === sh) return "next";
    return "external";
  } catch {
    return "empty";
  }
}

type ObjectFit = "cover" | "contain";

type CoverProps = {
  src: string;
  alt: string;
  /** e.g. (max-width: 768px) 92vw, 420px */
  sizes?: string;
  priority?: boolean;
  className?: string;
  /**
   * `cover` fills the frame (no side letterboxing; may crop).
   * `contain` shows the full image (may letterbox).
   */
  objectFit?: ObjectFit;
};

const fitClass = (fit: ObjectFit) =>
  fit === "cover" ? "object-cover object-center" : "object-contain object-center";

/**
 * Fills a parent with `position: relative` and explicit size (e.g. aspect ratio or fixed height).
 * Empty / invalid URL shows a muted placeholder (no bundled assets).
 */
export function CarCatalogImageCover({
  src,
  alt,
  sizes = "(max-width: 768px) 92vw, 420px",
  priority = false,
  className,
  objectFit = "cover",
}: CoverProps) {
  const fit = fitClass(objectFit);
  const mode = pickCarCatalogImageMode(src);
  if (mode === "empty") {
    return (
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center bg-muted",
          className,
        )}
      >
        <CarFront className="size-10 text-muted-foreground" aria-hidden />
        <span className="sr-only">No car photo</span>
      </div>
    );
  }
  if (mode === "external") {
    return (
      <img
        src={src}
        alt={alt}
        className={cn("absolute inset-0 h-full w-full", fit, className)}
        loading={priority ? "eager" : "lazy"}
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn(fit, className)}
      unoptimized={src.startsWith("/")}
    />
  );
}

type ThumbProps = {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
  objectFit?: ObjectFit;
};

/** Small fixed box (parent: relative h-* w-*). */
export function CarCatalogImageThumb({
  src,
  alt,
  sizes = "80px",
  className,
  objectFit = "cover",
}: ThumbProps) {
  const fit = fitClass(objectFit);
  const mode = pickCarCatalogImageMode(src);
  if (mode === "empty") {
    return (
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center bg-muted",
          className,
        )}
      >
        <CarFront className="size-6 text-muted-foreground" aria-hidden />
      </div>
    );
  }
  if (mode === "external") {
    return (
      <img
        src={src}
        alt={alt}
        className={cn("absolute inset-0 h-full w-full", fit, className)}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={cn(fit, className)}
      unoptimized={src.startsWith("/")}
    />
  );
}
