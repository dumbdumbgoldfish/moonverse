import type { LucideIcon } from "lucide-react";
import { BookHeart, BookOpen, Heart, LibraryBig, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface GenreHeroProps {
  eyebrow?: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accentClass: string;
  softBackgroundClass: string;
  iconContainerClass: string;
  decorClass: string;
  reviewCount: number;
  novelCount?: number;
}

const ROMANCE_ORNAMENTS = [Heart, Sparkles, BookHeart] as const;

export function GenreHero({
  eyebrow = "Browse by genre",
  title,
  description,
  icon: Icon,
  accentClass,
  softBackgroundClass,
  iconContainerClass,
  decorClass,
  reviewCount,
  novelCount,
}: GenreHeroProps) {
  const isRomance = title.toLowerCase().includes("romance");
  const ornaments = isRomance ? ROMANCE_ORNAMENTS : [Sparkles, Icon];

  return (
    <section
      aria-labelledby="genre-browse-title"
      className={cn(
        "relative overflow-hidden rounded-[24px] border border-violet-100/90",
        "shadow-[0_12px_40px_-18px_rgba(98,70,234,0.28)]",
        softBackgroundClass
      )}
    >
      {/* Layered soft shapes */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-12 -top-14 size-48 rounded-full blur-3xl",
          decorClass
        )}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 left-[18%] size-32 rounded-full bg-primary/10 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[28%] top-1/2 size-20 -translate-y-1/2 rounded-full bg-white/50 blur-xl"
      />

      {/* Decorative Lucide ornaments */}
      {ornaments.map((Ornament, index) => {
        const positions = [
          "right-8 top-7 size-6 opacity-25",
          "right-24 top-14 size-5 opacity-20 hidden sm:block",
          "right-14 bottom-8 size-7 opacity-20 hidden md:block",
        ];
        return (
          <Ornament
            key={index}
            className={cn(
              "pointer-events-none absolute",
              positions[index] ?? "right-8 top-7 size-5 opacity-20",
              accentClass
            )}
            aria-hidden
          />
        );
      })}

      <div className="relative flex min-h-[200px] items-center gap-5 px-5 py-6 sm:min-h-[220px] sm:gap-6 sm:px-7 sm:py-7 lg:min-h-[240px] lg:px-8">
        <div
          className={cn(
            "flex size-16 shrink-0 items-center justify-center rounded-[20px] shadow-[0_8px_24px_-8px_rgba(98,70,234,0.35)] ring-2 sm:size-[60px] lg:size-16",
            iconContainerClass
          )}
        >
          <Icon className="size-8 sm:size-9" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-primary/85">
            <Sparkles className="size-3.5" aria-hidden />
            {eyebrow}
          </p>
          <h1
            id="genre-browse-title"
            className={cn(
              "mt-1.5 text-[1.75rem] font-extrabold leading-tight tracking-tight text-[#1a1033] sm:text-4xl lg:text-[2.5rem]",
              accentClass
            )}
          >
            {title}
          </h1>
          <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-relaxed text-[#1a1033]/75 sm:line-clamp-none sm:text-base">
            {description}
          </p>

          <dl className="mt-4 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-sm shadow-sm ring-1 ring-violet-100/80 backdrop-blur-sm">
              <dt className="sr-only">Review count</dt>
              <dd className="inline-flex items-center gap-1.5 font-bold text-[#1a1033]">
                <LibraryBig className="size-4 text-primary" aria-hidden />
                <span>
                  {reviewCount.toLocaleString()}{" "}
                  {reviewCount === 1 ? "review" : "reviews"}
                </span>
              </dd>
            </div>
            {typeof novelCount === "number" && novelCount > 0 && (
              <div className="inline-flex items-center gap-2 rounded-full bg-white/60 px-3 py-1.5 text-sm ring-1 ring-violet-100/70 backdrop-blur-sm">
                <dt className="sr-only">Novel count</dt>
                <dd className="inline-flex items-center gap-1.5 font-semibold text-[#1a1033]/75">
                  <BookOpen className="size-4 text-primary/80" aria-hidden />
                  {novelCount.toLocaleString()}{" "}
                  {novelCount === 1 ? "novel" : "novels"}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </section>
  );
}
