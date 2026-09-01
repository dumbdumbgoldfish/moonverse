import { useState } from "react";
import { normalizeNavPathname } from "@/lib/nav-route-active";

type NavPendingFromPath = {
  path: string;
  href: string;
  generation: number;
};

type RouteEpoch = {
  path: string;
  generation: number;
};

/**
 * Tracks in-flight primary-nav clicks. Pending is scoped to the current route
 * generation so returning to an origin route cannot resurrect stale underline state.
 */
export function useNavPendingFromPath(pathname: string) {
  const normalizedPath = normalizeNavPathname(pathname);
  const [routeEpoch, setRouteEpoch] = useState<RouteEpoch>({
    path: normalizedPath,
    generation: 0,
  });
  const [pendingFromPath, setPendingFromPath] = useState<NavPendingFromPath | null>(
    null
  );

  if (routeEpoch.path !== normalizedPath) {
    setRouteEpoch({
      path: normalizedPath,
      generation: routeEpoch.generation + 1,
    });
  }

  const generation = routeEpoch.generation;

  const pendingHref =
    pendingFromPath &&
    pendingFromPath.path === normalizedPath &&
    pendingFromPath.generation === generation
      ? pendingFromPath.href
      : null;

  const setPendingForNav = (href: string) => {
    setPendingFromPath({
      path: normalizedPath,
      href: normalizeNavPathname(href),
      generation,
    });
  };

  return { normalizedPath, pendingHref, setPendingForNav };
}
