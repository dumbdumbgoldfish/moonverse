import { MOONIE_OPEN_STORAGE_KEY } from "@/lib/moonie/constants";

const openListeners = new Set<() => void>();

export function subscribeMooniePanelOpen(onStoreChange: () => void): () => void {
  openListeners.add(onStoreChange);
  return () => openListeners.delete(onStoreChange);
}

export function getMooniePanelOpenSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(MOONIE_OPEN_STORAGE_KEY) === "true";
}

export function setMooniePanelOpen(open: boolean): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(MOONIE_OPEN_STORAGE_KEY, open ? "true" : "false");
  openListeners.forEach((listener) => listener());
}

/** Closes the floating Moonie panel and notifies subscribers. */
export function closeMooniePanel(): void {
  setMooniePanelOpen(false);
}
