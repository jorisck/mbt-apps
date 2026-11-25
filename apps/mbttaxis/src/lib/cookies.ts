export type CookieConsent = "all" | "essential" | null;

export const COOKIE_KEY = "mbt-cookie-consent";

export function parseConsent(value: string | undefined | null): CookieConsent {
  if (value === "all" || value === "essential") return value;
  return null;
}
