import { cn } from "@/lib/utils";
import { reviewVerdict, type ReviewVerdictTone } from "@/lib/review-verdict";

const TONE_STYLES: Record<
  ReviewVerdictTone,
  { ring: string; bg: string; text: string }
> = {
  love: {
    ring: "ring-[#C89B4A]/45",
    bg: "bg-gradient-to-r from-amber-50/90 to-white",
    text: "text-[#8A6A1A]",
  },
  like: {
    ring: "ring-[#6E46C7]/30",
    bg: "bg-gradient-to-r from-violet-50/90 to-white",
    text: "text-[#6E46C7]",
  },
  mixed: {
    ring: "ring-[#1A1224]/12",
    bg: "bg-white/80",
    text: "text-[#1A1224]/70",
  },
  dislike: {
    ring: "ring-slate-200/80",
    bg: "bg-slate-50/90",
    text: "text-slate-600",
  },
  dnf: {
    ring: "ring-red-200/70",
    bg: "bg-red-50/80",
    text: "text-red-700/80",
  },
};

interface ReviewVerdictBadgeProps {
  rating: number;
  size?: "sm" | "md";
  showRating?: boolean;
  className?: string;
}

export function ReviewVerdictBadge({
  rating,
  size = "sm",
  showRating = true,
  className,
}: ReviewVerdictBadgeProps) {
  const verdict = reviewVerdict(rating);
  const tone = TONE_STYLES[verdict.tone];
  const compact = size === "sm";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full ring-1",
        tone.ring,
        tone.bg,
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
        "font-semibold uppercase tracking-[0.08em]",
        tone.text,
        className
      )}
      aria-label={`Verdict: ${verdict.label}`}
    >
      {showRating ? (
        <span className="tabular-nums font-bold">{rating.toFixed(1)}</span>
      ) : null}
      <span className={compact ? "normal-case tracking-normal" : ""}>
        {compact ? verdict.shortLabel : verdict.label}
      </span>
    </span>
  );
}
