"use client";

import { Suspense } from "react";
import { Search } from "lucide-react";
import { NavInlineSearch } from "@/components/landing/NavInlineSearch";
import { cn } from "@/lib/utils";

interface NavSearchSlotProps {
  className?: string;
  compact?: boolean;
  inputId?: string;
}

function NavInlineSearchFallback({
  className,
  compact,
  inputId = "mv-global-search",
}: NavSearchSlotProps) {
  return (
    <form
      className={cn("relative w-full", className)}
      role="search"
      action="/search"
      method="get"
    >
      <div
        className={cn(
          "mv-nav-search relative flex items-center rounded-full",
          compact ? "h-10 min-h-[40px]" : "h-12 min-h-[48px]",
          !compact && "w-full max-w-[520px] xl:max-w-[620px]"
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute flex items-center justify-center text-muted-foreground",
            compact ? "left-3 size-7" : "left-4 size-8"
          )}
        >
          <Search
            className={cn("stroke-[2.25]", compact ? "size-4" : "size-5")}
            aria-hidden
          />
        </div>
        <input
          id={inputId}
          name="q"
          type="search"
          placeholder="Search"
          aria-label="Search MoonVerse"
          autoComplete="off"
          data-moonverse-search=""
          className={cn(
            "h-full min-w-0 flex-1 rounded-full bg-transparent pr-5 text-sm font-medium text-night-blue outline-none placeholder:text-muted-foreground/70",
            compact ? "pl-10" : "pl-12"
          )}
        />
      </div>
    </form>
  );
}

/**
 * Search field is focusable immediately. Suggest/results hydrate inside this
 * boundary so `useSearchParams` cannot hide the site navbar.
 */
export function NavSearchSlot(props: NavSearchSlotProps) {
  return (
    <Suspense fallback={<NavInlineSearchFallback {...props} />}>
      <NavInlineSearch {...props} />
    </Suspense>
  );
}
