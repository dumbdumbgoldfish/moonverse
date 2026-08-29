import { LITERARY_PAGE_BG } from "@/lib/literary-salon";
import { SITE_SHELL_CLASS } from "@/lib/site-shell";
import { cn } from "@/lib/utils";

export default function ReviewDetailLoading() {
  return (
    <div className={cn("safe-bottom-pad", LITERARY_PAGE_BG)}>
      <div className={cn(SITE_SHELL_CLASS, "space-y-5 py-5 sm:space-y-7 sm:py-8")}>
        <div className="h-4 w-64 animate-pulse rounded bg-[#1a1033]/6" />
        <div className="h-[13.5rem] animate-pulse rounded-[1.5rem] bg-white/80 ring-1 ring-[#1a1033]/6" />
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(270px,300px)]">
          <div className="min-h-[32rem] animate-pulse rounded-[1.5rem] bg-white/80 ring-1 ring-[#1a1033]/6" />
          <div className="hidden min-h-[28rem] animate-pulse rounded-[1.5rem] bg-white/80 ring-1 ring-[#1a1033]/6 xl:block" />
        </div>
      </div>
      <p className="sr-only" role="status">
        Loading review…
      </p>
    </div>
  );
}
