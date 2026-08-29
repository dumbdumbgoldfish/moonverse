"use client";

import { CanonicalNovelSummary } from "@/components/reviews/write/CanonicalNovelSummary";
import type { NovelSelectOption } from "@/services/novel.service";

interface SelectedNovelCardProps {
  novel: NovelSelectOption;
  onChange: () => void;
  disabled?: boolean;
}

export function SelectedNovelCard({
  novel,
  onChange,
  disabled = false,
}: SelectedNovelCardProps) {
  return (
    <CanonicalNovelSummary
      title={novel.title}
      author={novel.author}
      coverUrl={novel.coverUrl ?? null}
      genres={novel.genres}
      reviewCount={novel.reviewCount}
      verifiedSourceCount={novel.verifiedSourceCount}
      themeSeed={novel.id}
      onChange={onChange}
      disabled={disabled}
    />
  );
}
