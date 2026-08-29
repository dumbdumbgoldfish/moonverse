import {
  Bookmark,
  MessagesSquare,
  Sparkles,
  Users,
  Tags,
} from "lucide-react";
import type { HomeFeedTab } from "@/lib/feed";

const FEED_COPY: Record<
  HomeFeedTab,
  { title: string; subtitle: string; icon: typeof Sparkles }
> = {
  "for-you": {
    title: "Community",
    subtitle: "Matched to your taste",
    icon: Sparkles,
  },
  following: {
    title: "Community",
    subtitle: "From people you follow",
    icon: Users,
  },
  trending: {
    title: "Community",
    subtitle: "What readers are discussing now",
    icon: MessagesSquare,
  },
  latest: {
    title: "Community",
    subtitle: "Newest reviews from the circle",
    icon: MessagesSquare,
  },
};

interface CommunityPageHeaderProps {
  feed: HomeFeedTab;
  followingCount?: number;
  savedCount?: number;
  genreCount?: number;
}

export function CommunityPageHeader({
  feed,
  followingCount,
  savedCount,
  genreCount,
}: CommunityPageHeaderProps) {
  const copy = FEED_COPY[feed];
  const Icon = copy.icon;

  const chips = [
    followingCount != null && followingCount > 0
      ? {
          icon: Users,
          label:
            followingCount === 1
              ? "1 followed"
              : `${followingCount} followed`,
        }
      : null,
    savedCount != null && savedCount > 0
      ? {
          icon: Bookmark,
          label: savedCount === 1 ? "1 saved" : `${savedCount} saved`,
        }
      : null,
    genreCount != null && genreCount > 0
      ? {
          icon: Tags,
          label: genreCount === 1 ? "1 genre" : `${genreCount} genres`,
        }
      : null,
  ].filter(Boolean) as { icon: typeof Users; label: string }[];

  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-[var(--mv-plum)]/10 text-[var(--mv-plum)]">
            <Icon className="size-5" aria-hidden />
          </span>
          <div>
            <h1 className="font-serif text-[1.65rem] font-semibold tracking-tight text-[var(--mv-ink)] sm:text-[1.75rem]">
              {copy.title}
            </h1>
            <p className="text-[13px] text-[var(--mv-text-muted)]">{copy.subtitle}</p>
          </div>
        </div>
      </div>
      {chips.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {chips.map((chip) => {
            const ChipIcon = chip.icon;
            return (
              <li
                key={chip.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--mv-border)] bg-white/80 px-2.5 py-1 text-[12px] font-medium text-[var(--mv-ink)]"
              >
                <ChipIcon
                  className="size-3.5 text-[var(--mv-plum)]"
                  aria-hidden
                />
                {chip.label}
              </li>
            );
          })}
        </ul>
      ) : null}
    </header>
  );
}
