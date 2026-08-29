import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ADMIN_CARD_CLASS,
  ADMIN_CARD_GLOW_CLASS,
  ADMIN_FILTER_CHIP_ACTIVE,
  ADMIN_FILTER_CHIP_BASE,
  ADMIN_FILTER_CHIP_IDLE,
  ADMIN_FILTER_CHIP_ROW_CLASS,
  ADMIN_FORM_CARD_CLASS,
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
    <div className={cn(ADMIN_CARD_CLASS, "border-dashed border-[#f9db7e]/25 px-6 py-12 text-center")}>
      <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-white/[0.06] text-[#f9db7e] ring-1 ring-[#f9db7e]/25">
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
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#fce9a8]">
          MoonVerse Admin
        </p>
        <h1 className="font-serif text-xl font-medium tracking-tight text-white sm:text-[1.45rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#ede9fe]">{description}</p>
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
        <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#fce9a8]">{title}</h2>
        {description ? <p className="mt-0.5 text-[11px] text-[#ede9fe]">{description}</p> : null}
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
    <div className={cn(ADMIN_FILTER_CHIP_ROW_CLASS, className)}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={cn(
            ADMIN_FILTER_CHIP_BASE,
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
    <div className="mb-4 rounded-xl border border-[#f9db7e]/25 bg-white/[0.04] p-3.5 sm:p-4">
      <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-[#fde68a]">{title}</h2>
      <div className="mt-2.5">{children}</div>
    </div>
  );
}

export function AdminAttentionLink({ href, count, label }: { href: string; count: number; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-1 text-xs ring-1 ring-[#f9db7e]/25 transition hover:bg-white/[0.12]"
    >
      <span className="font-semibold tabular-nums text-[#fde68a]">{count}</span>
      <span className="text-white/95">{label}</span>
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
          <Link href={footerHref} className="inline-flex items-center gap-1 text-xs font-semibold text-[#f9db7e] hover:underline">
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
          <p className="truncate font-medium text-white group-hover:text-white">{title}</p>
          <p className={cn("mt-0.5 line-clamp-1 text-xs", ADMIN_SURFACE_MUTED)}>{meta}</p>
        </span>
        <ChevronRight size={16} className="shrink-0 text-[#f9db7e]/45 transition group-hover:translate-x-0.5 group-hover:text-[#f9db7e]" aria-hidden />
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

export function AdminPagination({
  page,
  totalPages,
  total,
  basePath,
  params,
  className,
}: {
  page: number;
  totalPages: number;
  total: number;
  basePath: string;
  params?: Record<string, string | undefined>;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(nextPage: number) {
    const search = new URLSearchParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value) search.set(key, value);
      }
    }
    if (nextPage > 1) search.set("page", String(nextPage));
    const qs = search.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <div className={cn("mt-4 flex flex-wrap items-center justify-between gap-3", className)}>
      <p className="text-xs text-white/55">
        {total.toLocaleString()} total · page {page} of {totalPages}
      </p>
      <div className="flex flex-wrap gap-2">
        {page > 1 ? (
          <Link
            href={hrefFor(page - 1)}
            className={cn(ADMIN_FILTER_CHIP_BASE, ADMIN_FILTER_CHIP_IDLE, "px-3 py-1.5 text-xs")}
          >
            Previous
          </Link>
        ) : null}
        {page < totalPages ? (
          <Link
            href={hrefFor(page + 1)}
            className={cn(ADMIN_FILTER_CHIP_BASE, ADMIN_FILTER_CHIP_IDLE, "px-3 py-1.5 text-xs")}
          >
            Next
          </Link>
        ) : null}
      </div>
    </div>
  );
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
    "from-[#f9db7e]/14 to-transparent",
    "from-[#5B9FD4]/12 to-transparent",
    "from-[#4FAF8C]/10 to-transparent",
  ] as const;
  const accent = accents[accentIndex % accents.length];

  return (
    <Link href={href} className={cn(ADMIN_CARD_CLASS, ADMIN_CARD_GLOW_CLASS, "group relative flex items-start gap-3 overflow-hidden p-3.5 transition hover:border-[#f9db7e]/30")}>
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80", accent)} aria-hidden />
      <span className="relative flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.08] text-[#e6d2a3] shadow-sm ring-1 ring-[#f9db7e]/20">
        <Icon size={16} aria-hidden />
      </span>
      <span className="relative min-w-0">
        <span className="block text-sm font-semibold text-white group-hover:text-[#e6d2a3]">{label}</span>
        <span className={cn("mt-0.5 block text-[11px] leading-relaxed", ADMIN_SURFACE_MUTED)}>{description}</span>
      </span>
    </Link>
  );
}
