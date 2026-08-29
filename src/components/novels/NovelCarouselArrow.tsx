import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface NovelCarouselArrowProps {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
  label: string;
  tone?: "light" | "dark";
}

export function NovelCarouselArrow({
  direction,
  disabled,
  onClick,
  label,
  tone = "light",
}: NovelCarouselArrowProps) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  const onDark = tone === "dark";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "flex size-10 shrink-0 self-center items-center justify-center rounded-full transition-colors duration-150",
        onDark
          ? "border border-[#E8C36A]/30 bg-white/[0.05] text-[#EDE8FF] hover:enabled:border-[#E8C36A]/50 hover:enabled:bg-white/[0.08]"
          : "bg-white text-[#1A1224] ring-1 ring-[#6E46C7]/18 hover:enabled:bg-[#F4ECF8] hover:enabled:text-[#6E46C7] hover:enabled:ring-[#6E46C7]/40",
        "disabled:cursor-not-allowed disabled:opacity-35"
      )}
    >
      <Icon className="size-4" aria-hidden />
    </button>
  );
}
