import { PageHeader } from "@/components/layout/PageHeader";

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
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
