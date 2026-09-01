import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email/auth-emails";
import { wasEmailDelivered } from "@/lib/email/send";
import { isValidEmail, LIMITS, USERNAME_PATTERN } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username =
      typeof body.username === "string" ? body.username.toLowerCase().trim() : "";
    const displayName =
      typeof body.displayName === "string" ? body.displayName.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!username || !displayName || !email || !password) {
      return NextResponse.json(
        { error: "Username, display name, email and password are required." },
        { status: 400 }
      );
    }

    if (!USERNAME_PATTERN.test(username)) {
      return NextResponse.json(
        {
          error:
            "Username must be 3–30 characters and contain only lowercase letters, numbers and underscores.",
        },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (displayName.length > LIMITS.displayName.max) {
      return NextResponse.json(
        { error: `Display name must be ${LIMITS.displayName.max} characters or fewer.` },
        { status: 400 }
      );
    }

    if (password.length < LIMITS.password.min) {
      return NextResponse.json(
        { error: `Password must be at least ${LIMITS.password.min} characters.` },
        { status: 400 }
      );
    }

    if (password.length > LIMITS.password.max) {
      return NextResponse.json(
        { error: "Password is too long." },
        { status: 400 }
      );
    }

    const existingUser = await db.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "This username is already taken." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        username,
        displayName,
        email,
        passwordHash,
        notificationPreference: { create: {} },
      },
    });

    let verificationEmailSent = false;
    try {
      const emailResult = await sendVerificationEmail(
        {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
        },
        { requestUrl: request.url }
      );
      verificationEmailSent = wasEmailDelivered(emailResult);
    } catch (error) {
      console.error("[register] verification email failed:", error);
    }

    return NextResponse.json(
      { success: true, verificationEmailSent },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
