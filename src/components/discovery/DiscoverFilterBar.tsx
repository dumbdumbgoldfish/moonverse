"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface DiscoverFilterChip {
  key: string;
  label: string;
}

interface DiscoverFilterBarProps {
  chips: DiscoverFilterChip[];
  onRemoveChip: (key: string) => void;
  onClear: () => void;
  filtersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  filterPanel: ReactNode;
  toolbar?: ReactNode;
}

export function DiscoverFilterBar({
  chips,
  onRemoveChip,
  onClear,
  filtersOpen,
  onFiltersOpenChange,
  filterPanel,
  toolbar,
}: DiscoverFilterBarProps) {
  const hasChips = chips.length > 0;

  return (
    <>
      <div className="mb-4 lg:mb-5">
        <div className="hidden flex-wrap items-center gap-2 lg:flex">{toolbar}</div>

        {hasChips ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => onRemoveChip(chip.key)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full bg-[#6E46C7]/10 px-2.5 py-1 text-[12px] font-medium text-[#6E46C7]",
                  "transition-colors duration-150 hover:bg-[#6E46C7]/16"
                )}
              >
                {chip.label}
                <X className="size-3" aria-hidden />
              </button>
            ))}
            <button
              type="button"
              onClick={onClear}
              className="text-[12px] font-medium text-[#1A1224]/55 hover:text-[#6E46C7]"
            >
              Clear
            </button>
          </div>
        ) : null}
      </div>

      <Dialog open={filtersOpen} onOpenChange={onFiltersOpenChange}>
        <DialogContent className="max-h-[85vh] overflow-y-auto bg-[#FBF7F1] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">Filters</DialogTitle>
          </DialogHeader>
          {filterPanel}
          <Button
            variant="outline"
            className="mt-2 w-full rounded-full"
            onClick={() => onFiltersOpenChange(false)}
          >
            Show results
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
