"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CatalogTag {
  name: string;
  slug: string;
}

const MAX_TAGS = 3;

/** Presentational grouping of tag slugs into collapsible categories. */
export const TAG_CATEGORIES: { id: string; label: string; slugs: string[] }[] = [
  {
    id: "romance",
    label: "Romance and relationships",
    slugs: [
      "slow-burn",
      "enemies-to-lovers",
      "found-family",
      "reverse-harem",
      "harem",
      "strong-fl",
      "fluff",
      "angst",
      "bl-tag",
      "gl-tag",
      "lgbtq",
    ],
  },
  {
    id: "power",
    label: "Power and progression",
    slugs: [
      "op-mc",
      "earned-power",
      "weak-to-strong",
      "cultivation",
      "system",
      "martial-arts-tag",
      "dungeon-crawl",
    ],
  },
  {
    id: "premise",
    label: "Premise and plot",
    slugs: [
      "reincarnation",
      "transmigration",
      "regression",
      "isekai-tag",
      "time-travel",
      "villainess",
      "kingdom-building",
      "political-intrigue",
    ],
  },
  {
    id: "setting",
    label: "Setting and vibe",
    slugs: [
      "magic-academy",
      "school-life",
      "urban-fantasy",
      "military",
      "apocalypse",
      "survival",
      "steampunk",
      "cyberpunk-tag",
      "virtual-reality",
      "gaming",
      "sports",
      "mecha",
      "hard-sci-fi",
      "slice-of-life",
    ],
  },
  {
    id: "creatures",
    label: "Creatures and mythos",
    slugs: [
      "monsters",
      "vampire",
      "werewolf",
      "demons",
      "angels",
      "mythology",
      "cosmic-horror",
    ],
  },
  {
    id: "tone",
    label: "Tone and craft",
    slugs: [
      "dark",
      "tragedy",
      "satire",
      "comedy-tag",
      "psychological",
      "character-driven",
      "family-drama",
      "anti-hero",
      "beginner-friendly",
    ],
  },
  {
    id: "source",
    label: "Origin and source",
    slugs: [
      "translated-cn",
      "chinese-original",
      "english-original",
      "royal-road",
    ],
  },
];

interface TagRefinePanelProps {
  tags: CatalogTag[];
  selectedTags: string[];
  onToggle: (slug: string) => void;
  className?: string;
  idPrefix?: string;
}

function TagCategory({
  id,
  label,
  tags,
  selectedTags,
  atLimit,
  onToggle,
  idPrefix,
}: {
  id: string;
  label: string;
  tags: CatalogTag[];
  selectedTags: string[];
  atLimit: boolean;
  onToggle: (slug: string) => void;
  idPrefix: string;
}) {
  // Categories begin collapsed and expand on user request.
  const [open, setOpen] = useState(false);
  const selectedCount = tags.filter((t) => selectedTags.includes(t.slug)).length;
  const panelId = `${idPrefix}-tag-category-${id}`;

  if (tags.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl bg-white/80 ring-1 ring-[#1A1224]/8">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          "flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors",
          "hover:bg-[#6E46C7]/6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7] focus-visible:ring-inset",
          open && "bg-[#6E46C7]/6"
        )}
      >
        <span className="flex items-center gap-2 text-xs font-bold text-[#1a1033]">
          {label}
          {selectedCount > 0 && (
            <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-black text-white">
              {selectedCount}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>
      <div
        id={panelId}
        role="region"
        aria-label={label}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-200 motion-reduce:transition-none",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-wrap gap-1.5 p-3 pt-1.5">
            {tags.map((tag) => {
              const active = selectedTags.includes(tag.slug);
              const disabled = !active && atLimit;
              return (
                <button
                  key={tag.slug}
                  type="button"
                  disabled={disabled}
                  aria-pressed={active}
                  onClick={() => onToggle(tag.slug)}
                  className={cn(
                    "rounded-full px-2 py-1 text-[10px] font-semibold transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    active
                      ? "mv-nav-signup border-0 text-white"
                      : "bg-[#1A1224]/4 text-[#1A1224]/80 ring-1 ring-[#1A1224]/8 hover:bg-[#1A1224]/8",
                    disabled && "cursor-not-allowed opacity-40"
                  )}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TagRefinePanel({
  tags,
  selectedTags,
  onToggle,
  className,
  idPrefix = "discover",
}: TagRefinePanelProps) {
  const tagMap = new Map(tags.map((t) => [t.slug, t]));
  const atLimit = selectedTags.length >= MAX_TAGS;

  return (
    <section className={className}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1A1224]/45">
          Tropes
        </h2>
        <span className="text-[10px] font-medium text-[#1A1224]/45">
          {selectedTags.length} of {MAX_TAGS}
        </span>
      </div>
      <div className="space-y-2">
        {TAG_CATEGORIES.map((category) => {
          const categoryTags = category.slugs
            .map((slug) => tagMap.get(slug))
            .filter((t): t is CatalogTag => Boolean(t));
          return (
            <TagCategory
              key={category.id}
              id={category.id}
              idPrefix={idPrefix}
              label={category.label}
              tags={categoryTags}
              selectedTags={selectedTags}
              atLimit={atLimit}
              onToggle={onToggle}
            />
          );
        })}
      </div>
    </section>
  );
}

export { MAX_TAGS as DISCOVER_MAX_TAGS };
