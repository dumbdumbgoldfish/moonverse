import Link from "next/link";
import { CoverImage } from "@/components/ui/CoverImage";
import { StarRating } from "@/components/reviews/StarRating";

interface NovelAttachmentProps {
  novelId: string;
  title: string;
  author: string;
  coverUrl: string;
  rating: number;
  genres: string[];
}

export function NovelAttachment({
  novelId,
  title,
  author,
  coverUrl,
  rating,
  genres,
}: NovelAttachmentProps) {
  return (
    <Link
      href={`/novels/${novelId}`}
      className="mt-2.5 flex gap-3 rounded-xl border border-[var(--mv-border)] bg-[var(--mv-paper,#F5EFE6)]/80 p-2.5 transition hover:border-[var(--mv-gold)]/40 hover:bg-[var(--mv-paper,#F5EFE6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mv-plum)]"
    >
      <div className="relative h-[90px] w-[63px] shrink-0 overflow-hidden rounded-lg bg-[var(--mv-paper)] shadow-sm sm:h-[100px] sm:w-[70px]">
        <CoverImage
          src={coverUrl}
          alt={`Cover of ${title}`}
          title={title}
          author={author}
          genres={genres}
          themeSeed={novelId}
          sizes="70px"
          compactFallback
        />
      </div>
      <div className="min-w-0 flex-1 self-center">
        <p className="truncate text-sm font-bold text-[var(--mv-ink,#201738)]">
          {title}
        </p>
        <p className="truncate text-xs text-[var(--mv-muted,#6F6884)]">
          by {author}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <StarRating rating={rating} size="sm" />
          <span className="text-xs font-semibold text-[var(--mv-muted,#6F6884)]">
            {rating.toFixed(1)}
          </span>
        </div>
        {genres.length > 0 ? (
          <p className="mt-1 truncate text-[11px] text-[var(--mv-muted,#6F6884)]">
            {genres.slice(0, 2).join(" · ")}
          </p>
        ) : null}
        <span className="mt-1.5 inline-block text-[11px] font-bold text-primary">
          View novel
        </span>
      </div>
    </Link>
  );
}
