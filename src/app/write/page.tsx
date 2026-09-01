import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { buildAuthenticatedWriteReviewHref } from "@/lib/write-entry";
import { WriteGateModalView } from "@/components/write/WriteGateModalView";

export const metadata = {
  title: "Write a Review | MoonVerse",
  description: "Create an account to write web novel reviews on MoonVerse.",
};

export default async function WriteGatePage({
  searchParams,
}: {
  searchParams: Promise<{ novelId?: string }>;
}) {
  const { novelId } = await searchParams;
  const session = await auth();
  if (session?.user?.id) {
    redirect(buildAuthenticatedWriteReviewHref(novelId));
  }

  return <WriteGateModalView novelId={novelId} />;
}
