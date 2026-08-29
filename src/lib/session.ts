import { cache } from "react";
import { auth } from "@/lib/auth";
import { hasCompletedOnboarding } from "@/services/preference.service";

/** One auth() lookup per request (AppShell + pages share this). */
export const getSession = cache(async () => auth());

/** Cached onboarding gate for pages that call redirectIncompleteOnboarding. */
export const getOnboardingComplete = cache(async (userId: string) =>
  hasCompletedOnboarding(userId)
);
