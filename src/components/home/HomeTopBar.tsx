"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { openMoonie } from "@/lib/moonie/open-moonie";
import { moonieVariantFor } from "@/lib/moonie/variants";
import { getInitials } from "@/lib/review-utils";

interface HomeTopBarProps {
  displayName?: string;
  username?: string;
}

export function HomeTopBar({ displayName, username }: HomeTopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 bg-background/95 px-3 py-3 backdrop-blur-sm md:hidden">
      <BrandLogo size="sm" mark="mascot" showWordmark showTagline={false} className="gap-2" />
      <Link
        href="/search"
        className="flex flex-1 items-center gap-2 rounded-full bg-muted px-3 py-2.5 text-sm text-muted-foreground"
      >
        <Search className="size-4 shrink-0" aria-hidden="true" />
        Search stories & reviews
      </Link>
      <button
        type="button"
        onClick={() => openMoonie()}
        className="shrink-0"
        aria-label="Open Moonie assistant"
      >
        <MoonieMascot
          variant={moonieVariantFor("fab")}
          size={40}
          display="badge"
          lightweight
          embedded
        />
      </button>
      {username ? (
        <Link href={`/users/${username}`} aria-label="Your profile">
          <Avatar size="sm">
            <AvatarFallback className="bg-moon-purple-soft text-xs font-semibold text-primary">
              {getInitials(displayName ?? username)}
            </AvatarFallback>
          </Avatar>
        </Link>
      ) : (
        <Link href="/login" className="text-xs font-bold text-primary">
          Log in
        </Link>
      )}
    </header>
  );
}
