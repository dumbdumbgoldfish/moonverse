import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface WritingStudioStepPanelProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  stepNumber?: number;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function WritingStudioStepPanel({
  icon: Icon,
  title,
  description,
  stepNumber,
  children,
  className,
  bodyClassName,
}: WritingStudioStepPanelProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-[var(--mv-border)] bg-white shadow-[var(--mv-card-shadow)]",
        className
      )}
    >
      <header className="relative border-b border-[var(--mv-border)] bg-[linear-gradient(135deg,var(--mv-surface-soft)_0%,#ffffff_55%,var(--mv-paper)_100%)] px-5 py-4 sm:px-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--mv-gold)]/45 to-transparent"
        />
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--mv-plum)] shadow-sm ring-1 ring-[var(--mv-border)]">
            <Icon className="size-4" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            {stepNumber ? (
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--mv-plum)]">
                Step {stepNumber} of 3
              </p>
            ) : null}
            <h2
              className={cn(
                "font-serif text-xl font-semibold text-[var(--mv-ink)] sm:text-[1.35rem]",
                stepNumber && "mt-0.5"
              )}
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm leading-relaxed text-[var(--mv-text-muted)]">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </header>
      <div className={cn("space-y-5 px-5 py-5 sm:px-6 sm:py-6", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}
