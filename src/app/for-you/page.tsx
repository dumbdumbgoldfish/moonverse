import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "For You · MoonVerse",
  description: "Personal novel recommendations curated by Moonie.",
};

export default async function ForYouPage() {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/home");
  }
  redirect("/discover");
}
