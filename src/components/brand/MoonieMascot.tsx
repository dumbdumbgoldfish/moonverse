import { cn } from "@/lib/utils";

interface MoonieMascotProps {
  className?: string;
  size?: number;
  animated?: boolean;
}

export function MoonieMascot({
  className,
  size = 56,
  animated = false,
}: MoonieMascotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn(animated && "animate-moonie-float", className)}
    >
      {/* Glow */}
      <circle cx="28" cy="28" r="26" fill="currentColor" className="text-accent/15" />
      {/* Moon body */}
      <circle cx="28" cy="28" r="22" fill="currentColor" className="text-accent" />
      {/* Crescent shadow for depth */}
      <path
        d="M28 6C17.5 6 9 14.5 9 25C9 35.5 17.5 44 28 44C32 44 35.7 42.8 38.7 40.8C34.5 45.5 28.8 48 22.5 48C12.1 48 4 39.9 4 29.5C4 19.1 12.1 11 22.5 11C24.5 11 26.4 11.3 28.2 11.9C27.5 9.8 27.8 7.8 28 6Z"
        fill="currentColor"
        className="text-accent-soft"
        opacity="0.35"
      />
      {/* Eyes */}
      <ellipse cx="21" cy="26" rx="3" ry="4" fill="currentColor" className="text-background" />
      <ellipse cx="35" cy="26" rx="3" ry="4" fill="currentColor" className="text-background" />
      {/* Eye shine */}
      <circle cx="22" cy="25" r="1" fill="currentColor" className="text-accent-soft" />
      <circle cx="36" cy="25" r="1" fill="currentColor" className="text-accent-soft" />
      {/* Smile */}
      <path
        d="M22 34C24 37 32 37 34 34"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-background"
        fill="none"
      />
      {/* Cheek blush */}
      <circle cx="17" cy="31" r="2.5" fill="currentColor" className="text-primary/40" />
      <circle cx="39" cy="31" r="2.5" fill="currentColor" className="text-primary/40" />
    </svg>
  );
}
