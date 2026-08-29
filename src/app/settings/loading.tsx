import { PageHeader } from "@/components/layout/PageHeader";
import { SITE_SHELL_CLASS } from "@/lib/site-shell";
import { cn } from "@/lib/utils";

export default function SettingsLoading() {
  return (
    <div className={cn(SITE_SHELL_CLASS, "py-10")}>
      <PageHeader
        title="Settings"
        description="Manage your profile and account preferences."
      />
      <div className="animate-pulse space-y-6">
        <div className="h-40 rounded-xl bg-muted/50" />
        <div className="h-64 rounded-xl bg-muted/50" />
      </div>
      <p className="sr-only" role="status">
        Loading settings…
      </p>
    </div>
  );
}
