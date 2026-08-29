import Link from "next/link";
import { BookMarked, Moon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavMyReviewsCardProps {
  href?: string;
  className?: string;
}

/** Write dropdown card linking to published reviews + browser drafts. */
export function NavMyReviewsCard({
  href = "/my-reviews",
  className,
}: NavMyReviewsCardProps) {
  return (
    <Link
      href={href}
      role="menuitem"
      className={cn(
        "group relative mt-2 block overflow-hidden rounded-[20px] border border-violet-200/70",
        "bg-white p-4",
        "shadow-[0_8px_22px_rgba(76,29,149,0.08)]",
        "transition-[transform,box-shadow,border-color] duration-200 ease-out",
        "hover:-translate-y-0.5 hover:border-violet-400/70 hover:shadow-[0_12px_28px_rgba(76,29,149,0.12)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "motion-reduce:transform-none motion-reduce:transition-none",
        className
      )}
    >
      <div
        className="pointer-events-none absolute right-3 top-2.5 flex items-center gap-1 text-violet-200/90"
        aria-hidden
      >
        <Sparkles className="size-3" />
        <Moon className="size-3.5 fill-violet-100/80 stroke-violet-200" />
      </div>

      <div className="relative flex items-center gap-3">
        <div
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-lg",
            "bg-[#f0ecfa] text-primary ring-1 ring-violet-100",
            "transition-colors duration-200 group-hover:bg-[#e8e2ff]"
          )}
        >
          <BookMarked className="size-3.5" strokeWidth={2} aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-[0.9375rem] font-semibold leading-snug text-slate-950">
            My Reviews
          </h3>
          <p className="mt-1 text-sm leading-5 text-slate-600">
            Published reviews and browser drafts
          </p>
        </div>
      </div>
    </Link>
  );
}
