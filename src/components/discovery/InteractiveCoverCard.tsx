"use client";

import Link from "next/link";
import {
  createElement,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";
import { createPortal } from "react-dom";
import {
  BookOpen,
  BookmarkPlus,
  Check,
  Eye,
  MoreHorizontal,
  Sparkles,
  ThumbsDown,
} from "lucide-react";
import { memo } from "react";
import { saveReviewToLibraryAction } from "@/actions/folder.actions";
import { getGenreIcon } from "@/components/browse/genre-icon";
import { CoverImage } from "@/components/ui/CoverImage";
import { formatCompactCount } from "@/lib/format-utils";
import { openMoonie } from "@/lib/moonie/open-moonie";
import { cn } from "@/lib/utils";

interface InteractiveCoverCardProps {
  href: string;
  coverUrl: string;
  novelTitle: string;
  reviewId: string;
  viewCount?: number;
  tags?: string[];
  progress?: number;
  rank?: number;
  size?: "md" | "lg" | "xl";
  className?: string;
  onHide?: () => void;
}

const sizes = {
  md: { wrap: "w-[128px]", cover: "h-[178px] w-[128px]", imageSizes: "128px" },
  lg: { wrap: "w-[148px]", cover: "h-[208px] w-[148px]", imageSizes: "148px" },
  xl: { wrap: "w-[168px]", cover: "h-[236px] w-[168px]", imageSizes: "168px" },
};

const MENU_WIDTH = 176;

function CoverGenreIcon({ tag }: { tag: string }) {
  return createElement(getGenreIcon(tag), {
    className: "size-3 shrink-0 text-slate-500",
    "aria-hidden": true,
  });
}

function InteractiveCoverCardComponent({
  href,
  coverUrl,
  novelTitle,
  reviewId,
  viewCount,
  tags,
  progress,
  size = "lg",
  className,
  onHide,
}: InteractiveCoverCardProps) {
  const s = sizes[size];
  const primaryTag = tags?.[0];
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null
  );
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  /** Revealed by hover (desktop) or touch on this card (mobile). */
  const [revealed, setRevealed] = useState(false);

  const showMenuButton = revealed || open;

  function closeMenu() {
    setOpen(false);
    setMenuPos(null);
  }

  function openMenu() {
    const btn = buttonRef.current;
    if (!btn) return;

    const buttonRect = btn.getBoundingClientRect();
    const viewportPad = 8;
    const preferredLeft = buttonRect.left - 8;
    const left = Math.min(
      Math.max(viewportPad, preferredLeft),
      window.innerWidth - MENU_WIDTH - viewportPad
    );

    setStatus(null);
    setMenuPos({
      top: buttonRect.bottom + 6,
      left,
    });
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (
        menuRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      ) {
        return;
      }
      closeMenu();
      setRevealed(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
        setRevealed(false);
      }
    }

    function onWindowScroll() {
      closeMenu();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onWindowScroll);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onWindowScroll);
    };
  }, [open]);

  function handleAddToLibrary() {
    setStatus(null);
    startTransition(async () => {
      const result = await saveReviewToLibraryAction(reviewId);
      if (!result.success) {
        setStatus(result.error);
        return;
      }
      setStatus(result.added ? "Saved to library" : "Already in library");
      // Do not router.refresh() here: Discover personalization excludes
      // newly saved reviews and makes the cover "disappear".
      window.setTimeout(() => {
        closeMenu();
        setRevealed(false);
      }, 900);
    });
  }

  function handleShowLess() {
    closeMenu();
    setRevealed(false);
    onHide?.();
  }

  const saved =
    status?.includes("library") === true || status?.includes("Saved") === true;

  return (
    <div
      className={cn(
        "group relative shrink-0 snap-start",
        open && "z-40",
        s.wrap,
        className
      )}
      onMouseEnter={() => setRevealed(true)}
      onMouseLeave={() => {
        if (!open) setRevealed(false);
      }}
      onFocusCapture={() => setRevealed(true)}
      onBlurCapture={(event) => {
        if (
          !open &&
          !event.currentTarget.contains(event.relatedTarget as Node | null)
        ) {
          setRevealed(false);
        }
      }}
      onTouchStart={() => setRevealed(true)}
    >
      <div className="relative">
        <Link
          href={href}
          className={cn(
            "relative block overflow-hidden rounded-xl bg-slate-100",
            "shadow-sm ring-1 ring-black/5",
            "transition duration-200 ease-out",
            "group-hover:shadow-md group-hover:ring-black/10",
            s.cover
          )}
          aria-label={`Open ${novelTitle}`}
        >
          <CoverImage
            src={coverUrl}
            alt={`Cover of ${novelTitle}`}
            title={novelTitle}
            sizes={s.imageSizes}
            className="transition duration-300 group-hover:scale-[1.03]"
          />
          <div
            className={cn(
              "pointer-events-none absolute inset-0 bg-black/0 transition duration-200",
              showMenuButton && "bg-black/10"
            )}
            aria-hidden
          />
        </Link>

        <button
          ref={buttonRef}
          type="button"
          tabIndex={showMenuButton ? 0 : -1}
          aria-hidden={!showMenuButton}
          aria-label={`More options for ${novelTitle}`}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (open) {
              closeMenu();
              return;
            }
            openMenu();
          }}
          className={cn(
            "absolute right-2 top-2 z-10 inline-flex size-8 items-center justify-center rounded-full",
            "bg-white/95 text-[#1a1233] shadow-md ring-1 ring-black/5",
            "transition-all duration-200 hover:bg-white",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            showMenuButton
              ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
              : "pointer-events-none -translate-y-1 scale-90 opacity-0"
          )}
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </button>

        {progress !== undefined && (
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-violet-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#6246ea] to-[#F6C85F]"
              style={{ width: `${Math.min(100, Math.max(8, progress))}%` }}
            />
          </div>
        )}
      </div>

      <Link href={href} className="mt-2 block min-w-0">
        <p className="line-clamp-2 min-h-[2.5rem] text-[13px] font-semibold leading-5 text-[#1a1233]">
          {novelTitle}
        </p>
        <div className="mt-1 flex h-5 items-center gap-1.5 overflow-hidden">
          {primaryTag ? (
            <span className="inline-flex h-5 max-w-[70%] shrink items-center gap-1 truncate rounded-md bg-slate-100 px-1.5 text-[11px] font-medium leading-none text-slate-600">
              <CoverGenreIcon tag={primaryTag} />
              <span className="truncate">{primaryTag}</span>
            </span>
          ) : null}
          {viewCount !== undefined ? (
            <span className="inline-flex h-5 shrink-0 items-center gap-1 text-[11px] font-medium leading-none text-slate-500">
              <Eye className="size-3.5 shrink-0" aria-hidden />
              {formatCompactCount(viewCount)}
            </span>
          ) : null}
        </div>
      </Link>

      {open && menuPos
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              aria-label={`${novelTitle} options`}
              style={{
                top: menuPos.top,
                left: menuPos.left,
                width: MENU_WIDTH,
              }}
              className="fixed z-[100] overflow-hidden rounded-xl border border-white/60 bg-white/75 text-[#1a1233] shadow-[0_12px_40px_-12px_rgba(18,12,40,0.35)] backdrop-blur-xl"
              onPointerDown={(event) => event.stopPropagation()}
            >
              <div className="border-b border-black/5 px-2.5 py-2">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Story actions
                </p>
                <p className="mt-0.5 line-clamp-1 text-[12px] font-semibold text-[#1a1233]">
                  {novelTitle}
                </p>
              </div>

              <div className="p-1">
                <Link
                  href={href}
                  role="menuitem"
                  onClick={() => {
                    closeMenu();
                    setRevealed(false);
                  }}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] font-medium text-[#1a1233] transition hover:bg-white/80"
                >
                  <span className="inline-flex size-6 items-center justify-center rounded-md bg-slate-100/90 text-slate-600">
                    <BookOpen className="size-3.5" aria-hidden />
                  </span>
                  Read
                </Link>

                <button
                  type="button"
                  role="menuitem"
                  disabled={isPending}
                  onClick={handleAddToLibrary}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] font-medium text-[#1a1233] transition hover:bg-white/80 disabled:opacity-60"
                >
                  <span className="inline-flex size-6 items-center justify-center rounded-md bg-slate-100/90 text-emerald-600">
                    {saved ? (
                      <Check className="size-3.5" aria-hidden />
                    ) : (
                      <BookmarkPlus className="size-3.5" aria-hidden />
                    )}
                  </span>
                  {isPending
                    ? "Saving…"
                    : saved
                      ? status
                      : "Add to library"}
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    closeMenu();
                    setRevealed(false);
                    openMoonie(`Recommend stories like ${novelTitle}`);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] font-medium text-[#1a1233] transition hover:bg-violet-50/90"
                >
                  <span className="inline-flex size-6 items-center justify-center rounded-md bg-violet-100/90 text-primary">
                    <Sparkles className="size-3.5" aria-hidden />
                  </span>
                  Ask Moonie
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleShowLess}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] font-medium text-[#1a1233] transition hover:bg-white/80"
                >
                  <span className="inline-flex size-6 items-center justify-center rounded-md bg-slate-100/90 text-rose-500">
                    <ThumbsDown className="size-3.5" aria-hidden />
                  </span>
                  Show less like this
                </button>
              </div>

              {status && !saved ? (
                <p className="px-2.5 pb-2 text-[11px] text-rose-600">{status}</p>
              ) : null}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

export const InteractiveCoverCard = memo(InteractiveCoverCardComponent);
