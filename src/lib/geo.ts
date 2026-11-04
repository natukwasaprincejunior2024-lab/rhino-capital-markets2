import { COUNTRIES, DEFAULT_COUNTRY_CODE } from '@/lib/countries';

const STORAGE_KEY = 'rhino-country';
const DETECT_TIMEOUT_MS = 4000;

function isKnownCountry(code: unknown): code is string {
  return typeof code === 'string' && COUNTRIES.some((c) => c.code === code);
}

export function getStoredCountryCode(): string | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isKnownCountry(value) ? value : null;
  } catch {
    return null;
  }
}

export function storeCountryCode(code: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Storage can be unavailable (private mode); the choice then lasts for this visit only.
  }
}

export async function detectCountry(): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DETECT_TIMEOUT_MS);
  try {
    const response = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    const code = (body as { country_code?: unknown } | null)?.country_code;
    return isKnownCountry(code) ? code : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function initialCountryCode(): string {
  return getStoredCountryCode() ?? DEFAULT_COUNTRY_CODE;
}
