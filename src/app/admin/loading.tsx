import { AdminPanel } from "@/components/admin/AdminUi";

export default function AdminLoading() {
  return (
    <AdminPanel className="animate-pulse space-y-4">
      <div className="h-6 w-40 rounded-lg bg-white/[0.08]" />
      <div className="h-4 w-72 max-w-full rounded-lg bg-white/[0.06]" />
      <div className="h-40 rounded-xl bg-white/[0.05]" />
      <p className="sr-only" role="status">
        Loading admin dashboard…
      </p>
    </AdminPanel>
  );
}
