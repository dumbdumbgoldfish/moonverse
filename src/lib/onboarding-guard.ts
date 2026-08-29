import { redirect } from "next/navigation";
import { isAdminRole } from "@/lib/admin-redirect";
import { getOnboardingComplete, getSession } from "@/lib/session";

const ONBOARDING_PATH = "/onboarding/genres";

/** Require login + completed genre onboarding. */
export async function requireOnboardedUser(callbackPath = "/home") {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }
  if (isAdminRole(session.user.role)) {
    redirect("/admin");
  }
  const done = await getOnboardingComplete(session.user.id);
  if (!done) {
    redirect(ONBOARDING_PATH);
  }
  return session;
}

/** Require login and incomplete onboarding (for the genres page). */
export async function requireOnboardingPending() {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(ONBOARDING_PATH)}`);
  }
  if (isAdminRole(session.user.role)) {
    redirect("/admin");
  }
  const done = await getOnboardingComplete(session.user.id);
  if (done) {
    redirect("/discover");
  }
  return session;
}

/** If logged in but unfinished onboarding, send them to genre picker. */
export async function redirectIncompleteOnboarding() {
  const session = await getSession();
  if (!session?.user?.id) return session;
  if (isAdminRole(session.user.role)) {
    redirect("/admin");
  }
  const done = await getOnboardingComplete(session.user.id);
  if (!done) {
    redirect(ONBOARDING_PATH);
  }
  return session;
}
