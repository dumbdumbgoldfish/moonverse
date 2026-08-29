import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { AuthTokenType } from "@prisma/client";
import {
  claimAuthTokenInTransaction,
  inspectAuthToken,
  passwordResetStatusMessage,
} from "@/lib/auth-tokens";
import { db } from "@/lib/db";
import { LIMITS } from "@/lib/validation";

function readTokenFromRequest(request: Request): string {
  const url = new URL(request.url);
  return url.searchParams.get("token")?.trim() ?? "";
}

export async function GET(request: Request) {
  try {
    const token = readTokenFromRequest(request);
    const status = await inspectAuthToken(token, AuthTokenType.PASSWORD_RESET);

    return NextResponse.json({
      status,
      message: status === "valid" ? null : passwordResetStatusMessage(status),
    });
  } catch {
    return NextResponse.json(
      { status: "invalid", message: passwordResetStatusMessage("invalid") },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!token) {
      return NextResponse.json({ error: "Reset token is required." }, { status: 400 });
    }
    if (password.length < LIMITS.password.min) {
      return NextResponse.json(
        { error: `Password must be at least ${LIMITS.password.min} characters.` },
        { status: 400 }
      );
    }
    if (password.length > LIMITS.password.max) {
      return NextResponse.json({ error: "Password is too long." }, { status: 400 });
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: "Use at least one letter and one number." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const updated = await db.$transaction(async (tx) => {
      const claimed = await claimAuthTokenInTransaction(
        tx,
        token,
        AuthTokenType.PASSWORD_RESET
      );
      if (!claimed) return null;

      return tx.user.update({
        where: { id: claimed.userId },
        data: {
          passwordHash,
          emailVerified: new Date(),
        },
        select: { email: true },
      });
    });

    if (!updated) {
      const status = await inspectAuthToken(token, AuthTokenType.PASSWORD_RESET);
      return NextResponse.json(
        { error: passwordResetStatusMessage(status) },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, email: updated.email });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
