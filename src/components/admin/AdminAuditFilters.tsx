"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface AdminAuditFiltersProps {
  actions: string[];
  current: {
    query?: string;
    action?: string;
    entityType?: string;
    actor?: string;
  };
}

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
        <Label htmlFor="audit-query" className="text-xs">
          Search
        </Label>
        <Input
          id="audit-query"
          name="query"
          defaultValue={current.query ?? ""}
          placeholder="Action, entity, ID…"
          className="h-9 rounded-xl text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Action</Label>
        <select
          name="action"
          defaultValue={current.action ?? ""}
          className="h-9 w-full rounded-xl border border-white/10 bg-white/[0.06] px-2 text-sm text-white"
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
        <Label htmlFor="audit-entity" className="text-xs">
          Entity type
        </Label>
        <Input
          id="audit-entity"
          name="entityType"
          defaultValue={current.entityType ?? ""}
          placeholder="Review, User…"
          className="h-9 rounded-xl text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="audit-actor" className="text-xs">
          Actor
        </Label>
        <Input
          id="audit-actor"
          name="actor"
          defaultValue={current.actor ?? ""}
          placeholder="username"
          className="h-9 rounded-xl text-sm"
        />
      </div>
      <div className="flex items-end sm:col-span-2 lg:col-span-5">
        <Button type="submit" size="sm">
          Apply filters
        </Button>
      </div>
    </form>
  );
}
