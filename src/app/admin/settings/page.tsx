import { AdminPageHeader } from "@/components/admin/AdminUi";
import { Badge } from "@/components/ui/badge";
import { getSystemInfo } from "@/services/admin/dashboard.service";

export const metadata = { title: "Admin System — MoonVerse" };

export default async function AdminSettingsPage() {
  const info = await getSystemInfo();

  return (
    <>
      <AdminPageHeader
        title="System"
        description="Basic environment and service information."
      />
      <div className="rounded-xl border border-border/60 bg-bg-elevated p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">Application</dt>
            <dd className="mt-1 font-medium">{info.appName}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Environment</dt>
            <dd className="mt-1 font-medium capitalize">{info.environment}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Database</dt>
            <dd className="mt-1">
              <Badge
                variant={info.databaseStatus === "connected" ? "default" : "destructive"}
              >
                {info.databaseStatus === "connected" ? "Connected" : "Error"}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Moonie mode</dt>
            <dd className="mt-1 font-medium">{info.moonieMode}</dd>
          </div>
        </dl>
      </div>
    </>
  );
}
