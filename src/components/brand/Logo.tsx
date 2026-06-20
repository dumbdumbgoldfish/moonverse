import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { icon: 28, text: "text-lg" },
  md: { icon: 36, text: "text-xl" },
  lg: { icon: 48, text: "text-2xl" },
};

export function Logo({ className, showWordmark = true, size = "md" }: LogoProps) {
  const { icon, text } = sizes[size];

  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
      aria-label="MoonVerse home"
    >
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* Crescent moon */}
        <path
          d="M28 8C20.5 8 14.5 14 14.5 21.5C14.5 29 20.5 35 28 35C30.5 35 32.8 34.2 34.7 32.8C31.5 36.5 27 39 22 39C13.7 39 7 32.3 7 24C7 15.7 13.7 9 22 9C24.5 9 26.8 9.6 28.8 10.7C28.3 9.5 28 8.3 28 8Z"
          fill="currentColor"
          className="text-accent"
        />
        {/* Book */}
        <path
          d="M30 18H38C39.1 18 40 18.9 40 20V36C40 37.1 39.1 38 38 38H30V18Z"
          fill="currentColor"
          className="text-primary"
        />
        <path
          d="M30 18H22C20.9 18 20 18.9 20 20V36C20 37.1 20.9 38 22 38H30V18Z"
          fill="currentColor"
          className="text-primary/80"
        />
        <path
          d="M30 18V38"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-background"
        />
        {/* Book pages detail */}
        <path
          d="M24 24H27M24 28H27M33 24H36M33 28H35"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          className="text-accent-soft"
        />
      </svg>
      {showWordmark && (
        <span className={cn("font-semibold tracking-tight text-foreground", text)}>
          Moon<span className="text-accent">Verse</span>
        </span>
      )}
    </Link>
  );
}
