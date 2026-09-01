import { WORKS_REVIEWS_GRID_CLASS } from "@/components/search/search-layout";
import { LITERARY_PAGE_BG } from "@/lib/literary-salon";
import { SITE_SHELL_CLASS } from "@/lib/site-shell";
import { cn } from "@/lib/utils";

export function SearchStreamingFallback() {
  return (
    <div className={cn(LITERARY_PAGE_BG, "min-h-[40vh]")}>
      <div className={cn(SITE_SHELL_CLASS, "py-5")}>
        <div className="mb-4 h-11 max-w-md animate-pulse rounded-full bg-[#1A1224]/6" />
        <div className={WORKS_REVIEWS_GRID_CLASS} aria-hidden>
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="flex gap-4 rounded-2xl border border-primary/10 bg-white p-4"
            >
              <span className="h-[168px] w-[120px] shrink-0 animate-pulse rounded-xl bg-[#EDE8FF] sm:h-[200px] sm:w-[140px]" />
              <div className="min-w-0 flex-1 space-y-2">
                <span className="block h-4 w-3/4 animate-pulse rounded bg-[#EDE8FF]" />
                <span className="block h-3 w-1/2 animate-pulse rounded bg-[#F4ECF8]" />
                <span className="block h-3 w-full animate-pulse rounded bg-[#F4ECF8]" />
                <span className="block h-3 w-5/6 animate-pulse rounded bg-[#F4ECF8]" />
              </div>
            </div>
          ))}
        </div>
        <p className="sr-only" role="status">Loading search</p>
      </div>
    </div>
  );
}
