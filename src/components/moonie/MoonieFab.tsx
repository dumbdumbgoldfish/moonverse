"use client";

import { useEffect, useState } from "react";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { MoonieCharacter } from "@/components/moonie/MoonieCharacter";
import {
  MOONIE_REACTION_CONFIG,
  MOONIE_REACTION_EVENT,
  type MoonieReactionEventDetail,
} from "@/lib/moonie/reactions";
import { moonieVariantFor } from "@/lib/moonie/variants";
import { cn } from "@/lib/utils";

interface MoonieFabProps {
  open: boolean;
  onToggle: () => void;
  /** Sit above the mobile bottom nav when present. */
  elevateForMobileNav?: boolean;
  /** Hide while the chat panel is open (panel has its own close control). */
  hidden?: boolean;
}

export function MoonieFab({
  open,
  onToggle,
  elevateForMobileNav = false,
  hidden = false,
}: MoonieFabProps) {
  const [reacting, setReacting] = useState(false);

  useEffect(() => {
    const handleReaction = (event: Event) => {
      const { reaction } = (event as CustomEvent<MoonieReactionEventDetail>).detail;
      const config = MOONIE_REACTION_CONFIG[reaction];
      setReacting(true);
      window.setTimeout(() => setReacting(false), config.durationMs);
    };
    window.addEventListener(MOONIE_REACTION_EVENT, handleReaction);
    return () => window.removeEventListener(MOONIE_REACTION_EVENT, handleReaction);
  }, []);

  const showAnimated = open || reacting;

  if (hidden) return null;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls="moonie-chat-panel"
      aria-label={open ? "Close Moonie assistant" : "Open Moonie assistant"}
      className={cn(
        "mv-moonie-fab fixed right-4 z-50 flex size-[4.5rem] items-end justify-center overflow-visible rounded-full p-0",
        elevateForMobileNav ? "bottom-20 md:bottom-4" : "bottom-4",
        "transition-transform duration-200 hover:scale-105",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mv-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      )}
    >
      {showAnimated ? (
        <MoonieCharacter
          context="fab"
          variant={moonieVariantFor("fab")}
          size={70}
          lightweight
          animated={reacting}
          animationState={reacting ? "celebration" : "idle"}
        />
      ) : (
        <MoonieMascot
          variant={moonieVariantFor("fab")}
          size={70}
          lightweight
        />
      )}
    </button>
  );
}
