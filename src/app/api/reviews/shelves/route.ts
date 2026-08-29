import { NextResponse } from "next/server";
import { loadReviewsSalonShelvesForUser } from "@/components/reviews/salon/ReviewsSalonShelvesServer";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  const isLoggedIn = !!session?.user?.id;
  const data = await loadReviewsSalonShelvesForUser(
    isLoggedIn,
    session?.user?.id
  );

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
    },
  });
}
