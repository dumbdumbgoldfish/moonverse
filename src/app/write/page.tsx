import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { WriteGateModalView } from "@/components/write/WriteGateModalView";

export const metadata = {
  title: "Write a Review | MoonVerse",
  description: "Create an account to write web novel reviews on MoonVerse.",
};

export default async function WriteGatePage() {
  const session = await auth();
  if (session?.user?.id) redirect("/reviews/new");

  return <WriteGateModalView />;
}
