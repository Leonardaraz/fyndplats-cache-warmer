// lib/flodesvarmning.ts
//
// Håller flödena och sitemapen färska mellan hämtningarna.
//
// VARFÖR DEN FINNS. CDN:en håller ett flöde i en timme och ger sedan det gamla
// svaret medan nästa byggs (stale-while-revalidate). Den som hämtar en gång om
// dygnet, som Google Merchant Center, får då alltid förra hämtningens fil: ett
// dygn gammal. Hämtar vi själva varannan timme är filen Google får aldrig äldre
// än ett par timmar.
//
// LÖVMODUL med flit, så att `node --test` kan ladda den. Prisjakts hemliga
// adress står inte här och får aldrig göra det (CLAUDE.md).

/** Det som hämtas, i den här ordningen. Sitemapen först: den är minst. */
export const FLODEN_ATT_HALLA_FARSKA = [
  "/sitemap.xml",
  "/feed/google.xml",
  "/feed/products.xml",
  "/feed/pricerunner.xml",
] as const;

export type Flodesutfall = {
  path: string;
  /** HTTP-status, 0 när hämtningen föll eller tog för lång tid. */
  status: number;
  /** x-vercel-cache: HIT, STALE, MISS … eller "fel". */
  cache: string;
  /** Svarets ålder i sekunder enligt CDN:en. */
  alderS: number;
  ms: number;
};

/**
 * Hämtar varje flöde en gång, ett i taget, och läser svaret till slut.
 *
 * Svaret läses HELT: ett svar som inte finns i CDN:en byggs i den hämtningen,
 * och avbryts den byggs inget. Ett gammalt svar kommer direkt och förnyas i
 * bakgrunden. Slutar när `budgetMs` är förbrukad; resten tas nästa körning.
 */
export async function hamtaFloden(
  bas: string,
  opts: { hamta?: typeof fetch; budgetMs?: number; perFlodeMs?: number; nu?: () => number } = {},
): Promise<{ utfall: Flodesutfall[]; hoppade: string[] }> {
  const hamta = opts.hamta ?? fetch;
  const nu = opts.nu ?? Date.now;
  const budgetMs = opts.budgetMs ?? 240_000;
  const perFlodeMs = opts.perFlodeMs ?? 150_000;
  const start = nu();
  const utfall: Flodesutfall[] = [];
  const hoppade: string[] = [];
  for (const path of FLODEN_ATT_HALLA_FARSKA) {
    const kvar = budgetMs - (nu() - start);
    if (kvar <= 5_000) {
      hoppade.push(path);
      continue;
    }
    const t0 = nu();
    try {
      const res = await hamta(`${bas}${path}`, {
        headers: { "user-agent": "fyndplats-flodesvarmning/1.0" },
        cache: "no-store",
        signal: AbortSignal.timeout(Math.min(perFlodeMs, kvar)),
      });
      // Läs till slut utan att hålla hela svaret i minnet.
      const lasare = res.body?.getReader();
      if (lasare) {
        for (;;) {
          const { done } = await lasare.read();
          if (done) break;
        }
      }
      utfall.push({
        path,
        status: res.status,
        cache: res.headers.get("x-vercel-cache") || "",
        alderS: Number(res.headers.get("age")) || 0,
        ms: nu() - t0,
      });
    } catch {
      utfall.push({ path, status: 0, cache: "fel", alderS: 0, ms: nu() - t0 });
    }
  }
  return { utfall, hoppade };
}

/** En rad för loggen: "/feed/google.xml 200 STALE 7586 s (0,4 s)". Inga adresser utöver de fyra. */
export function flodesrad(u: Flodesutfall): string {
  return `${u.path} ${u.status || "fel"} ${u.cache || "-"} ${u.alderS} s (${(u.ms / 1000).toFixed(1).replace(".", ",")} s)`;
}
