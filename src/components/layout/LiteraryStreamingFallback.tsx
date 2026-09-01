import type { ReactNode } from "react";
import { LITERARY_PAGE_BG, LITERARY_SALON_STYLE } from "@/lib/literary-salon";
import { SITE_SHELL_CLASS } from "@/lib/site-shell";
import { cn } from "@/lib/utils";

export function LiteraryStreamingFallback({
  label,
  children,
  className,
}: {
  label: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(`safe-bottom-pad min-h-[40vh] ${LITERARY_PAGE_BG}`, className)}
      style={LITERARY_SALON_STYLE}
    >
      <div className={`${SITE_SHELL_CLASS} py-5`}>
        <div className="mb-4 h-2.5 w-28 animate-pulse rounded-full bg-[#1A1224]/8" />
        {children ?? (
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-2xl bg-[#1A1224]/6"
              />
            ))}
          </div>
        )}
        <p className="sr-only" role="status">{label}</p>
      </div>
    </div>
  );
}
