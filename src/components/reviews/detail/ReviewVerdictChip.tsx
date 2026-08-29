import { cn } from "@/lib/utils";
import { reviewVerdict, type ReviewVerdictTone } from "@/lib/review-verdict";

const TONE_RING: Record<ReviewVerdictTone, string> = {
  love: "ring-[#C89B4A]/50 bg-gradient-to-br from-amber-50 to-white",
  like: "ring-[#6b4bb5]/35 bg-gradient-to-br from-violet-50 to-white",
  mixed: "ring-[#1a1033]/15 bg-gradient-to-br from-[#faf8ff] to-white",
  dislike: "ring-slate-300/60 bg-gradient-to-br from-slate-50 to-white",
  dnf: "ring-red-200/70 bg-gradient-to-br from-red-50/80 to-white",
};

interface ReviewVerdictChipProps {
  rating: number;
  size?: "md" | "lg";
  className?: string;
}

export function ReviewVerdictChip({
  rating,
  size = "md",
  className,
}: ReviewVerdictChipProps) {
  const verdict = reviewVerdict(rating);
  const large = size === "lg";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 rounded-2xl ring-1",
        TONE_RING[verdict.tone],
        large ? "px-4 py-3" : "px-3 py-2",
        className,
      )}
      aria-label={`Verdict: ${verdict.label}, ${rating} out of 5 stars`}
    >
      <span
        className={cn(
          "font-serif font-black leading-none text-[#1a1033]",
          large ? "text-4xl" : "text-2xl",
        )}
      >
        {rating}
        <span className={cn("font-semibold text-[#7a7284]", large ? "text-lg" : "text-sm")}>
          /5
        </span>
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            "block font-heading font-semibold text-[#1a1033]",
            large ? "text-base" : "text-sm",
          )}
        >
          {verdict.label}
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7a7284]">
          Reader verdict
        </span>
      </span>
    </div>
  );
}
