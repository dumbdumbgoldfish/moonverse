import { cn } from "@/lib/utils";
import {
  MOONIE_VARIANTS,
  moonieLayoutSize,
  type MoonieExpression,
} from "@/lib/moonie/variants";

export type MoonieVariant = "default" | MoonieExpression;

/** Transparent cut-out only. no box, ring, or fill behind Moonie. */
export type MoonieDisplay = "clean" | "badge" | "hero" | "fab";

const VARIANT_IMAGES: Record<MoonieExpression, string> = Object.fromEntries(
  Object.values(MOONIE_VARIANTS).map((v) => [v.id, v.file])
) as Record<MoonieExpression, string>;

const DISPLAY_SHADOW: Record<MoonieDisplay, string> = {
  clean: "moonie-character-drop-sm",
  badge: "moonie-character-drop-sm",
  hero: "moonie-character-drop",
  fab: "moonie-character-drop-sm",
};

const DISPLAY_SHADOW_LITE: Record<MoonieDisplay, string> = {
  clean: "moonie-character-drop-lite",
  badge: "moonie-character-drop-lite",
  hero: "moonie-character-drop",
  fab: "moonie-character-drop-lite",
};

interface MoonieMascotProps {
  className?: string;
  /** Display height in pixels (width follows character aspect ratio). */
  size?: number;
  animated?: boolean;
  variant?: MoonieVariant;
  priority?: boolean;
  display?: MoonieDisplay;
  /** Purple outline when inside circular FAB / nav buttons */
  embedded?: boolean;
  /** Lighter filters. no halo, minimal shadow */
  lightweight?: boolean;
  /** Ambient glow halo (hero only, when in view) */
  showGlow?: boolean;
}

export function MoonieMascot({
  className,
  size = 56,
  animated = false,
  variant = "default",
  priority = false,
  display = "clean",
  embedded = false,
  lightweight = false,
  showGlow = false,
}: MoonieMascotProps) {
  const shadowClass = lightweight ? DISPLAY_SHADOW_LITE : DISPLAY_SHADOW;
  const useHalo = showGlow && !embedded && !lightweight;

  if (variant !== "default") {
    const { width, height } = moonieLayoutSize(variant, size);

    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-end justify-center overflow-visible bg-transparent",
          className
        )}
        style={{ width, height, background: "transparent" }}
        aria-hidden
      >
        {useHalo && <span className="moonie-glow-halo moonie-glow-halo-animated" aria-hidden />}
        {/* Native img avoids Next/Image aspect-ratio warnings on PNG mascots. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={VARIANT_IMAGES[variant]}
          alt=""
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          className={cn(
            "moonie-img relative z-10 block max-h-full max-w-full bg-transparent object-contain object-bottom",
            embedded ? "moonie-outline-embedded-lite" : shadowClass[display]
          )}
        />
      </span>
    );
  }

  return (
    <span
      className={cn("relative inline-flex shrink-0", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {useHalo && <span className="moonie-glow-halo moonie-glow-halo-animated" aria-hidden />}
      <svg
        width={size}
        height={size}
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className={cn(
          "relative z-10",
          animated && !lightweight && "animate-moonie-float",
          shadowClass.clean
        )}
      >
      <circle cx="28" cy="28" r="26" fill="currentColor" className="text-moon-purple/15" />
      <circle cx="28" cy="28" r="22" fill="currentColor" className="text-moon-purple" />
      <path
        d="M28 6C17.5 6 9 14.5 9 25C9 35.5 17.5 44 28 44C32 44 35.7 42.8 38.7 40.8C34.5 45.5 28.8 48 22.5 48C12.1 48 4 39.9 4 29.5C4 19.1 12.1 11 22.5 11C24.5 11 26.4 11.3 28.2 11.9C27.5 9.8 27.8 7.8 28 6Z"
        fill="currentColor"
        className="text-soft-lavender"
        opacity="0.35"
      />
      <ellipse cx="21" cy="26" rx="3" ry="4" fill="currentColor" className="text-background" />
      <ellipse cx="35" cy="26" rx="3" ry="4" fill="currentColor" className="text-background" />
      <circle cx="22" cy="25" r="1" fill="currentColor" className="text-soft-lavender" />
      <circle cx="36" cy="25" r="1" fill="currentColor" className="text-soft-lavender" />
      <path
        d="M22 34C24 37 32 37 34 34"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-background"
        fill="none"
      />
      <circle cx="17" cy="31" r="2.5" fill="currentColor" className="text-moon-purple/40" />
      <circle cx="39" cy="31" r="2.5" fill="currentColor" className="text-moon-purple/40" />
      </svg>
    </span>
  );
}

export function resolveMoonieDisplay(
  size: number,
  display?: MoonieDisplay
): MoonieDisplay {
  if (display) return display;
  if (size >= 120) return "hero";
  return "clean";
}

export type { MoonieExpression };
