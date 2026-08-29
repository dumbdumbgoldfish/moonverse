import { Logo } from "@/components/brand/Logo";
import { TasteOnboardingWizard } from "@/components/onboarding/TasteOnboardingWizard";
import { requireOnboardingPending } from "@/lib/onboarding-guard";
import { SITE_SHELL_CLASS } from "@/lib/site-shell";
import { cn } from "@/lib/utils";
import {
  getTasteOnboardingState,
  listSelectableGenres,
  listSelectableTags,
} from "@/services/preference.service";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Choose your taste · MoonVerse",
  description: "Tell Moonie the genres, tropes and moods you enjoy.",
};

export default async function GenreOnboardingPage() {
  const session = await requireOnboardingPending();

  const [genres, tropes, moods, initial] = await Promise.all([
    listSelectableGenres(),
    listSelectableTags("TROPE"),
    listSelectableTags("MOOD"),
    getTasteOnboardingState(session.user.id),
  ]);

  return (
    <div className="min-h-[100dvh] bg-[#FBF7F1] safe-bottom-pad">
      <header className="border-b border-[#1A1224]/8 bg-white/95 backdrop-blur-md">
        <div
          className={cn(
            SITE_SHELL_CLASS,
            "flex items-center justify-between py-3",
          )}
        >
          <Logo />
          <p className="text-xs font-semibold text-[#1A1224]/55">
            Taste onboarding
          </p>
        </div>
      </header>
      <main className={cn(SITE_SHELL_CLASS, "py-8 pb-24 sm:py-12")}>
        <TasteOnboardingWizard
          genres={genres}
          tropes={tropes}
          moods={moods}
          initial={initial}
          displayName={session.user.name ?? session.user.username}
          redirectTo="/home"
          mode="onboarding"
        />
      </main>
    </div>
  );
}
