import type { ReactNode } from "react";
import { requireOnboardedUser } from "@/lib/onboarding-guard";
import { getOrCreateDailyPick } from "@/services/moonie-daily.service";

export default async function HomeLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireOnboardedUser("/home");
  void getOrCreateDailyPick(session.user.id).catch(() => {});
  return children;
}
