import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { FOLDER_REVIEWS_PAGE_SIZE } from "@/lib/folder-reviews";
import { getFolderReviewsPage } from "@/services/folder.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();
  const { searchParams } = new URL(request.url);

  const offset = Number.parseInt(searchParams.get("offset") ?? "0", 10);
  const limit = Number.parseInt(
    searchParams.get("limit") ?? String(FOLDER_REVIEWS_PAGE_SIZE),
    10,
  );

  const result = await getFolderReviewsPage(
    id,
    session?.user?.id,
    Number.isFinite(offset) ? offset : 0,
    Number.isFinite(limit) ? limit : FOLDER_REVIEWS_PAGE_SIZE,
  );

  if (!result) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
