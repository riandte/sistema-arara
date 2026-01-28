import bcrypt from 'bcryptjs';

/**
 * Hash a password using bcrypt
 * @param password The plain text password
 * @returns The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare a plain text password with a hash
 * @param password The plain text password
 * @param hash The hashed password
 * @returns True if they match, false otherwise
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
