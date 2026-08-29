"use client";

import Link from "next/link";
import { MessagesSquare, Sparkles } from "lucide-react";
import { homeHref, type HomeView } from "@/lib/home-view";
import { cn } from "@/lib/utils";

interface EditorialViewTabsProps {
  view: HomeView;
  feed?: string;
}

const tabs = [
  {
    id: "home" as const,
    label: "For You",
    icon: Sparkles,
    href: () => homeHref("home"),
  },
  {
    id: "community" as const,
    label: "Community",
    icon: MessagesSquare,
    href: (feed?: string) => homeHref("community", feed),
  },
];

export function EditorialViewTabs({ view, feed }: EditorialViewTabsProps) {
  return (
    <div className="pt-2 pb-1" role="tablist" aria-label="Home sections">
      <div className="flex items-end gap-1 border-b border-[var(--mv-border)]">
        {tabs.map((tab) => {
          const showActive = view === tab.id;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              href={tab.href(feed)}
              scroll={false}
              role="tab"
              aria-selected={showActive}
              className={cn(
                "relative inline-flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-semibold transition duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mv-plum)]",
                showActive
                  ? "text-[var(--mv-deep-plum)]"
                  : "text-[var(--mv-text-muted)] hover:text-[var(--mv-ink)]"
              )}
            >
              <Icon className="size-3.5 opacity-80" aria-hidden />
              {tab.label}
              {showActive ? (
                <span
                  className="absolute inset-x-2.5 bottom-0 h-[3px] rounded-full bg-[var(--mv-plum)]"
                  aria-hidden
                />
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
