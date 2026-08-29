"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ADMIN_CARD_CLASS,
  ADMIN_CARD_GLOW_CLASS,
  ADMIN_FILTER_CHIP_ACTIVE,
  ADMIN_FILTER_CHIP_IDLE,
} from "@/components/admin/admin-styles";

export function AdminScrollPanel({
  children,
  className,
  maxHeight = "calc(100dvh - 13.5rem)",
}: {
  children: React.ReactNode;
  className?: string;
  maxHeight?: string;
}) {
  return (
    <div
      className={cn(
        ADMIN_CARD_CLASS,
        ADMIN_CARD_GLOW_CLASS,
        "overflow-auto",
        className
      )}
      style={{ maxHeight }}
    >
      {children}
    </div>
  );
}

export function AdminWorkspace({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid h-[min(680px,calc(100dvh-11.5rem))] min-h-[280px] gap-4 overflow-hidden lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export interface AdminTab {
  id: string;
  label: string;
  badge?: number;
  content: React.ReactNode;
}

export function AdminTabs({
  tabs,
  defaultId,
  activeId: controlledActiveId,
  onActiveChange,
  className,
  panelClassName,
}: {
  tabs: AdminTab[];
  defaultId?: string;
  activeId?: string;
  onActiveChange?: (id: string) => void;
  className?: string;
  panelClassName?: string;
}) {
  const [uncontrolledActive, setUncontrolledActive] = useState(
    defaultId ?? tabs[0]?.id ?? ""
  );
  const active = controlledActiveId ?? uncontrolledActive;
  const setActive = (id: string) => {
    if (controlledActiveId === undefined) {
      setUncontrolledActive(id);
    }
    onActiveChange?.(id);
  };
  const current = tabs.find((tab) => tab.id === active) ?? tabs[0];

  if (!current) return null;

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div
        role="tablist"
        aria-label="Admin sections"
        className="mb-4 flex flex-wrap gap-1.5 border-b border-white/[0.08] pb-3"
      >
        {tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(tab.id)}
              className={cn(
                "inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-semibold transition duration-150",
                selected ? ADMIN_FILTER_CHIP_ACTIVE : ADMIN_FILTER_CHIP_IDLE
              )}
            >
              {tab.label}
              {typeof tab.badge === "number" && tab.badge > 0 ? (
                <span className="ml-1.5 tabular-nums opacity-90">({tab.badge})</span>
              ) : null}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        className={cn("min-h-0 flex-1 overflow-hidden", panelClassName)}
      >
        {current.content}
      </div>
    </div>
  );
}

export function AdminCollapsibleSection({
  title,
  description,
  defaultOpen = false,
  children,
}: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={ADMIN_CARD_CLASS}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-white/[0.04]"
      >
        <span>
          <span className="block text-sm font-semibold text-white">{title}</span>
          {description ? (
            <span className="mt-0.5 block text-xs text-white">{description}</span>
          ) : null}
        </span>
        <span className="text-xs font-semibold text-[#fcd34d]">{open ? "Hide" : "Show"}</span>
      </button>
      {open ? <div className="border-t border-white/10 p-4">{children}</div> : null}
    </section>
  );
}
