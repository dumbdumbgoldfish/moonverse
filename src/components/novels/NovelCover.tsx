import { CoverImage } from "@/components/ui/CoverImage";
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
  return (
    <div
      className={cn(
        "relative aspect-[2/3] overflow-hidden rounded-[22px] border border-black/10",
        "shadow-[0_24px_55px_-25px_rgba(26,16,51,0.55)]",
        SIZE_CLASSES[size],
        className
      )}
    >
      <CoverImage
        src={src}
        alt={`Cover of ${title}${author ? ` by ${author}` : ""}`}
        title={title}
        author={author}
        genres={genres}
        language={language}
        rating={rating}
        reviewCount={reviewCount}
        themeSeed={themeSeed || title}
        sizes="(max-width: 640px) 192px, 240px"
        priority={priority}
      />
    </div>
  );
}
