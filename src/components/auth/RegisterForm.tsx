"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Mail, User } from "lucide-react";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { AuthBirthdayFields } from "@/components/auth/AuthBirthdayFields";
import { AUTH_INPUT_CLASS, AUTH_LABEL_CLASS } from "@/components/auth/auth-field";
import { AuthFieldNote, AuthRequirementList } from "@/components/auth/AuthFieldNote";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { AuthSocialBlock } from "@/components/auth/AuthSocialBlock";
import { AuthTrustRow } from "@/components/auth/AuthTrustRow";
import { PasswordField } from "@/components/auth/PasswordField";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { safeAuthCallbackPath } from "@/lib/auth-callback";
import { isDefaultHomePath } from "@/lib/home-view";
import { birthdayGateError, isoFromParts, type BirthdayParts } from "@/lib/birthday";
import { scorePassword } from "@/lib/password-strength";
import { LIMITS, USERNAME_PATTERN, isValidEmail } from "@/lib/validation";
import { cn } from "@/lib/utils";

function validatePassword(value: string): string | null {
  if (value.length < LIMITS.password.min) {
    return `Password must be at least ${LIMITS.password.min} characters.`;
  }
  if (value.length > LIMITS.password.max) return "Password is too long.";
  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
    return "Use at least one letter and one number.";
  }
  return null;
}

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = safeAuthCallbackPath(searchParams.get("callbackUrl"));
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [birthday, setBirthday] = useState<BirthdayParts>({ year: "", month: "", day: "" });
  const [birthdayError, setBirthdayError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handlePreview = useMemo(() => {
    const cleaned = username.trim().toLowerCase();
    return cleaned ? `@${cleaned}` : "@your_handle";
  }, [username]);

  const usernameRules = useMemo(
    () => [
      {
        id: "len",
        label: "3–30 characters",
        met: username.length >= 3 && username.length <= 30,
      },
      {
        id: "set",
        label: "Lowercase letters, numbers or _ only",
        met: username.length > 0 && /^[a-z0-9_]+$/.test(username),
      },
    ],
    [username]
  );

  const usernameReady = USERNAME_PATTERN.test(username.trim());
  const emailReady = isValidEmail(email.trim().toLowerCase());

  function validateStepOne() {
    const next: Record<string, string> = {};
    const trimmedUsername = username.trim().toLowerCase();
    const trimmedEmail = email.trim().toLowerCase();

    if (!USERNAME_PATTERN.test(trimmedUsername)) {
      next.username = "3–30 characters: lowercase letters, numbers or underscores.";
    }
    if (!isValidEmail(trimmedEmail)) {
      next.email = "Enter a valid email address.";
    }
    const passwordError = validatePassword(password);
    if (passwordError) next.password = passwordError;
    if (password !== confirmPassword) next.confirmPassword = "Passwords do not match.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (step === 1) {
      if (validateStepOne()) setStep(2);
      return;
    }

    if (!acceptedTerms) {
      setError("Please accept the Terms of Service and Privacy Policy.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const birthdayIso = isoFromParts(birthday) ?? String(formData.get("birthday") ?? "");
    const nextBirthdayError = birthdayGateError(birthdayIso || null);
    if (nextBirthdayError) {
      setBirthdayError(nextBirthdayError);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      setStep(1);
      return;
    }

    setIsLoading(true);
    const trimmedUsername = username.trim().toLowerCase();
    const trimmedEmail = email.trim().toLowerCase();

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: trimmedUsername,
        displayName: trimmedUsername,
        email: trimmedEmail,
        password,
      }),
    });

    const data = (await response.json()) as {
      error?: string;
      verificationEmailSent?: boolean;
    };

    if (!response.ok) {
      setError(data.error ?? "Registration failed.");
      setIsLoading(false);
      if (data.error?.toLowerCase().includes("username") || data.error?.toLowerCase().includes("email")) {
        setStep(1);
      }
      return;
    }

    const loginParams = new URLSearchParams({
      registered: "1",
      email: trimmedEmail,
      verify: data.verificationEmailSent ? "sent" : "failed",
    });
    if (callbackUrl && !isDefaultHomePath(callbackUrl)) {
      loginParams.set("callbackUrl", callbackUrl);
    }
    router.push(`/login?${loginParams.toString()}`);
  }

  return (
    <AuthPanel
      eyebrow="Open a desk"
      title="Create your account"
      description="Two short steps. Then Moonie can start learning your taste."
      footer={<AuthTrustRow />}
    >
      <ol className="mv-auth-stepper mb-6" aria-label="Sign up steps">
        <li>
          <button
            type="button"
            className="mv-auth-step"
            aria-current={step === 1 ? "step" : undefined}
            data-complete={step === 2 ? "true" : undefined}
            onClick={() => {
              setError(null);
              setStep(1);
            }}
          >
            <span className="mv-auth-step-index">
              {step === 2 ? <Check className="size-3.5" aria-hidden /> : "1"}
            </span>
            Account
          </button>
        </li>
        <li className="mv-auth-step-rule" aria-hidden />
        <li>
          <span
            className="mv-auth-step"
            aria-current={step === 2 ? "step" : undefined}
          >
            <span className="mv-auth-step-index">2</span>
            Age & terms
          </span>
        </li>
      </ol>

      <form className="space-y-4" onSubmit={handleSubmit} aria-label="Registration form">
        {error ? <AuthAlert>{error}</AuthAlert> : null}

        <div className={cn("space-y-4", step !== 1 && "hidden")}>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <Label htmlFor="register-username" className={AUTH_LABEL_CLASS}>
                Username
              </Label>
              <span className="text-[11px] font-medium text-[#1A1224]/40">
                {username.length}/30 · {handlePreview}
              </span>
            </div>
            <div className="relative">
              <User
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#1A1224]/35"
                aria-hidden
              />
              <Input
                id="register-username"
                name="username"
                autoComplete="username"
                placeholder="your_username"
                className={cn(AUTH_INPUT_CLASS, "pl-11 pr-11")}
                maxLength={30}
                required={step === 1}
                aria-required="true"
                aria-invalid={Boolean(fieldErrors.username) || (username.length > 0 && !usernameReady)}
                aria-describedby="register-username-help"
                disabled={isLoading}
                value={username}
                onChange={(event) => setUsername(event.target.value.toLowerCase())}
              />
              {usernameReady ? (
                <Check
                  className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-emerald-600"
                  aria-hidden
                />
              ) : null}
            </div>
            <div id="register-username-help">
              {fieldErrors.username ? (
                <AuthFieldNote tone="error">{fieldErrors.username}</AuthFieldNote>
              ) : (
                <AuthRequirementList items={usernameRules} started={username.length > 0} />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-email" className={AUTH_LABEL_CLASS}>
              Email
            </Label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#1A1224]/35"
                aria-hidden
              />
              <Input
                id="register-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={cn(AUTH_INPUT_CLASS, "pl-11 pr-11")}
                required={step === 1}
                aria-required="true"
                aria-invalid={Boolean(fieldErrors.email) || (email.length > 0 && !emailReady)}
                aria-describedby="register-email-help"
                disabled={isLoading}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              {emailReady ? (
                <Check
                  className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-emerald-600"
                  aria-hidden
                />
              ) : null}
            </div>
            <div id="register-email-help">
              {fieldErrors.email ? (
                <AuthFieldNote tone="error">{fieldErrors.email}</AuthFieldNote>
              ) : (
                <AuthFieldNote>
                  Sign-in and recovery only. Never shown to other readers.
                </AuthFieldNote>
              )}
            </div>
          </div>

          <PasswordField
            id="register-password"
            name="password"
            label="Password"
            placeholder="Create password"
            autoComplete="new-password"
            minLength={8}
            required={step === 1}
            disabled={isLoading}
            value={password}
            onValueChange={setPassword}
            showStrength
            error={fieldErrors.password}
          />

          <PasswordField
            id="register-confirm"
            name="confirmPassword"
            label="Re-enter password"
            placeholder="Re-enter password"
            autoComplete="new-password"
            minLength={8}
            required={step === 1}
            disabled={isLoading}
            value={confirmPassword}
            onValueChange={setConfirmPassword}
            error={
              fieldErrors.confirmPassword ||
              (confirmPassword && confirmPassword !== password ? "Passwords do not match." : undefined)
            }
          />
        </div>

        <div className={cn("space-y-4", step !== 2 && "hidden")}>
          <AuthBirthdayFields
            value={birthday}
            onChange={(next) => {
              setBirthday(next);
              setBirthdayError(null);
            }}
            disabled={isLoading}
            required={step === 2}
            error={birthdayError}
          />

          <label className="flex items-start gap-2.5 text-sm leading-snug text-[#1A1224]/70">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
              className="mt-0.5 size-4 rounded border-[#6E46C7]/30 accent-primary"
              disabled={isLoading}
            />
            <span>
              I agree to the{" "}
              <Link
                href="/terms"
                className="font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:rounded-sm"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:rounded-sm"
              >
                Privacy Policy
              </Link>
              .
            </span>
          </label>
        </div>

        <div className="flex gap-2">
          {step === 2 ? (
            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                setError(null);
                setStep(1);
              }}
              className="mv-nav-login inline-flex h-12 min-h-12 flex-1 items-center justify-center rounded-full text-[13px] font-semibold tracking-wide disabled:opacity-50"
            >
              Back
            </button>
          ) : null}
          <button
            type="submit"
            disabled={isLoading || (step === 1 && scorePassword(password).score < 2)}
            className={cn(
              "mv-nav-signup inline-flex h-12 min-h-12 flex-[1.6] items-center justify-center rounded-full text-[13px] font-semibold tracking-wide text-white",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              "disabled:opacity-50"
            )}
          >
            {isLoading ? "Creating account…" : step === 1 ? "Continue" : "Create account"}
          </button>
        </div>
      </form>

      {step === 1 ? (
        <AuthSocialBlock callbackUrl="/onboarding/genres" disabled={isLoading} />
      ) : null}
      <p className="mt-5 text-center text-sm text-[#1A1224]/60">
        Already have an account?{" "}
        <Link
          href={
            callbackUrl && !isDefaultHomePath(callbackUrl)
              ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
              : "/login"
          }
          className="font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:rounded-sm"
        >
          Log in
        </Link>
      </p>
    </AuthPanel>
  );
}

export function RegisterForm() {
  return (
    <Suspense
      fallback={
        <div className="mv-auth-card p-8 text-center text-sm text-muted-foreground">Loading…</div>
      }
    >
      <RegisterFormContent />
    </Suspense>
  );
}
