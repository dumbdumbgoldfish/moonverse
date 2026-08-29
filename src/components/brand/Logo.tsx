import { BrandLogo, type BrandLogoSize } from "@/components/brand/BrandLogo";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: BrandLogoSize;
  showTagline?: boolean;
}

/** @deprecated Use BrandLogo. This wrapper preserves existing imports. */
export function Logo({
  className,
  showWordmark = true,
  size = "md",
  showTagline,
}: LogoProps) {
  const tagline = showTagline ?? (size === "lg" || size === "xl");

  return (
    <BrandLogo
      size={size}
      showWordmark={showWordmark}
      showTagline={tagline}
      mark="mascot"
      className={cn(className)}
    />
  );
}
