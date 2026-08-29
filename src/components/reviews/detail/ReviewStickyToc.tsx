import { cn } from "@/lib/utils";
import type { ReviewBodyTocItem } from "@/lib/review-body";

interface ReviewStickyTocProps {
  items: ReviewBodyTocItem[];
  className?: string;
}

export function ReviewStickyToc({ items, className }: ReviewStickyTocProps) {
  if (items.length < 2) return null;

  return (
    <nav
      aria-label="Review sections"
      className={cn("flex flex-wrap gap-1.5", className)}
    >
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className="rounded-full bg-[#F8F1FA] px-3 py-1.5 text-xs font-semibold text-[#5a4d72] ring-1 ring-[#1a1033]/6 transition-colors hover:bg-[#F4ECF8] hover:text-[#6E46C7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]"
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
