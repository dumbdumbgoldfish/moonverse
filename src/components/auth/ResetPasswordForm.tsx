"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { AuthTrustRow } from "@/components/auth/AuthTrustRow";
import { PasswordField } from "@/components/auth/PasswordField";
import { writeRememberedIdentifier } from "@/lib/auth-remember";
import { closeMooniePanel } from "@/lib/moonie/panel-open-state";
import { scorePassword } from "@/lib/password-strength";
import { cn } from "@/lib/utils";

type ResetTokenStatus = "valid" | "used" | "expired" | "invalid";

function ResetPasswordFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tokenStatus, setTokenStatus] = useState<ResetTokenStatus | null>(null);
  const [tokenMessage, setTokenMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function validateToken() {
      try {
        const res = await fetch(
          `/api/auth/reset-password?token=${encodeURIComponent(token)}`
        );
        const data = (await res.json().catch(() => null)) as {
          status?: ResetTokenStatus;
          message?: string | null;
        } | null;

        if (cancelled) return;

        const status = data?.status ?? "invalid";
        setTokenStatus(status);
        setTokenMessage(
          status === "valid"
            ? null
            : (data?.message ?? "This reset link is invalid or has expired.")
        );
      } catch {
        if (!cancelled) {
          setTokenStatus("invalid");
          setTokenMessage("This reset link is invalid or has expired.");
        }
      }
    }

    void validateToken();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = (await res.json().catch(() => null)) as {
      error?: string;
      email?: string;
    } | null;
    setLoading(false);
    if (!res.ok) {
      setError(data?.error ?? "Could not reset password.");
      return;
    }

    const email = typeof data?.email === "string" ? data.email.toLowerCase().trim() : "";
    if (email) {
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!signInResult?.error) {
        writeRememberedIdentifier(email);
        closeMooniePanel();
        router.push("/home");
        router.refresh();
        return;
      }
    }

    router.push(
      email
        ? `/login?reset=1&email=${encodeURIComponent(email)}`
        : "/login?reset=1"
    );
  }

  if (!token) {
    return (
      <AuthPanel eyebrow="Account recovery" title="Reset password" footer={<AuthTrustRow />}>
        <AuthAlert>
          Missing reset token. Request a new link from{" "}
          <Link href="/forgot-password" className="font-semibold underline">
            forgot password
          </Link>
          .
        </AuthAlert>
      </AuthPanel>
    );
  }

  if (tokenStatus === null) {
    return (
      <AuthPanel eyebrow="Account recovery" title="Reset password" footer={<AuthTrustRow />}>
        <p className="text-sm text-muted-foreground">Checking your reset link…</p>
      </AuthPanel>
    );
  }

  if (tokenStatus !== "valid") {
    return (
      <AuthPanel eyebrow="Account recovery" title="Reset password" footer={<AuthTrustRow />}>
        <AuthAlert>
          {tokenMessage ?? "This reset link is invalid or has expired."}{" "}
          <Link href="/forgot-password" className="font-semibold underline">
            Request a new link
          </Link>
          .
        </AuthAlert>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel
      eyebrow="Account recovery"
      title="Choose a new password"
      description="Use at least 8 characters, with a letter and a number."
      footer={<AuthTrustRow />}
    >
      <form onSubmit={onSubmit} className="space-y-4" aria-label="Reset password">
        {error ? <AuthAlert>{error}</AuthAlert> : null}
        <PasswordField
          id="password"
          name="password"
          label="New password"
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onValueChange={setPassword}
          showStrength
        />
        <PasswordField
          id="confirm-password"
          name="confirmPassword"
          label="Re-enter password"
          autoComplete="new-password"
          minLength={8}
          required
          value={confirmPassword}
          onValueChange={setConfirmPassword}
          error={
            confirmPassword && confirmPassword !== password ? "Passwords do not match." : undefined
          }
        />
        <button
          type="submit"
          disabled={loading || scorePassword(password).score < 2}
          className={cn(
            "mv-nav-signup inline-flex h-12 min-h-12 w-full items-center justify-center rounded-full text-[13px] font-semibold tracking-wide text-white disabled:opacity-50"
          )}
        >
          {loading ? "Saving…" : "Update password"}
        </button>
      </form>
    </AuthPanel>
  );
}

export function ResetPasswordForm() {
  return (
    <Suspense
      fallback={
        <div className="mv-auth-card p-8 text-center text-sm text-muted-foreground">Loading…</div>
      }
    >
      <ResetPasswordFormContent />
    </Suspense>
  );
}
