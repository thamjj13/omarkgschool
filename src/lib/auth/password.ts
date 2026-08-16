import bcrypt from "bcryptjs";

const ROUNDS = 12;

// A valid bcrypt hash used only to equalise response timing when a login
// attempt targets an unknown email address (prevents user enumeration).
export const DUMMY_HASH =
  "$2b$12$2DIY2TwOQm0crCAhnglChOIIQj.Qi7v4mchIvG.X1L9y.4Zb7e1AG";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}
