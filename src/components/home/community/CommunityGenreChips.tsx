"use client";

import { useState } from "react";
import Link from "next/link";
import { getGenreIcon } from "@/components/browse/genre-icon";
import type { PreferredGenreOption } from "@/services/preference.service";
import { cn } from "@/lib/utils";

interface CommunityGenreChipsProps {
  genres: PreferredGenreOption[];
  limit?: number;
}

export function CommunityGenreChips({
  genres,
  limit = 3,
}: CommunityGenreChipsProps) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? genres : genres.slice(0, limit);
  const hidden = Math.max(0, genres.length - limit);

  if (genres.length === 0) return null;

  return (
    <div>
      <ul className="flex flex-wrap gap-2">
        {visible.map((genre) => {
          const Icon = getGenreIcon(genre.slug);
          return (
            <li key={genre.id}>
              <Link
                href={`/browse/${genre.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--mv-border)] bg-white px-3 py-1.5 text-[11px] font-medium text-[var(--mv-plum)] transition hover:border-[var(--mv-plum)]/35"
              >
                <Icon className="size-3 opacity-70" aria-hidden />
                {genre.name}
              </Link>
            </li>
          );
        })}
      </ul>
      {hidden > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className={cn(
            "mt-1.5 text-[11px] font-semibold text-[var(--mv-plum)] hover:underline"
          )}
        >
          {expanded ? "Show fewer" : `+${hidden} more`}
        </button>
      ) : null}
    </div>
  );
}
