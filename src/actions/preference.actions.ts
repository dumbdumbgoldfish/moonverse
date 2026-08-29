"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  savePreferredGenres,
  saveTasteOnboarding,
  type TasteOnboardingInput,
} from "@/services/preference.service";

export type PreferenceActionResult =
  | { success: true }
  | { success: false; error: string };

export async function saveGenrePreferencesAction(
  genreIds: string[]
): Promise<PreferenceActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in." };
  }

  try {
    await savePreferredGenres(session.user.id, genreIds);
    revalidatePath("/");
    revalidatePath("/home");
    revalidatePath("/onboarding");
    revalidatePath("/onboarding/genres");
    revalidatePath("/settings/preferences");
    revalidatePath("/for-you");
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Unable to save your genres." };
  }
}

export async function saveTasteOnboardingAction(
  input: TasteOnboardingInput
): Promise<PreferenceActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in." };
  }

  try {
    await saveTasteOnboarding(session.user.id, input);
    revalidatePath("/");
    revalidatePath("/home");
    revalidatePath("/onboarding");
    revalidatePath("/onboarding/genres");
    revalidatePath("/settings/preferences");
    revalidatePath("/moonie");
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Unable to save your reading taste." };
  }
}
