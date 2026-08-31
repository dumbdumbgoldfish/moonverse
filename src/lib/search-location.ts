/** Client-side search URL sync between the navbar field and `/search`. */
export const SEARCH_LOCATION_EVENT = "moonverse:search-location";

export function subscribeSearchLocation(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange);
  window.addEventListener(SEARCH_LOCATION_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("popstate", onStoreChange);
    window.removeEventListener(SEARCH_LOCATION_EVENT, onStoreChange);
  };
}

export function notifySearchLocation() {
  window.dispatchEvent(new Event(SEARCH_LOCATION_EVENT));
}

export function readLocationSearchQuery(): string {
  return new URLSearchParams(window.location.search).get("q")?.trim() ?? "";
}
