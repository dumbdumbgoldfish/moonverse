import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email/auth-emails";
import { isValidEmail } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.toLowerCase().trim() : "";

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Always return success to avoid email enumeration.
    const user = await db.user.findUnique({ where: { email } });
    if (user && !user.isSuspended) {
      try {
        await sendPasswordResetEmail({
          id: user.id,
          email: user.email,
          displayName: user.displayName,
        });
      } catch (error) {
        console.error("[forgot-password] reset email failed:", error);
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
