"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { MoonieWidget } from "@/components/moonie/MoonieWidget";
import { shouldShowFloatingMoonie } from "@/lib/moonie/constants";
import { setMoonieWidgetMounted } from "@/lib/moonie/open-moonie";

export function MoonieWidgetHost({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname();
  const visible = shouldShowFloatingMoonie(pathname);

  useEffect(() => {
    setMoonieWidgetMounted(visible);
    return () => setMoonieWidgetMounted(false);
  }, [visible]);

  if (!visible) return null;

  return (
    <MoonieWidget isLoggedIn={isLoggedIn} elevateForMobileNav={isLoggedIn} />
  );
}
