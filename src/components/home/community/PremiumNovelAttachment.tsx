import Link from "next/link";
import { CoverImage } from "@/components/ui/CoverImage";
import { StarRating } from "@/components/reviews/StarRating";
import { genreAccentColor } from "@/lib/genre-accent";

interface PremiumNovelAttachmentProps {
  novelId: string;
  title: string;
  author: string;
  coverUrl: string;
  rating: number;
  genres: string[];
}

export function PremiumNovelAttachment({
  novelId,
  title,
  author,
  coverUrl,
  rating,
  genres,
}: PremiumNovelAttachmentProps) {
  const accent = genres[0] ? genreAccentColor(genres[0]) : "var(--mv-plum)";

  return (
    <Link
      href={`/novels/${novelId}`}
      className="mt-3 flex gap-3.5 overflow-hidden rounded-xl border border-[var(--mv-border)] bg-[var(--mv-paper)]/80 p-3 transition hover:border-[var(--mv-gold)]/40 hover:bg-[var(--mv-paper)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mv-plum)]"
      style={{ boxShadow: `inset 3px 0 0 ${accent}` }}
    >
      <div className="relative h-[138px] w-[96px] shrink-0 overflow-hidden rounded-lg shadow-[0_10px_24px_-14px_rgba(23,19,41,0.55)] ring-1 ring-[var(--mv-border)]">
        <CoverImage
          src={coverUrl}
          alt={`Cover of ${title}`}
          title={title}
          author={author}
          genres={genres}
          themeSeed={novelId}
          sizes="96px"
          compactFallback
        />
      </div>
      <div className="min-w-0 flex-1 self-center">
        <p className="font-serif text-[1.05rem] font-semibold leading-snug text-[var(--mv-ink)]">
          {title}
        </p>
        <p className="mt-0.5 text-xs text-[var(--mv-text-muted)]">
          by {author}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StarRating rating={rating} size="sm" showValue={false} />
          <span className="text-xs font-semibold text-[var(--mv-gold)]">
            {rating.toFixed(1)}
          </span>
        </div>
        {genres.length > 0 ? (
          <p className="mt-1.5 text-[11px] tracking-wide text-[var(--mv-text-muted)]">
            {genres.slice(0, 3).join(" · ")}
          </p>
        ) : null}
        <span className="mt-2 inline-block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--mv-gold)]">
          View novel
        </span>
      </div>
    </Link>
  );
}
