"use client";

import { useTransition } from "react";
import { updateMoonieTasteProfileAction, getMoonieTasteProfileAction } from "@/actions/moonie.actions";
import { Button } from "@/components/ui/button";
import {
  dismissRememberPrompt,
  writeSessionPreferences,
  mergeSessionPreferencePatch,
  readSessionPreferences,
} from "@/lib/moonie/personalization";
import type { MoonieInterpretedPreferences } from "@/types/moonie";

interface MoonieRememberPreferencePromptProps {
  offer: Partial<MoonieInterpretedPreferences>;
  onDismiss: () => void;
}

export function MoonieRememberPreferencePrompt({
  offer,
  onDismiss,
}: MoonieRememberPreferencePromptProps) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-2xl border border-violet-100 bg-[#FBF6FC] px-4 py-3 text-sm text-slate-700">
      <p className="font-medium text-night-blue">
        Use this just for this chat, or remember it for future recommendations?
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          className="h-9 rounded-full"
          onClick={() => {
            const patch = {
              tags: offer.tags,
              genres: offer.genres,
              mood: offer.mood,
              excludedTags: offer.excludedTags,
              status: offer.status,
            };
            writeSessionPreferences(
              mergeSessionPreferencePatch(readSessionPreferences(), patch)
            );
            window.dispatchEvent(new Event("mv-moonie-session-prefs-change"));
            dismissRememberPrompt();
            onDismiss();
          }}
        >
          This chat only
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={pending}
          className="h-9 rounded-full"
          onClick={() => {
            startTransition(async () => {
              const profile = await getMoonieTasteProfileAction();
              await updateMoonieTasteProfileAction({
                favouriteGenres: [
                  ...new Set([
                    ...(profile.favouriteGenres ?? []),
                    ...(offer.genres ?? []),
                  ]),
                ],
                favouriteTags: [
                  ...new Set([
                    ...(profile.favouriteTags ?? []),
                    ...(offer.tags ?? []),
                  ]),
                ],
                avoidedTags: [
                  ...new Set([
                    ...(profile.avoidedTags ?? []),
                    ...(offer.excludedTags ?? []),
                  ]),
                ],
                preferredStatus: offer.status ?? profile.preferredStatus ?? null,
                useTasteByDefault: profile.useTasteByDefault,
              });
              dismissRememberPrompt();
              onDismiss();
            });
          }}
        >
          Remember
        </Button>
      </div>
    </div>
  );
}
