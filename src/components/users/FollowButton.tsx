"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { followUserAction, unfollowUserAction } from "@/actions/follow.actions";
import { useSignInPromptOptional } from "@/components/auth/SignInPromptProvider";
import { Button } from "@/components/ui/button";
import { MV_PRIMARY_BTN } from "@/lib/mv-buttons";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  userId: string;
  username: string;
  initialFollowing: boolean;
  /** Subtle text control for editorial feed cards. */
  appearance?: "default" | "subtle" | "pill";
  isLoggedIn?: boolean;
  notFollowingLabel?: string;
  followingLabel?: string;
}

interface FollowState {
  userId: string;
  baselineFollowing: boolean;
  following: boolean;
}

export function FollowButton({
  userId,
  username,
  initialFollowing,
  appearance = "default",
  isLoggedIn = true,
  notFollowingLabel = "Follow",
  followingLabel = "Following",
}: FollowButtonProps) {
  const prompt = useSignInPromptOptional();
  const [isPending, startTransition] = useTransition();
  const [followState, setFollowState] = useState<FollowState>(() => ({
    userId,
    baselineFollowing: initialFollowing,
    following: initialFollowing,
  }));
  const [errorRecord, setErrorRecord] = useState<{
    userId: string;
    message: string;
  } | null>(null);

  let nextState = followState;
  if (followState.userId !== userId) {
    nextState = {
      userId,
      baselineFollowing: initialFollowing,
      following: initialFollowing,
    };
    setFollowState(nextState);
  } else if (
    followState.baselineFollowing !== initialFollowing &&
    !isPending
  ) {
    nextState = {
      ...followState,
      baselineFollowing: initialFollowing,
      following: initialFollowing,
    };
    setFollowState(nextState);
  }

  const following = nextState.following;
  const error =
    errorRecord && errorRecord.userId === userId ? errorRecord.message : null;

  const handleToggle = () => {
    if (!isLoggedIn) {
      prompt?.promptSignIn();
      if (!prompt) {
        window.location.href = `/login?callbackUrl=${encodeURIComponent(`/users/${username}`)}`;
      }
      return;
    }

    setErrorRecord(null);
    const previous = following;
    const requestUserId = userId;
    const requestUsername = username;
    setFollowState((current) => {
      if (current.userId !== requestUserId) return current;
      return { ...current, following: !current.following };
    });

    startTransition(async () => {
      const result = previous
        ? await unfollowUserAction(requestUserId, requestUsername)
        : await followUserAction(requestUserId, requestUsername);

      if (!result.success) {
        setFollowState((current) => {
          if (current.userId !== requestUserId) return current;
          return { ...current, following: previous };
        });
        setErrorRecord({
          userId: requestUserId,
          message: result.error,
        });
        return;
      }

      setFollowState((current) => {
        if (current.userId !== requestUserId) return current;
        return { ...current, following: result.following };
      });
    });
  };

  if (appearance === "subtle") {
    return (
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          aria-pressed={following}
          aria-label={following ? `Unfollow ${username}` : `Follow ${username}`}
          className={cn(
            "whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-semibold transition duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mv-plum)]",
            following
              ? "text-[var(--mv-text-muted)] hover:text-[var(--mv-ink)]"
              : "border border-[var(--mv-plum)]/28 bg-white text-[var(--mv-plum)] shadow-sm hover:border-[var(--mv-plum)]/45 hover:bg-[var(--mv-surface-soft)]"
          )}
        >
          {following ? followingLabel : notFollowingLabel}
        </button>
        {error ? (
          <p
            className="absolute right-0 top-full z-10 mt-1 w-40 text-[11px] text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  if (appearance === "pill") {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          aria-pressed={following}
          aria-label={following ? `Unfollow ${username}` : `Follow ${username}`}
          className={cn(
            "inline-flex h-9 items-center justify-center rounded-full px-3.5 text-[13px] font-semibold transition",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]",
            following
              ? "border border-[#6E46C7]/22 bg-white text-[#1a1033] hover:bg-[#F4ECF8]"
              : cn(MV_PRIMARY_BTN, "h-9 px-3.5 text-[13px] text-white")
          )}
        >
          {following ? followingLabel : notFollowingLabel}
        </button>
        {error ? (
          <p
            className="absolute right-0 top-full z-10 mt-1 w-44 text-[11px] text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  }

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
        {following ? followingLabel : notFollowingLabel}
      </Button>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}{" "}
          {error.includes("logged in") && (
            <Link
              href={`/login?callbackUrl=/users/${username}`}
              className="underline"
            >
              Log in
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
