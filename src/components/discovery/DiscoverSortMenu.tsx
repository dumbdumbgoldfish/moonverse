"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Lock } from "lucide-react";
import {
  DISCOVER_SORT_OPTIONS,
  discoverSortLabel,
  isGatedDiscoverSort,
} from "@/lib/discover";
import { cn } from "@/lib/utils";
import type { ReviewSort } from "@/types/review";

interface DiscoverSortMenuProps {
  value: ReviewSort;
  isLoggedIn: boolean;
  onSelect: (sort: ReviewSort) => void;
  onGatedSelect: () => void;
}

export function DiscoverSortMenu({
  value,
  isLoggedIn,
  onSelect,
  onGatedSelect,
}: DiscoverSortMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const everyone = DISCOVER_SORT_OPTIONS.filter((opt) => opt.group === "everyone");
  const forYou = DISCOVER_SORT_OPTIONS.filter((opt) => opt.group === "for-you");

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[13px] font-medium text-[#1A1224]",
          "ring-1 ring-[#1A1224]/12 transition-colors duration-150",
          "hover:ring-[#6E46C7]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]"
        )}
      >
        Sort: {discoverSortLabel(value)}
        <ChevronDown className="size-3.5 opacity-60" aria-hidden />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Sort reviews"
          className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-xl bg-white py-1.5 ring-1 ring-[#1A1224]/10"
        >
          <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1A1224]/45">
            Everyone
          </p>
          {everyone.map((opt) => (
            <SortRow
              key={opt.value}
              label={opt.label}
              selected={value === opt.value}
              onClick={() => {
                onSelect(opt.value);
                setOpen(false);
              }}
            />
          ))}
          <p className="mt-1 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1A1224]/45">
            For you
          </p>
          {forYou.map((opt) => (
            <SortRow
              key={opt.value}
              label={opt.label}
              selected={value === opt.value}
              locked={!isLoggedIn && isGatedDiscoverSort(opt.value)}
              onClick={() => {
                if (!isLoggedIn && isGatedDiscoverSort(opt.value)) {
                  onGatedSelect();
                  setOpen(false);
                  return;
                }
                onSelect(opt.value);
                setOpen(false);
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SortRow({
  label,
  selected,
  locked,
  onClick,
}: {
  label: string;
  selected: boolean;
  locked?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between px-3 py-1.5 text-left text-[13px] transition-colors duration-150",
        selected
          ? "bg-[#6E46C7]/10 font-medium text-[#6E46C7]"
          : "text-[#1A1224] hover:bg-[#1A1224]/4",
        locked && "text-[#1A1224]/55"
      )}
    >
      <span>{label}</span>
      {locked ? <Lock className="size-3.5" aria-hidden /> : null}
    </button>
  );
}
