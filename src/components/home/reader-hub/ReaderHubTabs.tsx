"use client";

import { EditorialViewTabs } from "@/components/home/community/EditorialViewTabs";
import { useReaderHub } from "./reader-hub-context";

export function ReaderHubTabs() {
  const { displaySection, feed } = useReaderHub();
  return (
    <EditorialViewTabs
      view={displaySection === "community" ? "community" : "home"}
      feed={feed}
    />
  );
}
