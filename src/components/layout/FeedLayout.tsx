"use client";

import { cn } from "@/lib/utils";

interface FeedLayoutProps {
  leftSidebar?: React.ReactNode;
  rightSidebar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function FeedLayout({
  leftSidebar,
  rightSidebar,
  children,
  className,
}: FeedLayoutProps) {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:px-8 lg:py-10",
        className
      )}
    >
      {leftSidebar && (
        <aside className="hidden lg:col-span-3 lg:block">
          <div className="sticky top-20 space-y-4">{leftSidebar}</div>
        </aside>
      )}

      <main className={cn("min-w-0", leftSidebar && rightSidebar ? "lg:col-span-6" : leftSidebar || rightSidebar ? "lg:col-span-9" : "lg:col-span-12")}>
        {children}
      </main>

      {rightSidebar && (
        <aside className="hidden lg:col-span-3 lg:block">
          <div className="sticky top-20 space-y-4">{rightSidebar}</div>
        </aside>
      )}
    </div>
  );
}
