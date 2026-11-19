import { NextResponse } from "next/server";
import { getPosts } from "../../../lib/blog";
import { guideKort } from "../../../lib/guide-kort";

// Alla köpguider som kort, för raden på startsidan (components/guide-karusell.tsx).
//
// VARFÖR ETT EGET SVAR. Startsidan ritar fyra kort. Bar den också de andra
// fyrtio inläggens rubrik, ingress och omslag vägde den 4,2 kB mer över nätet
// (mätt 2026-11-19: 33,2 → 37,4 kB brotli), för varje besökare, fast de flesta
// aldrig bläddrar. Nu hämtas resten härifrån först när någon rör raden.
//
// Samma cache som /api/lista och /api/kort-bilder: fem minuter i webbläsaren,
// en timme i CDN:t, och ett gammalt svar medan ett nytt byggs.
export const revalidate = 3600;

const CACHE = "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";

export async function GET() {
  const guider = guideKort(await getPosts().catch(() => []));
  // En tom lista (bloggen svarade inte) får inte ligga kvar i en timme.
  return NextResponse.json(guider, { headers: { "Cache-Control": guider.length ? CACHE : "public, s-maxage=60" } });
}
