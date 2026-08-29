"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSystemSettingsAction } from "@/actions/admin.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ADMIN_FORM_CARD_CLASS } from "@/components/admin/admin-styles";
import type { SystemSettingsValue } from "@/lib/system-settings";

interface AdminSystemSettingsFormProps {
  settings: SystemSettingsValue;
}

function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        checked ? "bg-primary" : "bg-slate-200"
      )}
    >
      <span
        className={cn(
          "absolute top-1 size-5 rounded-full bg-white shadow transition",
          checked ? "left-6" : "left-1"
        )}
      />
    </button>
  );
}

export function AdminSystemSettingsForm({ settings }: AdminSystemSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [requireEmailVerified, setRequireEmailVerified] = useState(
    settings.requireEmailVerified
  );
  const [digestEnabled, setDigestEnabled] = useState(settings.digestEnabled);
  const [guestMoonieDemoCap, setGuestMoonieDemoCap] = useState(
    String(settings.guestMoonieDemoCap)
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function save(patch: Partial<SystemSettingsValue>) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateSystemSettingsAction(patch);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
      window.setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className={cn("space-y-6", ADMIN_FORM_CARD_CLASS, "mt-0")}>
      <div>
        <h2 className="font-serif text-lg font-medium text-white">
          Platform settings
        </h2>
        <p className="mt-1 text-[13px] text-white">
          Changes apply immediately across MoonVerse.
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="text-sm text-success" role="status">
          Saved.
        </p>
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Require verified email</p>
          <p className="text-xs text-muted-foreground">
            When enabled, users must verify their email before posting reviews or
            comments. Managed in Admin, not via environment variables.
          </p>
        </div>
        <Toggle
          checked={requireEmailVerified}
          disabled={isPending}
          label="Toggle require verified email"
          onChange={(value) => {
            setRequireEmailVerified(value);
            save({ requireEmailVerified: value });
          }}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Digest emails enabled</p>
          <p className="text-xs text-muted-foreground">
            Master switch for the digest cron job across all users.
          </p>
        </div>
        <Toggle
          checked={digestEnabled}
          disabled={isPending}
          label="Toggle digest emails enabled"
          onChange={(value) => {
            setDigestEnabled(value);
            save({ digestEnabled: value });
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="guest-moonie-cap">Guest Moonie demo cap</Label>
        <p className="whitespace-nowrap text-xs text-muted-foreground">
          Number of free chat turns given to guests on /ask-moonie.
        </p>
        <div className="flex max-w-xs gap-2">
          <Input
            id="guest-moonie-cap"
            type="number"
            min={1}
            max={20}
            value={guestMoonieDemoCap}
            onChange={(e) => setGuestMoonieDemoCap(e.target.value)}
            disabled={isPending}
          />
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => {
              const value = Math.max(1, Math.min(20, Number(guestMoonieDemoCap) || 3));
              setGuestMoonieDemoCap(String(value));
              save({ guestMoonieDemoCap: value });
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
