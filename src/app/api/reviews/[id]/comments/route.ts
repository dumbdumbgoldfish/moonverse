import { NextResponse } from "next/server";
import { getCommentsByReviewId } from "@/services/comment.service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing review id" }, { status: 400 });
  }

  try {
    const comments = await getCommentsByReviewId(id);
    return NextResponse.json({ comments });
  } catch {
    return NextResponse.json(
      { error: "Unable to load comments" },
      { status: 500 }
    );
  }
}
