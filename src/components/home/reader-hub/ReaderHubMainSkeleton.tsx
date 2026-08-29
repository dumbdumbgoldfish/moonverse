export function ReaderHubMainSkeleton() {
  return (
    <div className="space-y-5" aria-hidden>
      <div className="space-y-2">
        <div className="h-9 w-48 animate-pulse rounded-xl bg-[#1A1224]/6" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-[#1A1224]/5" />
      </div>
      <div className="h-11 animate-pulse rounded-full bg-[#1A1224]/6" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-52 animate-pulse rounded-3xl bg-white/80 ring-1 ring-[#1A1224]/8"
          />
        ))}
      </div>
    </div>
  );
}
