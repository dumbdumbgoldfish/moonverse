"use client";

import { useState, type ChangeEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { AUTH_INPUT_CLASS, AUTH_LABEL_CLASS } from "@/components/auth/auth-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { scorePassword } from "@/lib/password-strength";
import { cn } from "@/lib/utils";

interface PasswordFieldProps {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  showStrength?: boolean;
  error?: string;
  describedBy?: string;
}

export function PasswordField({
  id,
  name,
  label,
  placeholder = "Password",
  autoComplete,
  minLength,
  required,
  disabled,
  className,
  value,
  onValueChange,
  showStrength = false,
  error,
  describedBy,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [uncontrolled, setUncontrolled] = useState("");
  const current = value ?? uncontrolled;
  const strength = showStrength ? scorePassword(current) : null;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    if (value === undefined) setUncontrolled(next);
    onValueChange?.(next);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className={AUTH_LABEL_CLASS}>
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={cn(AUTH_INPUT_CLASS, "pr-12")}
          minLength={minLength}
          required={required}
          aria-required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={cn(describedBy, error ? errorId : undefined, hintId)}
          disabled={disabled}
          {...(value !== undefined ? { value } : {})}
          onChange={onChange}
          onKeyDown={(event) => setCapsLock(event.getModifierState("CapsLock"))}
          onKeyUp={(event) => setCapsLock(event.getModifierState("CapsLock"))}
          onBlur={() => setCapsLock(false)}
        />
        <button
          type="button"
          onClick={() => setVisible((currentVisible) => !currentVisible)}
          className="absolute right-1.5 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-[#1A1224]/45 transition-colors hover:bg-white hover:text-night-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      </div>
      {capsLock ? (
        <p className="text-xs font-medium text-amber-700">Caps Lock is on.</p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs font-medium text-rose-700">
          {error}
        </p>
      ) : null}
      {strength && current ? (
        <div id={hintId} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <div className="grid flex-1 grid-cols-4 gap-1">
              {([1, 2, 3, 4] as const).map((level) => (
                <span
                  key={level}
                  className={cn(
                    "h-1 rounded-full",
                    strength.score >= level
                      ? strength.score <= 1
                        ? "bg-rose-400"
                        : strength.score === 2
                          ? "bg-amber-400"
                          : "bg-emerald-500"
                      : "bg-[#E8DFEF]"
                  )}
                />
              ))}
            </div>
            <span className="text-[11px] font-semibold text-[#1A1224]/55">{strength.label}</span>
          </div>
          {strength.hints[0] ? (
            <p className="text-xs text-[#1A1224]/50">{strength.hints[0]}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
