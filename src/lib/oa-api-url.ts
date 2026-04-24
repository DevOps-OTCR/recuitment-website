/**
 * DevOps OA backend API base URL.
 * Production (recruit.otcr-consulting.com) always uses the US Render backend
 * so cached or old builds still work after switching from Singapore to US.
 */
const PRODUCTION_ORIGIN = 'https://recruit.otcr-consulting.com';
const PRODUCTION_API_URL = 'https://recuitment-usa.onrender.com';

export function getOaApiUrl(): string {
  if (typeof window !== 'undefined' && window.location.origin === PRODUCTION_ORIGIN) {
    return PRODUCTION_API_URL;
  }
  return import.meta.env.NEXT_PUBLIC_OA_API_URL || import.meta.env.VITE_OA_API_URL || 'http://localhost:8000';
}
