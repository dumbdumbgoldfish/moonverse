import { db } from "@/lib/db";

export interface SystemSettingsValue {
  requireEmailVerified: boolean;
  digestEnabled: boolean;
  guestMoonieDemoCap: number;
}

const DEFAULTS: SystemSettingsValue = {
  requireEmailVerified: false,
  digestEnabled: true,
  guestMoonieDemoCap: 3,
};

const KEY = "platform";

export async function getSystemSettings(): Promise<SystemSettingsValue> {
  const row = await db.systemSetting.findUnique({ where: { key: KEY } });
  if (!row || typeof row.value !== "object" || row.value === null) {
    return { ...DEFAULTS };
  }
  const value = row.value as Partial<SystemSettingsValue>;
  return {
    requireEmailVerified:
      typeof value.requireEmailVerified === "boolean"
        ? value.requireEmailVerified
        : DEFAULTS.requireEmailVerified,
    digestEnabled:
      typeof value.digestEnabled === "boolean"
        ? value.digestEnabled
        : DEFAULTS.digestEnabled,
    guestMoonieDemoCap:
      typeof value.guestMoonieDemoCap === "number"
        ? Math.max(1, Math.min(20, value.guestMoonieDemoCap))
        : DEFAULTS.guestMoonieDemoCap,
  };
}

export async function updateSystemSettings(
  patch: Partial<SystemSettingsValue>
): Promise<SystemSettingsValue> {
  const current = await getSystemSettings();
  const next = { ...current, ...patch };
  await db.systemSetting.upsert({
    where: { key: KEY },
    create: { key: KEY, value: next },
    update: { value: next },
  });
  return next;
}
