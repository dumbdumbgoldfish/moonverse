import { LiteraryStreamingFallback } from "@/components/layout/LiteraryStreamingFallback";

export default function ReviewsLoading() {
  return (
    <LiteraryStreamingFallback label="Loading reviews">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-64 animate-pulse rounded-xl bg-[#1A1224]/6"
          />
        ))}
      </div>
    </LiteraryStreamingFallback>
  );
}
