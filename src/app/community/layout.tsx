import type { ReactNode } from "react";
import { requireOnboardedUser } from "@/lib/onboarding-guard";
import { COMMUNITY_PATH } from "@/lib/home-view";

export default async function CommunityLayout({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  await requireOnboardedUser(COMMUNITY_PATH);
  return (
    <>
      {children}
      {modal}
    </>
  );
}
