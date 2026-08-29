import { MoonieCharacter } from "@/components/moonie/MoonieCharacter";
import { cn } from "@/lib/utils";

interface MoonieLoadingStateProps {
  message?: string;
  className?: string;
  size?: number;
}

export function MoonieLoadingState({
  message = "Searching the archive.",
  className,
  size = 100,
}: MoonieLoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center overflow-visible px-6 py-10 text-center",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <MoonieCharacter context="loading" size={size} compact />
      <p className="mt-4 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
