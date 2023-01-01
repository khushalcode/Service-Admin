import { getThemeColorsApi } from "@/api/apiRoutes";
import { applyDynamicManifest } from "@/lib/dynamic-manifest";

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

// API key -> CSS custom property scale name
const COLOR_SCALE_MAP: Record<string, string> = {
  primary: "primary",
  neutral: "neutral",
  success: "success",
  error: "error",
  warn: "warning",
  info: "info",
};

// The Cleaning Bee brand palette lives in globals.css (:root --color-primary-*,
// --color-neutral-*, --color-warning-*). These scales are LOCKED to the logo
// palette, so the backend/admin theme (which still returns the old blue) can
// no longer override them. success/error/info still follow the API.
export const BRAND_PRIMARY_500 = "#6a8e22";
const LOCKED_SCALES = new Set(["primary", "neutral", "warn"]);

export interface ThemeColorsData {
  updated_at?: string;
  [key: string]: unknown;
}

export interface ThemeColorsResponse {
  data?: ThemeColorsData;
}

export async function fetchThemeColors(): Promise<ThemeColorsData | null> {
  const response: ThemeColorsResponse | null = await getThemeColorsApi().catch(() => null);
  return response?.data ?? null;
}

export function applyThemeColors(data: ThemeColorsData | null | undefined) {
  const root = document.documentElement;
  // Make sure any previously applied (non-brand) inline values are cleared so
  // the globals.css brand palette shows through.
  for (const apiKey of LOCKED_SCALES) {
    const cssScale = COLOR_SCALE_MAP[apiKey];
    for (const shade of SHADES) root.style.removeProperty(`--color-${cssScale}-${shade}`);
  }
  if (!data) return;
  for (const [apiKey, cssScale] of Object.entries(COLOR_SCALE_MAP)) {
    if (LOCKED_SCALES.has(apiKey)) continue;
    const shades = data[apiKey] as Record<string, string> | undefined;
    if (!shades) continue;
    for (const shade of SHADES) {
      const value = shades[String(shade)];
      if (value) root.style.setProperty(`--color-${cssScale}-${shade}`, value);
    }
  }

  // The OS status/toolbar color can't be dynamic at launch — it's read from
  // manifest.json's static "theme_color" before any JS runs. Once the admin's
  // actual brand color is applied, correct the live <meta name="theme-color">
  // to match, so mid-session it reflects the real brand instead of staying on
  // the manifest's hardcoded default.
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", BRAND_PRIMARY_500);
  // Fire-and-forget — the manifest patch is best-effort and shouldn't block
  // (or throw into) the synchronous CSS-var/meta-tag updates above.
  void applyDynamicManifest(BRAND_PRIMARY_500);
}
