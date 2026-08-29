import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrCreateDailyPick } from "@/services/moonie-daily.service";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const pick = await getOrCreateDailyPick(session.user.id);
    if (!pick) {
      return NextResponse.json({ pick: null });
    }

    return NextResponse.json({ pick });
  } catch (error) {
    console.error("[moonie/daily-pick]", error);
    return NextResponse.json(
      { error: "Moonie's daily pick is unavailable right now." },
      { status: 500 }
    );
  }
}
