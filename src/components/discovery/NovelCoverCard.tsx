import Link from "next/link";
import { Eye } from "lucide-react";
import { memo } from "react";
import { CoverImage } from "@/components/ui/CoverImage";
import { formatCompactCount } from "@/lib/format-utils";
import { cn } from "@/lib/utils";

interface NovelCoverCardProps {
  href: string;
  coverUrl: string;
  title: string;
  subtitle?: string;
  rank?: number;
  viewCount?: number;
  tags?: string[];
  progress?: number;
  size?: "sm" | "md" | "lg";
  showTitle?: boolean;
  className?: string;
}

const sizes = {
  sm: { wrap: "w-[88px]", cover: "h-[120px] w-[88px]", imageSizes: "88px" },
  md: { wrap: "w-[110px]", cover: "h-[150px] w-[110px]", imageSizes: "110px" },
  lg: { wrap: "w-[120px]", cover: "h-[168px] w-[120px]", imageSizes: "120px" },
};

function NovelCoverCardComponent({
  href,
  coverUrl,
  title,
  subtitle,
  rank,
  viewCount,
  tags,
  progress,
  size = "md",
  showTitle = false,
  className,
}: NovelCoverCardProps) {
  const s = sizes[size];
  const primaryTag = tags?.[0];
  const fluid = className?.includes("w-full");

  return (
    <Link
      href={href}
      className={cn(
        "group snap-start",
        fluid ? "w-full" : cn("shrink-0", s.wrap),
        className,
      )}
    >
      <div className="relative">
        <div
          className={cn(
            "relative overflow-hidden rounded-lg bg-muted",
            fluid ? "aspect-[5/7] w-full" : s.cover,
          )}
        >
          <CoverImage
            src={coverUrl}
            alt={`Cover of ${title}`}
            title={title}
            author={subtitle}
            themeSeed={href}
            sizes={fluid ? "(max-width: 640px) 50vw, 160px" : s.imageSizes}
            compactFallback
            className="object-cover"
          />
          {rank !== undefined && (
            <span
              className="absolute bottom-0 left-0 px-1 text-5xl font-black leading-none text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
              aria-hidden="true"
            >
              {rank}
            </span>
          )}
        </div>
        {progress !== undefined && (
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-rating-accent"
              style={{ width: `${Math.min(100, Math.max(8, progress))}%` }}
            />
          </div>
        )}
      </div>

      {showTitle && (
        <p className="mt-2 line-clamp-2 text-xs font-semibold leading-tight">
          {title}
        </p>
      )}
      {subtitle && (
        <p className="mt-1 line-clamp-1 text-[10px] text-muted-foreground">
          {subtitle}
        </p>
      )}

      {primaryTag && (
        <span className="mt-2 inline-block max-w-full truncate rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
          {primaryTag.toLowerCase()}
        </span>
      )}

      {viewCount !== undefined && (
        <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
          <Eye className="size-3 shrink-0" aria-hidden="true" />
          {formatCompactCount(viewCount)}
        </p>
      )}
    </Link>
  );
}

export const NovelCoverCard = memo(NovelCoverCardComponent);
