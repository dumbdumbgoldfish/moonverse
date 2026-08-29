import { TasteOnboardingWizard } from "@/components/onboarding/TasteOnboardingWizard";
import { SettingsShell } from "@/components/settings/SettingsShell";
import { requireOnboardedUser } from "@/lib/onboarding-guard";
import {
  getTasteOnboardingState,
  listSelectableGenres,
  listSelectableTags,
} from "@/services/preference.service";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reading preferences · MoonVerse",
  description: "Update the taste profile that shapes Moonie and Discover.",
};

export default async function PreferencesSettingsPage() {
  const session = await requireOnboardedUser("/settings/preferences");

  const [genres, tropes, moods, initial] = await Promise.all([
    listSelectableGenres(),
    listSelectableTags("TROPE"),
    listSelectableTags("MOOD"),
    getTasteOnboardingState(session.user.id),
  ]);

  return (
    <SettingsShell
      active="preferences"
      title="Reading taste"
      description="Edit genres, tropes, moods, exclusions and reading constraints. Moonie uses these when shaping matches."
    >
      <TasteOnboardingWizard
        genres={genres}
        tropes={tropes}
        moods={moods}
        initial={initial}
        displayName={session.user.name ?? session.user.username}
        redirectTo="/settings/preferences"
        mode="settings"
      />
    </SettingsShell>
  );
}
