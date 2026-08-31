"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { MoonieChatPanel } from "@/components/moonie/MoonieChatPanel";
import { MoonieFab } from "@/components/moonie/MoonieFab";
import {
  closeMooniePanel,
  getMooniePanelOpenSnapshot,
  setMooniePanelOpen,
  subscribeMooniePanelOpen,
} from "@/lib/moonie/panel-open-state";
import { useMoonieChat } from "@/hooks/use-moonie-chat";

interface MoonieWidgetProps {
  isLoggedIn: boolean;
  /** Lift FAB above the mobile bottom nav when it is visible. */
  elevateForMobileNav?: boolean;
}

export function MoonieWidget({
  isLoggedIn,
  elevateForMobileNav = false,
}: MoonieWidgetProps) {
  const pathname = usePathname();
  const hideFab = pathname.startsWith("/moonie");

  const open = useSyncExternalStore(
    subscribeMooniePanelOpen,
    getMooniePanelOpenSnapshot,
    () => false
  );

  // Guest open state must not leak into authenticated sessions or survive refresh.
  useEffect(() => {
    if (isLoggedIn) {
      closeMooniePanel();
    }
  }, [isLoggedIn]);

  const {
    messages,
    input,
    setInput,
    isLoading,
    loadingPhase,
    handleSubmit,
    hideNovel,
    quotaRemaining,
    conversationId,
    startNewConversation,
  } = useMoonieChat({ isLoggedIn });

  const setPanelOpen = useCallback((next: boolean) => {
    setMooniePanelOpen(next);
  }, []);

  const handleClosePanel = useCallback(() => {
    setPanelOpen(false);
  }, [setPanelOpen]);

  useEffect(() => {
    const handleOpen = () => {
      if (pathname.startsWith("/moonie")) return;
      startNewConversation();
      setMooniePanelOpen(true);
    };
    window.addEventListener("moonie:open", handleOpen);
    return () => window.removeEventListener("moonie:open", handleOpen);
  }, [pathname, startNewConversation]);

  if (hideFab) return null;

  return (
    <>
      <MoonieFab
        open={open}
        onToggle={() => setPanelOpen(!open)}
        elevateForMobileNav={elevateForMobileNav}
        hidden={open}
      />
      {open ? (
        <div id="moonie-chat-panel">
          <MoonieChatPanel
            open={open}
            onClose={handleClosePanel}
            isLoggedIn={isLoggedIn}
            messages={messages}
            isLoading={isLoading}
            loadingPhase={loadingPhase}
            input={input}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            onNotForMe={hideNovel}
            onMoreLikeThis={(novelId) =>
              void handleSubmit("More like this novel, refined to my taste.", {
                similarToNovelId: novelId,
              })
            }
            loginCallbackUrl={pathname}
            quotaRemaining={quotaRemaining}
            conversationId={conversationId}
          />
        </div>
      ) : null}
    </>
  );
}
