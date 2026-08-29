"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { ChevronDown } from "lucide-react";
import {
  AUTH_LABEL_CLASS,
  AUTH_SELECT_CLASS,
} from "@/components/auth/auth-field";
import { AuthFieldNote } from "@/components/auth/AuthFieldNote";
import { Label } from "@/components/ui/label";
import {
  BIRTHDAY_MONTHS,
  ageFromIso,
  birthdayYearRange,
  daysInMonth,
  isoFromParts,
  type BirthdayParts,
} from "@/lib/birthday";
import { cn } from "@/lib/utils";

function SelectWrap({
  id,
  label,
  value,
  required,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  required?: boolean;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <Label className="sr-only" htmlFor={id}>
        {label}
      </Label>
      <select
        id={id}
        className={cn(AUTH_SELECT_CLASS, "cursor-pointer")}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#4C2A67]/55"
        aria-hidden
      />
    </div>
  );
}

interface AuthBirthdayFieldsProps {
  value: BirthdayParts;
  onChange: (next: BirthdayParts) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string | null;
}

export function AuthBirthdayFields({
  value,
  onChange,
  disabled,
  required,
  error,
}: AuthBirthdayFieldsProps) {
  const years = useMemo(() => {
    const { max, min } = birthdayYearRange();
    const list: number[] = [];
    for (let year = max; year >= min; year -= 1) list.push(year);
    return list;
  }, []);

  const dayCount = useMemo(() => {
    const year = Number(value.year) || 2000;
    const month = Number(value.month) || 1;
    return daysInMonth(year, month);
  }, [value.month, value.year]);

  const iso = isoFromParts(value);
  const age = iso ? ageFromIso(iso) : null;

  const patch = (key: keyof BirthdayParts, nextValue: string) => {
    const next = { ...value, [key]: nextValue };
    if (key !== "day") {
      const maxDay = daysInMonth(
        Number(next.year) || 2000,
        Number(next.month) || 1,
      );
      if (Number(next.day) > maxDay) next.day = String(maxDay);
    }
    onChange(next);
  };

  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className={cn(AUTH_LABEL_CLASS, "px-0")}>Birthday</legend>
      <p className="text-xs leading-5 text-[#1A1224]/50">
        Confirms you are 13 or older. It is not stored on your public profile.
      </p>

      <div className="grid grid-cols-3 gap-2">
        <SelectWrap
          id="register-birth-month"
          label="Month"
          value={value.month}
          required={required}
          onChange={(next) => patch("month", next)}
        >
          <option value="">Month</option>
          {BIRTHDAY_MONTHS.map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </SelectWrap>

        <SelectWrap
          id="register-birth-day"
          label="Day"
          value={value.day}
          required={required}
          onChange={(next) => patch("day", next)}
        >
          <option value="">Day</option>
          {Array.from({ length: dayCount }, (_, index) =>
            String(index + 1),
          ).map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </SelectWrap>

        <SelectWrap
          id="register-birth-year"
          label="Year"
          value={value.year}
          required={required}
          onChange={(next) => patch("year", next)}
        >
          <option value="">Year</option>
          {years.map((year) => (
            <option key={year} value={String(year)}>
              {year}
            </option>
          ))}
        </SelectWrap>
      </div>

      <input type="hidden" name="birthday" value={iso ?? ""} />

      {error ? (
        <AuthFieldNote tone="error">{error}</AuthFieldNote>
      ) : age !== null && age >= 13 ? (
        <AuthFieldNote tone="ok">
          Age confirmed · {age}. This stays private.
        </AuthFieldNote>
      ) : age !== null ? (
        <AuthFieldNote tone="error">
          MoonVerse is for readers 13 and up.
        </AuthFieldNote>
      ) : (
        <AuthFieldNote>
          Month, day and year: faster than a calendar, and private.
        </AuthFieldNote>
      )}
    </fieldset>
  );
}
