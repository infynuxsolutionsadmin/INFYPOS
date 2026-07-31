import { DecodedJwt } from '../types/auth';

/**
 * Decodes a JWT payload safely
 */
export function decodeJwt(token: string): DecodedJwt | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );

    return JSON.parse(jsonPayload) as DecodedJwt;
  } catch {
    return null;
  }
}

/**
 * Formats a UNIX timestamp (in seconds) into a readable date/time string
 */
export function formatExpiry(exp?: number): string {
  if (!exp) return 'N/A';
  const date = new Date(exp * 1000);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

/**
 * Checks if a JWT token is expired
 */
export function isTokenExpired(exp?: number): boolean {
  if (!exp) return true;
  return Date.now() >= exp * 1000;
}
