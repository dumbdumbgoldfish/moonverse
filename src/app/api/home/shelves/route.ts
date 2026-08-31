import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getPersonalizedHomeShelves } from "@/services/home-shelves.service";

export async function GET() {
  const session = await getSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const shelves = await getPersonalizedHomeShelves(userId);
    return NextResponse.json(shelves, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown_shelf_load_error";
    console.error("[api/home/shelves] shelf_load_failed", {
      userId,
      code: message.slice(0, 120),
    });
    return NextResponse.json({ error: "shelf_load_failed" }, { status: 503 });
  }
}
