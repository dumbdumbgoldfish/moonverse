import { AdminPanel } from "@/components/admin/AdminUi";

export default function AdminLoading() {
  return (
    <AdminPanel className="animate-pulse space-y-4">
      <div className="h-6 w-40 rounded-lg bg-[#241630]/8" />
      <div className="h-4 w-72 max-w-full rounded-lg bg-[#c89b4a]/12" />
      <div className="h-40 rounded-xl bg-[#241630]/6" />
      <p className="sr-only" role="status">
        Loading admin dashboard…
      </p>
    </AdminPanel>
  );
}
