import Link from "next/link";
import { UserRole } from "@prisma/client";
import type { Session } from "next-auth";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { NavbarUserMenu } from "@/components/layout/NavbarUserMenu";
import type { NotificationItem } from "@/types/notification";

const publicNavLinks = [
  { href: "/reviews", label: "Reviews" },
  { href: "/about", label: "About" },
];

const authenticatedNavLinks = [
  { href: "/reviews", label: "Reviews" },
  { href: "/reviews/new", label: "Write a Review" },
  { href: "/folders", label: "Folders" },
  { href: "/notifications", label: "Notifications" },
  { href: "/about", label: "About" },
];

interface NavbarProps {
  session: Session | null;
  unreadCount?: number;
  latestNotifications?: NotificationItem[];
}

export function Navbar({
  session,
  unreadCount = 0,
  latestNotifications = [],
}: NavbarProps) {
  const navLinks = session
    ? [
        ...authenticatedNavLinks,
        ...(session?.user?.role === UserRole.ADMIN
          ? [{ href: "/admin", label: "Admin" }]
          : []),
      ]
    : publicNavLinks;

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo size="sm" />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {session ? (
          <NavbarUserMenu
            session={session}
            unreadCount={unreadCount}
            notifications={latestNotifications}
          />
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" render={<Link href="/login" />}>
              Log in
            </Button>
            <Button size="sm" render={<Link href="/register" />}>
              Sign up
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
