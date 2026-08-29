"use client";

import { useState } from "react";
import Image from "next/image";
import { DefaultNovelCover } from "@/components/novels/DefaultNovelCover";
import {
  canUseNextImageCover,
  isMissingCoverUrl,
  optimizeCoverThumbnailUrl,
  shouldSkipCoverOptimizer,
} from "@/lib/review-utils";
import { cn } from "@/lib/utils";

interface CoverImageProps {
  src: string | null | undefined;
  alt: string;
  title?: string;
  author?: string | null;
  genres?: string[];
  language?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  themeSeed?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
  loading?: "lazy" | "eager";
  /** Force denser branded fallback for tiny thumbnails. */
  compactFallback?: boolean;
}

function maxThumbWidthFromSizes(sizes?: string): number {
  if (!sizes) return 220;
  const pxValues = [...sizes.matchAll(/(\d+)px/g)].map((match) =>
    Number.parseInt(match[1] ?? "0", 10)
  );
  if (pxValues.length === 0) return 220;
  return Math.max(...pxValues);
}

/**
 * Real cover image when available; otherwise a premium MoonVerse edition cover.
 * Never renders picsum or empty Next/Image sources.
 * Unconfigured / slow remote hosts skip next/image so the reviews page
 * does not throw hostname or optimizer timeout errors.
 */
export function CoverImage({
  src,
  alt,
  title,
  author,
  genres,
  language,
  rating,
  reviewCount,
  themeSeed,
  fill = true,
  width,
  height,
  sizes,
  priority,
  className,
  loading = "lazy",
  compactFallback,
}: CoverImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const displayTitle = title?.trim() || alt?.trim() || "MoonVerse";
  const missing = isMissingCoverUrl(src) || failedSrc === src;

  if (missing) {
    return (
      <DefaultNovelCover
        title={displayTitle}
        author={author}
        genres={genres}
        language={language}
        rating={rating}
        reviewCount={reviewCount}
        themeSeed={themeSeed || `${displayTitle}|${author ?? ""}`}
        compact={compactFallback}
        className={cn(fill && "absolute inset-0", "h-full w-full")}
      />
    );
  }

  const thumbWidth = maxThumbWidthFromSizes(sizes);
  const coverSrc = optimizeCoverThumbnailUrl(src, thumbWidth) as string;
  const imageClass = cn(
    fill && "absolute inset-0 h-full w-full",
    "object-cover",
    className
  );
  const useNativeImg =
    !canUseNextImageCover(coverSrc) || shouldSkipCoverOptimizer(coverSrc);

  if (useNativeImg) {
    return (
      // Native img for unlisted or slow CDNs — explicit eager loading for LCP covers.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={coverSrc}
        alt={alt}
        className={imageClass}
        loading={priority ? "eager" : loading}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        onError={() => setFailedSrc(src as string)}
      />
    );
  }

  const unoptimized = shouldSkipCoverOptimizer(coverSrc);

  if (fill) {
    return (
      <Image
        src={coverSrc}
        alt={alt}
        fill
        unoptimized={unoptimized}
        className={cn("object-cover", className)}
        sizes={sizes}
        priority={priority}
        fetchPriority={priority ? "high" : "auto"}
        loading={priority ? "eager" : loading}
        onError={() => setFailedSrc(src as string)}
      />
    );
  }

  return (
    <Image
      src={coverSrc}
      alt={alt}
      width={width ?? 200}
      height={height ?? 280}
      unoptimized={unoptimized}
      className={cn("object-cover", className)}
      sizes={sizes}
      priority={priority}
      fetchPriority={priority ? "high" : "auto"}
      loading={priority ? "eager" : loading}
      onError={() => setFailedSrc(src as string)}
    />
  );
}
