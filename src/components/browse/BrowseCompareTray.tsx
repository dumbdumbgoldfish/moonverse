"use client";

import Link from "next/link";
import { Columns2, Trash2, X } from "lucide-react";
import { CoverImage } from "@/components/ui/CoverImage";
import { SITE_SHELL_CLASS } from "@/lib/site-shell";
import { cn } from "@/lib/utils";
import type { BrowseWorkItem } from "@/types/browse";

interface BrowseCompareTrayProps {
  works: BrowseWorkItem[];
  onRemove: (novelId: string) => void;
  onClear: () => void;
  onOpenCompare: () => void;
  className?: string;
}

export function BrowseCompareTray({
  works,
  onRemove,
  onClear,
  onOpenCompare,
  className,
}: BrowseCompareTrayProps) {
  if (works.length === 0) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-[#1a1033]/10 bg-[#FBF7F1]/95 shadow-[0_-16px_40px_-28px_rgba(26,16,51,0.45)] backdrop-blur-sm",
        "safe-bottom-pad",
        className
      )}
      role="region"
      aria-label="Compare tray"
    >
      <div className={cn(SITE_SHELL_CLASS, "flex flex-wrap items-center gap-3 py-3")}>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
          Compare {works.length}/3
        </p>
        <ul className="flex flex-1 flex-wrap items-center gap-2">
          {works.map((work) => (
            <li
              key={work.novelId}
              className="inline-flex items-center gap-2 rounded-full border border-[#1a1033]/10 bg-white py-1 pl-1 pr-2"
            >
              <span className="relative size-7 overflow-hidden rounded-full bg-[#f4ecf8]">
                <CoverImage
                  src={work.coverUrl}
                  alt=""
                  title={work.title}
                  author={work.author}
                  themeSeed={work.novelId}
                  sizes="28px"
                  compactFallback
                />
              </span>
              <Link
                href={work.href}
                className="max-w-[8rem] truncate text-xs font-semibold text-[#1a1033] hover:text-primary"
              >
                {work.title}
              </Link>
              <button
                type="button"
                aria-label={`Remove ${work.title} from compare`}
                onClick={() => onRemove(work.novelId)}
                className="rounded-full p-0.5 text-[#1a1033]/40 hover:bg-[#f4ecf8] hover:text-[#1a1033]"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[#1a1033]/12 px-3 text-xs font-bold text-[#1a1033]/70 hover:bg-white"
          >
            <Trash2 className="size-3.5" aria-hidden />
            Clear
          </button>
          <button
            type="button"
            disabled={works.length < 2}
            onClick={onOpenCompare}
            className={cn(
              "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold",
              works.length >= 2
                ? "bg-[#1a1033] text-white hover:bg-[#2a1848]"
                : "cursor-not-allowed bg-[#1a1033]/20 text-white/70"
            )}
          >
            <Columns2 className="size-3.5" aria-hidden />
            Open compare
          </button>
        </div>
      </div>
    </div>
  );
}
