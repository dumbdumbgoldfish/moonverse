"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { updateProfileAction } from "@/actions/user.actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LIMITS } from "@/lib/validation";
import { getInitials } from "@/lib/review-utils";
import type { UserSettings } from "@/types/user";

interface SettingsFormProps {
  settings: UserSettings;
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const router = useRouter();
  const { update } = useSession();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(settings.displayName);
  const [bio, setBio] = useState(settings.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(settings.avatarUrl ?? "");

  const previewInitials = getInitials(displayName || settings.displayName);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await updateProfileAction({
        displayName,
        bio,
        avatarUrl,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (result.displayName) {
        await update({ name: result.displayName });
      }

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

      <section className="rounded-xl border border-border/60 bg-bg-elevated p-6">
        <h2 className="text-lg font-semibold">Account</h2>
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

      <section className="rounded-xl border border-border/60 bg-bg-elevated p-6">
        <h2 className="text-lg font-semibold">Public profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          These details appear on your profile page.
        </p>

        <div className="mt-6 flex items-center gap-4">
          <Avatar className="size-16">
            {avatarUrl.trim() ? (
              <AvatarImage src={avatarUrl.trim()} alt="" />
            ) : null}
            <AvatarFallback className="bg-primary/20 text-primary">
              {previewInitials}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm text-muted-foreground">
            Avatar preview updates as you type a URL.
          </p>
        </div>

        <div className="mt-6 space-y-4">
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

          <div className="space-y-2">
            <Label htmlFor="settings-avatar-url">Avatar URL</Label>
            <Input
              id="settings-avatar-url"
              type="url"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder="https://…"
              maxLength={LIMITS.avatarUrl.max}
              disabled={isPending}
            />
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
