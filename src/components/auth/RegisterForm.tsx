"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/layout/AuthCard";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const username = formData.get("username");
    const displayName = formData.get("displayName");
    const email = formData.get("email");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (
      typeof username !== "string" ||
      typeof displayName !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof confirmPassword !== "string"
    ) {
      setError("All fields are required.");
      setIsLoading(false);
      return;
    }

    if (!username.trim() || !displayName.trim() || !email.trim() || !password) {
      setError("All fields are required.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username.trim(),
        displayName: displayName.trim(),
        email: email.trim(),
        password,
      }),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? "Registration failed.");
      setIsLoading(false);
      return;
    }

    const signInResult = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });

    if (signInResult?.error) {
      router.push("/login");
      return;
    }

    router.push("/reviews");
    router.refresh();
  }

  return (
    <AuthCard
      title="Join MoonVerse"
      description="Create an account to write reviews and save folders"
      footer={
        <p className="text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
          >
            Log in
          </Link>
        </p>
      }
    >
      <form
        className="space-y-4"
        onSubmit={handleSubmit}
        aria-label="Registration form"
      >
        {error && (
          <p
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="register-username">Username</Label>
          <Input
            id="register-username"
            name="username"
            autoComplete="username"
            placeholder="stargazer"
            pattern="[a-z0-9_]{3,30}"
            title="3–30 lowercase letters, numbers, or underscores"
            required
            aria-required="true"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-display-name">Display name</Label>
          <Input
            id="register-display-name"
            name="displayName"
            autoComplete="name"
            placeholder="Star Gazer"
            required
            aria-required="true"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-email">Email</Label>
          <Input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            aria-required="true"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-password">Password</Label>
          <Input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            aria-required="true"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-confirm">Confirm password</Label>
          <Input
            id="register-confirm"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            aria-required="true"
            disabled={isLoading}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthCard>
  );
}
