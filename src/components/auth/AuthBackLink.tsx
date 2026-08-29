"use client";

import { ChevronLeft } from "lucide-react";

interface AuthBackLinkProps {
  label: string;
  onClick: () => void;
}

export function AuthBackLink({ label, onClick }: AuthBackLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-6 flex items-center gap-1 text-sm font-semibold text-[#1a1a1a] transition-colors hover:text-primary"
    >
      <ChevronLeft className="size-4" aria-hidden />
      {label}
    </button>
  );
}
