import { PageHeader } from "@/components/layout/PageHeader";
import { SITE_SHELL_CLASS } from "@/lib/site-shell";
import { cn } from "@/lib/utils";

export default function ReviewsLoading() {
  return (
    <div className={cn(SITE_SHELL_CLASS, "py-10")}>
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
