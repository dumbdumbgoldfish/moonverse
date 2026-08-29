"use client";

import { useMemo } from "react";
import { Check, Plus } from "lucide-react";
import {
  curatedTagsCoveredBySections,
  getBrowseTagSections,
  getCuratedTagSlugs,
} from "@/lib/browse-tag-sections";
import { cn } from "@/lib/utils";

interface BrowseTag {
  name: string;
  slug: string;
}

interface GenreTagGroupsProps {
  genreSlug: string;
  tags: BrowseTag[];
  selectedTags: string[];
  maxTags: number;
  onToggle: (slug: string) => void;
  /** Flat chip row for compact browse panels. */
  flat?: boolean;
  /** Flat layout when nested inside a parent filter panel. */
  embedded?: boolean;
}

function TagChip({
  tag,
  active,
  disabled,
  onToggle,
  compact,
}: {
  tag: BrowseTag;
  active: boolean;
  disabled: boolean;
  onToggle: (slug: string) => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      onClick={() => onToggle(tag.slug)}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md font-semibold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
        compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        active
          ? "mv-nav-signup border-0 text-white"
          : "border border-violet-200/80 bg-white text-[#1a1033]/85 hover:border-primary/30 hover:bg-violet-50/70",
        disabled && "cursor-not-allowed opacity-45"
      )}
    >
      {active ? (
        <Check className="size-3 shrink-0" aria-hidden />
      ) : (
        <Plus className="size-2.5 shrink-0 opacity-50" aria-hidden />
      )}
      {tag.name}
    </button>
  );
}

export function GenreTagGroups({
  genreSlug,
  tags,
  selectedTags,
  maxTags,
  onToggle,
  flat = false,
  embedded = false,
}: GenreTagGroupsProps) {
  const atLimit = selectedTags.length >= maxTags;

  const tagMap = useMemo(() => new Map(tags.map((t) => [t.slug, t])), [tags]);
  const curatedSlugs = useMemo(() => new Set(getCuratedTagSlugs(genreSlug)), [genreSlug]);
  const sections = useMemo(() => getBrowseTagSections(genreSlug), [genreSlug]);
  const skipPopularRow = useMemo(() => curatedTagsCoveredBySections(genreSlug), [genreSlug]);

  const orderedTags = useMemo(() => {
    if (!flat) return tags;

    const seen = new Set<string>();
    const ordered: BrowseTag[] = [];

    const push = (slug: string) => {
      if (seen.has(slug)) return;
      const tag = tagMap.get(slug);
      if (!tag) return;
      seen.add(slug);
      ordered.push(tag);
    };

    if (!skipPopularRow) {
      for (const slug of curatedSlugs) push(slug);
    }

    for (const section of sections) {
      for (const slug of section.slugs) push(slug);
    }

    for (const tag of tags) push(tag.slug);

    return ordered;
  }, [flat, tags, tagMap, curatedSlugs, sections, skipPopularRow]);

  if (tags.length === 0) return null;

  if (flat) {
    return (
      <div className="space-y-2">
        {atLimit && (
          <p
            className="text-[11px] font-medium text-amber-800"
            role="status"
          >
            You can select up to five tags.
          </p>
        )}
        <div className="flex flex-wrap gap-1.5">
          {orderedTags.map((tag) => {
            const active = selectedTags.includes(tag.slug);
            const disabled = !active && atLimit;
            return (
              <TagChip
                key={tag.slug}
                tag={tag}
                active={active}
                disabled={disabled}
                onToggle={onToggle}
                compact
              />
            );
          })}
        </div>
      </div>
    );
  }

  // Legacy sectioned layout for non-flat contexts
  const curatedTags = skipPopularRow
    ? []
    : [...curatedSlugs]
        .map((slug) => tagMap.get(slug))
        .filter((t): t is BrowseTag => Boolean(t));

  const sectionData = sections
    .map((section) => ({
      ...section,
      tags: section.slugs
        .map((slug) => tagMap.get(slug))
        .filter((t): t is BrowseTag => Boolean(t)),
    }))
    .filter((section) => section.tags.length > 0);

  const content = (
    <div className="space-y-2">
      {atLimit && (
        <p
          className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-2.5 py-1.5 text-xs font-medium text-amber-900"
          role="status"
        >
          You can select up to five tags.
        </p>
      )}

      {curatedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {curatedTags.map((tag) => {
            const active = selectedTags.includes(tag.slug);
            const disabled = !active && atLimit;
            return (
              <TagChip
                key={tag.slug}
                tag={tag}
                active={active}
                disabled={disabled}
                onToggle={onToggle}
              />
            );
          })}
        </div>
      )}

      {sectionData.map((section) => (
        <div key={section.id} className="flex flex-wrap gap-1.5">
          {section.tags.map((tag) => {
            const active = selectedTags.includes(tag.slug);
            const disabled = !active && atLimit;
            return (
              <TagChip
                key={tag.slug}
                tag={tag}
                active={active}
                disabled={disabled}
                onToggle={onToggle}
              />
            );
          })}
        </div>
      ))}
    </div>
  );

  if (embedded) return content;

  return (
    <section
      aria-labelledby="browse-tag-filters-heading"
      className="rounded-lg border border-violet-100/90 bg-white px-3 py-2.5"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2
          id="browse-tag-filters-heading"
          className="text-xs font-bold text-[#1a1033]"
        >
          Refine by tag
        </h2>
        <span className="text-[11px] font-medium text-muted-foreground">
          {selectedTags.length} of {maxTags} selected
        </span>
      </div>
      {content}
    </section>
  );
}
