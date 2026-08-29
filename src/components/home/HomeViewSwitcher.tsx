"use client";

import { EditorialViewTabs } from "@/components/home/community/EditorialViewTabs";
import type { HomeView } from "@/lib/home-view";

interface HomeViewSwitcherProps {
  view: HomeView;
  feed?: string;
}

export function HomeViewSwitcher({ view, feed }: HomeViewSwitcherProps) {
  return <EditorialViewTabs view={view} feed={feed} />;
}
