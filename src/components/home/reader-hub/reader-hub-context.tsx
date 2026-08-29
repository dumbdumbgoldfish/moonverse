"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { HomeFeedTab } from "@/lib/feed";
import type { ReaderSection } from "@/lib/home-view";

interface ReaderHubValue {
  section: ReaderSection;
  displaySection: ReaderSection;
  feed: HomeFeedTab;
  isPending: boolean;
}

const ReaderHubContext = createContext<ReaderHubValue | null>(null);

export function ReaderHubProvider({
  section,
  feed,
  children,
}: {
  section: ReaderSection;
  feed: HomeFeedTab;
  children: ReactNode;
}) {
  return (
    <ReaderHubContext.Provider
      value={{ section, displaySection: section, feed, isPending: false }}
    >
      {children}
    </ReaderHubContext.Provider>
  );
}

export function useReaderHub(): ReaderHubValue {
  const value = useContext(ReaderHubContext);
  if (!value) {
    return {
      section: "for-you",
      displaySection: "for-you",
      feed: "for-you",
      isPending: false,
    };
  }
  return value;
}
