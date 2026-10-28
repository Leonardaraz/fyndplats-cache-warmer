// lib/feed/prisjakt-motor.ts
//
// Aosoms artikelnummer och varumärken för det hemliga Prisjakt-flödet,
// hämtade från motorn när flödet byggs (motorns /api/prisjakt-artiklar, grenen
// main). Mappningarna bor i motorns Postgres; butiken har dem inte.
//
// ☠️ SVARET BÄR ARTIKELNUMREN. Därför:
//   - `cache: "no-store"`: svaret sparas inte i Nexts datacache,
//   - felmeddelandena bär bara statuskod och antal, aldrig svarets innehåll,
//   - hemligheten är REVIEW_INGEST_SECRET, som de två projekten redan delar.
//
// KASTAR när motorn inte svarar, svaret har fel form eller för få poster. Då
// svarar den hemliga adressen 503 och CDN:en serverar förra flödet
// (stale-if-error), i stället för ett flöde där numren plötsligt saknas.
//
// LÖVMODUL med flit: bara typimporter, så att `node --test` kan ladda den.

import type { PrisjaktArtikel, PrisjaktArtiklar } from "./prisjakt";

export const PRISJAKT_ARTIKLAR_API =
  process.env.CACHE_WARMER_PRISJAKT_URL
  ?? "https://fyndplats-cache-warmer.vercel.app/api/prisjakt-artiklar";

/**
 * Färre giltiga poster än så är ett läsfel, inte katalogen. Motorn har
 * tusentals Aosom-rader; ett svar med en handfull hade gett ett flöde där
 * nästan alla nummer saknas.
 */
export const MIN_POSTER = 1000;

/** Motorn läser alla mappningar och Aosom-flödet (tiotals MB). Mer än så är ett fel. */
const TIDSGRANS_MS = 150_000;

type Beroenden = {
  fetchImpl?: typeof fetch;
  hemlighet?: string | undefined;
  url?: string;
};

function giltigPost(v: unknown): v is PrisjaktArtikel {
  if (!v || typeof v !== "object") return false;
  const p = v as Record<string, unknown>;
  return typeof p.mpn === "string" && (p.marke === null || typeof p.marke === "string");
}

function karta(v: unknown): { poster: Record<string, PrisjaktArtikel>; ogiltiga: number } | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const poster: Record<string, PrisjaktArtikel> = {};
  let ogiltiga = 0;
  for (const [nyckel, post] of Object.entries(v as Record<string, unknown>)) {
    if (giltigPost(post)) poster[nyckel] = { mpn: post.mpn, marke: post.marke };
    else ogiltiga++;
  }
  return { poster, ogiltiga };
}

export async function hamtaPrisjaktArtiklar(
  d: Beroenden = {},
): Promise<{ artiklar: PrisjaktArtiklar; poster: number; ogiltiga: number }> {
  const hemlighet = "hemlighet" in d ? d.hemlighet : process.env.REVIEW_INGEST_SECRET;
  if (!hemlighet) throw new Error("REVIEW_INGEST_SECRET saknas — artikelnumren kan inte hämtas");
  const f = d.fetchImpl ?? fetch;

  const res = await f(d.url ?? PRISJAKT_ARTIKLAR_API, {
    headers: { authorization: `Bearer ${hemlighet}` },
    cache: "no-store",
    signal: AbortSignal.timeout(TIDSGRANS_MS),
  });
  if (!res.ok) throw new Error(`motorn svarade ${res.status}`);

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new Error("motorns svar var inte JSON");
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const varianter = karta(b.varianter);
  const produkter = karta(b.produkter);
  if (b.ok !== true || !varianter || !produkter) throw new Error("motorns svar hade fel form");

  const poster = Object.keys(varianter.poster).length + Object.keys(produkter.poster).length;
  if (poster < MIN_POSTER) throw new Error(`motorns svar hade ${poster} poster, minst ${MIN_POSTER} väntas`);

  return {
    artiklar: { varianter: varianter.poster, produkter: produkter.poster },
    poster,
    ogiltiga: varianter.ogiltiga + produkter.ogiltiga,
  };
}
