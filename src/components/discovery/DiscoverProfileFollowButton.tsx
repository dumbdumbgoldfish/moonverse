"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { followUserAction, unfollowUserAction } from "@/actions/follow.actions";
import { useSignInPrompt } from "@/components/auth/SignInPromptProvider";
import { cn } from "@/lib/utils";

interface DiscoverProfileFollowButtonProps {
  userId: string;
  username: string;
  initialFollowing: boolean;
  isLoggedIn?: boolean;
}

export function DiscoverProfileFollowButton({
  userId,
  username,
  initialFollowing,
  isLoggedIn = true,
}: DiscoverProfileFollowButtonProps) {
  const router = useRouter();
  const { promptSignIn } = useSignInPrompt();
  const [isPending, startTransition] = useTransition();
  const [following, setFollowing] = useState(initialFollowing);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isLoggedIn) {
      promptSignIn(`/users/${username}`);
      return;
    }

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
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        aria-pressed={following}
        aria-label={following ? `Unfollow ${username}` : `Follow ${username}`}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6246ea] disabled:opacity-60",
          following
            ? "bg-white text-[#1a1033] ring-1 ring-[#1a1033]/15 hover:bg-[#fcfaf7]"
            : "bg-[#ececec] text-[#1a1033] hover:bg-[#e2e2e2]"
        )}
      >
        {!following && <UserPlus className="size-4" aria-hidden />}
        {following ? "Following" : "Follow"}
      </button>
      {error && (
        <p className="max-w-[12rem] text-right text-xs text-destructive" role="alert">
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
