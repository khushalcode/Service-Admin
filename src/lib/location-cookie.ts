export const LOCATION_COOKIE_NAME = "edemand-loc";

export interface LocationCookieValue {
  address: string;
  lat: number;
  lng: number;
}

export function serializeLocationCookie(value: LocationCookieValue): string {
  return encodeURIComponent(JSON.stringify(value));
}

export function readLocationCookieFromDocument(): LocationCookieValue | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCATION_COOKIE_NAME}=([^;]*)`));
  return parseLocationCookie(match?.[1]);
}

export function parseLocationCookie(raw: string | undefined | null): LocationCookieValue | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (
      parsed &&
      typeof parsed.address === "string" &&
      typeof parsed.lat === "number" &&
      typeof parsed.lng === "number"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
