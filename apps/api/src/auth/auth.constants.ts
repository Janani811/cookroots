import type { Request } from 'express';

export const AUTH_COOKIE_NAME = 'cookroots_token';
export const AUTH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7d, matches JWT expiry

/**
 * The web app relies on the httpOnly auth cookie; the mobile app (no
 * cookie jar) sends a Bearer token instead. Guards accept either.
 */
export function extractToken(request: Request): string | null {
  const authHeader = request.headers.authorization;
  if (authHeader) {
    const [scheme, token] = authHeader.split(' ');
    if (scheme === 'Bearer' && token) return token;
  }

  const cookieToken = (request as Request & { cookies?: Record<string, string> })
    .cookies?.[AUTH_COOKIE_NAME];
  return cookieToken ?? null;
}
