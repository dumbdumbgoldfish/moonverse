"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  FolderOpen,
  Hash,
  LayoutDashboard,
  MessageSquare,
  Bell,
  Settings,
  Tags,
  Users,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: FileText },
  { href: "/admin/comments", label: "Comments", icon: MessageSquare },
  { href: "/admin/novels", label: "Novels", icon: BookOpen },
  { href: "/admin/genres", label: "Genres", icon: Tags },
  { href: "/admin/tags", label: "Tags", icon: Hash },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/settings", label: "System", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 border-b border-border/60 bg-white lg:w-56 lg:border-b-0 lg:border-r">
      <div className="px-4 py-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Admin
        </p>
        <p className="mt-1 text-sm font-medium">MoonVerse</p>
      </div>
      <nav aria-label="Admin navigation" className="px-2 pb-4 lg:pb-6">
        <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {navItems.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <li key={item.href} className="shrink-0 lg:shrink">
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    active
                      ? "bg-primary/15 font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon size={16} aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="hidden border-t border-border/60 px-4 py-4 lg:block">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
        >
          <FolderOpen size={14} aria-hidden="true" />
          Back to site
        </Link>
      </div>
    </aside>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col lg:flex-row">
      <AdminSidebar />
      <div className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
