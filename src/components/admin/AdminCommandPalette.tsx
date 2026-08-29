"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  FileText,
  Flag,
  Search,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: string;
  label: string;
  meta: string;
  href: string;
}

const TYPE_ICONS: Record<string, typeof Users> = {
  user: Users,
  novel: BookOpen,
  review: FileText,
  report: Flag,
};

export function AdminCommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/search?q=${encodeURIComponent(q.trim())}`,
        { credentials: "same-origin" }
      );
      if (!response.ok) return;
      const data = (await response.json()) as { results: SearchResult[] };
      setResults(data.results);
      setActiveIndex(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void runSearch(query);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [query, runSearch]);

  function navigate(href: string) {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(href);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
    if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      navigate(results[activeIndex].href);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-8 w-full max-w-md items-center gap-2 rounded-xl border border-[#241630]/10 bg-white px-3 text-left text-xs text-[#7a7284] shadow-sm transition hover:border-[#c89b4a]/35"
      >
        <Search size={14} className="shrink-0 text-[#c89b4a]/80" />
        <span className="flex-1 truncate">Search admin records…</span>
        <kbd className="hidden rounded-md bg-[#faf8fc] px-1.5 py-0.5 font-mono text-[10px] text-[#4c2a67]/70 sm:inline">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="border-b border-[#241630]/10 px-4 py-3">
            <DialogTitle className="font-serif text-base">Admin search</DialogTitle>
            <DialogDescription>Find users, catalogue records, reviews, and reports.</DialogDescription>
          </DialogHeader>
          <div className="border-b border-[#241630]/10 px-4 py-3">
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type to search…"
              className="h-9 rounded-xl border-[#241630]/12"
            />
          </div>
          <ul className="max-h-72 overflow-y-auto p-2">
            {loading ? (
              <li className="px-3 py-6 text-center text-sm text-[#7a7284]">Searching…</li>
            ) : results.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-[#7a7284]">
                {query.length < 2 ? "Type at least 2 characters" : "No results"}
              </li>
            ) : (
              results.map((result, index) => {
                const Icon = TYPE_ICONS[result.type] ?? FileText;
                return (
                  <li key={`${result.type}-${result.id}`}>
                    <button
                      type="button"
                      onClick={() => navigate(result.href)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                        index === activeIndex ? "bg-[#faf8fc] text-[#4c2a67]" : "hover:bg-[#f3f0f6]"
                      )}
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-[#c89b4a]/20">
                        <Icon size={14} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{result.label}</span>
                        <span className="block truncate text-xs text-[#7a7284]">{result.meta}</span>
                      </span>
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[#c89b4a]/75">
                        {result.type}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
