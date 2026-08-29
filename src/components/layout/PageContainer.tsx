import Link from "next/link";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Tighter width for chat / for-you style pages */
  narrow?: boolean;
}

export function PageContainer({ children, className, narrow }: PageContainerProps) {
  return (
    <div
      className={cn(
        "app-page safe-bottom-pad mx-auto w-full px-4 py-5 sm:px-6 md:py-6 lg:px-8",
        narrow ? "max-w-3xl" : "max-w-6xl",
        className
      )}
    >
      {children}
    </div>
  );
}

interface PageHeroProps {
  children: React.ReactNode;
  className?: string;
}

export function PageHero({ children, className }: PageHeroProps) {
  return (
    <header className={cn("mv-page-hero mb-6 rounded-2xl p-5 sm:rounded-3xl sm:p-6", className)}>
      {children}
    </header>
  );
}

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function SectionTitle({ eyebrow, title, description, action }: SectionTitleProps) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>
        )}
        <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function PrimaryCtaLink({
  href,
  children,
  variant = "default",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "default" | "outline";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold transition-colors",
        variant === "default"
          ? "mv-nav-signup border-0 text-white"
          : "border border-border bg-white text-foreground hover:bg-muted"
      )}
    >
      {children}
    </Link>
  );
}
