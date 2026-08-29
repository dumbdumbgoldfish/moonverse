import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getReadingListShelfNovelsPage,
} from "@/services/folder.service";
import { READING_LIST_SHELF_PAGE_SIZE } from "@/lib/reading-list-shelf";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();
  const { searchParams } = new URL(request.url);

  const offset = Number.parseInt(searchParams.get("offset") ?? "0", 10);
  const limit = Number.parseInt(
    searchParams.get("limit") ?? String(READING_LIST_SHELF_PAGE_SIZE),
    10
  );

  const result = await getReadingListShelfNovelsPage(
    id,
    session?.user?.id,
    Number.isFinite(offset) ? offset : 0,
    Number.isFinite(limit) ? limit : READING_LIST_SHELF_PAGE_SIZE
  );

  if (!result) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
