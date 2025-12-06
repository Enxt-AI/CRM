import bcrypt from "bcrypt";
import crypto from "crypto";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateRandomPassword(): string {
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ"; 
  const lowercase = "abcdefghjkmnpqrstuvwxyz"; 
  const digits = "23456789";
  const special = "!@#$%&*";

  let password = "";

  // Add 3 uppercase
  for (let i = 0; i < 3; i++) {
    password += uppercase[crypto.randomInt(uppercase.length)];
  }

  // Add 3 lowercase
  for (let i = 0; i < 3; i++) {
    password += lowercase[crypto.randomInt(lowercase.length)];
  }

  // Add 2 digits
  for (let i = 0; i < 2; i++) {
    password += digits[crypto.randomInt(digits.length)];
  }

  // Add 2 special characters
  for (let i = 0; i < 2; i++) {
    password += special[crypto.randomInt(special.length)];
  }

  // Shuffle the password
  return shuffleString(password);
}

/**
 * Shuffle a string using Fisher-Yates algorithm
 */
function shuffleString(str: string): string {
  const arr = str.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    // Ensure arr[i] and arr[j] are defined strings
    const temp: string = arr[i] ?? "";
    arr[i] = arr[j] ?? "";
    arr[j] = temp;
  }
  return arr.join("");
}
