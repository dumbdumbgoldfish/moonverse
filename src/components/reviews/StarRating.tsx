import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export const STAR_GOLD_CLASS =
  "fill-[var(--mv-star-gold)] text-[var(--mv-star-gold)]";
export const STAR_EMPTY_CLASS =
  "fill-transparent text-[var(--mv-text-muted)]/35";

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: "sm" | "md";
  showValue?: boolean;
  className?: string;
}

export function StarRating({
  rating,
  max = 5,
  size = "sm",
  showValue = true,
  className,
}: StarRatingProps) {
  const iconSize = size === "sm" ? 14 : 18;

  return (
    <div
      className={cn("inline-flex items-center gap-1", className)}
      aria-label={`Rating: ${rating} out of ${max} stars`}
    >
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={iconSize}
          className={cn(i < rating ? STAR_GOLD_CLASS : STAR_EMPTY_CLASS)}
          aria-hidden="true"
        />
      ))}
      {showValue && (
        <span className="ml-1 text-xs font-medium text-muted-foreground">
          {rating}/{max}
        </span>
      )}
    </div>
  );
}
