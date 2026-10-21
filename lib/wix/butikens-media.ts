// Butikens egen lista över de Wix-bilder den pekar på.
//
// Butiken (grenen headless-site) bygger listan vid varje deploy ur sina
// källfiler: blogginläggen, adresserna i koden, reservkatalogen products.json
// och data/ (variantbilderna). Den serveras statiskt som /api/media-referenser.
// Bildstädningen (lib/aosom/media-cleanup.ts) raderar aldrig en fil som står i
// den.
//
// ☠️ GOLVET ÄR SPÄRREN. En lista som är tom eller halv ser exakt ut som en
// lista där ingenting används, och städningen hade då raderat bloggens bilder
// permanent. Butiken svarar själv 503 under sitt golv; kontrollen här gäller
// ändå, så att en ändring på ena sidan inte ensam kan släppa igenom en halv
// lista. Uppmätt 2026-10-14: bloggen 215 id, totalt 3 295.

export const BUTIKENS_MEDIA_URL = "https://www.fyndplats.se/api/media-referenser";

/**
 * Golv per källa och totalt. Per källa, för att reservkatalogen ensam bär
 * totalen: faller variantbilderna (data/) bort ur listan klarar den ändå
 * totalgolvet, och de är AE-importer som städningen annars tar. Uppmätt
 * 2026-10-14: blogg 215, reservkatalog 2 399, data 749, kod 5.
 */
export const BUTIKENS_GOLV = { blogg: 100, reservkatalog: 1000, data: 300, kod: 1, totalt: 1000 } as const;

/** Tolkar och kontrollerar svaret. Kastar hellre än returnerar en halv lista. */
export function tolkaButikensLista(data: unknown): string[] {
  const d = data as { version?: unknown; idn?: unknown; perKalla?: Record<string, unknown> } | null;
  if (!d || d.version !== 1 || !Array.isArray(d.idn)) {
    throw new Error("butikens bildlista har okänd form");
  }
  const idn = d.idn.filter((x): x is string => typeof x === "string" && x.length > 0);
  if (idn.length !== d.idn.length) throw new Error("butikens bildlista har tomma eller felaktiga rader");
  for (const kalla of ["blogg", "reservkatalog", "data", "kod"] as const) {
    const n = Number(d.perKalla?.[kalla] ?? 0);
    if (!(n >= BUTIKENS_GOLV[kalla])) {
      throw new Error(`butikens bildlista har ${n} bilder ur ${kalla}, golvet är ${BUTIKENS_GOLV[kalla]}`);
    }
  }
  if (idn.length < BUTIKENS_GOLV.totalt) {
    throw new Error(`butikens bildlista har ${idn.length} bilder, golvet är ${BUTIKENS_GOLV.totalt}`);
  }
  return idn.map((s) => s.toLowerCase());
}

export async function lasButikensMediaIdn(hamta: typeof fetch = fetch): Promise<string[]> {
  const url = process.env.BUTIKENS_MEDIA_URL || BUTIKENS_MEDIA_URL;
  const res = await hamta(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`${url} svarade ${res.status}`);
  return tolkaButikensLista(await res.json());
}
