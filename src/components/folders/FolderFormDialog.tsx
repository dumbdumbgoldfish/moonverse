"use client";

import { useState, useTransition } from "react";
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
      onClose();
    });
  };

  return (
    <form onSubmit={handleSubmit}>
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
          <Label htmlFor="folder-name">Name</Label>
          <Input
            id="folder-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Best Romance"
            required
            maxLength={100}
            disabled={isPending}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="folder-description">Description</Label>
          <Textarea
            id="folder-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional notes about this collection"
            rows={3}
            maxLength={500}
            disabled={isPending}
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
