import Image from "next/image";
import { DefaultNovelCover } from "@/components/novels/DefaultNovelCover";
import { canUseNextImageCover, isMissingCoverUrl } from "@/lib/review-utils";
import { cn } from "@/lib/utils";

interface NovelCoverProps {
  src: string | null | undefined;
  title: string;
  author?: string | null;
  genres?: string[];
  language?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  themeSeed?: string;
  priority?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES = {
  sm: "w-32",
  md: "w-44 sm:w-52",
  lg: "w-48 sm:w-56 lg:w-60",
} as const;

export function NovelCover({
  src,
  title,
  author,
  genres,
  language,
  rating,
  reviewCount,
  themeSeed,
  priority = false,
  size = "lg",
  className,
}: NovelCoverProps) {
  const missing = isMissingCoverUrl(src);
  const coverSrc = src as string;
  const useNext = !missing && canUseNextImageCover(coverSrc);

  return (
    <div
      className={cn(
        "relative aspect-[2/3] overflow-hidden rounded-[22px] border border-black/10",
        "shadow-[0_24px_55px_-25px_rgba(26,16,51,0.55)]",
        SIZE_CLASSES[size],
        className
      )}
    >
      {missing ? (
        <DefaultNovelCover
          title={title}
          author={author}
          genres={genres}
          language={language}
          rating={rating}
          reviewCount={reviewCount}
          themeSeed={themeSeed || title}
        />
      ) : useNext ? (
        <Image
          src={coverSrc}
          alt={`Cover of ${title}${author ? ` by ${author}` : ""}`}
          fill
          sizes="(max-width: 640px) 192px, 240px"
          priority={priority}
          unoptimized
          className="object-cover"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- host not in next/image allowlist
        <img
          src={coverSrc}
          alt={`Cover of ${title}${author ? ` by ${author}` : ""}`}
          className="absolute inset-0 h-full w-full object-cover"
          loading={priority ? "eager" : "lazy"}
        />
      )}
    </div>
  );
}
