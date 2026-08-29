import { Heart } from "lucide-react";
import type { NovelDetail } from "@/types/review";

interface NovelWhatReadersLikedProps {
  novel: NovelDetail;
}

export function NovelWhatReadersLiked({ novel }: NovelWhatReadersLikedProps) {
  const highRatings =
    novel.ratingDistribution
      .filter((row) => row.rating >= 4)
      .reduce((sum, row) => sum + row.count, 0);

  if (highRatings === 0 && novel.likedTropes.length === 0) return null;

  return (
    <section
      aria-labelledby="readers-liked-heading"
      className="rounded-[22px] border border-[#1A1224]/10 bg-white p-4 shadow-[0_12px_35px_-28px_rgba(26,16,51,0.12)] sm:p-5"
    >
      <h2
        id="readers-liked-heading"
        className="flex items-center gap-2 font-heading text-xl font-semibold text-[#1a1033]"
      >
        <Heart className="size-5 fill-[var(--mv-gold)] text-[var(--mv-gold)]" aria-hidden />
        What readers liked
      </h2>
      <p className="mt-2 text-sm text-[#4a4458]">
        Aggregated from {highRatings} four- and five-star reviews. This is not
        generated review text.
      </p>
      {novel.likedTropes.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {novel.likedTropes.map((trope) => (
            <li
              key={trope}
              className="rounded-full bg-[#F4ECF8] px-3 py-1.5 text-xs font-semibold text-[#4C35C4] ring-1 ring-[#6E46C7]/15"
            >
              {trope}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-[#4a4458]">
          High ratings, but no shared tropes yet.
        </p>
      )}
    </section>
  );
}
