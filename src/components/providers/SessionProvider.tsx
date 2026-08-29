"use client";

import {
  SessionProvider as NextAuthSessionProvider,
  __NEXTAUTH,
} from "next-auth/react";
import { useLayoutEffect } from "react";
import type { Session } from "next-auth";

interface SessionProviderProps {
  children: React.ReactNode;
  session: Session | null;
}

function primeClientSession(session: Session | null) {
  __NEXTAUTH._session = session;
  __NEXTAUTH._lastSync = Math.floor(Date.now() / 1000);
}

export function SessionProvider({ children, session }: SessionProviderProps) {
  // NextAuth clears __NEXTAUTH._session in its effect cleanup. In React Strict
  // Mode (dev), that remount triggers a client fetch before the server session
  // is restored — restore it in layout effect so _getSession can skip the fetch.
  useLayoutEffect(() => {
    primeClientSession(session);
  }, [session]);

  return (
    <NextAuthSessionProvider
      session={session}
      // Avoid noisy session refetch errors when the dev server restarts or port changes.
      refetchOnWindowFocus={process.env.NODE_ENV === "production"}
    >
      {children}
    </NextAuthSessionProvider>
  );
}
