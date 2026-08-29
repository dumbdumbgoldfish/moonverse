import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ADMIN_CARD_CLASS,
  ADMIN_CARD_GLOW_CLASS,
  ADMIN_FILTER_CHIP_ACTIVE,
  ADMIN_FILTER_CHIP_IDLE,
  ADMIN_FORM_CARD_CLASS,
  ADMIN_ICON_SHELL,
  ADMIN_STAT_TONE_STYLES,
  ADMIN_SURFACE_LABEL,
  ADMIN_SURFACE_MUTED,
  ADMIN_TABLE_ACCENT_CLASS,
  ADMIN_TABLE_BODY_ROW_CLASS,
  ADMIN_TABLE_CELL_CLASS,
  ADMIN_TABLE_HEAD_CELL_CLASS,
  ADMIN_TABLE_HEAD_ROW_CLASS,
  ADMIN_TABLE_SHELL_CLASS,
  type AdminStatTone,
} from "@/components/admin/admin-styles";

export {
  ADMIN_BTN_GOLD,
  ADMIN_BTN_SECONDARY,
  ADMIN_CARD_CLASS,
  ADMIN_FORM_CARD_CLASS,
  ADMIN_TABLE_SHELL_CLASS,
} from "@/components/admin/admin-styles";

interface AdminStatCardProps {
  label: string;
  value: number | string;
  hint?: string;
  icon?: LucideIcon;
  tone?: AdminStatTone;
  className?: string;
}

export function AdminStatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "plum",
  className,
}: AdminStatCardProps) {
  const display = typeof value === "number" ? value.toLocaleString() : value;
  const toneStyle = ADMIN_STAT_TONE_STYLES[tone];

  return (
    <div
      className={cn(
        ADMIN_CARD_CLASS,
        ADMIN_CARD_GLOW_CLASS,
        "bg-gradient-to-br p-3.5 ring-1",
        toneStyle.shell,
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={ADMIN_SURFACE_LABEL}>
          {label}
        </p>
        {Icon ? (
          <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg ring-1", toneStyle.icon)}>
            <Icon size={14} aria-hidden />
          </span>
        ) : null}
      </div>
      <p className={cn("mt-2 font-serif text-2xl font-medium leading-none tracking-tight", toneStyle.value)}>
        {display}
      </p>
      {hint ? <p className={cn("mt-1.5 text-[11px] leading-relaxed", ADMIN_SURFACE_MUTED)}>{hint}</p> : null}
    </div>
  );
}

export function AdminEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className={cn(ADMIN_CARD_CLASS, "border-dashed border-[#c89b4a]/25 px-6 py-12 text-center")}>
      <span className={cn("mx-auto flex size-12 items-center justify-center rounded-xl ring-1", ADMIN_ICON_SHELL)}>
        <Sparkles size={20} aria-hidden />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-white">{title}</h3>
      <p className={cn("mx-auto mt-1.5 max-w-sm text-xs leading-relaxed", ADMIN_SURFACE_MUTED)}>{description}</p>
    </div>
  );
}

export function AdminPageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-4 flex shrink-0 flex-col gap-3 border-b border-white/[0.08] pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#fcd34d]">
          MoonVerse Admin
        </p>
        <h1 className="font-serif text-xl font-medium tracking-tight text-white sm:text-[1.45rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/90">{description}</p>
        ) : null}
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </header>
  );
}

export function AdminSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#fcd34d]">{title}</h2>
        {description ? <p className="mt-0.5 text-[11px] text-white/90">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function AdminPanel({
  children,
  className,
  padding = true,
}: {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <div className={cn(ADMIN_CARD_CLASS, ADMIN_CARD_GLOW_CLASS, padding && "p-4", className)}>
      {children}
    </div>
  );
}

export function AdminContentPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function AdminFormCard({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(ADMIN_FORM_CARD_CLASS, ADMIN_CARD_GLOW_CLASS, className)}>
      {title ? (
        <div>
          <h2 className="font-serif text-base font-medium text-white">{title}</h2>
          {description ? <p className={cn("mt-0.5 text-xs leading-relaxed", ADMIN_SURFACE_MUTED)}>{description}</p> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function AdminToolbar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-4 flex flex-col gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between", className)}>
      {children}
    </div>
  );
}

export function AdminFilterChips({
  items,
  className,
}: {
  items: Array<{ href: string; label: string; active: boolean }>;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={cn(
            "rounded-full px-3 py-1 text-[11px] font-semibold transition duration-150",
            item.active ? ADMIN_FILTER_CHIP_ACTIVE : ADMIN_FILTER_CHIP_IDLE
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

export function AdminAttentionBanner({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded-xl border border-[#c89b4a]/25 bg-white/[0.04] p-3.5 sm:p-4">
      <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-[#fcd34d]">{title}</h2>
      <div className="mt-2.5">{children}</div>
    </div>
  );
}

export function AdminAttentionLink({ href, count, label }: { href: string; count: number; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-1 text-xs ring-1 ring-[#c89b4a]/25 transition hover:bg-white/[0.12]"
    >
      <span className="font-semibold tabular-nums text-[#fcd34d]">{count}</span>
      <span className="text-white">{label}</span>
    </Link>
  );
}

export function AdminListPanel({
  title,
  children,
  footerHref,
  footerLabel,
}: {
  title: string;
  children: React.ReactNode;
  footerHref?: string;
  footerLabel?: string;
}) {
  return (
    <div className={cn(ADMIN_CARD_CLASS, ADMIN_CARD_GLOW_CLASS)}>
      <div className="border-b border-white/10 bg-white/[0.04] px-4 py-3">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <ul className="divide-y divide-white/[0.06]">{children}</ul>
      {footerHref && footerLabel ? (
        <div className="border-t border-white/10 bg-white/[0.04] px-4 py-2.5">
          <Link href={footerHref} className="inline-flex items-center gap-1 text-xs font-semibold text-[#fcd34d] hover:underline">
            {footerLabel}
            <ChevronRight size={14} aria-hidden />
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function AdminListItem({ href, title, meta }: { href: string; title: string; meta: string }) {
  return (
    <li>
      <Link href={href} className="group flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-white/[0.04]">
        <span className="min-w-0">
          <p className="truncate font-medium text-white">{title}</p>
          <p className={cn("mt-0.5 line-clamp-1 text-xs", ADMIN_SURFACE_MUTED)}>{meta}</p>
        </span>
        <ChevronRight size={16} className="shrink-0 transition group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </li>
  );
}

export function AdminTableShell({ children, minWidth = "720px", className, scrollable = true }: { children: React.ReactNode; minWidth?: string; className?: string; scrollable?: boolean }) {
  return (
    <div
      className={cn(
        ADMIN_TABLE_SHELL_CLASS,
        ADMIN_TABLE_ACCENT_CLASS,
        scrollable && "max-h-[calc(100dvh-14rem)] overflow-auto",
        className
      )}
    >
      <table className="w-full text-left" style={{ minWidth }}>{children}</table>
    </div>
  );
}

export function AdminTableHead({ children }: { children: React.ReactNode }) {
  return <thead className={ADMIN_TABLE_HEAD_ROW_CLASS}>{children}</thead>;
}

export function AdminTableTh({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn(ADMIN_TABLE_HEAD_CELL_CLASS, className)} scope="col">{children}</th>;
}

export function AdminTableRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tr className={cn(ADMIN_TABLE_BODY_ROW_CLASS, className)}>{children}</tr>;
}

export function AdminTableCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn(ADMIN_TABLE_CELL_CLASS, className)}>{children}</td>;
}

export function AdminQuickAction({
  href,
  label,
  description,
  icon: Icon,
  accentIndex = 0,
}: {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  accentIndex?: number;
}) {
  const accents = [
    "from-[#6e46c7]/16 to-transparent",
    "from-[#C89B4A]/14 to-transparent",
    "from-[#5B9FD4]/12 to-transparent",
    "from-[#4FAF8C]/10 to-transparent",
  ] as const;
  const accent = accents[accentIndex % accents.length];

  return (
    <Link href={href} className={cn(ADMIN_CARD_CLASS, ADMIN_CARD_GLOW_CLASS, "group relative flex items-start gap-3 overflow-hidden p-3.5 transition hover:border-[#c89b4a]/30")}>
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80", accent)} aria-hidden />
      <span className={cn("relative flex size-9 shrink-0 items-center justify-center rounded-lg shadow-sm", ADMIN_ICON_SHELL)}>
        <Icon size={16} aria-hidden />
      </span>
      <span className="relative min-w-0">
        <span className="block text-sm font-semibold text-white">{label}</span>
        <span className={cn("mt-0.5 block text-[11px] leading-relaxed", ADMIN_SURFACE_MUTED)}>{description}</span>
      </span>
    </Link>
  );
}
