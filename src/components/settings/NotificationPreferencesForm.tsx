"use client";

import { useState, useTransition } from "react";
import { DigestCadence } from "@prisma/client";
import { updateNotificationPreferenceAction } from "@/actions/notification-preference.actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NotificationPreferenceData } from "@/services/notification-preference.service";

interface NotificationPreferencesFormProps {
  preference: NotificationPreferenceData;
}

const CADENCE_OPTIONS: { value: DigestCadence; label: string }[] = [
  { value: "OFF", label: "Off" },
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
];

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
        checked ? "bg-primary" : "bg-slate-200",
        disabled && "cursor-not-allowed opacity-50"
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

export function NotificationPreferencesForm({
  preference,
}: NotificationPreferencesFormProps) {
  const [isPending, startTransition] = useTransition();
  const [emailEnabled, setEmailEnabled] = useState(preference.emailEnabled);
  const [digestCadence, setDigestCadence] = useState(preference.digestCadence);
  const [moonieDailyEmail, setMoonieDailyEmail] = useState(preference.moonieDailyEmail);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function save(patch: Partial<NotificationPreferenceData>) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateNotificationPreferenceAction(patch);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="space-y-5 rounded-[1.25rem] border border-[#1A1224]/8 bg-white p-5 shadow-[0_20px_48px_-36px_rgba(26,18,36,0.12)] sm:p-6">
      <div>
        <h2 className="sr-only">Notification preferences</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Control when MoonVerse sends email from your account activity.
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
          <p className="text-sm font-medium">Email notifications</p>
          <p className="text-xs text-muted-foreground">
            Master switch for all MoonVerse emails. When on, you can receive
            emails for follows, comments, replies, digest roundups, and Moonie
            daily picks.
          </p>
        </div>
        <Toggle
          checked={emailEnabled}
          disabled={isPending}
          label="Toggle email notifications"
          onChange={(value) => {
            setEmailEnabled(value);
            save({ emailEnabled: value });
          }}
        />
      </div>

      <div className="rounded-lg border border-violet-100/80 bg-violet-50/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        <p className="font-medium text-[#1A1224]/80">What emails are included</p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>Someone follows you</li>
          <li>Someone comments on your review or replies to your comment</li>
          <li>Digest roundups (if enabled below)</li>
          <li>Moonie daily picks (if enabled below)</li>
        </ul>
        <p className="mt-2">Likes and appreciates stay in-app only.</p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Moonie daily pick emails</p>
          <p className="text-xs text-muted-foreground">
            Get an email when Moonie has a new daily recommendation. Requires
            email notifications to be on.
          </p>
        </div>
        <Toggle
          checked={moonieDailyEmail}
          disabled={isPending || !emailEnabled}
          label="Toggle Moonie daily pick emails"
          onChange={(value) => {
            setMoonieDailyEmail(value);
            save({ moonieDailyEmail: value });
          }}
        />
      </div>

      <div>
        <p className="text-sm font-medium">Digest frequency</p>
        <p className="mb-2 text-xs text-muted-foreground">
          A roundup email of activity you may have missed. Requires email
          notifications to be on.
        </p>
        <div className="flex flex-wrap gap-2">
          {CADENCE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={digestCadence === option.value ? "default" : "outline"}
              disabled={isPending || !emailEnabled}
              onClick={() => {
                setDigestCadence(option.value);
                save({ digestCadence: option.value });
              }}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
