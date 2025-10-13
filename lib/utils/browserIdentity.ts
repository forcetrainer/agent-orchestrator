/**
 * Browser Identity Management Module
 *
 * Provides cookie-based browser identification for conversation persistence
 * without requiring user authentication. Uses HTTP-only cookies with security
 * attributes to prevent XSS/CSRF attacks while maintaining GDPR compliance.
 *
 * Security Features:
 * - HTTP-only cookies (prevents JavaScript access)
 * - Secure flag in production (HTTPS-only)
 * - SameSite=Strict (CSRF protection)
 * - 1-year expiration (31536000 seconds)
 *
 * Privacy Features:
 * - Opaque UUID with no PII
 * - First-party cookie only
 * - User-controlled deletion
 *
 * @module browserIdentity
 */

import { cookies } from 'next/headers';

const COOKIE_NAME = 'agent_orchestrator_browser_id';
const ONE_YEAR_SECONDS = 31536000;

/**
 * Generate a new browser ID using crypto.randomUUID()
 *
 * Returns UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * Uses native Node.js crypto API for secure random generation.
 *
 * @returns {string} UUID v4 string
 *
 * @example
 * const browserId = generateBrowserId();
 * // Returns: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
 */
export function generateBrowserId(): string {
  return crypto.randomUUID();
}

/**
 * Get browser ID from request cookies
 *
 * Reads the browser ID cookie from the Next.js request using the cookies() API.
 * Returns null if the cookie doesn't exist (first visit or cookie deleted).
 *
 * @returns {string | null} Browser ID or null if not found
 *
 * @example
 * const browserId = getBrowserId();
 * if (browserId) {
 *   console.log('Returning visitor:', browserId);
 * } else {
 *   console.log('First visit - no browser ID found');
 * }
 */
export function getBrowserId(): string | null {
  const cookieStore = cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  return cookie?.value || null;
}

/**
 * Set browser ID cookie in response
 *
 * Configures security attributes per OWASP recommendations:
 * - httpOnly: true - Prevents XSS access via document.cookie
 * - secure: true in production - HTTPS-only transmission
 * - sameSite: 'strict' - CSRF protection, blocks cross-site requests
 * - maxAge: 1 year - Long-lived session for conversation persistence
 * - path: '/' - Available across entire application
 *
 * @param {string} browserId - UUID v4 browser identifier
 *
 * @example
 * const newId = generateBrowserId();
 * setBrowserId(newId);
 * // Cookie set in response headers automatically via Next.js cookies() API
 */
export function setBrowserId(browserId: string): void {
  const cookieStore = cookies();
  cookieStore.set({
    name: COOKIE_NAME,
    value: browserId,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: ONE_YEAR_SECONDS,
    path: '/',
  });
}

/**
 * Get or create browser ID (convenience function)
 *
 * Returns existing ID from cookie or generates a new one if not found.
 * Automatically sets the cookie for new IDs.
 *
 * This is the primary function used by API routes to ensure every
 * request has an associated browser ID.
 *
 * @returns {string} Browser ID (existing or newly generated)
 *
 * @example
 * // In API route
 * export async function POST(request: NextRequest) {
 *   const browserId = getOrCreateBrowserId();
 *   // browserId is guaranteed to be valid UUID
 * }
 */
export function getOrCreateBrowserId(): string {
  let browserId = getBrowserId();

  if (!browserId) {
    browserId = generateBrowserId();
    setBrowserId(browserId);
  }

  return browserId;
}
