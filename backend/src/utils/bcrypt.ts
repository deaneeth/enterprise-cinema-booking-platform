// bcrypt.ts (Member 1)
// Bcrypt utility - Handles password hashing and verification
// Hashes passwords securely and verifies password matches

import * as bcrypt from 'bcryptjs';

// Number of salt rounds for bcrypt hashing
const SALT_ROUNDS = 10;

/**
 * Hash a plain text password using bcrypt
 * @param password - Plain text password to hash
 * @returns Hashed password string
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    // Generate salt with specified rounds
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    // Hash the password with the salt
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    throw new Error('Error hashing password');
  }
};

/**
 * Compare a plain text password with a hashed password
 * @param candidatePassword - Plain text password to check
 * @param hashedPassword - Hashed password from database
 * @returns true if passwords match, false otherwise
 */
export const comparePassword = async (
  candidatePassword: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    const isMatch = await bcrypt.compare(candidatePassword, hashedPassword);
    return isMatch;
  } catch (error) {
    // Return false on any error to prevent leaking information
    return false;
  }
};

/**
 * Generate a salt for password hashing
 * @param rounds - Number of salt rounds (default: 10)
 * @returns Generated salt string
 */
export const generateSalt = async (
  rounds: number = SALT_ROUNDS
): Promise<string> => {
  try {
    return await bcrypt.genSalt(rounds);
  } catch (error) {
    throw new Error('Error generating salt');
  }
};

/**
 * Hash a password with a specific salt
 * @param password - Plain text password to hash
 * @param salt - Salt to use for hashing
 * @returns Hashed password string
 */
export const hashPasswordWithSalt = async (
  password: string,
  salt: string
): Promise<string> => {
  try {
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error('Error hashing password with salt');
  }
};

export default {
  hashPassword,
  comparePassword,
  generateSalt,
  hashPasswordWithSalt,
  SALT_ROUNDS,
};
