// lib/medlem/golv-klient.ts
//
// Golvet per variant från motorns `POST /api/medlem/golv` (medlemskapet E2).
// Motorn räknar G = C × 1,10 × 1,25 ur sina mappningar och svarar med golvet,
// och kostnaden för prisbeslutsloggen.
//
// ☠️ SVARET BÄR KOSTNADEN. Den stannar på servern:
//   - `cache: "no-store"`, så att Nexts datacache aldrig sparar svaret,
//   - inga loggrader med belopp, och fel bär bara statuskoden,
//   - prisrutten till webbläsaren skickar aldrig golv eller kostnad.
//
// KASTAR ALDRIG. Svarar motorn inte får raderna inget golv, och prismotorn
// lämnar dem på listpriset: hellre inget medlemspris än ett under golvet.
// Hemligheten är REVIEW_INGEST_SECRET, som de två projekten redan delar.
//
// LÖVMODUL med flit: bara typimporter, så att `node --test` kan ladda den.
// Nyckeln finns därför också i varukorg.ts; varukorg.test.ts låser att de två
// är lika.

import type { Golvsvar } from "./varukorg";

/** Samma nyckel som `golvnyckel` i varukorg.ts. */
export const golvnyckel = (produktId: string, variantId: string | null) => `${produktId}|${variantId ?? ""}`;

export const GOLV_API = process.env.CACHE_WARMER_GOLV_URL ?? "https://fyndplats-cache-warmer.vercel.app/api/medlem/golv";

/** En produktsida ska inte vänta på motorn längre än så. */
const TIDSGRANS_MS = 4_000;
/** Ett golv gäller en minut per instans: kostnaden ändras högst vid synken. */
export const GOLV_CACHE_MS = 60_000;
/** Motorns gräns per anrop. */
const PER_ANROP = 200;

const cache = new Map<string, { svar: Golvsvar; at: number }>();

export function tomGolvcache(): void {
  cache.clear();
}

type Beroenden = {
  fetchImpl?: typeof fetch;
  hemlighet?: string | undefined;
  url?: string;
  nuMs?: number;
};

const UTAN_SVAR: Golvsvar = { golvOre: null, kostnadOre: null, utan: "motorn-svarade-inte" };

function lasRad(v: unknown): (Golvsvar & { nyckel: string }) | null {
  const r = v as Record<string, unknown> | null;
  if (!r || typeof r.produktId !== "string") return null;
  const variantId = typeof r.variantId === "string" ? r.variantId : null;
  const heltalEllerNull = (x: unknown) => (x === null ? null : Number.isSafeInteger(x) && (x as number) > 0 ? (x as number) : undefined);
  const golvOre = heltalEllerNull(r.golvOre);
  const kostnadOre = heltalEllerNull(r.kostnadOre);
  if (golvOre === undefined || kostnadOre === undefined) return null;
  // Ett golv utan kostnad, eller tvärtom, är ett trasigt svar.
  if ((golvOre === null) !== (kostnadOre === null)) return null;
  return {
    nyckel: golvnyckel(r.produktId, variantId),
    golvOre,
    kostnadOre,
    ...(typeof r.utan === "string" ? { utan: r.utan } : {}),
  };
}

/**
 * Golvet för varje (produkt, variant). Varje efterfrågad nyckel finns i svaret;
 * de motorn inte svarade för har `golvOre: null`.
 */
export async function hamtaGolv(
  fragor: readonly { produktId: string; variantId: string | null }[],
  d: Beroenden = {},
): Promise<Map<string, Golvsvar>> {
  const nu = d.nuMs ?? Date.now();
  const hemlighet = "hemlighet" in d ? d.hemlighet : process.env.REVIEW_INGEST_SECRET;
  const fetchImpl = d.fetchImpl ?? fetch;
  const url = d.url ?? GOLV_API;

  const ut = new Map<string, Golvsvar>();
  const saknas = new Map<string, { produktId: string; variantId: string | null }>();
  for (const f of fragor) {
    const k = golvnyckel(f.produktId, f.variantId);
    const c = cache.get(k);
    if (c && nu - c.at < GOLV_CACHE_MS) ut.set(k, c.svar);
    else saknas.set(k, f);
  }
  if (saknas.size === 0) return ut;
  if (!hemlighet) {
    for (const k of saknas.keys()) ut.set(k, UTAN_SVAR);
    return ut;
  }

  const lista = [...saknas.values()];
  for (let i = 0; i < lista.length; i += PER_ANROP) {
    const del = lista.slice(i, i + PER_ANROP);
    try {
      const svar = await fetchImpl(url, {
        method: "POST",
        headers: { authorization: `Bearer ${hemlighet}`, "content-type": "application/json" },
        body: JSON.stringify({ rader: del }),
        cache: "no-store",
        signal: AbortSignal.timeout(TIDSGRANS_MS),
      });
      if (!svar.ok) {
        console.warn(`[medlem-golv] motorn svarade ${svar.status}`);
        continue;
      }
      const kropp = (await svar.json()) as { rader?: unknown };
      for (const rad of Array.isArray(kropp?.rader) ? kropp.rader : []) {
        const r = lasRad(rad);
        if (!r || !saknas.has(r.nyckel)) continue;
        const { nyckel, ...golv } = r;
        ut.set(nyckel, golv);
        cache.set(nyckel, { svar: golv, at: nu });
      }
    } catch {
      // Felet kan bära svarets innehåll: bara att det föll.
      console.warn("[medlem-golv] motorn gick inte att nå");
    }
  }
  for (const k of saknas.keys()) if (!ut.has(k)) ut.set(k, UTAN_SVAR);
  return ut;
}
