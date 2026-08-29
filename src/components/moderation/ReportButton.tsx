"use client";

import { useId, useState, useTransition } from "react";
import { CheckCircle2, Flag, ShieldAlert } from "lucide-react";
import type { ReportTargetType } from "@prisma/client";
import { createReportAction } from "@/actions/report.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const REASONS = [
  "Spam or scam",
  "Harassment or hate speech",
  "Explicit or inappropriate content",
  "Spoilers without a warning",
  "Impersonation",
  "Other",
];

interface ReportButtonProps {
  targetType: ReportTargetType;
  targetId: string;
  isLoggedIn: boolean;
  variant?: "text" | "icon" | "chip";
  className?: string;
  label?: string;
  title?: string;
  description?: string;
  reasons?: string[];
}

const triggerVariants = {
  text: cn(
    "inline-flex min-h-7 items-center gap-1.5 rounded-lg px-2 py-1",
    "text-[12px] font-semibold text-[#7a7284]",
    "transition-colors hover:bg-[#6E46C7]/[0.06] hover:text-[#5a4d72]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]/25"
  ),
  icon: cn(
    "inline-flex size-9 items-center justify-center rounded-full",
    "text-[#7a7284] transition-colors",
    "hover:bg-[#F4ECF8] hover:text-[#6E46C7]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]/30"
  ),
  chip: cn(
    "inline-flex min-h-9 items-center gap-2 rounded-full border border-[#6E46C7]/12",
    "bg-white/90 px-3.5 text-[13px] font-semibold text-[#5a4d72] shadow-[0_4px_14px_-10px_rgba(26,16,51,0.35)]",
    "transition hover:border-[#6E46C7]/28 hover:bg-[#F4ECF8]/90 hover:text-[#6E46C7]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]/30"
  ),
} as const;

export function ReportButton({
  targetType,
  targetId,
  isLoggedIn,
  variant = "text",
  className,
  label,
  title = "Report content",
  description = "Let us know why this needs review. Our moderators will take a look.",
  reasons = REASONS,
}: ReportButtonProps) {
  const detailsId = useId();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(reasons[0] ?? REASONS[0]);
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setError(null);
      setDone(false);
      setDetails("");
      setReason(reasons[0] ?? REASONS[0]);
    }
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await createReportAction({
        targetType,
        targetId,
        reason,
        details: details.trim() || undefined,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setDone(true);
    });
  }

  if (!isLoggedIn) return null;

  const displayLabel = label ?? "Report";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(triggerVariants[variant], className)}
        aria-label={displayLabel}
      >
        <Flag
          className={cn(
            "shrink-0",
            variant === "chip" ? "size-3.5" : "size-3.5",
            variant === "text" && "opacity-80"
          )}
          aria-hidden
        />
        {variant !== "icon" ? displayLabel : null}
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          overlayClassName="z-[85] bg-[#1a1033]/40 supports-backdrop-filter:backdrop-blur-[2px]"
          className="z-[85] gap-0 overflow-hidden border-[#6E46C7]/12 bg-[#FFFBFF] p-0 sm:max-w-lg"
        >
          <div
            className={cn(
              "border-b border-[#6E46C7]/8 px-6 pb-5 pt-6",
              done
                ? "bg-gradient-to-b from-emerald-50/80 to-[#FFFBFF]"
                : "bg-gradient-to-b from-[#F8F1FA] to-[#FFFBFF]"
            )}
          >
            <DialogHeader className="space-y-3 text-left">
              <div
                className={cn(
                  "flex size-11 items-center justify-center rounded-2xl ring-1",
                  done
                    ? "bg-emerald-50 text-emerald-600 ring-emerald-200"
                    : "bg-[#F4ECF8] text-[#6E46C7] ring-[#6E46C7]/10"
                )}
              >
                {done ? (
                  <CheckCircle2 className="size-5" aria-hidden />
                ) : (
                  <ShieldAlert className="size-5" aria-hidden />
                )}
              </div>
              <div className="space-y-1.5">
                <DialogTitle className="font-sans text-[18px] font-semibold tracking-tight text-[#1a1033]">
                  {done ? "Report submitted" : title}
                </DialogTitle>
                <DialogDescription
                  className="text-[14px] leading-relaxed text-[#7a7284]"
                  {...(done ? { role: "status", "aria-live": "polite" as const } : {})}
                >
                  {done
                    ? "Thank you. Our moderators will review this shortly."
                    : description}
                </DialogDescription>
              </div>
            </DialogHeader>
          </div>

          {!done ? (
            <div className="space-y-5 px-6 py-5">
              {error ? (
                <p
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}

              <fieldset className="space-y-2.5">
                <legend className="text-[13px] font-semibold text-[#1a1033]">
                  Reason
                </legend>
                <div className="flex flex-wrap gap-2">
                  {reasons.map((option) => {
                    const selected = reason === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setReason(option)}
                        disabled={isPending}
                        aria-pressed={selected}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-[12px] font-medium transition",
                          selected
                            ? "border-[#6E46C7] bg-[#F4ECF8] text-[#6E46C7] shadow-[inset_0_0_0_1px_rgba(110,70,199,0.08)]"
                            : "border-[#6E46C7]/12 bg-white text-[#5a4d72] hover:border-[#6E46C7]/25 hover:bg-[#FAF8FC]"
                        )}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="space-y-2.5">
                <Label
                  htmlFor={`${detailsId}-field`}
                  className="text-[13px] font-semibold text-[#1a1033]"
                >
                  Additional details{" "}
                  <span className="font-normal text-[#7a7284]">(optional)</span>
                </Label>
                <Textarea
                  id={`${detailsId}-field`}
                  value={details}
                  onChange={(event) => setDetails(event.target.value)}
                  disabled={isPending}
                  rows={4}
                  maxLength={1000}
                  placeholder="Share any context that helps moderators understand the issue…"
                  className="min-h-[6.5rem] resize-none rounded-2xl border-[#6E46C7]/15 bg-[#FAF8FC] text-[14px] text-[#1a1033] placeholder:text-[#9b93a8] focus-visible:border-[#6E46C7]/35 focus-visible:ring-[#6E46C7]/20"
                />
              </div>
            </div>
          ) : null}

          <DialogFooter className="!m-0 gap-2 border-t border-[#6E46C7]/8 bg-[#FFFBFF] px-6 py-4 sm:justify-end">
            {done ? (
              <Button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="rounded-full bg-[#6E46C7] px-6 text-white hover:bg-[#5d3ab0]"
              >
                Close
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isPending}
                  className="rounded-full border-[#6E46C7]/18 bg-white px-5 text-[#5a4d72] hover:bg-[#F4ECF8]/60"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="rounded-full bg-[#6E46C7] px-5 text-white hover:bg-[#5d3ab0]"
                >
                  {isPending ? "Submitting…" : "Submit report"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
