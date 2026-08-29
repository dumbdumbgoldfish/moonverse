export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  hints: string[];
};

export function scorePassword(value: string): PasswordStrength {
  const hints: string[] = [];
  if (!value) {
    return { score: 0, label: "Enter a password", hints: ["At least 8 characters, with a letter and a number."] };
  }

  const longEnough = value.length >= 8;
  const extraLength = value.length >= 12;
  const hasLetter = /[A-Za-z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);

  if (!longEnough) hints.push("Use at least 8 characters.");
  if (!hasLetter || !hasNumber) hints.push("Include a letter and a number.");
  if (longEnough && hasLetter && hasNumber && !extraLength && !hasSymbol) {
    hints.push("12+ characters or a symbol makes it stronger.");
  }

  let score = 0 as PasswordStrength["score"];
  if (longEnough) score = 1;
  if (longEnough && hasLetter && hasNumber) score = 2;
  if (longEnough && hasLetter && hasNumber && (extraLength || hasSymbol)) score = 3;
  if (extraLength && hasLetter && hasNumber && hasSymbol) score = 4;

  const label =
    score <= 1 ? "Weak" : score === 2 ? "Okay" : score === 3 ? "Strong" : "Excellent";

  return { score, label, hints };
}
