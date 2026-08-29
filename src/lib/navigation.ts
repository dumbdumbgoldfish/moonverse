import type { LucideIcon } from "lucide-react";
import { LayoutGrid, MessagesSquare, Newspaper, PenLine, Sparkles, User } from "lucide-react";

export interface MainNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
  /** Center tab styling (Moonie) */
  primary?: boolean;
}

export const AUTHENTICATED_NAV: MainNavItem[] = [
  {
    href: "/community",
    label: "Community",
    icon: MessagesSquare,
    match: (p) => p.startsWith("/community"),
  },
  {
    href: "/discover",
    label: "Discover",
    icon: Newspaper,
    match: (p) =>
      p === "/discover" || p === "/reviews" || /^\/reviews\/[^/]+$/.test(p),
  },
  {
    href: "/browse",
    label: "Browse",
    icon: LayoutGrid,
    match: (p) => p.startsWith("/browse"),
  },
  {
    href: "/moonie",
    label: "Moonie",
    icon: Sparkles,
    match: (p) => p.startsWith("/moonie") || p.startsWith("/ask-moonie"),
    primary: true,
  },
  {
    href: "/folders",
    label: "Library",
    icon: PenLine,
    match: (p) => p.startsWith("/folders") || p.startsWith("/lists"),
  },
];

export function profileNavItem(username?: string): MainNavItem {
  const href = username ? `/users/${username}` : "/login";
  return {
    href,
    label: "You",
    icon: User,
    match: (p) => (username ? p.startsWith(`/users/${username}`) : false),
  };
}

export const DESKTOP_AUTH_NAV = [
  { href: "/community", label: "Community" },
  { href: "/discover", label: "Discover" },
  { href: "/browse", label: "Browse" },
  { href: "/folders", label: "My Library" },
] as const;
