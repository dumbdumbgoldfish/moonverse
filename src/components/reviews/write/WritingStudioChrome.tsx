"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Soft studio atmosphere shared by write + my-reviews pages. */
export function WritingStudioBackdrop({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
      aria-hidden
    >
      <div className="absolute -left-24 top-0 size-[28rem] rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--mv-gold)_18%,transparent),transparent_68%)] blur-2xl" />
      <div className="absolute -right-16 top-10 size-[22rem] rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--mv-plum)_14%,transparent),transparent_70%)] blur-2xl" />
      <div className="absolute bottom-0 left-1/3 size-[18rem] rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--mv-glow)_40%,transparent),transparent_70%)] blur-xl" />
    </div>
  );
}

export function WritingStatChip({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex min-w-[7.5rem] flex-1 items-center gap-3 rounded-2xl border border-white/70 bg-white/80 px-3.5 py-3 shadow-[0_10px_30px_-24px_rgba(30,22,54,0.45)] backdrop-blur-sm">
      <span className="flex size-10 items-center justify-center rounded-xl bg-[#f7f3ff] text-primary ring-1 ring-violet-100">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
          {label}
        </p>
        <p className="truncate font-serif text-lg font-bold text-night-blue">
          {value}
        </p>
      </div>
    </div>
  );
}

export function WritingSectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
          {eyebrow}
        </p>
        <h2 className="mt-1 font-serif text-2xl font-bold text-night-blue">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm leading-snug text-slate-600">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
