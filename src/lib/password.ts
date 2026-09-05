import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 200) return "Password is too long.";
  if (!/[a-zA-Z]/.test(password)) return "Password must contain a letter.";
  if (!/[0-9]/.test(password)) return "Password must contain a number.";
  if (!/[^a-zA-Z0-9]/.test(password))
    return "Password must contain a special character.";
  return null;
}
