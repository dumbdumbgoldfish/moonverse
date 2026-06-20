import { cn } from "@/lib/utils";

interface AdminStatCardProps {
  label: string;
  value: number;
  className?: string;
}

export function AdminStatCard({ label, value, className }: AdminStatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-white p-4 shadow-sm",
        className
      )}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value.toLocaleString()}</p>
    </div>
  );
}

interface AdminEmptyStateProps {
  title: string;
  description: string;
}

export function AdminEmptyState({ title, description }: AdminEmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-border/60 bg-white px-6 py-12 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function AdminPageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
