import { NextResponse } from "next/server";
import { getBrowseWorkPreview } from "@/services/browse.service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const novelId = searchParams.get("novelId")?.trim();

  if (!novelId) {
    return NextResponse.json(
      { error: "novelId is required." },
      { status: 400 }
    );
  }

  const preview = await getBrowseWorkPreview(novelId);
  if (!preview) {
    return NextResponse.json({ error: "Work not found." }, { status: 404 });
  }

  return NextResponse.json({ preview });
}
