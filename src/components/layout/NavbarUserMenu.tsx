"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import type { Session } from "next-auth";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/review-utils";
import type { NotificationItem } from "@/types/notification";

interface NavbarUserMenuProps {
  session: Session;
  unreadCount: number;
  notifications: NotificationItem[];
}

export function NavbarUserMenu({
  session,
  unreadCount,
  notifications,
}: NavbarUserMenuProps) {
  const displayName = session.user.name ?? session.user.username;
  const initials = getInitials(displayName);

  return (
    <div className="flex items-center gap-2">
      <NotificationDropdown
        unreadCount={unreadCount}
        notifications={notifications}
      />

      <Link
        href={`/users/${session.user.username}`}
        className="hidden items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:inline-flex"
      >
        <Avatar size="sm">
          <AvatarFallback className="bg-primary/20 text-[10px] text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span>{displayName}</span>
      </Link>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => signOut({ callbackUrl: "/" })}
        aria-label="Log out"
      >
        <LogOut data-icon="inline-start" aria-hidden="true" />
        <span className="hidden sm:inline">Log out</span>
      </Button>
    </div>
  );
}
