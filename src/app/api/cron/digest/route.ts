import { DigestCadence, NotificationType } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { buildDigestEmailTemplate } from "@/lib/email/templates/digest";
import { buildMoonieDailyPickEmailTemplate } from "@/lib/email/templates/moonie-daily";
import { createNotification } from "@/services/notification.service";
import { getOrCreateDailyPick } from "@/services/moonie-daily.service";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";

  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;

  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}

async function runDigestForCadence(cadence: DigestCadence): Promise<number> {
  const since = new Date(
    Date.now() - (cadence === "DAILY" ? 1 : 7) * 24 * 60 * 60 * 1000
  );

  const preferences = await db.notificationPreference.findMany({
    where: { emailEnabled: true, digestCadence: cadence },
    include: { user: { select: { id: true, email: true, displayName: true } } },
  });

  let sent = 0;

  for (const preference of preferences) {
    const unreadCount = await db.notification.count({
      where: { userId: preference.userId, createdAt: { gte: since } },
    });
    if (unreadCount === 0) continue;

    const message = `You have ${unreadCount} new notification${unreadCount === 1 ? "" : "s"} on MoonVerse this ${cadence === "DAILY" ? "day" : "week"}.`;

    await createNotification({
      userId: preference.userId,
      type: NotificationType.DIGEST,
      message,
      link: "/notifications",
    });

    if (isEmailConfigured() && preference.user.email) {
      const template = await buildDigestEmailTemplate({
        displayName: preference.user.displayName,
        cadence,
        unreadCount,
      });
      await sendEmail({
        to: preference.user.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
    }

    sent += 1;
  }

  return sent;
}

async function runMoonieDailyEmails(): Promise<number> {
  if (!isEmailConfigured()) return 0;

  const now = new Date();
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const preferences = await db.notificationPreference.findMany({
    where: { emailEnabled: true, moonieDailyEmail: true },
    include: { user: { select: { id: true, email: true, displayName: true } } },
  });

  let sent = 0;
  for (const preference of preferences) {
    if (!preference.user.email) continue;

    const alreadySent = await db.moonieRecommendationEvent.findFirst({
      where: {
        userId: preference.userId,
        event: "DAILY_PICK_EMAIL",
        createdAt: { gte: todayStart },
      },
      select: { id: true },
    });
    if (alreadySent) continue;

    const pick = await getOrCreateDailyPick(preference.userId);
    if (!pick) continue;

    const template = await buildMoonieDailyPickEmailTemplate({
      displayName: preference.user.displayName,
      novelTitle: pick.novelTitle,
      reason: pick.reason,
      reviewId: pick.reviewId,
    });
    const result = await sendEmail({
      to: preference.user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
    if (!result.ok) continue;

    await db.moonieRecommendationEvent.create({
      data: {
        userId: preference.userId,
        novelId: pick.novelId,
        event: "DAILY_PICK_EMAIL",
      },
    });
    sent += 1;
  }

  return sent;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const cadenceParam = url.searchParams.get("cadence")?.toUpperCase();
  const cadences: DigestCadence[] =
    cadenceParam === "DAILY" || cadenceParam === "WEEKLY"
      ? [cadenceParam]
      : ["DAILY", "WEEKLY"];

  const results: Record<string, number> = {};
  for (const cadence of cadences) {
    results[cadence] = await runDigestForCadence(cadence);
  }
  if (cadences.includes(DigestCadence.DAILY)) {
    results.MOONIE_DAILY = await runMoonieDailyEmails();
  }

  return NextResponse.json({ ok: true, sent: results });
}

export async function POST(request: Request) {
  return GET(request);
}
