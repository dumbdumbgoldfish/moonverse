"use client";

import Link from "next/link";
import { Clock3, Flame, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HomeFeedTab } from "@/lib/feed";

const tabs: {
  id: HomeFeedTab;
  label: string;
  icon: typeof Sparkles;
}[] = [
  { id: "for-you", label: "For You", icon: Sparkles },
  { id: "following", label: "Following", icon: Users },
  { id: "trending", label: "Trending", icon: Flame },
  { id: "latest", label: "Latest", icon: Clock3 },
];

interface FeedTabsProps {
  value: HomeFeedTab;
  /** Base path for feed query links. Must include view=community. */
  basePath?: string;
}

export function FeedTabs({
  value,
  basePath = "/community",
}: FeedTabsProps) {
  return (
    <div
      className="sticky top-[var(--mv-nav-h)] z-20 -mx-1 rounded-2xl border border-[var(--mv-border,#E6DFF8)] bg-white/90 p-1 shadow-sm backdrop-blur-md"
      role="tablist"
      aria-label="Community feed filters"
    >
      <div className="flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                "inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                active
                  ? "bg-[var(--mv-primary,#6542E8)] text-white shadow-sm"
                  : "text-[var(--mv-muted,#6F6884)] hover:bg-[var(--mv-surface-soft,#F3EFFF)] hover:text-[var(--mv-ink,#201738)]"
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
