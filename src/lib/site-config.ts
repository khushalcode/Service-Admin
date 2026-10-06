export const siteConfig = {
  appName: "The Cleaning Bee",
  version: process.env.NEXT_PUBLIC_VERSION ?? "",
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT ?? "",
  title: "The Cleaning Bee - Your Trusted Cleaning Service Booking Platform",
  description:
    "The Cleaning Bee connects you with trusted local cleaning professionals for home cleaning, deep cleaning, and professional services. Book verified experts, track appointments, and get instant quotes. Your one-stop platform for all cleaning needs.",
  keywords: [
    "cleaning services",
    "home cleaning",
    "service booking app",
    "professional cleaning",
    "local cleaning providers",
    "cleaning services",
    "home maintenance",
    "service marketplace",
    "instant booking",
    "expert cleaning",
    "home cleaning",
    "cleaning professionals",
    "trusted providers",
    "service platform",
    "local experts",
    "service scheduling",
    "verified professionals",
    "service appointments",
    "home improvement services",
    "service booking platform",
  ],
  pwaEnabled: true,
  // Parent guard for server-side data fetching. true = dynamic/VPS deploy,
  // pages fetch server-side for SEO. false = static export/shared hosting,
  // no server exists at request time so pages must fetch client-side only.
  seoEnabled: process.env.NEXT_PUBLIC_SEO !== "false",
  // Absolute site origin (e.g. "https://edemand.example.com") — needed to
  // build absolute canonical/OG/twitter URLs. Empty string degrades to
  // relative URLs (still valid HTML) if the env var isn't set.
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "",
  // Existing asset (public/icon.png) — used as the OG/twitter image
  // fallback when a page's SEO settings don't specify one.
  defaultOgImage: "/icon.png",
  // GA4 measurement + Microsoft Clarity project id — loaded only after
  // analytics consent is granted (see components/layout/consent-scripts.tsx).
  gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  clarityProjectId: process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID,
};
