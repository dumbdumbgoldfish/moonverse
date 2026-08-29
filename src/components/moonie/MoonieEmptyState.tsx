"use client";

import { MoonieCharacter } from "@/components/moonie/MoonieCharacter";
import type { MoonieAnimationContext } from "@/lib/moonie/animation-states";
import type { MoonieVariant } from "@/components/brand/MoonieMascot";
import { cn } from "@/lib/utils";

interface MoonieEmptyStateProps {
  variant?: MoonieVariant;
  context?: MoonieAnimationContext;
  title: string;
  description: string;
  descriptionClassName?: string;
  className?: string;
  action?: React.ReactNode;
}

export function MoonieEmptyState({
  variant,
  context = "emptyState",
  title,
  description,
  descriptionClassName,
  className,
  action,
}: MoonieEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center overflow-visible px-6 py-12 text-center",
        className
      )}
    >
      <MoonieCharacter
        context={context}
        variant={variant}
        size={130}
        animated={false}
        lightweight
      />
      <h2 className="mt-6 font-[family-name:var(--font-source-serif)] text-lg font-bold text-[#1A1224]">{title}</h2>
      <p
        className={cn(
          "mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground",
          descriptionClassName
        )}
      >
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
