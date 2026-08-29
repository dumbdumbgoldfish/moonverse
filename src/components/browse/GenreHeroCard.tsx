import type { LucideIcon } from "lucide-react";
import { BookOpen, LibraryBig, Sparkles } from "lucide-react";
import { AskMoonieLink } from "@/components/moonie/AskMoonieButton";
import { CoverImage } from "@/components/ui/CoverImage";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { cn } from "@/lib/utils";

export interface GenreHeroCover {
  novelId: string;
  title: string;
  author: string;
  coverUrl: string;
}

interface GenreHeroCardProps {
  eyebrow?: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accentClass: string;
  softBackgroundClass: string;
  iconContainerClass: string;
  decorClass: string;
  reviewCount?: number;
  novelCount?: number;
  /** Displays only measured community activity; synthetic trending scores are excluded. */
  communityLabel?: string;
  /** Tighter hero for browse pages where results should appear sooner. */
  compact?: boolean;
  /** Cover mosaic from the genre shelf. */
  covers?: GenreHeroCover[];
  /** Deep link into Ask Moonie for this shelf. */
  moonieHref?: string;
}

export function GenreHeroCard({
  eyebrow = "Browse",
  title,
  description,
  icon: Icon,
  accentClass,
  softBackgroundClass,
  iconContainerClass,
  decorClass,
  reviewCount,
  novelCount,
  communityLabel = "Popular in community",
  compact = false,
  covers = [],
  moonieHref,
}: GenreHeroCardProps) {
  const showCommunity = (reviewCount ?? 0) > 0 && !compact;
  const mosaic = covers.slice(0, 4);

  return (
    <section
      aria-labelledby="genre-browse-title"
      className={cn(
        "relative overflow-hidden border border-[#1a1033]/10",
        compact
          ? "rounded-2xl shadow-[0_12px_36px_-20px_rgba(26,16,51,0.35)]"
          : "rounded-3xl shadow-[0_16px_48px_-20px_rgba(98,70,234,0.35)]",
        softBackgroundClass
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-10 -top-16 rounded-full blur-3xl",
          compact ? "size-40" : "size-56",
          decorClass
        )}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 left-[8%] size-32 rounded-full bg-[#F6C85F]/20 blur-3xl"
      />
      <Sparkles
        className={cn(
          "pointer-events-none absolute right-[38%] top-5 size-5 opacity-25 hidden sm:block",
          accentClass
        )}
        aria-hidden
      />

      <div
        className={cn(
          "relative grid items-center gap-4",
          compact
            ? "px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-5 sm:px-5 md:px-6"
            : "gap-5 px-5 py-7 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6 sm:px-8 sm:py-8 lg:px-10"
        )}
      >
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex shrink-0 items-center justify-center shadow-[0_6px_18px_-8px_rgba(98,70,234,0.4)] ring-2 ring-white/70",
                compact ? "size-12 rounded-xl" : "size-[72px] rounded-2xl",
                iconContainerClass
              )}
            >
              <Icon className={compact ? "size-6" : "size-9"} aria-hidden />
            </div>

            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "inline-flex items-center gap-1.5 font-extrabold uppercase tracking-[0.16em] text-primary/90",
                  compact ? "text-[10px]" : "text-[11px] tracking-[0.2em]"
                )}
              >
                <Sparkles className={compact ? "size-3" : "size-3.5"} aria-hidden />
                {eyebrow}
              </p>
              <h1
                id="genre-browse-title"
                className={cn(
                  "font-heading font-semibold leading-tight tracking-tight text-[#1a1033]",
                  compact
                    ? "mt-0.5 text-2xl md:text-[1.85rem]"
                    : "mt-2 text-3xl sm:text-4xl lg:text-[2.65rem]"
                )}
              >
                {title}
              </h1>
            </div>
          </div>

          <p
            className={cn(
              "max-w-2xl text-[#1a1033]/72",
              compact
                ? "mt-2 line-clamp-2 text-sm leading-snug"
                : "mt-2.5 text-sm leading-relaxed sm:text-base"
            )}
          >
            {description}
          </p>

          <div
            className={cn(
              "flex flex-wrap items-center",
              compact ? "mt-3 gap-2" : "mt-5 gap-2"
            )}
          >
            {typeof novelCount === "number" && novelCount > 0 ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full font-semibold shadow-sm ring-1",
                  iconContainerClass,
                  compact ? "px-2.5 py-1 text-xs" : "px-3.5 py-2 text-sm",
                )}
              >
                <BookOpen
                  className={cn("opacity-90", compact ? "size-3.5" : "size-4")}
                  aria-hidden
                />
                {novelCount.toLocaleString()}{" "}
                {novelCount === 1 ? "title" : "titles"}
              </span>
            ) : null}

            {typeof reviewCount === "number" ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/75 font-semibold text-[#1a1033] shadow-sm backdrop-blur-sm",
                  compact ? "px-2.5 py-1 text-xs" : "px-3.5 py-2 text-sm"
                )}
              >
                <LibraryBig
                  className={cn("text-primary", compact ? "size-3.5" : "size-4")}
                  aria-hidden
                />
                {reviewCount.toLocaleString()}{" "}
                {reviewCount === 1 ? "review" : "reviews"}
              </span>
            ) : null}

            {showCommunity ? (
              <span className="inline-flex items-center rounded-full border border-[#F6C85F]/40 bg-[#F6C85F]/20 px-3.5 py-2 text-sm font-semibold text-amber-900/90">
                {communityLabel}
              </span>
            ) : null}

            {moonieHref ? (
              <AskMoonieLink
                href={moonieHref}
                size={compact ? "xs" : "sm"}
                className={cn(
                  "font-bold shadow-sm",
                  compact ? "px-2.5 py-1 text-xs" : "px-3.5 py-2 text-sm",
                )}
              />
            ) : null}
          </div>
        </div>

        <div className="flex items-end justify-between gap-3 sm:justify-end">
          {mosaic.length > 0 ? (
            <ul className="flex items-end" aria-hidden>
              {mosaic.map((cover, index) => (
                <li
                  key={cover.novelId}
                  className={cn(
                    "relative overflow-hidden rounded-lg border-2 border-white bg-[#e8dff2] shadow-[0_10px_24px_-12px_rgba(26,16,51,0.45)]",
                    compact
                      ? "h-[4.25rem] w-[3rem] sm:h-[4.75rem] sm:w-[3.35rem]"
                      : "h-24 w-[4.25rem] sm:h-28 sm:w-20",
                    index > 0 && (compact ? "-ml-2.5 sm:-ml-3" : "-ml-3 sm:-ml-4"),
                    index === 1 && "translate-y-1 rotate-[-3deg]",
                    index === 2 && "translate-y-0.5 rotate-[2deg]",
                    index === 3 && "-translate-y-0.5 rotate-[-2deg] max-[380px]:hidden"
                  )}
                  style={{ zIndex: mosaic.length - index }}
                >
                  <CoverImage
                    src={cover.coverUrl}
                    alt=""
                    title={cover.title}
                    author={cover.author}
                    themeSeed={cover.novelId}
                    sizes="80px"
                    compactFallback
                    className="object-cover"
                  />
                </li>
              ))}
            </ul>
          ) : null}

          <div
            className={cn(
              "relative shrink-0",
              compact ? "mb-[-0.35rem]" : "mb-[-0.5rem]"
            )}
          >
            <span
              aria-hidden
              className="absolute inset-x-2 bottom-1 h-3 rounded-full bg-[#1a1033]/10 blur-md"
            />
            <MoonieMascot
              size={compact ? 80 : 110}
              variant="happy"
              display="clean"
              className="mv-float-slow relative"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
