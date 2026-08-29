"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  BookOpen,
  ExternalLink,
  FileText,
  Flag,
  Hash,
  Inbox,
  LayoutDashboard,
  Link2,
  LogOut,
  MessageSquare,
  ScrollText,
  Settings,
  Sparkles,
  Tags,
  Users,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import {
  ADMIN_MAIN_CLASS,
  ADMIN_NAV_LINK_ACTIVE,
  ADMIN_NAV_LINK_IDLE,
  ADMIN_CHROME_HEADER_CLASS,
  ADMIN_PAGE_BODY_CLASS,
  ADMIN_PAGE_CLASS,
  ADMIN_ROOT_CLASS,
  ADMIN_SCROLL_CLASS,
  ADMIN_SIDEBAR_CLASS,
  ADMIN_TOPBAR_CLASS,
} from "@/components/admin/admin-styles";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/admin/inbox", label: "Moderation queue", icon: Inbox },
    ],
  },
  {
    label: "Moderation",
    items: [
      { href: "/admin/reports", label: "Reports", icon: Flag },
      { href: "/admin/reviews", label: "Reviews", icon: FileText },
      { href: "/admin/comments", label: "Comments", icon: MessageSquare },
    ],
  },
  {
    label: "Catalogue",
    items: [
      { href: "/admin/novels", label: "Novels", icon: BookOpen },
      { href: "/admin/genres", label: "Genres", icon: Tags },
      { href: "/admin/tags", label: "Tags", icon: Hash },
      { href: "/admin/reading-links", label: "Reading links", icon: Link2 },
      { href: "/admin/featured", label: "Featured", icon: Sparkles },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/notifications", label: "Announcements", icon: Bell },
      { href: "/admin/audit", label: "Audit log", icon: ScrollText },
      { href: "/admin/settings", label: "System", icon: Settings },
    ],
  },
];

const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

function isActive(pathname: string, item: NavItem) {
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function currentNavItem(pathname: string): NavItem {
  return (
    ALL_NAV_ITEMS.find((item) => isActive(pathname, item)) ?? ALL_NAV_ITEMS[0]
  );
}

function AdminNavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition duration-150",
        active ? ADMIN_NAV_LINK_ACTIVE : ADMIN_NAV_LINK_IDLE
      )}
    >
      <Icon size={15} aria-hidden className="shrink-0 opacity-90" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function AdminSidebar({ pathname }: { pathname: string }) {
  return (
    <aside className={cn(ADMIN_SIDEBAR_CLASS, "hidden lg:flex")}>
      <div className={cn(ADMIN_CHROME_HEADER_CLASS, "justify-center px-3")}>
        <BrandLogo
          href="/admin"
          size="sm"
          showWordmark
          showTagline={false}
          mark="none"
          variant="inverse"
          className="min-w-0 max-w-none justify-center"
        />
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#fde68a]">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <AdminNavLink key={item.href} item={item} pathname={pathname} />
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/[0.06] p-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-medium text-white/88 transition hover:bg-white/[0.05] hover:text-white"
        >
          <ExternalLink size={14} aria-hidden />
          View public site
        </Link>
      </div>
    </aside>
  );
}

function AdminTopBar({
  pathname,
  session,
}: {
  pathname: string;
  session: Session;
}) {
  const router = useRouter();
  const current = currentNavItem(pathname);
  const displayName = session.user.name ?? session.user.username ?? "Admin";

  return (
    <header className={ADMIN_TOPBAR_CLASS}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="lg:hidden">
          <div className="flex min-w-0 flex-col">
            <BrandLogo
              href="/admin"
              size="sm"
              showWordmark
              showTagline={false}
              mark="none"
              variant="inverse"
              className="min-w-0 max-w-[9.5rem]"
            />
            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[#f9db7e]">
              Admin
            </p>
          </div>
        </div>
        <div className="lg:hidden">
          <label htmlFor="admin-mobile-nav" className="sr-only">
            Jump to admin section
          </label>
          <select
            id="admin-mobile-nav"
            value={current.href}
            onChange={(event) => router.push(event.target.value)}
            className="max-w-[9.5rem] rounded-lg border border-white/10 bg-white/[0.06] px-2 py-1.5 text-xs font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f9db7e]/45 sm:max-w-[11rem]"
          >
            {NAV_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.items.map((item) => (
                  <option key={item.href} value={item.href}>
                    {item.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden text-right sm:block">
          <p className="max-w-[12rem] truncate text-sm font-bold tracking-tight text-[#fefce8]">
            {displayName}
          </p>
          <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#f9db7e]">
            Administrator
          </p>
        </div>
        <button
          type="button"
          onClick={() => void signOut({ callbackUrl: "/login" })}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-1.5 text-xs font-medium text-white/95 transition hover:border-[#f9db7e]/35 hover:bg-white/[0.1] hover:text-white"
        >
          <LogOut size={14} aria-hidden />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}

export function AdminShell({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session;
}) {
  const pathname = usePathname();

  return (
    <div className={ADMIN_ROOT_CLASS}>
      <AdminSidebar pathname={pathname} />
      <div className={ADMIN_MAIN_CLASS}>
        <AdminTopBar pathname={pathname} session={session} />
        <div className={ADMIN_SCROLL_CLASS}>
          <div className={ADMIN_PAGE_CLASS}>
            <div className={ADMIN_PAGE_BODY_CLASS}>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
