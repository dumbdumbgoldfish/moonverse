import { AdminPageHeader, AdminPanel } from "@/components/admin/AdminUi";
import { AdminSystemSettingsForm } from "@/components/admin/AdminSystemSettingsForm";
import { Badge } from "@/components/ui/badge";
import { getSystemInfo } from "@/services/admin/dashboard.service";
import { getSystemSettings } from "@/lib/system-settings";

export const metadata = { title: "Admin System · MoonVerse" };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [info, settings] = await Promise.all([getSystemInfo(), getSystemSettings()]);

  return (
    <>
      <AdminPageHeader
        title="System"
        description="Environment health and platform-wide toggles."
      />
      <AdminPanel className="mb-6">
        <dl className="grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/45">
              Application
            </dt>
            <dd className="mt-1 font-medium text-white">{info.appName}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/45">
              Environment
            </dt>
            <dd className="mt-1 font-medium capitalize text-white">
              {info.environment}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/45">
              Database
            </dt>
            <dd className="mt-1">
              <Badge
                variant={info.databaseStatus === "connected" ? "default" : "destructive"}
              >
                {info.databaseStatus === "connected" ? "Connected" : "Error"}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/45">
              Moonie mode
            </dt>
            <dd className="mt-1 font-medium text-white">{info.moonieMode}</dd>
          </div>
        </dl>
      </AdminPanel>

      <AdminSystemSettingsForm settings={settings} />
    </>
  );
}
