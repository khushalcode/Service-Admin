import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

// Same guard as src/lib/site-config.ts — kept independent here since
// next.config.ts runs in Node at build time, before the app's module graph
// (and its client bundle) exists.
const seoEnabled = process.env.NEXT_PUBLIC_SEO !== "false";

// Vercel sets this automatically during its own builds. Vercel has its own
// serverless bundling and does its own build-completion step that expects
// the *default* Next.js output — forcing "standalone" (self-hosted Node/VPS)
// or "export" (static hosting) both break it (missing next-server.js.nft.json).
// So on Vercel we must leave `output` unset regardless of the SEO flag;
// only self-hosted VPS builds (seoEnabled, not on Vercel) want "standalone".
const isVercel = !!process.env.VERCEL;

export default function config(phase: string): NextConfig {
  // `next dev` must never use "export": static export disables middleware and
  // dynamic routing, which breaks the dev server (404 on "/", middleware errors).
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;

  const output: NextConfig["output"] = isDev
    ? undefined
    : !seoEnabled
      ? "export"
      : isVercel
        ? undefined
        : "standalone";

  return {
    // true  = dynamic/VPS deploy — self-contained Node server build.
    // false = static export/shared hosting — plain HTML/JS, no Node server needed.
    // On Vercel and in dev: leave unset.
    output,
    // sanitize-html's htmlparser2 dependency (v12+) ships ESM-only. Next's
    // Turbopack SSR runtime externalizes sanitize-html by default (a plain
    // Node require() at runtime), and Node can't require() an ESM module —
    // that 500s every page using RichText.tsx on Vercel with ERR_REQUIRE_ESM.
    // transpilePackages forces Turbopack to actually bundle these instead of
    // leaving them as an external runtime require, which resolves ESM/CJS
    // interop at build time.
    transpilePackages: ["sanitize-html", "htmlparser2"],
    // Lets a real phone on the same wifi (hitting the dev server via LAN IP
    // instead of localhost) load HMR/dynamic chunks — Next blocks cross-origin
    // dev-resource requests by default, which silently breaks anything loaded
    // via a client-side dynamic import() when testing from a device.
    // Your Mac's current LAN IP (from the dev log) is also listed.
    allowedDevOrigins: ["192.168.0.181", "10.117.205.67"],
    images: seoEnabled
      ? {
          remotePatterns: [
            {
              protocol: "https",
              hostname: "edemand-test.thewrteam.in",
            },
          ],
        }
      : // next/image's default loader needs a running server to optimize
        // images on demand — unavailable under static export.
        { unoptimized: true },
  };
}