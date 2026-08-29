"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useSignInPrompt } from "@/components/auth/SignInPromptProvider";
import {
  parseReviewBody,
  type ReviewBodyBlock,
} from "@/lib/review-body";
import { cn } from "@/lib/utils";

interface ReviewStructuredBodyProps {
  body: string;
  className?: string;
  isLoggedIn?: boolean;
  /** Community modal must show the complete review. */
  forceExpanded?: boolean;
  /** Opens the community review modal instead of expanding inline. */
  onReadFull?: () => void;
}

const PREVIEW_HEIGHT_LOGGED_IN = 260;
const PREVIEW_HEIGHT_GUEST = 180;

function SectionLabel({ children }: { children: string }) {
  return (
    <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#C89B4A]">
      {children}
    </h3>
  );
}

const BODY_PARAGRAPH_CLASS =
  "max-w-[40rem] whitespace-pre-line text-pretty font-serif text-[1rem] leading-[1.7] text-[#3d2f5c] sm:text-[1.0625rem]";

const BODY_CONTENT_CLASS = "w-full max-w-[40rem] space-y-3.5 sm:space-y-4";

function BlockView({ block }: { block: ReviewBodyBlock }) {
  if (block.kind === "lead" || block.kind === "paragraph") {
    return (
      <p id={block.id} className={BODY_PARAGRAPH_CLASS}>
        {block.lines[0]}
      </p>
    );
  }

  if (block.kind === "quote") {
    return (
      <blockquote
        id={block.id}
        className="max-w-[40rem] border-l-2 border-[#C89B4A] py-1 pl-4 font-serif text-[1.0625rem] italic leading-[1.65] text-[#3d2f5c]"
      >
        <span
          aria-hidden
          className="mb-1 block text-2xl leading-none text-[#C89B4A]/40"
        >
          “
        </span>
        {block.lines[0]}
      </blockquote>
    );
  }

  if (block.kind === "callout") {
    return (
      <aside
        id={block.id}
        className="max-w-[40rem] rounded-xl border border-[#C89B4A]/25 bg-[#fffdf8] px-3.5 py-2.5"
      >
        {block.title ? <SectionLabel>{block.title}</SectionLabel> : null}
        <p className="mt-1 text-sm font-medium leading-[1.65] text-[#5a4d72]">
          {block.lines[0]}
        </p>
      </aside>
    );
  }

  if (block.kind === "list") {
    return (
      <section id={block.id} className="max-w-[40rem] space-y-1.5">
        {block.title ? <SectionLabel>{block.title}</SectionLabel> : null}
        <ul className="space-y-1.5">
          {block.lines.map((line) => (
            <li
              key={line}
              className="grid grid-cols-[auto_minmax(0,1fr)] gap-2.5 text-[1rem] leading-[1.7] text-[#3d2f5c] sm:text-[1.0625rem]"
            >
              <span
                aria-hidden
                className="mt-[0.65rem] size-1.5 shrink-0 rounded-full bg-[#6b4bb5]/70"
              />
              <span className="min-w-0">{line}</span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (block.kind === "section") {
    return (
      <section id={block.id}>
        {block.title ? <SectionLabel>{block.title}</SectionLabel> : null}
      </section>
    );
  }

  return (
    <p id={block.id} className={BODY_PARAGRAPH_CLASS}>
      {block.lines[0]}
    </p>
  );
}

export function ReviewStructuredBody({
  body,
  className,
  isLoggedIn = true,
  forceExpanded = false,
  onReadFull,
}: ReviewStructuredBodyProps) {
  const { promptSignIn } = useSignInPrompt();
  const blocks = parseReviewBody(body);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const opensInModal = Boolean(onReadFull);
  const previewHeight = isLoggedIn ? PREVIEW_HEIGHT_LOGGED_IN : PREVIEW_HEIGHT_GUEST;

  useLayoutEffect(() => {
    if (forceExpanded) return;
    const el = contentRef.current;
    if (!el) return;
    const check = () => setOverflowing(el.scrollHeight > previewHeight + 20);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [body, forceExpanded, previewHeight]);

  const showControls = !forceExpanded && overflowing;
  const collapsed = showControls && (opensInModal || !expanded);
  const scrollable = showControls && expanded && !opensInModal;

  const handleToggle = () => {
    if (opensInModal) {
      onReadFull?.();
      return;
    }
    if (!isLoggedIn) {
      promptSignIn();
      return;
    }
    if (expanded) {
      scrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
    }
    setExpanded((value) => !value);
  };

  return (
    <div className={className}>
      <div
        ref={scrollRef}
        className={cn(
          "relative rounded-xl",
          scrollable &&
            "max-h-[min(50dvh,26rem)] overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]",
        )}
        style={
          collapsed ? { maxHeight: previewHeight, overflow: "hidden" } : undefined
        }
        tabIndex={scrollable ? 0 : undefined}
        aria-label={scrollable ? "Full review text" : undefined}
      >
        <div ref={contentRef} className={BODY_CONTENT_CLASS}>
          {blocks.map((block) => (
            <BlockView key={block.id} block={block} />
          ))}
        </div>

        {collapsed ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white via-white/95 to-transparent"
          />
        ) : null}
      </div>

      {showControls ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleToggle}
            aria-expanded={opensInModal ? false : expanded}
            className={cn(
              "inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-[#6E46C7]/20 bg-[#F4ECF8] px-3.5 text-sm font-bold text-[#6E46C7]",
              "hover:bg-[#faf8ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b4bb5]",
            )}
          >
            {opensInModal || !expanded ? "Read full review" : "Show less"}
            <ChevronDown
              className={cn(
                "size-4 transition-transform duration-200",
                expanded && !opensInModal && "rotate-180",
              )}
              aria-hidden
            />
          </button>
          {scrollable ? (
            <p className="text-xs text-[#7a7284]">Scroll inside the review box for more</p>
          ) : null}
        </div>
      ) : null}

      {!isLoggedIn && collapsed ? (
        <p className="mt-2 text-xs leading-relaxed text-[#5a4d72]">
          Preview only. Sign in to read the full review and join the discussion.
        </p>
      ) : null}
    </div>
  );
}
