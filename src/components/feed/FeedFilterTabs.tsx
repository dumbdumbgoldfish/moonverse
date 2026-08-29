"use client";

import { cn } from "@/lib/utils";

export type FeedFilter = "latest" | "trending";

interface FeedFilterTabsProps {
  value: FeedFilter;
  onChange: (value: FeedFilter) => void;
}

const tabs: { id: FeedFilter; label: string }[] = [
  { id: "latest", label: "Latest" },
  { id: "trending", label: "Trending" },
];

export function FeedFilterTabs({ value, onChange }: FeedFilterTabsProps) {
  return (
    <div
      className="mv-feed-tabs"
      role="tablist"
      aria-label="Review feed filters"
    >
      {tabs.map((tab) => {
        const active = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn("mv-feed-tab", active && "mv-feed-tab-active")}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
