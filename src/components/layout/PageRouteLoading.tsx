import { LITERARY_PAGE_BG, LITERARY_SALON_STYLE } from "@/lib/literary-salon";
import { SITE_SHELL_CLASS } from "@/lib/site-shell";
import { cn } from "@/lib/utils";

export function PageRouteLoading({
  label,
  title,
  tone = "light",
  variant = "page",
}: {
  label: string;
  /** Visible destination heading so the click-to-content interval is not an empty main. */
  title?: string;
  tone?: "light" | "moonie";
  variant?: "page" | "desk";
}) {
  const moonie = tone === "moonie";

  if (moonie && variant === "desk") {
    return (
      <div
        className="flex h-full min-h-[calc(100dvh-var(--mv-nav-offset,4.5rem)-var(--mv-mobile-nav-h,0px))] flex-1 bg-[#1A1224] lg:min-h-[calc(100dvh-var(--mv-nav-offset,4.5rem))]"
        role="status"
        aria-live="polite"
      >
        <aside className="hidden w-[17.5rem] shrink-0 flex-col border-r border-white/10 bg-[#160F20] p-4 lg:flex">
          <div className="h-9 animate-pulse rounded-xl bg-white/10" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-10 animate-pulse rounded-xl bg-white/8"
              />
            ))}
          </div>
        </aside>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex-1 px-5 py-5">
            <div className="h-2.5 w-28 animate-pulse rounded-full bg-white/15" />
            <div className="mt-6 space-y-3">
              <div className="h-16 max-w-md animate-pulse rounded-2xl bg-white/8" />
              <div className="ml-auto h-12 max-w-xs animate-pulse rounded-2xl bg-white/6" />
            </div>
          </div>
          <div className="shrink-0 border-t border-white/10 px-5 py-4">
            <div className="h-12 animate-pulse rounded-2xl bg-white/10" />
          </div>
        </div>
        <p className="sr-only">{label}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        moonie ? "min-h-full bg-[#1A1224]" : `${LITERARY_PAGE_BG} min-h-[40vh]`
      )}
      style={moonie ? undefined : LITERARY_SALON_STYLE}
    >
      <div className={cn(SITE_SHELL_CLASS, moonie ? "py-6" : "py-5")}>
        {title ? (
          <h1
            className={cn(
              "font-heading text-2xl font-semibold sm:text-3xl",
              moonie ? "text-white" : "text-[#1a1033]"
            )}
          >
            {title}
          </h1>
        ) : (
          <div
            className={cn(
              "h-2.5 w-28 animate-pulse rounded-full",
              moonie ? "bg-white/15" : "bg-[#1A1224]/8"
            )}
          />
        )}
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-28 animate-pulse rounded-2xl",
                moonie ? "bg-white/8" : "bg-[#1A1224]/6"
              )}
            />
          ))}
        </div>
        <p className="sr-only" role="status">
          {label}
        </p>
      </div>
    </div>
  );
}
