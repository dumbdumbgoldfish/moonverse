"use client";

import { CatalogLink } from "@/components/ui/CatalogLink";

export function MoonieQuickStartChips({
  prompts,
  onSelect,
  disabled = false,
}: {
  prompts: string[];
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}) {
  if (prompts.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {prompts.map((prompt) => (
        <CatalogLink
          key={prompt}
          onClick={() => onSelect(prompt)}
          size="compact"
          disabled={disabled}
          className="!h-auto !min-h-0 max-w-full !whitespace-normal !text-left !leading-snug"
        >
          {prompt}
        </CatalogLink>
      ))}
    </div>
  );
}
