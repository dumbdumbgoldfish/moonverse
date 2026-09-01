"use client";

import { useMemo, useState } from "react";
import {
  canSubmitTagSuggestionMap,
  filterCanonicalTagsForMap,
  type CanonicalTagOption,
} from "@/lib/admin/inbox-tag-suggestion-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InboxTagSuggestionMapControlProps {
  canonicalTags: CanonicalTagOption[];
  itemBusy: boolean;
  isMapPending: boolean;
  mapError: string | null;
  onMap: (tagId: string) => void;
}

export function InboxTagSuggestionMapControl({
  canonicalTags,
  itemBusy,
  isMapPending,
  mapError,
  onMap,
}: InboxTagSuggestionMapControlProps) {
  const [query, setQuery] = useState("");
  const [selectedTagId, setSelectedTagId] = useState("");

  const filteredTags = useMemo(
    () => filterCanonicalTagsForMap(canonicalTags, query),
    [canonicalTags, query]
  );

  const canSubmit = canSubmitTagSuggestionMap(selectedTagId, itemBusy);

  return (
    <div className="max-w-md space-y-2 rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <Label className="text-xs font-medium text-white/80">
        Map to existing tag
      </Label>
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search canonical tags…"
        disabled={itemBusy}
        className="h-9 rounded-xl border-white/10 bg-white/[0.06] text-sm text-white placeholder:text-white/35"
      />
      <Select
        value={selectedTagId}
        onValueChange={(value) => setSelectedTagId(value ?? "")}
        disabled={itemBusy || filteredTags.length === 0}
      >
        <SelectTrigger className="h-9 rounded-xl border-white/10 bg-white/[0.06] text-sm text-white">
          <SelectValue placeholder="Select an existing tag" />
        </SelectTrigger>
        <SelectContent>
          {filteredTags.map((tag) => (
            <SelectItem key={tag.id} value={tag.id}>
              {tag.name} · {tag.kind}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        variant="outline"
        disabled={!canSubmit}
        onClick={() => {
          if (!selectedTagId) return;
          onMap(selectedTagId);
        }}
      >
        {isMapPending ? "…" : "Map to existing tag"}
      </Button>
      {mapError ? (
        <p className="text-xs text-destructive" role="alert">
          {mapError}
        </p>
      ) : null}
    </div>
  );
}
