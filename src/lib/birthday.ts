const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export type BirthdayParts = {
  year: string;
  month: string;
  day: string;
};

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function birthdayYearRange(today = new Date()): { max: number; min: number } {
  return {
    max: today.getFullYear() - 13,
    min: today.getFullYear() - 120,
  };
}

export function isoFromParts(parts: BirthdayParts): string | null {
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  if (!year || !month || !day) return null;
  if (day > daysInMonth(year, month)) return null;
  const iso = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() + 1 !== month ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return iso;
}

export function ageFromIso(iso: string, today = new Date()): number | null {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }
  return age;
}

export function birthdayGateError(iso: string | null, today = new Date()): string | null {
  if (!iso) return "Choose your birth month, day and year.";
  const age = ageFromIso(iso, today);
  if (age === null) return "Enter a valid birthday.";
  if (age < 13) return "You must be at least 13 to join MoonVerse.";
  if (age > 120) return "Enter a valid birthday.";
  return null;
}

export const BIRTHDAY_MONTHS = MONTHS.map((label, index) => ({
  value: String(index + 1),
  label,
}));
