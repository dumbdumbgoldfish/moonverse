"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Compass,
  LayoutGrid,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    href: "/moonie",
    label: "Moonie",
    icon: Sparkles,
    primary: true,
  },
];

function isActive(
  pathname: string,
  item: MobileNavItem,
  homeView: string | null
) {
  switch (item.id) {
    case "home":
      return (
        pathname === "/" ||
        pathname.startsWith("/search") ||
        (pathname.startsWith("/home") && homeView !== "community")
      );
    case "browse":
      return pathname.startsWith("/browse");
    case "moonie":
      return pathname.startsWith("/moonie") || pathname.startsWith("/ask-moonie");
    default:
      return false;
  }
}

/**
 * Renders only after mount so `usePathname()` cannot mismatch SSR HTML.
 * Reserves bottom space during SSR/first paint to limit layout shift.
 */
export function MobileBottomNav({}: MobileBottomNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const homeView = searchParams.get("view");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!mounted) {
    return (
      <div
        className="h-[calc(4rem+env(safe-area-inset-bottom,0px))] md:hidden"
        aria-hidden
      />
    );
  }

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
          const active = isActive(pathname, item, homeView);
          const Icon = item.icon;
          const isMoonie = Boolean(item.primary);

          return (
            <li key={item.id} className="flex">
              <Link
                href={item.href}
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-semibold transition-colors",
                  active ? "text-[#4C35C4]" : "text-[#1A1224]/55"
                )}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={cn(
                    "relative flex size-8 items-center justify-center rounded-full",
                    isMoonie &&
                      "bg-gradient-to-br from-[#6246ea]/12 to-[#f6c85f]/18",
                    active && isMoonie && "bg-[#6246ea] text-white"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-5",
                      active && isMoonie && "text-white"
                    )}
                    strokeWidth={active ? 2.5 : 2}
                    aria-hidden
                  />
                </span>
                <span className="truncate">{item.label}</span>
                {active ? (
                  <span
                    className="absolute inset-x-6 bottom-1 h-0.5 rounded-full bg-gradient-to-r from-[#6c4dff] to-[#c89b4a]"
                    aria-hidden
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="h-[env(safe-area-inset-bottom,0px)] bg-[#FFFBFF]" />
    </nav>
  );
}
