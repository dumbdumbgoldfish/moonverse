import { Compass, MessagesSquare, Sparkles } from "lucide-react";
import type { HomeFeedTab } from "@/lib/feed";
import type { ReaderSection } from "@/lib/home-view";

const FOR_YOU_COPY = {
  title: "For You",
  subtitle: "Personal picks from your taste, saves, and reading circle",
  icon: Sparkles,
} as const;

const COMMUNITY_FEED_COPY: Record<
  HomeFeedTab,
  { title: string; subtitle: string; icon: typeof MessagesSquare }
> = {
  "for-you": {
    title: "Community Feed",
    subtitle: "Reviews matched to your taste",
    icon: Sparkles,
  },
  following: {
    title: "Community Feed",
    subtitle: "From people you follow",
    icon: MessagesSquare,
  },
  trending: {
    title: "Community Feed",
    subtitle: "What readers are discussing now",
    icon: MessagesSquare,
  },
  latest: {
    title: "Community Feed",
    subtitle: "Newest reviews from the circle",
    icon: MessagesSquare,
  },
};

interface ReaderHubSectionHeaderProps {
  section: ReaderSection;
  greetingName?: string;
  feed?: HomeFeedTab;
  followingCount?: number;
  savedCount?: number;
  genreCount?: number;
}

export function ReaderHubSectionHeader({
  section,
  greetingName,
  feed = "for-you",
  followingCount,
  savedCount,
  genreCount,
}: ReaderHubSectionHeaderProps) {
  const copy =
    section === "for-you"
      ? {
          ...FOR_YOU_COPY,
          subtitle: greetingName
            ? `${greetingName}, ${FOR_YOU_COPY.subtitle.toLowerCase()}`
            : FOR_YOU_COPY.subtitle,
        }
      : COMMUNITY_FEED_COPY[feed];
  const Icon = section === "for-you" ? Compass : copy.icon;

  const chips = [
    followingCount != null && followingCount > 0
      ? `${followingCount} followed`
      : null,
    savedCount != null && savedCount > 0 ? `${savedCount} saved` : null,
    genreCount != null && genreCount > 0 ? `${genreCount} genres` : null,
  ].filter(Boolean) as string[];

  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" aria-hidden />
          </span>
          <div>
            <h1 className="font-serif text-2xl font-medium tracking-tight text-[var(--mv-ink)] sm:text-[1.75rem]">
              {copy.title}
            </h1>
            <p className="text-sm text-[var(--mv-text-muted)]">{copy.subtitle}</p>
          </div>
        </div>
      </div>
      {chips.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {chips.map((label) => (
            <li
              key={label}
              className="inline-flex items-center rounded-full border border-[var(--mv-border)] bg-white/80 px-2.5 py-1 text-[12px] font-medium text-[var(--mv-ink)]"
            >
              {label}
            </li>
          ))}
        </ul>
      ) : null}
    </header>
  );
}
