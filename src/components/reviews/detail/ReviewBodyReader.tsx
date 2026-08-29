"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BookOpen, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewBodyReaderProps {
  body: string;
  collapsedHeight?: number;
  /** When false, expanding requires login. Defaults to session status. */
  allowExpandWithoutAuth?: boolean;
}

function renderBlocks(body: string) {
  const blocks = body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    if (block.startsWith("> ")) {
      return (
        <blockquote
          key={index}
          className="border-l-4 border-primary/40 bg-violet-50/50 py-2 pl-4 pr-3 font-serif text-[1.05rem] italic leading-relaxed text-night-blue"
        >
          {block.replace(/^>\s?/gm, "")}
        </blockquote>
      );
    }

    return (
      <p key={index} className="whitespace-pre-line">
        {block}
      </p>
    );
  });
}

export function ReviewBodyReader({
  body,
  collapsedHeight = 360,
  allowExpandWithoutAuth = false,
}: ReviewBodyReaderProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const check = () => setOverflowing(el.scrollHeight > collapsedHeight + 32);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [collapsedHeight, body]);

  const collapsed = overflowing && !expanded;

  const handleToggle = () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    if (
      !allowExpandWithoutAuth &&
      status === "unauthenticated"
    ) {
      router.push(
        `/login?callbackUrl=${encodeURIComponent(pathname || "/")}`
      );
      return;
    }
    setExpanded(true);
  };

  return (
    <div>
      <div
        className="relative"
        style={
          collapsed
            ? { maxHeight: collapsedHeight, overflow: "hidden" }
            : undefined
        }
      >
        <div
          ref={contentRef}
          className={cn(
            "space-y-5 text-[1.0625rem] leading-[1.75] text-slate-700 sm:text-[1.125rem]",
            "[&_p]:max-w-[42rem]"
          )}
        >
          {renderBlocks(body)}
        </div>

        {collapsed ? (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white via-white/85 to-transparent"
            aria-hidden
          />
        ) : null}
      </div>

      {overflowing ? (
        <div className="mt-1 flex justify-start">
          <button
            type="button"
            onClick={handleToggle}
            aria-expanded={expanded}
            className={cn(
              "inline-flex min-h-10 items-center gap-1.5 rounded-lg px-1 py-1.5 text-sm font-bold text-primary",
              "hover:bg-violet-50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            )}
          >
            <BookOpen className="size-4" aria-hidden />
            {expanded ? "Show less" : "Continue reading"}
            <ChevronDown
              className={cn(
                "size-4 transition-transform duration-200",
                expanded && "rotate-180"
              )}
              aria-hidden
            />
          </button>
        </div>
      ) : null}
    </div>
  );
}
