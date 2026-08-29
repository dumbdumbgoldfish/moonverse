"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { updateProfileAction } from "@/actions/user.actions";
import { ProfileImageUpload } from "@/components/settings/ProfileImageUpload";
import { ProfileBackgroundUpload } from "@/components/settings/ProfileBackgroundUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LIMITS } from "@/lib/validation";
import { resolveSessionImageUrl } from "@/lib/session-image";
import type { UserSettings } from "@/types/user";

interface SettingsFormProps {
  settings: UserSettings;
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(settings.displayName);
  const [bio, setBio] = useState(settings.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(settings.avatarUrl ?? "");
  const [profileBackgroundUrl, setProfileBackgroundUrl] = useState(
    settings.profileBackgroundUrl ?? "",
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await updateProfileAction({
        displayName,
        bio,
        avatarUrl,
        profileBackgroundUrl,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      await update({
        name: result.displayName ?? displayName,
        image:
          resolveSessionImageUrl(
            (result.avatarUrl ?? avatarUrl.trim()) || null,
            session?.user?.id ?? "",
          ) ?? null,
      });

      setSuccess("Profile updated successfully.");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8"
      aria-label="Profile settings form"
    >
      {error && (
        <p
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}

      {success && (
        <p
          className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
          role="status"
        >
          {success}
        </p>
      )}

      <section className="rounded-[1.25rem] border border-[#1A1224]/8 bg-white p-5 shadow-[0_20px_48px_-36px_rgba(26,18,36,0.12)] sm:p-6">
        <h2 className="font-serif text-lg font-medium text-[#1A1224]">Account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Email and username cannot be changed.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="settings-email">Email</Label>
            <Input
              id="settings-email"
              value={settings.email}
              readOnly
              aria-readonly="true"
              className="bg-muted/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-username">Username</Label>
            <Input
              id="settings-username"
              value={`@${settings.username}`}
              readOnly
              aria-readonly="true"
              className="bg-muted/50"
            />
          </div>
        </div>
      </section>

      <section className="rounded-[1.25rem] border border-[#1A1224]/8 bg-white p-5 shadow-[0_20px_48px_-36px_rgba(26,18,36,0.12)] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-lg font-medium text-[#1A1224]">Public profile</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              These details appear on your profile page.
            </p>
          </div>
          <Link
            href={`/users/${settings.username}`}
            className="shrink-0 text-[13px] font-semibold text-[#6E46C7] hover:underline"
          >
            See your profile
          </Link>
        </div>

        <div className="mt-6 space-y-4">
          <ProfileBackgroundUpload
            value={profileBackgroundUrl}
            onChange={setProfileBackgroundUrl}
            disabled={isPending}
          />

          <ProfileImageUpload
            value={avatarUrl}
            onChange={setAvatarUrl}
            displayName={displayName || settings.displayName}
            disabled={isPending}
          />

          <div className="space-y-2">
            <Label htmlFor="settings-display-name">Display name</Label>
            <Input
              id="settings-display-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
              maxLength={LIMITS.displayName.max}
              disabled={isPending}
              aria-required="true"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-bio">Bio</Label>
            <Textarea
              id="settings-bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={4}
              maxLength={LIMITS.bio.max}
              placeholder="Tell the community what you like to read…"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              {bio.length}/{LIMITS.bio.max} characters
            </p>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
