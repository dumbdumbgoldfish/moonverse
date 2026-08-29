import { MoonieMascot } from "@/components/brand/MoonieMascot";

interface MoonieContinueEncouragementProps {
  progress?: number;
  novelTitle?: string;
}

export function MoonieContinueEncouragement({
  progress = 78,
  novelTitle,
}: MoonieContinueEncouragementProps) {
  return (
    <div className="relative mx-4 mb-2 flex items-center gap-2 overflow-visible">
      <MoonieMascot variant="happy" size={56} display="badge" lightweight />
      <p className="text-sm leading-snug text-foreground">
        {novelTitle ? (
          <>
            You&apos;re <span className="font-bold">{progress}%</span> through{" "}
            <span className="font-semibold">{novelTitle}</span>. Want to continue?
          </>
        ) : (
          <>
            You&apos;re <span className="font-bold">{progress}%</span> through this
            story. Want to continue?
          </>
        )}
      </p>
    </div>
  );
}
