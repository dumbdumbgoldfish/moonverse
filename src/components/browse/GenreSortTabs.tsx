"use client";

import type { LucideIcon } from "lucide-react";
import {
  Bookmark,
  Clock3,
  Flame,
  Heart,
  MessageCircle,
  ShieldCheck,
  Star,
  Scale,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GenreBrowseSort } from "@/lib/browse-sort";
import { cn } from "@/lib/utils";

export const GENRE_SORT_OPTIONS: {
  value: GenreBrowseSort;
  label: string;
  icon: LucideIcon;
  description: string;
  worksOnly?: boolean;
  requiresAuth?: boolean;
}[] = [
  {
    value: "affinity",
    label: "My affinity",
    icon: Heart,
    description:
      "Ranks by overlap with your Moonie taste profile (signed-in only)",
    worksOnly: true,
    requiresAuth: true,
  },
  {
    value: "community-strength",
    label: "Community strength",
    icon: Scale,
    description:
      "Bayesian average: a few five-star reviews cannot dominate the list",
    worksOnly: true,
  },
  {
    value: "catalogue-confidence",
    label: "Catalogue confidence",
    icon: ShieldCheck,
    description: "Official links, real covers, and community evidence first",
    worksOnly: true,
  },
  {
    value: "hot",
    label: "Hot",
    icon: Flame,
    description: "Most liked and discussed in the community",
  },
  {
    value: "new",
    label: "Fresh discussion",
    icon: Clock3,
    description: "Most recent community activity first",
  },
  {
    value: "highest-rated",
    label: "Highest rated",
    icon: Star,
    description: "Raw average star rating first",
  },
  {
    value: "most-discussed",
    label: "Most discussed",
    icon: MessageCircle,
    description: "Reviews with the most comments",
  },
  {
    value: "most-saved",
    label: "Most saved",
    icon: Bookmark,
    description: "Reviews readers save most",
  },
];

interface GenreSortSelectProps {
  sort: GenreBrowseSort;
  onSortChange: (sort: GenreBrowseSort) => void;
  loading?: boolean;
  mode?: "works" | "reviews";
  isAuthenticated?: boolean;
  className?: string;
}

export function GenreSortSelect({
  sort,
  onSortChange,
  loading,
  mode = "works",
  isAuthenticated = false,
  className,
}: GenreSortSelectProps) {
  const options = GENRE_SORT_OPTIONS.filter((option) => {
    if (option.worksOnly && mode === "reviews") return false;
    if (option.requiresAuth && !isAuthenticated) return false;
    return true;
  });
  const active = options.find((option) => option.value === sort) ?? options[0];

  return (
    <div className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      <span className="text-xs text-muted-foreground">Sort by:</span>
      <Select
        value={options.some((o) => o.value === sort) ? sort : "hot"}
        onValueChange={(value) => onSortChange(value as GenreBrowseSort)}
        disabled={loading}
        modal={false}
      >
        <SelectTrigger
          size="sm"
          aria-label="Sort results"
          title={active?.description}
          className={cn(
            "h-7 min-h-7 gap-1 rounded-md border-violet-200/90 bg-white px-2 text-xs font-semibold text-[#1a1033]",
            "shadow-none hover:border-primary/30 hover:bg-violet-50/50",
            "focus-visible:border-primary/40 focus-visible:ring-primary/25"
          )}
        >
          <SelectValue placeholder="Hot">{active?.label ?? "Hot"}</SelectValue>
        </SelectTrigger>
        <SelectContent
          align="end"
          alignItemWithTrigger={false}
          className="w-[min(22rem,calc(100vw-1.5rem))] min-w-[18rem] max-w-[min(22rem,calc(100vw-1.5rem))]"
        >
          {options.map(({ value, label, icon: Icon, description }) => (
            <SelectItem
              key={value}
              value={value}
              label={label}
              title={description}
              className="items-start py-2 pr-9"
            >
              <span className="flex w-full min-w-0 flex-col gap-0.5 py-0.5">
                <span className="inline-flex items-center gap-2 font-semibold text-[#1a1033]">
                  <Icon className="size-3.5 shrink-0 text-primary/80" aria-hidden />
                  {label}
                </span>
                <span className="pl-5 text-[10px] font-normal leading-snug text-muted-foreground">
                  {description}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {loading && (
        <span
          className="inline-flex items-center gap-1 text-[11px] font-medium text-primary"
          aria-live="polite"
        >
          <span className="size-1.5 animate-pulse rounded-full bg-primary motion-reduce:animate-none" />
          <span className="sr-only sm:not-sr-only">Updating…</span>
        </span>
      )}
    </div>
  );
}
