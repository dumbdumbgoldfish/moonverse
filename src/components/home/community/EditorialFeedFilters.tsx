"use client";

import Link from "next/link";
import { Clock3, Flame, Sparkles, Users } from "lucide-react";
import type { HomeFeedTab } from "@/lib/feed";
import { cn } from "@/lib/utils";

const tabs: {
  id: HomeFeedTab;
  label: string;
  icon: typeof Sparkles;
  hint: string;
}[] = [
  {
    id: "for-you",
    label: "For You",
    icon: Sparkles,
    hint: "Personalised from your genres, saves & circle",
  },
  {
    id: "following",
    label: "Following",
    icon: Users,
    hint: "Only reviews from people you follow",
  },
  {
    id: "trending",
    label: "Trending",
    icon: Flame,
    hint: "Most discussed reviews right now",
  },
  {
    id: "latest",
    label: "Latest",
    icon: Clock3,
    hint: "Newest reviews across MoonVerse",
  },
];

interface EditorialFeedFiltersProps {
  value: HomeFeedTab;
  basePath?: string;
}

export function EditorialFeedFilters({
  value,
  basePath = "/community",
}: EditorialFeedFiltersProps) {
  const activeHint = tabs.find((tab) => tab.id === value)?.hint;

  return (
    <div className="space-y-2" role="presentation">
      <div
        className="relative z-10"
        role="tablist"
        aria-label="Community feed filters"
      >
        <div className="flex gap-0.5 overflow-x-auto rounded-full border border-[var(--mv-border)] bg-[var(--mv-paper)]/80 p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => {
            const active = value === tab.id;
            const Icon = tab.icon;
            const href = basePath.includes("?")
              ? `${basePath}&feed=${tab.id}`
              : `${basePath}?feed=${tab.id}`;
            return (
              <Link
                key={tab.id}
                href={href}
                scroll={false}
                role="tab"
                aria-selected={active}
                className={cn(
                  "inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mv-plum)]",
                  active
                    ? "bg-white text-[var(--mv-deep-plum)] shadow-[0_1px_4px_rgba(36,22,48,0.12)]"
                    : "text-[var(--mv-text-muted)] hover:text-[var(--mv-ink)]"
                )}
              >
                <Icon
                  className={cn(
                    "size-3.5 shrink-0",
                    active ? "text-[var(--mv-plum)]" : "opacity-75"
                  )}
                  aria-hidden
                />
                <span className="truncate">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
      {activeHint ? (
        <p className="flex items-center gap-1.5 px-0.5 text-[12px] text-[var(--mv-text-muted)]">
          <Sparkles className="size-3 shrink-0 text-[var(--mv-plum)]" aria-hidden />
          {activeHint}
        </p>
      ) : null}
    </div>
  );
}
