import { FloatingMoonie } from "@/components/brand/FloatingMoonie";

interface MoonieLibraryHintProps {
  variant?: "saved" | "suggest";
  message?: string;
}

const DEFAULT_MESSAGES = {
  saved: "Moonie saved this for later.",
  suggest: "Moonie thinks you'll love this next.",
};

export function MoonieLibraryHint({
  variant = "saved",
  message,
}: MoonieLibraryHintProps) {
  return (
    <div className="relative mb-4 flex items-center gap-2 overflow-visible">
      <FloatingMoonie
        context={variant === "suggest" ? "librarySuggest" : "librarySaved"}
        size={44}
        display="badge"
        compact
      />
      <p className="text-sm text-foreground">{message ?? DEFAULT_MESSAGES[variant]}</p>
    </div>
  );
}
