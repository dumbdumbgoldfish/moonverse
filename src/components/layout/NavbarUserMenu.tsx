"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  BookMarked,
  ChevronDown,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  PenLine,
  Settings,
  UserRound,
  Bell,
} from "lucide-react";
import type { Session } from "next-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { closeMooniePanel } from "@/lib/moonie/panel-open-state";
import { getInitials } from "@/lib/initials";
import { signOutAndReload } from "@/lib/logout";
import { cn } from "@/lib/utils";
import type { EnrichedNotificationItem } from "@/types/notification";

interface NavbarUserMenuProps {
  session: Session;
  unreadCount: number;
  notifications: EnrichedNotificationItem[];
}

type MenuEntry =
  | {
      type: "link";
      label: string;
      href: string;
      icon: typeof UserRound;
      hint?: string;
    }
  | {
      type: "action";
      label: string;
      onSelect: () => void;
      icon: typeof UserRound;
      hint?: string;
      danger?: boolean;
    };

function MenuRow({
  icon: Icon,
  label,
  hint,
  danger,
  children,
}: {
  icon: typeof UserRound;
  label: string;
  hint?: string;
  danger?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl",
          danger
            ? "bg-rose-50 text-rose-600"
            : "bg-[#F4ECF8] text-[#4C2A67]"
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-sm font-semibold",
            danger ? "text-rose-700" : "text-[#1A1224]"
          )}
        >
          {label}
        </span>
        {hint ? (
          <span className="block truncate text-xs text-[#7A7284]">{hint}</span>
        ) : null}
      </span>
      {children}
    </span>
  );
}

export function NavbarUserMenu({
  session,
  unreadCount,
}: NavbarUserMenuProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const displayName = session.user.name ?? session.user.username;
  const username = session.user.username;
  const isAdmin = session.user.role === "ADMIN";
  const initials = getInitials(displayName);
  const avatarUrl = session.user.image?.trim() || undefined;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  const sections: MenuEntry[][] = [
    [
      {
        type: "link",
        label: "My Profile",
        href: `/users/${username}`,
        icon: UserRound,
        hint: `@${username}`,
      },
      {
        type: "link",
        label: "Notifications",
        href: "/notifications",
        icon: Bell,
        hint:
          unreadCount > 0
            ? `${unreadCount} new`
            : undefined,
      },
      {
        type: "link",
        label: "Library",
        href: "/folders",
        icon: BookMarked,
        hint: "Folders & saves",
      },
      {
        type: "link",
        label: "Write a review",
        href: "/reviews/new",
        icon: PenLine,
        hint: "Drafts and published",
      },
    ],
    [
      {
        type: "link",
        label: "Settings",
        href: "/settings",
        icon: Settings,
        hint: "Account & profile",
      },
      ...(isAdmin
        ? [
            {
              type: "link" as const,
              label: "Admin console",
              href: "/admin",
              icon: LayoutDashboard,
              hint: "Moderation & operations",
            },
          ]
        : []),
      {
        type: "link",
        label: "Help",
        href: "/help",
        icon: CircleHelp,
      },
    ],
    [
      {
        type: "action",
        label: "Log Out",
        onSelect: () => {
          if (isSigningOut) return;
          setLogoutError(null);
          setIsSigningOut(true);
          void (async () => {
            try {
              closeMooniePanel();
            } catch {
              // sessionStorage can throw in private browsing
            }
            try {
              await signOutAndReload(signOut, "/");
            } catch {
              setLogoutError("Log out failed. Your session is still active.");
              setIsSigningOut(false);
              setOpen(true);
            }
          })();
        },
        icon: LogOut,
        hint: isSigningOut ? "Signing out…" : undefined,
        danger: true,
      },
    ],
  ];

  const rowClass =
    "flex w-full items-center rounded-2xl px-2.5 py-2 text-left transition-colors hover:bg-[#FBF6FC] focus-visible:bg-[#FBF6FC] focus-visible:outline-none";

  return (
    <div className="relative" ref={rootRef}>
        <button
          type="button"
          id={`${menuId}-trigger`}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? `${menuId}-menu` : undefined}
          onClick={() => setOpen((value) => !value)}
          className={cn(
            "group relative inline-flex h-11 min-h-[44px] items-center gap-2 rounded-2xl border border-[#E4D8EE] bg-white pl-1.5 pr-2.5 shadow-[0_1px_0_rgba(36,22,48,0.04)] transition",
            "hover:border-[#C9B4DC] hover:bg-[#FBF6FC]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C2A67]/35 focus-visible:ring-offset-2",
            open && "border-[#4C2A67]/35 bg-[#FBF6FC] shadow-sm"
          )}
        >
          <span className="relative">
            <Avatar className="size-8 rounded-xl after:rounded-xl ring-2 ring-white shadow-sm">
              {avatarUrl ? (
                <AvatarImage
                  src={avatarUrl}
                  alt={`${displayName}'s profile photo`}
                  className="rounded-xl object-cover"
                />
              ) : null}
              <AvatarFallback className="rounded-xl bg-[linear-gradient(145deg,#4C2A67,#6E46C7)] text-xs font-bold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            {unreadCount > 0 ? (
              <span
                className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-[#6c4dff] ring-2 ring-white"
                aria-hidden
              />
            ) : null}
          </span>
          <span className="hidden min-w-0 max-w-[7.5rem] flex-col items-start leading-tight xl:flex">
            <span className="truncate text-sm font-semibold text-[#1A1224]">
              {displayName}
            </span>
            <span className="truncate text-[11px] text-[#7A7284]">
              @{username}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-[#7A7284] transition-transform duration-200",
              open && "rotate-180 text-[#4C2A67]"
            )}
            aria-hidden
          />
          <span className="sr-only">Account menu for {displayName}</span>
        </button>

        {open ? (
          <div
            id={`${menuId}-menu`}
            role="menu"
            aria-labelledby={`${menuId}-trigger`}
            className="absolute right-0 z-50 mt-3 w-[min(20rem,calc(100vw-1.5rem))] origin-top-right animate-in fade-in-0 zoom-in-95 duration-150"
          >
            <div
              className={cn(
                "overflow-hidden rounded-3xl border border-[#E8DFEF]",
                "bg-[linear-gradient(180deg,#FFFFFF_0%,#FDFBFE_55%,#F8F1FA_100%)]",
                "shadow-[0_24px_60px_-28px_rgba(36,22,48,0.45)]"
              )}
            >
              <div className="relative border-b border-[#EDE6F2] px-4 pb-4 pt-4">
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[radial-gradient(ellipse_at_top,_rgba(110,70,199,0.12),_transparent_70%)]"
                  aria-hidden
                />
                <div className="relative flex items-center gap-3">
                  <Avatar className="size-14 rounded-2xl after:rounded-2xl ring-2 ring-white shadow-md">
                    {avatarUrl ? (
                      <AvatarImage
                        src={avatarUrl}
                        alt={`${displayName}'s profile photo`}
                        className="rounded-2xl object-cover"
                      />
                    ) : null}
                    <AvatarFallback className="rounded-2xl bg-[linear-gradient(145deg,#4C2A67,#6E46C7)] text-base font-bold text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-[family-name:var(--font-source-serif)] text-lg font-semibold tracking-tight text-[#1A1224]">
                      {displayName}
                    </p>
                    <p className="truncate text-sm text-[#7A7284]">@{username}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1 p-2">
                {logoutError ? (
                  <p
                    role="alert"
                    className="mx-2 mb-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"
                  >
                    {logoutError}
                  </p>
                ) : null}
                {sections.map((section, sectionIndex) => (
                  <div key={sectionIndex}>
                    {sectionIndex > 0 ? (
                      <div
                        className="mx-2 my-1.5 border-t border-[#EDE6F2]"
                        role="separator"
                      />
                    ) : null}
                    {section.map((entry) => {
                      if (entry.type === "link") {
                        return (
                          <Link
                            key={entry.href}
                            href={entry.href}
                            role="menuitem"
                            onClick={close}
                            className={rowClass}
                          >
                            <MenuRow
                              icon={entry.icon}
                              label={entry.label}
                              hint={entry.hint}
                            >
                              {entry.href === "/notifications" &&
                              unreadCount > 0 ? (
                                <span className="rounded-full bg-[#4C2A67] px-2 py-0.5 text-[10px] font-bold text-white">
                                  {unreadCount > 99 ? "99+" : unreadCount}
                                </span>
                              ) : null}
                            </MenuRow>
                          </Link>
                        );
                      }
                      return (
                        <button
                          key={entry.label}
                          type="button"
                          role="menuitem"
                          onClick={entry.onSelect}
                          className={rowClass}
                        >
                          <MenuRow
                            icon={entry.icon}
                            label={entry.label}
                            hint={entry.hint}
                            danger={entry.danger}
                          />
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
    </div>
  );
}
