"use client";

import { useSyncExternalStore, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { moonieLoggedInEntryHref } from "@/lib/moonie/open-moonie";
import {
  Compass,
  LayoutGrid,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  isHomeNavActive,
  isBrowseNavActive,
  isMoonieNavActive,
  isNavPending,
  normalizeNavPathname,
} from "@/lib/nav-route-active";

interface MobileBottomNavProps {
  unreadCount?: number;
  username?: string;
}

interface MobileNavItem {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
  primary?: boolean;
}

const BASE_ITEMS: MobileNavItem[] = [
  { id: "home", href: "/home", label: "Home", icon: Compass },
  { id: "browse", href: "/browse", label: "Browse", icon: LayoutGrid },
  {
    id: "moonie",
    href: moonieLoggedInEntryHref(),
    label: "Moonie",
    icon: Sparkles,
    primary: true,
  },
];

function MobileNavLink({
  href,
  active,
  pending,
  onPending,
  isMoonie,
  label,
  icon: Icon,
}: {
  href: string;
  active: boolean;
  pending?: boolean;
  onPending?: () => void;
  isMoonie: boolean;
  label: string;
  icon: LucideIcon;
}) {

  return (
    <Link
      href={href}
      className={cn(
        "relative flex flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-semibold transition-colors",
        active || pending ? "text-[#4C35C4]" : "text-[#1A1224]/55"
      )}
      aria-current={active ? "page" : undefined}
      aria-busy={pending || undefined}
      data-nav-pending={pending ? "true" : undefined}
      onClick={() => {
        if (!active) onPending?.();
      }}
    >
      <span
        className={cn(
          "relative flex size-8 items-center justify-center rounded-full",
          isMoonie && "bg-gradient-to-br from-[#6246ea]/12 to-[#f6c85f]/18",
          active && isMoonie && "bg-[#6246ea] text-white",
          pending && !active && "ring-2 ring-[#6c4dff]/35"
        )}
      >
        <Icon
          className={cn("size-5", active && isMoonie && "text-white")}
          strokeWidth={active || pending ? 2.5 : 2}
          aria-hidden
        />
      </span>
      <span className="truncate">{label}</span>
      {active || pending ? (
        <span
          className="absolute inset-x-6 bottom-1 h-0.5 rounded-full bg-gradient-to-r from-[#6c4dff] to-[#c89b4a]"
          aria-hidden
        />
      ) : null}
    </Link>
  );
}

function isActive(pathname: string, item: MobileNavItem) {
  const p = normalizeNavPathname(pathname);
  switch (item.id) {
    case "home":
      return isHomeNavActive(p);
    case "browse":
      return isBrowseNavActive(p);
    case "moonie":
      return isMoonieNavActive(p);
    default:
      return false;
  }
}

function subscribeClientHydration() {
  return () => {};
}

function getClientHydrationSnapshot() {
  return true;
}

function getServerHydrationSnapshot() {
  return false;
}

/**
 * Renders only after mount so `usePathname()` cannot mismatch SSR HTML.
 * Reserves bottom space during SSR/first paint to limit layout shift.
 */
export function MobileBottomNav({}: MobileBottomNavProps) {
  const pathname = usePathname();
  const normalizedPath = normalizeNavPathname(pathname);
  const [pendingFromPath, setPendingFromPath] = useState<{
    path: string;
    href: string;
  } | null>(null);
  const pendingHref =
    pendingFromPath?.path === normalizedPath ? pendingFromPath.href : null;
  const hydrated = useSyncExternalStore(
    subscribeClientHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot
  );

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#1A1224]/8 bg-[#FFFBFF]/96 text-night-blue backdrop-blur-xl md:hidden"
      aria-label="Mobile navigation"
    >
      <ul className="mx-auto grid h-16 max-w-lg grid-cols-3 items-stretch">
        {BASE_ITEMS.map((item) => {
          const active = hydrated && isActive(pathname, item);
          const Icon = item.icon;
          const isMoonie = Boolean(item.primary);
          const pending =
            hydrated &&
            isNavPending(
              normalizeNavPathname(pathname),
              pendingHref,
              normalizeNavPathname(item.href)
            );

          return (
            <li key={item.id} className="flex">
              <MobileNavLink
                href={item.href}
                active={active}
                pending={pending}
                onPending={() =>
                  setPendingFromPath({
                    path: normalizedPath,
                    href: normalizeNavPathname(item.href),
                  })
                }
                isMoonie={isMoonie}
                label={item.label}
                icon={Icon}
              />
            </li>
          );
        })}
      </ul>
      <div className="h-[env(safe-area-inset-bottom,0px)] bg-[#FFFBFF]" />
    </nav>
  );
}
