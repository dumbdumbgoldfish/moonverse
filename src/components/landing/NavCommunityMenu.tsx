import Link from "next/link";
import { Users } from "lucide-react";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import {
  COMMUNITY_MENU_EXTRA,
  COMMUNITY_MENU_GROUPS,
  COMMUNITY_MENU_HELP,
  type CommunityMenuItem,
} from "@/lib/community-menu";
import { cn } from "@/lib/utils";

interface NavCommunityMenuProps {
  layout?: "mega" | "mobile";
  onNavigate?: () => void;
  className?: string;
}

function CommunityMenuItemLink({
  item,
  onNavigate,
  compact,
}: {
  item: CommunityMenuItem;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      role="menuitem"
      onClick={onNavigate}
      className={cn(
        "group flex items-start transition-colors duration-150",
        "hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "motion-reduce:transition-none",
        compact
          ? "gap-2 rounded-lg p-1.5"
          : "gap-2.5 rounded-xl p-2"
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700",
          "transition-colors duration-150 group-hover:bg-violet-200/80 group-hover:text-violet-800",
          compact ? "size-7" : "size-8"
        )}
      >
        <Icon className={cn(compact ? "size-3.5" : "size-4")} aria-hidden />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "font-semibold leading-snug text-slate-950",
            compact ? "text-xs" : "text-sm"
          )}
        >
          {item.label}
        </p>
        <p
          className={cn(
            "text-slate-600",
            compact ? "mt-0.5 text-[11px] leading-4" : "mt-0.5 text-xs leading-4"
          )}
        >
          {item.description}
        </p>
      </div>
    </Link>
  );
}

function CommunityMenuSection({
  group,
  onNavigate,
}: {
  group: (typeof COMMUNITY_MENU_GROUPS)[number];
  onNavigate?: () => void;
}) {
  const SectionIcon = group.sectionIcon;

  return (
    <section aria-labelledby={`community-section-${group.id}`}>
      <div className="mb-1.5 flex items-center gap-1.5">
        <div className="flex size-6 items-center justify-center rounded-md bg-violet-100/80 text-violet-700">
          <SectionIcon className="size-3" aria-hidden />
        </div>
        <p
          id={`community-section-${group.id}`}
          className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet-600"
        >
          {group.label}
        </p>
      </div>
      <div className="space-y-0">
        {group.items.map((item) => (
          <CommunityMenuItemLink key={item.href + item.label} item={item} onNavigate={onNavigate} />
        ))}
      </div>
    </section>
  );
}

function CommunityMenuHelpCard({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="border-t border-violet-100 bg-gradient-to-r from-violet-50/80 to-white px-4 py-3 sm:px-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-950 sm:text-sm">Need help?</p>
          <p className="mt-0.5 text-xs text-slate-600">
            Visit the Help Centre or report a concern.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          <Link
            href={COMMUNITY_MENU_HELP.helpHref}
            role="menuitem"
            onClick={onNavigate}
            className={cn(
              "mv-nav-signup inline-flex h-9 min-h-[36px] items-center justify-center rounded-full border-0 px-3 text-xs font-semibold text-white sm:text-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C36A] focus-visible:ring-offset-2"
            )}
          >
            Help Centre
          </Link>
          <Link
            href={COMMUNITY_MENU_HELP.reportHref}
            role="menuitem"
            onClick={onNavigate}
            className={cn(
              "inline-flex h-9 min-h-[36px] items-center justify-center rounded-lg border border-violet-200 bg-white px-3 text-xs font-semibold text-violet-700 sm:text-sm",
              "transition hover:border-violet-300 hover:bg-violet-50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            )}
          >
            Report an Issue
          </Link>
        </div>
      </div>
    </div>
  );
}

export function NavCommunityMenu({
  layout = "mega",
  onNavigate,
  className,
}: NavCommunityMenuProps) {
  if (layout === "mobile") {
    return (
      <div className={cn("space-y-4", className)}>
        {COMMUNITY_MENU_GROUPS.map((group) => (
          <CommunityMenuSection key={group.id} group={group} onNavigate={onNavigate} />
        ))}
        <section>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-violet-600">
            More
          </p>
          <div className="space-y-0">
            {COMMUNITY_MENU_EXTRA.map((item) => (
              <CommunityMenuItemLink key={item.href} item={item} onNavigate={onNavigate} compact />
            ))}
          </div>
        </section>
        <CommunityMenuHelpCard onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mv-community-menu relative flex w-[min(calc(100vw-2rem),680px)] max-h-[min(32rem,calc(100vh-var(--mv-nav-h)-1rem),70vh)] flex-col overflow-hidden rounded-[20px]",
        "border border-violet-200 bg-white shadow-[0_24px_70px_rgba(76,29,149,0.16)]",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent"
        aria-hidden
      />

      <div className="shrink-0 border-b border-violet-100 bg-gradient-to-r from-violet-50 to-white px-4 py-2.5 sm:px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            <Users className="size-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold leading-tight text-slate-950">
              Community at MoonVerse
            </h3>
            <p className="text-xs leading-snug text-slate-600">
              Everything you need to participate safely and respectfully.
            </p>
          </div>
          <div className="hidden shrink-0 sm:block" aria-hidden>
            <MoonieMascot size={28} variant="happy" display="clean" lightweight />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="grid gap-3 p-3 sm:grid-cols-2 sm:gap-4 sm:p-4">
          {COMMUNITY_MENU_GROUPS.map((group) => (
            <CommunityMenuSection key={group.id} group={group} onNavigate={onNavigate} />
          ))}
        </div>

        <div className="border-t border-violet-100 px-4 py-2.5 sm:px-5">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-violet-600">
            More policies
          </p>
          <div className="grid gap-0 sm:grid-cols-2">
            {COMMUNITY_MENU_EXTRA.map((item) => (
              <CommunityMenuItemLink key={item.href} item={item} onNavigate={onNavigate} compact />
            ))}
          </div>
        </div>

        <CommunityMenuHelpCard onNavigate={onNavigate} />
      </div>
    </div>
  );
}
