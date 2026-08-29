"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { AUTH_INPUT_CLASS, AUTH_LABEL_CLASS } from "@/components/auth/auth-field";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { AuthTrustRow } from "@/components/auth/AuthTrustRow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Could not send reset email.");
      return;
    }
    setMessage(
      "If an account exists for that email, we sent a reset link. Check your inbox."
    );
  }

  return (
    <AuthPanel
      eyebrow="Account recovery"
      title="Forgot password"
      description="Enter the email on your account. If it exists, we’ll send a reset link."
      footer={<AuthTrustRow />}
    >
      <form onSubmit={onSubmit} className="space-y-4" aria-label="Forgot password">
        {error ? <AuthAlert>{error}</AuthAlert> : null}
        {message ? <AuthAlert tone="success">{message}</AuthAlert> : null}
        <div className="space-y-2">
          <Label htmlFor="email" className={AUTH_LABEL_CLASS}>
            Email
          </Label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#1A1224]/35"
              aria-hidden
            />
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              className={cn(AUTH_INPUT_CLASS, "pl-11")}
              placeholder="you@example.com"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mv-nav-signup inline-flex h-12 min-h-12 w-full items-center justify-center rounded-full text-[13px] font-semibold tracking-wide text-white disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-[#1A1224]/60">
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Back to log in
        </Link>
      </p>
    </AuthPanel>
  );
}
