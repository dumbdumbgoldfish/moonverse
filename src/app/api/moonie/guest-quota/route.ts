import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { getSystemSettings } from "@/lib/system-settings";

const GUEST_TURNS_COOKIE = "mv-moonie-guest-turns";

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.id) {
      return NextResponse.json({ guestTurnsRemaining: null });
    }

    const settings = await getSystemSettings();
    const jar = await cookies();
    const turnsRaw = jar.get(GUEST_TURNS_COOKIE)?.value ?? "0";
    let turnsUsed = Number.parseInt(turnsRaw, 10);
    if (!Number.isFinite(turnsUsed) || turnsUsed < 0) {
      turnsUsed = 0;
    }

    return NextResponse.json({
      guestTurnsRemaining: Math.max(
        0,
        settings.guestMoonieDemoCap - turnsUsed
      ),
      guestDemoCap: settings.guestMoonieDemoCap,
    });
  } catch (error) {
    console.error("[moonie/guest-quota]", error);
    return NextResponse.json(
      { error: "Guest quota is unavailable right now." },
      { status: 500 }
    );
  }
}
