// environment.ts
// Environment configuration - Manages environment variables
// Loads and validates environment variables, provides configuration constants

import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Environment variable interface
export interface Environment {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRE: string;
  FRONTEND_URL: string;
  // PayPal Configuration (Member 7)
  PAYPAL_CLIENT_ID: string;
  PAYPAL_CLIENT_SECRET: string;
  PAYPAL_MODE: 'sandbox' | 'live';
}

/**
 * Validate that a required environment variable exists
 */
const getRequiredEnv = (key: string): string => {
  const value = process.env[key];
  // During tests, avoid throwing to allow in-memory DB usage and test setup
  if (!value && process.env.NODE_ENV !== 'test') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || '';
};

/**
 * Get optional environment variable with default value
 */
const getOptionalEnv = (key: string, defaultValue: string): string => {
  return process.env[key] || defaultValue;
};

/**
 * Environment configuration object
 * Validates and exports all environment variables with proper types
 */
export const env: Environment = {
  NODE_ENV: getOptionalEnv(
    'NODE_ENV',
    'development'
  ) as Environment['NODE_ENV'],
  PORT: parseInt(getOptionalEnv('PORT', '5000'), 10),
  MONGODB_URI: getRequiredEnv('MONGODB_URI'),
  JWT_SECRET: getRequiredEnv('JWT_SECRET'),

  JWT_EXPIRE: getOptionalEnv('JWT_EXPIRE', '24h'),
  FRONTEND_URL: getOptionalEnv('FRONTEND_URL', 'http://localhost:3000'),

  // PayPal Configuration (Member 7)
  PAYPAL_CLIENT_ID: getRequiredEnv('PAYPAL_CLIENT_ID'),
  PAYPAL_CLIENT_SECRET: getRequiredEnv('PAYPAL_CLIENT_SECRET'),
  PAYPAL_MODE: getOptionalEnv('PAYPAL_MODE', 'sandbox') as Environment['PAYPAL_MODE'],
};

/**
 * Check if running in development mode
 */
export const isDevelopment = (): boolean => env.NODE_ENV === 'development';

/**
 * Check if running in production mode
 */
export const isProduction = (): boolean => env.NODE_ENV === 'production';

/**
 * Check if running in test mode
 */
export const isTest = (): boolean => env.NODE_ENV === 'test';

export default env;
