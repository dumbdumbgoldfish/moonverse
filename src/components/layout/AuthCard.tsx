import { cn } from "@/lib/utils";

interface AuthCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  variant?: "default" | "marketing";
}

export function AuthCard({
  title,
  description,
  children,
  footer,
  className,
  variant = "default",
}: AuthCardProps) {
  const isMarketing = variant === "marketing";

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          isMarketing
            ? "rounded-none bg-white p-0 sm:p-0"
            : "rounded-xl border border-border/60 bg-bg-elevated p-6 shadow-sm sm:p-8"
        )}
      >
        <div className={cn("mb-6", isMarketing ? "text-left" : "text-center")}>
          <h1
            className={cn(
              "font-bold tracking-tight text-[#1a1a1a]",
              isMarketing ? "text-[1.75rem] leading-tight sm:text-[2rem]" : "text-2xl"
            )}
          >
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm text-[#555]">{description}</p>
          )}
        </div>
        {children}
      </div>
      {footer && (
        <div className={cn("mt-6 text-sm", isMarketing ? "text-center" : "text-center")}>
          {footer}
        </div>
      )}
    </div>
  );
}
