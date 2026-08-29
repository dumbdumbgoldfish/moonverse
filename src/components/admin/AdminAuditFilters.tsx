"use client";

import { useRouter } from "next/navigation";
import { ADMIN_BTN_GOLD } from "@/components/admin/admin-styles";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminAuditFiltersProps {
  actions: string[];
  current: {
    query?: string;
    action?: string;
    entityType?: string;
    actor?: string;
  };
}

const adminFieldClass =
  "h-9 rounded-xl border-white/10 bg-white/[0.06] text-sm text-white placeholder:text-white/35";

export function AdminAuditFilters({ actions, current }: AdminAuditFiltersProps) {
  const router = useRouter();

  return (
    <form
      className="mb-6 grid gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 sm:grid-cols-2 lg:grid-cols-5"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        const params = new URLSearchParams();
        for (const [key, value] of data.entries()) {
          if (typeof value === "string" && value.trim()) {
            params.set(key, value.trim());
          }
        }
        router.push(`/admin/audit?${params.toString()}`);
      }}
    >
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="audit-query" className="text-xs text-white/80">
          Search
        </Label>
        <Input
          id="audit-query"
          name="query"
          defaultValue={current.query ?? ""}
          placeholder="Action, entity, ID…"
          className={adminFieldClass}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="audit-action" className="text-xs text-white/80">
          Action
        </Label>
        <select
          id="audit-action"
          name="action"
          defaultValue={current.action ?? ""}
          className={cn(adminFieldClass, "w-full px-2")}
        >
          <option value="">All actions</option>
          {actions.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="audit-entity" className="text-xs text-white/80">
          Entity type
        </Label>
        <Input
          id="audit-entity"
          name="entityType"
          defaultValue={current.entityType ?? ""}
          placeholder="Review, User…"
          className={adminFieldClass}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="audit-actor" className="text-xs text-white/80">
          Actor
        </Label>
        <Input
          id="audit-actor"
          name="actor"
          defaultValue={current.actor ?? ""}
          placeholder="username"
          className={adminFieldClass}
        />
      </div>
      <div className="flex items-end sm:col-span-2 lg:col-span-5">
        <Button type="submit" size="sm" className={ADMIN_BTN_GOLD}>
          Apply filters
        </Button>
      </div>
    </form>
  );
}
