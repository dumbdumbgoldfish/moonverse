import { PageHeader } from "@/components/layout/PageHeader";

export default function ReviewsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        title="Reviews"
        description="Discover web novel reviews from the MoonVerse community."
      />
      <div className="animate-pulse space-y-4">
        <div className="h-10 rounded-lg bg-muted/50" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-64 rounded-xl bg-muted/50" />
          ))}
        </div>
      </div>
      <p className="sr-only" role="status">
        Loading reviews…
      </p>
    </div>
  );
}
