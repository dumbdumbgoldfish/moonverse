"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AdminSearchBarProps {
  placeholder?: string;
  paramName?: string;
  className?: string;
}

export function AdminSearchBar({
  placeholder = "Search…",
  paramName = "q",
  className,
}: AdminSearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryFromUrl = searchParams.get(paramName) ?? "";

  return (
    <form
      key={queryFromUrl}
      className={cn("flex w-full max-w-md gap-2", className)}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const q = String(data.get(paramName) ?? "").trim();
        const params = new URLSearchParams(searchParams.toString());
        if (q) params.set(paramName, q);
        else params.delete(paramName);
        const qs = params.toString();
        router.push(qs ? `${pathname}?${qs}` : pathname);
      }}
    >
      <label htmlFor={`admin-search-${paramName}`} className="sr-only">
        {placeholder}
      </label>
      <Input
        id={`admin-search-${paramName}`}
        name={paramName}
        defaultValue={queryFromUrl}
        placeholder={placeholder}
        className="h-10 rounded-xl border-white/10 bg-white/[0.06] text-white placeholder:text-white/35 shadow-[0_10px_24px_-18px_rgba(0,0,0,0.25)]"
      />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        aria-label="Search"
        className="h-10 rounded-xl border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
      >
        <Search size={16} aria-hidden="true" />
      </Button>
    </form>
  );
}
