import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PolicyHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  lastUpdated?: string;
  readingMinutes?: number;
  formal?: boolean;
}

export function PolicyHero({
  eyebrow,
  title,
  description,
  icon: Icon,
  lastUpdated,
  readingMinutes,
  formal = false,
}: PolicyHeroProps) {
  return (
    <header className="relative overflow-hidden rounded-[24px] border border-violet-200/80 bg-gradient-to-br from-[#fbf9ff] via-white to-violet-50/70 px-6 py-8 sm:px-8 sm:py-9">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/45 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-6 -top-8 size-40 rounded-full bg-violet-200/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-2 right-8 flex gap-1.5 text-violet-200/80"
        aria-hidden
      >
        <span className="mt-3 size-1 rounded-full bg-violet-300/70" />
        <span className="size-1.5 rounded-full bg-violet-300/60" />
        <span className="mt-1 size-1 rounded-full bg-violet-300/50" />
      </div>

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:size-14">
          <Icon className="size-6 sm:size-7" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-violet-600 sm:text-[13px]">
            {eyebrow}
          </p>
          <h1
            className={cn(
              "mt-2 font-serif font-bold tracking-tight text-slate-950",
              formal
                ? "text-[1.875rem] leading-tight sm:text-[2.25rem] lg:text-[2.75rem]"
                : "text-[1.875rem] leading-tight sm:text-[2.5rem] lg:text-[3.25rem]"
            )}
          >
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">
            {description}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
            {lastUpdated && (
              <span>
                Last updated:{" "}
                <time dateTime="2026-07-15" className="font-medium text-slate-700">
                  {lastUpdated}
                </time>
              </span>
            )}
            {readingMinutes != null && (
              <>
                <span className="hidden text-violet-200 sm:inline" aria-hidden>
                  ·
                </span>
                <span>Estimated reading time: {readingMinutes} minutes</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
