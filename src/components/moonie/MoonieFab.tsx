"use client";

import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MoonieFabProps {
  open: boolean;
  onToggle: () => void;
}

export function MoonieFab({ open, onToggle }: MoonieFabProps) {
  return (
    <Button
      onClick={onToggle}
      aria-expanded={open}
      aria-controls="moonie-chat-panel"
      aria-label={open ? "Close Moonie assistant" : "Open Moonie assistant"}
      className={cn(
        "fixed bottom-4 right-4 z-50 size-14 rounded-full p-0 shadow-lg shadow-primary/30",
        "gradient-moonverse text-primary-foreground",
        "hover:opacity-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        !open && "animate-moonie-float"
      )}
    >
      <MoonieMascot size={40} className="text-primary-foreground" />
    </Button>
  );
}
