"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AdminSearchBarProps {
  placeholder?: string;
  paramName?: string;
}

export function AdminSearchBar({
  placeholder = "Search…",
  paramName = "q",
}: AdminSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultValue = searchParams.get(paramName) ?? "";

  return (
    <form
      className="flex gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const q = String(formData.get(paramName) ?? "").trim();
        const params = new URLSearchParams(searchParams.toString());
        if (q) params.set(paramName, q);
        else params.delete(paramName);
        router.push(`?${params.toString()}`);
      }}
    >
      <label htmlFor={`admin-search-${paramName}`} className="sr-only">
        {placeholder}
      </label>
      <Input
        id={`admin-search-${paramName}`}
        name={paramName}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="max-w-md"
      />
      <Button type="submit" variant="outline" size="sm" aria-label="Search">
        <Search size={16} aria-hidden="true" />
      </Button>
    </form>
  );
}
