import Image from "next/image";
import {
  MOONVERSE_MISSING_COVER_SRC,
  moonversePlaceholderAriaLabel,
} from "@/lib/cover-placeholder";
import { cn } from "@/lib/utils";

export interface DefaultNovelCoverProps {
  title: string;
  author?: string | null;
  /** Kept for call-site compatibility; placeholder art is not title-themed. */
  genres?: string[];
  language?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  themeSeed?: string;
  className?: string;
  /** Tiny thumbnails use the same asset without extra chrome. */
  compact?: boolean;
}

/**
 * MoonVerse missing-cover artwork — one bundled asset, no baked-in title or metadata.
 */
export function DefaultNovelCover({
  title,
  author,
  className,
}: DefaultNovelCoverProps) {
  const ariaLabel = moonversePlaceholderAriaLabel(title, author);

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden bg-[#1a1033]",
        className
      )}
      role="img"
      aria-label={ariaLabel}
    >
      <Image
        src={MOONVERSE_MISSING_COVER_SRC}
        alt=""
        fill
        sizes="(max-width: 640px) 50vw, 240px"
        className="object-cover object-center"
        priority={false}
      />
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
}
