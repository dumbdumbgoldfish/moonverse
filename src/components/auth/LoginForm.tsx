"use client";

import { Suspense, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { Mail } from "lucide-react";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { AUTH_INPUT_CLASS, AUTH_LABEL_CLASS } from "@/components/auth/auth-field";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { AuthSocialBlock } from "@/components/auth/AuthSocialBlock";
import { AuthTrustRow } from "@/components/auth/AuthTrustRow";
import { PasswordField } from "@/components/auth/PasswordField";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  readRememberedIdentifier,
  writeRememberedIdentifier,
} from "@/lib/auth-remember";
import { safeAuthCallbackPath } from "@/lib/auth-callback";
import { defaultPathForRole } from "@/lib/admin-redirect";
import { isDefaultHomePath } from "@/lib/home-view";
import { closeMooniePanel } from "@/lib/moonie/panel-open-state";
import { LIMITS, isValidEmail } from "@/lib/validation";
import { cn } from "@/lib/utils";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = safeAuthCallbackPath(searchParams.get("callbackUrl"));
  const resetOk = searchParams.get("reset") === "1";
  const verified = searchParams.get("verified") === "1";
  const registered = searchParams.get("registered") === "1";
  const verifyStatus = searchParams.get("verify");
  const emailFromQuery = searchParams.get("email")?.trim().toLowerCase() ?? "";

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const remembered = useSyncExternalStore(
    () => () => {},
    readRememberedIdentifier,
    () => ""
  );
  const [identifierDraft, setIdentifierDraft] = useState<string | null>(null);
  const identifier = identifierDraft ?? emailFromQuery ?? remembered;
  const [remember, setRemember] = useState(true);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const loginIdentifier = identifier.trim();
    const loginPassword = password;

    if (!loginIdentifier || !loginPassword) {
      setError("Email or username and password are required.");
      setIsLoading(false);
      return;
    }

    if (loginIdentifier.includes("@") && !isValidEmail(loginIdentifier.toLowerCase())) {
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    if (loginPassword.length < LIMITS.password.min) {
      setError(`Password must be at least ${LIMITS.password.min} characters.`);
      setIsLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email: loginIdentifier.toLowerCase(),
      password: loginPassword,
      redirect: false,
    });

    if (result?.error) {
      setError("Those details didn’t match. Check the email or username, or reset your password.");
      setIsLoading(false);
      return;
    }

    writeRememberedIdentifier(remember ? loginIdentifier : null);
    closeMooniePanel();
    const session = await getSession();
    const destination =
      session?.user?.role && isDefaultHomePath(callbackUrl)
        ? defaultPathForRole(session.user.role)
        : callbackUrl;
    router.push(destination);
    router.refresh();
  }

  return (
    <AuthPanel
      eyebrow="Reader desk"
      title="Welcome back"
      description="Log in to continue discovering, reviewing and saving web novels."
      footer={<AuthTrustRow />}
    >
      <form className="space-y-4" onSubmit={handleSubmit} aria-label="Login form">
        {error ? (
          <AuthAlert>
            {error}{" "}
            <Link href="/forgot-password" className="font-semibold underline-offset-2 hover:underline">
              Forgot password?
            </Link>
          </AuthAlert>
        ) : null}
        {resetOk && !error ? (
          <AuthAlert tone="success">Password updated. You can log in now.</AuthAlert>
        ) : null}
        {verified && !error ? (
          <AuthAlert tone="success">Email verified. You can log in now.</AuthAlert>
        ) : null}
        {registered && verifyStatus === "sent" && !error ? (
          <AuthAlert tone="success">
            Account created. We sent a verification link
            {emailFromQuery ? ` to ${emailFromQuery}` : ""}. Check your inbox,
            then sign in.
          </AuthAlert>
        ) : null}
        {registered && verifyStatus === "failed" && !error ? (
          <AuthAlert tone="info">
            Account created, but we could not send a verification email right
            now. You can still sign in, or{" "}
            <Link
              href={
                emailFromQuery
                  ? `/verify-email?email=${encodeURIComponent(emailFromQuery)}`
                  : "/verify-email"
              }
              className="font-semibold underline-offset-2 hover:underline"
            >
              request a new verification link
            </Link>
            .
          </AuthAlert>
        ) : null}
        {registered && !verifyStatus && !error ? (
          <AuthAlert tone="success">
            Account created. Sign in to set your reading taste and continue.
          </AuthAlert>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="login-email" className={AUTH_LABEL_CLASS}>
            Email or username
          </Label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#1A1224]/35"
              aria-hidden
            />
            <Input
              id="login-email"
              name="email"
              type="text"
              autoComplete="username"
              placeholder="you@example.com or username"
              className={cn(AUTH_INPUT_CLASS, "pl-11")}
              required
              aria-required="true"
              disabled={isLoading}
              value={identifier}
              onChange={(event) => setIdentifierDraft(event.target.value)}
            />
          </div>
        </div>

        <PasswordField
          id="login-password"
          name="password"
          label="Password"
          placeholder="Your password"
          autoComplete="current-password"
          required
          disabled={isLoading}
          value={password}
          onValueChange={setPassword}
        />

        <div className="flex items-center justify-between gap-4 text-sm">
          <label className="flex min-h-11 cursor-pointer items-center gap-2 font-medium text-[#1A1224]/75">
            <input
              type="checkbox"
              name="remember"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="size-4 rounded border-[#6E46C7]/30 accent-primary"
            />
            Remember email
          </label>
          <Link
            href="/forgot-password"
            className="font-bold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:rounded-sm"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "mv-nav-signup inline-flex h-12 min-h-12 w-full items-center justify-center rounded-full text-[13px] font-semibold tracking-wide text-white",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            "disabled:opacity-50"
          )}
        >
          {isLoading ? "Signing in…" : "Log in"}
        </button>
      </form>

      <AuthSocialBlock callbackUrl={callbackUrl} disabled={isLoading} />
      <p className="mt-5 text-center text-sm text-[#1A1224]/60">
        New to MoonVerse?{" "}
        <Link
          href={
            callbackUrl && !isDefaultHomePath(callbackUrl)
              ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`
              : "/register"
          }
          className="font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:rounded-sm"
        >
          Create account
        </Link>
      </p>
    </AuthPanel>
  );
}

export function LoginForm() {
  return (
    <Suspense
      fallback={
        <div className="mv-auth-card p-8 text-center text-sm text-muted-foreground">Loading…</div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
