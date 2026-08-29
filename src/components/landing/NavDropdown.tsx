"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavDropdownVariant = "menu" | "action";

interface NavDropdownProps {
  label: string;
  children: ReactNode;
  icon?: LucideIcon;
  align?: "left" | "center" | "right";
  className?: string;
  panelClassName?: string;
  showCaret?: boolean;
  variant?: NavDropdownVariant;
  active?: boolean;
}

export function NavDropdown({
  label,
  children,
  icon: Icon,
  align = "left",
  className,
  panelClassName,
  showCaret,
  variant = "menu",
  active = false,
}: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  const panelId = useId();
  const showChevron = showCaret ?? variant === "menu";

  const clearTimers = () => {
    if (openTimer.current) window.clearTimeout(openTimer.current);
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  };

  const scheduleOpen = () => {
    clearTimers();
    openTimer.current = window.setTimeout(() => setOpen(true), 70);
  };

  const scheduleClose = () => {
    clearTimers();
    closeTimer.current = window.setTimeout(() => setOpen(false), 140);
  };

  useEffect(() => () => clearTimers(), []);

  useEffect(() => {
    if (!open) return;

    const handlePointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={cn("relative", className)}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") scheduleOpen();
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") scheduleClose();
      }}
    >
      <button
        type="button"
        onClick={(event) => {
          clearTimers();
          const keyboard = event.detail === 0;
          const hoverPointer =
            typeof window !== "undefined" &&
            window.matchMedia("(hover: hover) and (pointer: fine)").matches;
          if (!keyboard && hoverPointer) {
            setOpen(true);
            return;
          }
          setOpen((current) => !current);
        }}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={open ? panelId : undefined}
        aria-current={active ? "page" : undefined}
        className={cn(
          "mv-nav-trigger inline-flex h-11 min-h-[44px] items-center gap-1 px-3 text-[13px] font-semibold tracking-wide",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          variant === "menu" && "mv-nav-trigger--menu",
          variant === "action" && "mv-nav-trigger--action"
        )}
      >
        {Icon ? <Icon className="size-4 shrink-0 opacity-80" aria-hidden /> : null}
        <span>{label}</span>
        {showChevron ? (
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 opacity-60 transition-transform duration-200 motion-reduce:transition-none",
              open && "rotate-180 opacity-100"
            )}
            aria-hidden
          />
        ) : null}
      </button>

      {open ? (
        <div
          id={panelId}
          className={cn(
            "absolute top-[calc(100%+0.55rem)] z-[60] min-w-[220px] overflow-hidden rounded-[22px] bg-[#FFFBFF] shadow-[0_28px_60px_-24px_rgba(76,53,196,0.45)] ring-1 ring-[#6E46C7]/18",
            "animate-in fade-in-0 zoom-in-95 duration-150 motion-reduce:animate-none",
            align === "left" && "left-0",
            align === "center" && "left-1/2 -translate-x-1/2",
            align === "right" && "right-0",
            panelClassName
          )}
          role="menu"
        >
          <div onClick={() => setOpen(false)}>{children}</div>
        </div>
      ) : null}
    </div>
  );
}

interface NavDropdownLinkProps {
  href: string;
  title: string;
  description?: string;
}

export function NavDropdownLink({ href, title, description }: NavDropdownLinkProps) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="block rounded-xl px-3 py-2.5 transition-colors hover:bg-[#F4ECF8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <span className="block text-sm font-semibold text-foreground">{title}</span>
      {description ? (
        <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
      ) : null}
    </Link>
  );
}
