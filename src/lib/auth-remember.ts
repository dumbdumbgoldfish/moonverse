const STORAGE_KEY = "moonverse.auth.identifier";

export function readRememberedIdentifier(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

export function writeRememberedIdentifier(value: string | null): void {
  try {
    if (!value) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // private browsing
  }
}
