import { db } from "@/lib/db";
import { getSystemSettings } from "@/lib/system-settings";

export async function isEmailVerificationRequired(): Promise<boolean> {
  const settings = await getSystemSettings();
  return settings.requireEmailVerified;
}

export async function assertEmailVerifiedForUser(userId: string): Promise<void> {
  if (!(await isEmailVerificationRequired())) {
    return;
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  });

  if (!user?.emailVerified) {
    throw new Error(
      "Verify your email before posting reviews or comments. Check your inbox or request a new verification link on the verify email page."
    );
  }
}
