export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading reviews">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-violet-100 bg-white p-4"
        >
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-violet-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 rounded bg-violet-100" />
              <div className="h-2.5 w-24 rounded bg-violet-50" />
            </div>
          </div>
          <div className="mt-4 h-4 w-3/4 rounded bg-violet-100" />
          <div className="mt-3 h-20 rounded-xl bg-violet-50" />
          <div className="mt-3 space-y-2">
            <div className="h-3 w-full rounded bg-violet-50" />
            <div className="h-3 w-5/6 rounded bg-violet-50" />
            <div className="h-3 w-2/3 rounded bg-violet-50" />
          </div>
          <div className="mt-4 flex gap-2 border-t border-violet-50 pt-3">
            <div className="h-9 flex-1 rounded-lg bg-violet-50" />
            <div className="h-9 flex-1 rounded-lg bg-violet-50" />
            <div className="h-9 flex-1 rounded-lg bg-violet-50" />
            <div className="h-9 flex-1 rounded-lg bg-violet-50" />
          </div>
        </div>
      ))}
    </div>
  );
}
