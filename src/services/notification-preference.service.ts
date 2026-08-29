import { DigestCadence } from "@prisma/client";
import { db } from "@/lib/db";

export interface NotificationPreferenceData {
  emailEnabled: boolean;
  digestCadence: DigestCadence;
  moonieDailyEmail: boolean;
}

const DEFAULTS: NotificationPreferenceData = {
  emailEnabled: true,
  digestCadence: DigestCadence.WEEKLY,
  moonieDailyEmail: true,
};

export async function getNotificationPreference(
  userId: string
): Promise<NotificationPreferenceData> {
  const preference = await db.notificationPreference.findUnique({
    where: { userId },
  });
  if (!preference) return { ...DEFAULTS };

  return {
    emailEnabled: preference.emailEnabled,
    digestCadence: preference.digestCadence,
    moonieDailyEmail: preference.moonieDailyEmail,
  };
}

export async function updateNotificationPreference(
  userId: string,
  patch: Partial<NotificationPreferenceData>
): Promise<NotificationPreferenceData> {
  const current = await getNotificationPreference(userId);
  const next = { ...current, ...patch };

  await db.notificationPreference.upsert({
    where: { userId },
    create: { userId, ...next },
    update: next,
  });

  return next;
}
