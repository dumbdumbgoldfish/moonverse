import { NextResponse } from "next/server";
import { loadCommunityReviewModal } from "@/lib/community-review-modal";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const data = await loadCommunityReviewModal(id);
    if (!data) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("Community review modal failed", error);
    return NextResponse.json(
      { error: "Unable to load review." },
      { status: 500 }
    );
  }
}
