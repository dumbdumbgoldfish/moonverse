"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { broadcastNotificationAction } from "@/actions/broadcast.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminFormCard } from "@/components/admin/AdminUi";

export function AdminBroadcastForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <AdminFormCard
      title="Send platform announcement"
      description="Delivers a notification to all active users. Use sparingly for maintenance, policy, or safety updates."
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          setSuccess(null);
          startTransition(async () => {
            const result = await broadcastNotificationAction({ message, link });
            if (!result.success) {
              setError(result.error);
              return;
            }
            setSuccess(`Sent to ${result.recipientCount.toLocaleString()} users.`);
            setMessage("");
            setLink("");
            router.refresh();
          });
        }}
      >
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="text-sm text-success" role="status">
            {success}
          </p>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="broadcast-message">Message</Label>
          <Textarea
            id="broadcast-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="We're performing scheduled maintenance tonight at 10pm UTC…"
            rows={3}
            required
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="broadcast-link">Optional link</Label>
          <Input
            id="broadcast-link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="/help"
            disabled={isPending}
          />
        </div>
        <Button type="submit" disabled={isPending || !message.trim()}>
          {isPending ? "Sending…" : "Send broadcast"}
        </Button>
      </form>
    </AdminFormCard>
  );
}
