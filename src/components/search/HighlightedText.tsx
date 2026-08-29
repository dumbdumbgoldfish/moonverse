"use client";

export function HighlightedText({
  text,
  query,
}: {
  text: string;
  query: string;
}) {
  const q = query.trim();
  if (!q || q.length < 2) return <>{text}</>;
  const token =
    q.split(/\s+/).sort((a, b) => b.length - a.length)[0] ?? q;
  if (token.length < 2) return <>{text}</>;
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "ig"));

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === token.toLowerCase() ? (
          <mark
            key={`${part}-${index}`}
            className="rounded-sm bg-[#6E46C7]/15 text-inherit"
          >
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        )
      )}
    </>
  );
}
