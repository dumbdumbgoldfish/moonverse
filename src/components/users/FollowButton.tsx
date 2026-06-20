"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { followUserAction, unfollowUserAction } from "@/actions/follow.actions";
import { Button } from "@/components/ui/button";

interface FollowButtonProps {
  userId: string;
  username: string;
  initialFollowing: boolean;
}

export function FollowButton({
  userId,
  username,
  initialFollowing,
}: FollowButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [following, setFollowing] = useState(initialFollowing);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = () => {
    setError(null);

    startTransition(async () => {
      const result = following
        ? await unfollowUserAction(userId, username)
        : await followUserAction(userId, username);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setFollowing(result.following);
      router.refresh();
    });
  };

  return (
    <div className="space-y-2">
      <Button
        variant={following ? "outline" : "default"}
        size="sm"
        onClick={handleToggle}
        disabled={isPending}
        aria-pressed={following}
        aria-label={following ? `Unfollow ${username}` : `Follow ${username}`}
      >
        {following ? "Unfollow" : "Follow"}
      </Button>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}{" "}
          {error.includes("logged in") && (
            <Link href={`/login?callbackUrl=/users/${username}`} className="underline">
              Log in
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
