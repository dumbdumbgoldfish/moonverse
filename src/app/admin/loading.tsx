import { PageHeader } from "@/components/layout/PageHeader";

export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-4">
      <PageHeader title="Loading admin…" description="" />
      <div className="h-40 rounded-xl bg-muted/50" />
      <p className="sr-only" role="status">
        Loading admin dashboard…
      </p>
    </div>
  );
}
