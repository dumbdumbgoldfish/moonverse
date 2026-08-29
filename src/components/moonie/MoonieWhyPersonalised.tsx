"use client";

interface MoonieWhyPersonalisedProps {
  reasons?: string[];
  className?: string;
}

export function MoonieWhyPersonalised({
  reasons,
  className,
}: MoonieWhyPersonalisedProps) {
  if (!reasons?.length) return null;

  return (
    <div className={className}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        Why this matches
      </p>
      <ul className="mt-1 space-y-0.5 text-xs text-slate-600">
        {reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </div>
  );
}
