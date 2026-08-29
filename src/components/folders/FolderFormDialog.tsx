"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { triggerMoonieReaction } from "@/lib/moonie/reactions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FolderListItem } from "@/types/folder";

export interface FolderFormValues {
  name: string;
  description: string;
  isPublic: boolean;
}

interface FolderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialFolder?: FolderListItem;
  onSubmit: (values: FolderFormValues) => Promise<{ success: boolean; error?: string }>;
}

interface FolderFormFieldsProps {
  mode: "create" | "edit";
  initialFolder?: FolderListItem;
  onSubmit: (values: FolderFormValues) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

function FolderFormFields({
  mode,
  initialFolder,
  onSubmit,
  onClose,
}: FolderFormFieldsProps) {
  const { data: session } = useSession();
  const fieldScope = session?.user?.id ?? "guest";
  const nameFieldId = `folder-name-${fieldScope}`;
  const descriptionFieldId = `folder-description-${fieldScope}`;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(initialFolder?.name ?? "");
  const [description, setDescription] = useState(initialFolder?.description ?? "");
  const [isPublic, setIsPublic] = useState(initialFolder?.isPublic ?? false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await onSubmit({ name, description, isPublic });
      if (!result.success) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      if (mode === "create") {
        triggerMoonieReaction("createReadingList");
      }
      onClose();
    });
  };

  return (
    <form onSubmit={handleSubmit} autoComplete="off">
      <DialogHeader>
        <DialogTitle>
          {mode === "create" ? "Create folder" : "Edit folder"}
        </DialogTitle>
        <DialogDescription>
          {mode === "create"
            ? "Organise reviews into a personal collection."
            : "Update your folder details."}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor={nameFieldId}>Name</Label>
          <Input
            id={nameFieldId}
            name={nameFieldId}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Best Romance"
            required
            maxLength={100}
            disabled={isPending}
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor={descriptionFieldId}>Description</Label>
          <Textarea
            id={descriptionFieldId}
            name={descriptionFieldId}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional notes about this collection"
            rows={3}
            maxLength={500}
            disabled={isPending}
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="folder-is-public"
            type="checkbox"
            checked={isPublic}
            onChange={(event) => setIsPublic(event.target.checked)}
            disabled={isPending}
            className="size-4 rounded border-border accent-primary"
          />
          <Label htmlFor="folder-is-public" className="font-normal">
            Make this folder public
          </Label>
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {mode === "create" ? "Create folder" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function FolderFormDialog({
  open,
  onOpenChange,
  mode,
  initialFolder,
  onSubmit,
}: FolderFormDialogProps) {
  const formKey = `${mode}-${initialFolder?.id ?? "new"}-${open ? "open" : "closed"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && (
          <FolderFormFields
            key={formKey}
            mode={mode}
            initialFolder={initialFolder}
            onSubmit={onSubmit}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
