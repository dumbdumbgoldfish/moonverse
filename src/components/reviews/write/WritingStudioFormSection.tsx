import { cn } from "@/lib/utils";

type SectionBadge = "required" | "optional" | "read-only";

const BADGE_STYLES: Record<SectionBadge, string> = {
  required:
    "border-[var(--mv-plum)]/20 bg-[var(--mv-plum)]/[0.06] text-[var(--mv-plum)]",
  optional:
    "border-[var(--mv-border)] bg-white text-[var(--mv-text-muted)]",
  "read-only":
    "border-emerald-200/80 bg-emerald-50/80 text-emerald-800",
};

const BADGE_LABELS: Record<SectionBadge, string> = {
  required: "Required",
  optional: "Optional",
  "read-only": "Read-only",
};

interface WritingStudioFormSectionProps {
  eyebrow?: string;
  title: string;
  description?: string;
  badge?: SectionBadge;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function WritingStudioFormSection({
  eyebrow,
  title,
  description,
  badge,
  children,
  className,
  bodyClassName,
}: WritingStudioFormSectionProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-[var(--mv-border)] bg-white/70 shadow-[0_8px_28px_-24px_rgba(36,22,48,0.35)]",
        className
      )}
    >
      <header className="border-b border-[var(--mv-border)]/80 px-4 py-3.5 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--mv-plum)]">
                {eyebrow}
              </p>
            ) : null}
            <h3
              className={cn(
                "font-serif text-lg font-semibold text-[var(--mv-ink)]",
                eyebrow && "mt-0.5"
              )}
            >
              {title}
            </h3>
            {description ? (
              <p className="mt-1 text-sm leading-relaxed text-[var(--mv-text-muted)]">
                {description}
              </p>
            ) : null}
          </div>
          {badge ? (
            <span
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]",
                BADGE_STYLES[badge]
              )}
            >
              {BADGE_LABELS[badge]}
            </span>
          ) : null}
        </div>
      </header>
      <div className={cn("space-y-4 px-4 py-4 sm:px-5 sm:py-5", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}
