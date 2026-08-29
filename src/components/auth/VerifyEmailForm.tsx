"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { AUTH_INPUT_CLASS, AUTH_LABEL_CLASS } from "@/components/auth/auth-field";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { AuthTrustRow } from "@/components/auth/AuthTrustRow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const emailFromQuery = searchParams.get("email")?.trim().toLowerCase() ?? "";
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email…");
  const [resendEmail, setResendEmail] = useState(emailFromQuery);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (emailFromQuery) {
      setResendEmail(emailFromQuery);
    }
  }, [emailFromQuery]);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setStatus("error");
        setMessage(data?.error ?? "This verification link is invalid or has expired.");
        return;
      }
      setStatus("ok");
      setMessage("Email verified. Welcome to MoonVerse — you can log in now.");
    })();
  }, [token]);

  async function handleResend(event: React.FormEvent) {
    event.preventDefault();
    setResendLoading(true);
    setResendMessage(null);
    setResendError(null);

    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: resendEmail }),
    });

    setResendLoading(false);

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setResendError(data?.error ?? "Could not send verification email.");
      return;
    }

    setResendMessage(
      "If an account exists for that email and still needs verification, we sent a new link."
    );
  }

  const resolvedStatus = !token ? "error" : status;
  const resolvedMessage = !token
    ? "Missing verification token. Request a new link below."
    : message;

  return (
    <AuthPanel
      eyebrow="Account"
      title="Verify email"
      description="Confirming this address keeps your reviews and lists attached to you."
      footer={<AuthTrustRow />}
    >
      {emailFromQuery && !token ? (
        <div className="mb-4">
          <AuthAlert tone="info">
            Enter your email below to request a new verification link.
          </AuthAlert>
        </div>
      ) : null}

      {resolvedStatus === "loading" ? (
        <AuthAlert tone="info">{resolvedMessage}</AuthAlert>
      ) : (
        <AuthAlert tone={resolvedStatus === "ok" ? "success" : "error"}>
          {resolvedMessage}
        </AuthAlert>
      )}

      {resolvedStatus !== "ok" ? (
        <form onSubmit={handleResend} className="mt-5 space-y-3" aria-label="Resend verification email">
          <div className="space-y-2">
            <Label htmlFor="resend-email" className={AUTH_LABEL_CLASS}>
              Resend verification email
            </Label>
            <Input
              id="resend-email"
              type="email"
              required
              value={resendEmail}
              onChange={(event) => setResendEmail(event.target.value)}
              autoComplete="email"
              className={AUTH_INPUT_CLASS}
              placeholder="you@example.com"
            />
          </div>
          {resendError ? <AuthAlert tone="error">{resendError}</AuthAlert> : null}
          {resendMessage ? <AuthAlert tone="success">{resendMessage}</AuthAlert> : null}
          <button
            type="submit"
            disabled={resendLoading}
            className={cn(
              "inline-flex h-11 w-full items-center justify-center rounded-full border border-violet-200 bg-white text-[13px] font-semibold text-[#1A1224] transition hover:bg-violet-50 disabled:opacity-50"
            )}
          >
            {resendLoading ? "Sending…" : "Resend verification email"}
          </button>
        </form>
      ) : null}

      <Link
        href={resolvedStatus === "ok" ? "/login?verified=1" : "/login"}
        className="mv-nav-signup mt-5 inline-flex h-12 min-h-12 w-full items-center justify-center rounded-full text-[13px] font-semibold tracking-wide text-white"
      >
        Go to log in
      </Link>
    </AuthPanel>
  );
}

export function VerifyEmailForm() {
  return (
    <Suspense
      fallback={
        <div className="mv-auth-card p-8 text-center text-sm text-muted-foreground">Loading…</div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
