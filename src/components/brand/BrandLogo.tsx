import Link from "next/link";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { cn } from "@/lib/utils";

export type BrandLogoSize = "sm" | "md" | "lg" | "xl" | "nav";
export type BrandLogoVariant = "light" | "dark" | "mono" | "inverse";
export type BrandLogoLayout = "horizontal" | "square";

interface BrandLogoProps {
  className?: string;
  href?: string;
  size?: BrandLogoSize;
  showTagline?: boolean;
  showWordmark?: boolean;
  /** PNG Moonie only. the old circular emblem mark is retired. */
  mark?: "mascot" | "none";
  variant?: BrandLogoVariant;
  layout?: BrandLogoLayout;
  priority?: boolean;
}

const MARK_PX: Record<BrandLogoSize, number> = {
  sm: 36,
  md: 44,
  lg: 56,
  xl: 72,
  nav: 40,
};

const WORDMARK_CLASS: Record<BrandLogoSize, string> = {
  sm: "text-[1.28rem]",
  md: "text-[1.5rem]",
  lg: "text-[1.8rem]",
  xl: "text-[2.2rem]",
  nav: "text-[1.38rem] sm:text-[1.52rem]",
};

const TAGLINE = "Read · Review · Discover";

function Wordmark({
  size,
  variant,
  showTagline,
}: {
  size: BrandLogoSize;
  variant: BrandLogoVariant;
  showTagline: boolean;
}) {
  const isInverse = variant === "inverse" || variant === "dark";
  const isMono = variant === "mono";

  return (
    <span
      className={cn(
        "mv-wordmark",
        isInverse && "mv-wordmark--inverse",
        isMono && "mv-wordmark--mono"
      )}
    >
      <span className={cn("mv-wordmark-letters leading-none", WORDMARK_CLASS[size])}>
        <span className="mv-wordmark-moon">Moon</span>
        <span className="mv-wordmark-verse">Verse</span>
      </span>
      {showTagline ? (
        <span
          className={cn(
            "mv-wordmark-sub uppercase",
            size === "nav" ? "hidden lg:block" : "block"
          )}
        >
          {TAGLINE}
        </span>
      ) : null}
    </span>
  );
}

/** Clean crescent mark for square/favicon-style uses. no cartoon emblem. */
function CrescentMark({
  size,
  className,
  inverse = false,
}: {
  size: number;
  className?: string;
  inverse?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        inverse
          ? "bg-white/10 text-[#C89B4A]"
          : "bg-gradient-to-br from-[#F4ECF8] to-[#FFFBFF] text-[#6E46C7]",
        className
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-[58%]" fill="currentColor">
        <path d="M14.2 3.1A8.8 8.8 0 1 0 20.9 14 7.2 7.2 0 0 1 14.2 3.1Z" />
        <circle cx="17.2" cy="6.4" r="1" fill="#C89B4A" />
      </svg>
    </span>
  );
}

/**
 * Premium MoonVerse brand lockup. readable wordmark, optional Moonie or crescent.
 * The old circular cartoon emblem has been removed.
 */
export function BrandLogo({
  className,
  href = "/",
  size = "nav",
  showTagline = false,
  showWordmark = true,
  mark = "mascot",
  variant = "light",
  layout = "horizontal",
  priority = false,
}: BrandLogoProps) {
  const markPx = MARK_PX[size];
  const squareOnly = layout === "square" || !showWordmark;
  const showMascot = mark === "mascot";
  const showCrescent = mark === "none" && squareOnly;
  const isInverse = variant === "inverse" || variant === "dark";

  const content = (
    <>
      {showMascot ? (
        <MoonieMascot
          size={markPx}
          variant="waving"
          display="clean"
          lightweight
          priority={priority}
          className={cn(
            "shrink-0",
            size === "nav" && "drop-shadow-[0_4px_10px_rgba(76,42,103,0.18)]"
          )}
        />
      ) : null}

      {showCrescent ? (
        <CrescentMark size={markPx} inverse={isInverse} />
      ) : null}

      {showWordmark && !squareOnly ? (
        <Wordmark size={size} variant={variant} showTagline={showTagline} />
      ) : null}
    </>
  );

  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex shrink-0 items-center rounded-xl",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        showWordmark && !squareOnly && (showMascot || showCrescent)
          ? "gap-2.5 sm:gap-3"
          : "gap-0",
        size === "nav" && showWordmark && "min-w-[200px] max-w-[260px]",
        className
      )}
      aria-label="MoonVerse home"
    >
      {content}
    </Link>
  );
}
