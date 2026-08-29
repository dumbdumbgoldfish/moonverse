import type { Rng } from "./rng";
import type { DemoUserSpec } from "./names";
import { generateDemoUsers } from "./names";
import { QA_EXTENSION_EMAIL_DOMAIN } from "./qa-extension-targets";

export interface QaExtensionUserSpec extends DemoUserSpec {
  cohort: "inactive" | "lurker" | "casual" | "active" | "power";
  isSuspended: boolean;
  emailVerified: boolean;
}

function cohortForUser(
  rng: Rng,
  activity: DemoUserSpec["activity"]
): QaExtensionUserSpec["cohort"] {
  if (activity === "low" && rng.chance(0.55)) return "inactive";
  if (activity === "low") return "lurker";
  if (activity === "medium") return rng.chance(0.35) ? "casual" : "active";
  return rng.chance(0.22) ? "active" : "power";
}

export function reviewQuotaForCohort(cohort: QaExtensionUserSpec["cohort"], rng: Rng): number {
  switch (cohort) {
    case "inactive":
      return 0;
    case "lurker":
      return rng.chance(0.45) ? 1 : 0;
    case "casual":
      return rng.int(1, 3);
    case "active":
      return rng.int(2, 6);
    case "power":
      return rng.int(5, 12);
    default:
      return 0;
  }
}

/**
 * Generate synthetic QA extension users with a dedicated email domain.
 * Usernames are offset-indexed to reduce collisions with the base demo set.
 */
export function generateQaExtensionUsers(
  rng: Rng,
  count: number,
  existingUsernames: Set<string>,
  existingEmails: Set<string>
): QaExtensionUserSpec[] {
  const base = generateDemoUsers(rng, count);
  const users: QaExtensionUserSpec[] = [];

  for (let i = 0; i < base.length; i++) {
    const source = base[i];
    let username = `${source.username}qa${i + 1}`.slice(0, 24);
    let guard = 0;
    while (existingUsernames.has(username) && guard++ < 40) {
      username = `${source.username.slice(0, 16)}q${i}${guard}`.slice(0, 24);
    }
    existingUsernames.add(username);

    let email = `${username}@${QA_EXTENSION_EMAIL_DOMAIN}`;
    let emailGuard = 0;
    while (existingEmails.has(email) && emailGuard++ < 20) {
      email = `${username}${emailGuard}@${QA_EXTENSION_EMAIL_DOMAIN}`;
    }
    existingEmails.add(email);

    const cohort = cohortForUser(rng, source.activity);
    const joinOffsetDays =
      cohort === "inactive"
        ? rng.int(120, 540)
        : cohort === "power"
          ? rng.int(30, 400)
          : rng.int(3, 480);

    users.push({
      ...source,
      email,
      username,
      role: "USER",
      joinOffsetDays,
      cohort,
      isSuspended: false,
      emailVerified: true,
    });
  }

  return users;
}
