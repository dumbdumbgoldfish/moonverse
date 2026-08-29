"use client";

import { useEffect, type ReactNode } from "react";

export function SearchCommandProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const focusSearch = () => {
      const inputs = Array.from(
        document.querySelectorAll<HTMLInputElement>("[data-moonverse-search]")
      );
      const visible =
        inputs.find((input) => input.getClientRects().length > 0) ?? inputs[0];
      visible?.focus();
      visible?.select();
    };

    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      const typing =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        focusSearch();
        return;
      }

      if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey && !typing) {
        event.preventDefault();
        focusSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return children;
}
