import { Suspense } from "react";
import { MoonieAssistantView } from "@/components/moonie/MoonieAssistantView";
import { GuestAskMoonieDiscoveryRail } from "@/components/moonie/GuestAskMoonieDiscoveryRail";
import { SITE_SHELL_CLASS } from "@/lib/site-shell";

interface GuestAskMooniePageShellProps {
  guestDemoCap: number;
  initialPrompt?: string;
}

export function GuestAskMooniePageShell({
  guestDemoCap,
  initialPrompt,
}: GuestAskMooniePageShellProps) {
  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#1A1224] text-[#FFFBFF]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_top,_rgba(110,70,199,0.28),_transparent_62%)]"
      />

      <div
        className={`${SITE_SHELL_CLASS} relative z-10 flex h-full min-h-0 flex-1 flex-col overflow-hidden py-3 sm:py-4 lg:py-4`}
      >
        <div className="mb-3 shrink-0 lg:mb-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#E6D2A3]">
            Catalogue desk
          </p>
          <h1 className="mt-0.5 font-[family-name:var(--font-source-serif)] text-2xl font-bold text-[#FFFBFF] sm:text-[1.75rem]">
            Try Moonie
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-snug text-white/65 lg:truncate">
            Guests get {guestDemoCap} free recommendation turns. Create an account for
            taste, daily picks, and your library.
          </p>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 overflow-hidden lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-stretch xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div className="flex min-h-0 min-w-0 flex-col">
            <Suspense fallback={null}>
              <MoonieAssistantView
                isLoggedIn={false}
                variant="page"
                guestPageLayout
                initialPrompt={initialPrompt}
                guestDemoCap={guestDemoCap}
              />
            </Suspense>
          </div>

          <GuestAskMoonieDiscoveryRail />
        </div>
      </div>
    </div>
  );
}
