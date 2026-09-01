import { NextResponse } from "next/server";
import { sendVerificationEmail } from "@/lib/email/auth-emails";
import { db } from "@/lib/db";
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

    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        displayName: true,
        emailVerified: true,
        passwordHash: true,
        isSuspended: true,
      },
    });

    if (
      user &&
      !user.emailVerified &&
      user.passwordHash &&
      !user.isSuspended
    ) {
      try {
        await sendVerificationEmail(
          {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
          },
          { requestUrl: request.url }
        );
      } catch (error) {
        console.error("[resend-verification] email failed:", error);
      }
    }

    return NextResponse.json({
      success: true,
      message:
        "If an account exists for that email and still needs verification, we sent a new link.",
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
