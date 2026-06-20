import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

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
          className={cn(
            i < rating
              ? "fill-primary text-primary"
              : "fill-transparent text-muted-foreground/40"
          )}
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
