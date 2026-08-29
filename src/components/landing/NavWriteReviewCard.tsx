import Link from "next/link";
import { Moon, PenLine, Sparkles } from "lucide-react";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { cn } from "@/lib/utils";

interface NavWriteReviewCardProps {
  href: string;
  className?: string;
}

/** Premium Write dropdown card. single interactive link */
export function NavWriteReviewCard({ href, className }: NavWriteReviewCardProps) {
  return (
    <Link
      href={href}
      role="menuitem"
      className={cn(
        "mv-write-review-card group relative block overflow-hidden rounded-[20px] border border-violet-200/80",
        "bg-gradient-to-br from-white via-white to-violet-50/90 p-4",
        "shadow-[0_12px_30px_rgba(76,29,149,0.10)]",
        "transition-[transform,box-shadow,border-color] duration-200 ease-out",
        "hover:-translate-y-0.5 hover:border-violet-400/80 hover:shadow-[0_16px_36px_rgba(76,29,149,0.16)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "motion-reduce:transform-none motion-reduce:transition-none",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/45 to-transparent"
        aria-hidden
      />

      <div
        className="pointer-events-none absolute right-3 top-2.5 flex items-center gap-1 text-violet-200/90"
        aria-hidden
      >
        <Sparkles className="size-3" />
        <Moon className="size-3.5 fill-violet-100/80 stroke-violet-200" />
      </div>

      <div className="relative flex items-center gap-3 pr-8">
        <div
          className={cn(
            "mv-write-review-card-icon flex size-7 shrink-0 items-center justify-center rounded-lg",
            "bg-[#f0ecfa] text-primary ring-1 ring-violet-100",
            "transition-colors duration-200 group-hover:bg-[#e8e2ff]"
          )}
        >
          <PenLine className="size-3.5" strokeWidth={2} aria-hidden />
        </div>

        <div className="min-w-0 flex-1 pr-1">
          <h3 className="text-[0.9375rem] font-semibold leading-snug text-slate-950">
            Create a New Review
          </h3>
          <p className="mt-1 text-sm leading-5 text-slate-600">
            Share your thoughts on a web novel
          </p>
        </div>
      </div>

      <div
        className="pointer-events-none absolute -bottom-1 right-0 translate-x-1 opacity-75"
        aria-hidden
      >
        <MoonieMascot size={42} variant="excited" display="clean" lightweight />
      </div>
    </Link>
  );
}
