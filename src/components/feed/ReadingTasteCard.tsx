import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { ReadingTasteSnapshot } from "@/services/feed.service";

interface ReadingTasteCardProps {
  taste: ReadingTasteSnapshot;
}

export function ReadingTasteCard({ taste }: ReadingTasteCardProps) {
  if (!taste.hasSignals) {
    return (
      <section className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-night-blue">Your reading taste</h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">
          Moonie is still learning your taste. Like, save, and review a few novels
          to personalise your feed.
        </p>
        <Link
          href="/search"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
        >
          <BookOpen className="size-3.5" aria-hidden />
          Browse genres
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold text-night-blue">Your reading taste</h2>
      <ul className="mt-3 space-y-2 text-xs text-slate-600">
        {taste.topGenres.length > 0 ? (
          <li>
            <span className="font-semibold text-slate-500">Top genres · </span>
            {taste.topGenres.map((genre, index) => (
              <span key={genre.slug}>
                {index > 0 ? ", " : null}
                <Link
                  href={`/browse/${genre.slug}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {genre.name}
                </Link>
              </span>
            ))}
          </li>
        ) : null}
        {taste.topTag ? (
          <li>
            <span className="font-semibold text-slate-500">Top saved tag · </span>
            <Link
              href={`/search?tags=${encodeURIComponent(taste.topTag.slug)}`}
              className="font-semibold text-primary hover:underline"
            >
              {taste.topTag.name}
            </Link>
          </li>
        ) : null}
        <li>
          <span className="font-semibold text-slate-500">Saved novels · </span>
          <span className="font-bold text-night-blue">{taste.savedNovelCount}</span>
        </li>
      </ul>
    </section>
  );
}
