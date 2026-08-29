import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  Beaker,
  Gamepad2,
  Heart,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface BrowseLabPreset {
  id: string;
  title: string;
  blurb: string;
  href: string;
}

interface BrowseLabPresetsProps {
  presets: BrowseLabPreset[];
  className?: string;
}

const PRESET_VISUALS: Record<
  string,
  { icon: LucideIcon; gradient: string; softBg: string; iconClass: string }
> = {
  "romance-etl": {
    icon: Heart,
    gradient: "from-pink-400 to-rose-500",
    softBg: "from-rose-50 via-white to-pink-50/80",
    iconClass: "bg-rose-100 text-rose-600 ring-rose-200/70",
  },
  "fantasy-official": {
    icon: ShieldCheck,
    gradient: "from-violet-500 to-purple-600",
    softBg: "from-violet-50 via-white to-indigo-50/70",
    iconClass: "bg-violet-100 text-violet-700 ring-violet-200/70",
  },
  "litrpg-fresh": {
    icon: Gamepad2,
    gradient: "from-blue-500 to-indigo-600",
    softBg: "from-blue-50 via-white to-indigo-50/70",
    iconClass: "bg-blue-100 text-blue-700 ring-blue-200/70",
  },
};

const DEFAULT_VISUAL = {
  icon: Sparkles,
  gradient: "from-[#6b4bb5] to-[#1a1033]",
  softBg: "from-[#f4ecf8] via-white to-[#faf5ff]",
  iconClass: "bg-[#f4ecf8] text-[#6b4bb5] ring-violet-200/70",
};

export function BrowseLabPresets({
  presets,
  className,
}: BrowseLabPresetsProps) {
  if (presets.length === 0) return null;

  return (
    <section className={cn(className)} aria-labelledby="browse-lab-heading">
      <div>
        <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b4bb5]">
          <Beaker className="size-3.5" aria-hidden />
          Lab presets
        </p>
        <h2
          id="browse-lab-heading"
          className="mt-1 font-heading text-xl font-semibold text-[#1a1033]"
        >
          Curated facet mixes
        </h2>
      </div>

      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {presets.map((preset) => {
          const visual = PRESET_VISUALS[preset.id] ?? DEFAULT_VISUAL;
          const Icon = visual.icon;

          return (
            <li key={preset.id}>
              <Link
                href={preset.href}
                className={cn(
                  "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#1a1033]/10 bg-gradient-to-br px-4 py-3.5",
                  visual.softBg,
                  "transition-[transform,border-color,box-shadow] duration-300",
                  "hover:-translate-y-0.5 hover:border-[#6b4bb5]/30 hover:shadow-[0_16px_40px_-24px_rgba(26,16,51,0.35)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b4bb5]",
                  "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
                )}
              >
                <div
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-gradient-to-br opacity-20 blur-2xl",
                    visual.gradient,
                  )}
                />

                <div className="relative flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl ring-1",
                      visual.iconClass,
                    )}
                  >
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <ArrowUpRight
                    className="size-4 shrink-0 text-[#6b4bb5]/50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#6b4bb5]"
                    aria-hidden
                  />
                </div>

                <span className="relative mt-3 text-sm font-bold text-[#1a1033]">
                  {preset.title}
                </span>
                <span className="relative mt-1 text-xs leading-snug text-[#5a4d72]">
                  {preset.blurb}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
