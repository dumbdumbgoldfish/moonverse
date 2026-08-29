"use client";

import { AuthDivider } from "@/components/auth/AuthDivider";
import { AuthSocialButton } from "@/components/auth/AuthSocialButton";
import { signIn } from "next-auth/react";

const googleEnabled = process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true";
const discordEnabled = process.env.NEXT_PUBLIC_AUTH_DISCORD_ENABLED === "true";

interface AuthSocialBlockProps {
  callbackUrl: string;
  disabled?: boolean;
}

export function AuthSocialBlock({ callbackUrl, disabled }: AuthSocialBlockProps) {
  if (!googleEnabled && !discordEnabled) return null;

  return (
    <div className="mt-5 space-y-3">
      <AuthDivider />
      {googleEnabled ? (
        <AuthSocialButton
          provider="google"
          label="Continue with Google"
          disabled={disabled}
          onClick={() => void signIn("google", { callbackUrl })}
        />
      ) : null}
      {discordEnabled ? (
        <AuthSocialButton
          provider="discord"
          label="Continue with Discord"
          disabled={disabled}
          onClick={() => void signIn("discord", { callbackUrl })}
        />
      ) : null}
    </div>
  );
}
