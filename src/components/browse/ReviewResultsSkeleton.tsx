import { cn } from "@/lib/utils";

interface ReviewResultsSkeletonProps {
  count?: number;
  className?: string;
}

export function ReviewResultsSkeleton({
  count = 3,
  className,
}: ReviewResultsSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)} aria-hidden>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex animate-pulse flex-col gap-4 rounded-2xl border border-violet-100/80 bg-white p-4 sm:flex-row sm:p-5 motion-reduce:animate-none"
        >
          <div className="mx-auto aspect-[2/3] w-[120px] shrink-0 rounded-xl bg-violet-100/80 sm:mx-0 sm:w-[132px]" />
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="h-5 w-3/4 rounded-md bg-violet-100/90" />
            <div className="h-4 w-1/3 rounded-md bg-violet-50" />
            <div className="h-4 w-full rounded-md bg-violet-50" />
            <div className="h-4 w-5/6 rounded-md bg-violet-50" />
            <div className="mt-2 flex gap-2">
              <div className="h-6 w-16 rounded-full bg-violet-50" />
              <div className="h-6 w-20 rounded-full bg-violet-50" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
