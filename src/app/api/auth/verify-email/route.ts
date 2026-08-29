import { NextResponse } from "next/server";
import { AuthTokenType } from "@prisma/client";
import { consumeAuthToken } from "@/lib/auth-tokens";
import { sendWelcomeEmail } from "@/lib/email/auth-emails";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!token) {
      return NextResponse.json({ error: "Token is required." }, { status: 400 });
    }

    const consumed = await consumeAuthToken(token, AuthTokenType.EMAIL_VERIFY);
    if (!consumed) {
      return NextResponse.json(
        { error: "This verification link is invalid or has expired." },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: consumed.userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "This verification link is invalid or has expired." },
        { status: 400 }
      );
    }

    const wasAlreadyVerified = Boolean(user.emailVerified);

    await db.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });

    if (!wasAlreadyVerified) {
      try {
        await sendWelcomeEmail({
          email: user.email,
          displayName: user.displayName,
        });
      } catch (error) {
        console.error("[verify-email] welcome email failed:", error);
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
