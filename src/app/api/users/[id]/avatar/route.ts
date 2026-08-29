import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  isInlineSessionImage,
  parseInlineImageDataUrl,
} from "@/lib/session-image";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const user = await db.user.findUnique({
    where: { id },
    select: { avatarUrl: true, updatedAt: true },
  });

  if (!user?.avatarUrl?.trim()) {
    return new NextResponse(null, { status: 404 });
  }

  const avatarUrl = user.avatarUrl.trim();

  if (isInlineSessionImage(avatarUrl)) {
    const parsed = parseInlineImageDataUrl(avatarUrl);
    if (!parsed) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(new Uint8Array(parsed.buffer), {
      headers: {
        "Content-Type": parsed.mime,
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        ETag: `"${user.updatedAt.getTime()}"`,
      },
    });
  }

  if (/^https?:\/\//i.test(avatarUrl)) {
    return NextResponse.redirect(avatarUrl, 307);
  }

  if (avatarUrl.startsWith("/") && !avatarUrl.startsWith("//")) {
    return NextResponse.redirect(new URL(avatarUrl, _request.url), 307);
  }

  return new NextResponse(null, { status: 404 });
}
