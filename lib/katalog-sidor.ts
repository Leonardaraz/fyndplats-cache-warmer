// lib/katalog-sidor.ts — katalogens sidor, flera åt gången.
//
// VARFÖR. getProducts (lib/products.ts) hämtar hela katalogen innan en sida kan
// byggas, en gång per serverinstans. Hämtningen gick en sida i taget, och
// katalogen är 51 sidor om 100 (5 064 synliga produkter 2026-10-21). Varje ny
// instans väntade därför en dryg minut: loggen "[wix] live products loaded" kom
// 61–75 s efter begäran, många gånger i timmen, och lika länge kvällen före
// deployen 2026-10-21 (63–68 s). Det stoppade morgonmejlet (maxDuration 60 s)
// och gjorde fyndauktionens varor långsamma i över en minut efter prisbytet.
//
// Uppmätt 2026-10-21 mot skarpa Wix, med butikens fråga och publika klient:
//
//   en sida i taget   65,7 s
//   fyra åt gången    16,2 s
//   sex åt gången     13,0 s och 10,4 s
//   åtta åt gången    10,4 s
//   tio åt gången      6,9 s
//
// Alla körningar gav samma 5 064 produkter utan dubbletter, korta sidor eller
// fel, och sidtiden (median runt 1 s) steg inte med antalet samtidiga anrop.
//
// SEX ÅT GÅNGEN. Varje instans hämtar själv, och flera startar samtidigt (fem
// när auktionens sidor värms vid prisbytet). Sex gånger fem är 30 samtidiga
// anrop mot Wix. Mer än tio åt gången från en instans är inte mätt.
//
// ☠️ EN KORT SIDA ÄR INTE SISTA SIDAN (2026-08-16, se fetchProducts). Sidorna
// hämtas på fasta offset, så en kort sida mitt i katalogen betyder att
// produkter saknas i just det fönstret. Den hämtas om. Är den fortfarande kort
// får anroparen färre rader än totalantalet, och då cachas katalogen inte.
//
// ☠️ TOTALANTALET ÄR DET STÖRSTA NÅGON SIDA SVARADE. Växer katalogen under
// hämtningen hämtas sidorna som tillkommit. Krymper den kan en produkt glida
// förbi en sidgräns, och då blir raderna färre än totalantalet. Hellre en
// hämtning till vid nästa begäran än en katalog som saknar en produkt.
//
// ☠️ BARA FEL SOM GÅR ÖVER FÖRSÖKS IGEN. 429, 408, 5xx, nätverksfel och en
// sida som inte svarar inom tidsgränsen försöks igen efter 1, 3 och 8 s. Ett
// annat 4xx betyder en felaktig fråga och kastas direkt. Faller en sida alla
// gånger kastas hela hämtningen, och anroparen visar reservlistan som förut.
//
// Beroendefri, så node:test kan importera den.

export const KATALOG_SIDSTORLEK = 100;
export const KATALOG_SAMTIDIGA = 6;
/** Rundgångsspärr, ingen katalogbegränsning: 500 sidor är 50 000 produkter. */
export const KATALOG_MAX_SIDOR = 500;
/** Väntan före varje nytt försök. Samma steg som motorns importMediaByUrl. */
export const KATALOG_PAUSER_MS: readonly number[] = [1_000, 3_000, 8_000];
/** Den långsammaste sidan i mätningen tog 9,3 s. */
export const KATALOG_SIDTIDSGRANS_MS = 20_000;

export type KatalogSida<T> = { items: T[]; totalCount: number | null };

export type KatalogHamtning<T> = {
  /** Raderna i sidornas ordning, som när sidorna hämtades en i taget. */
  items: T[];
  /** Det största totalantal någon sida rapporterade, eller null. */
  rapporteratTotalt: number | null;
  /** Taket på antal sidor nåddes innan katalogen var slut. */
  slogITaket: boolean;
  sidor: number;
  omforsok: number;
  /** Sidor mitt i katalogen som var korta även efter omförsöken. */
  kortaSidor: number;
};

export type KatalogAlternativ = {
  samtidiga?: number;
  maxSidor?: number;
  pauser?: readonly number[];
  sidtidsgrans?: number;
  vanta?: (ms: number) => Promise<void>;
};

type Installning = Required<KatalogAlternativ>;

class Tidsgrans extends Error {}

/** HTTP-status ur ett fel från Wix SDK: `status`, annars `response.status`. */
export function felStatus(e: unknown): number | null {
  const f = e as { status?: unknown; response?: { status?: unknown } } | null | undefined;
  const s = f?.status ?? f?.response?.status;
  return typeof s === "number" ? s : null;
}

/** Går felet över av sig självt? 408, 429, 5xx, tidsgränsen och nätverksfel. */
export function arTillfalligt(e: unknown): boolean {
  if (e instanceof Tidsgrans) return true;
  const s = felStatus(e);
  if (s === null) return true; // nätverksfel: inget svar, alltså ingen status
  return s === 408 || s === 429 || s >= 500;
}

function medTidsgrans<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const grans = new Promise<never>((_, avvisa) => {
    timer = setTimeout(() => avvisa(new Tidsgrans(`sidan svarade inte på ${ms} ms`)), ms);
  });
  return Promise.race([p, grans]).finally(() => clearTimeout(timer));
}

type Lage = { omforsok: number; avbruten: boolean };

async function medOmforsok<T>(
  forsok: () => Promise<KatalogSida<T>>,
  arKort: (sida: KatalogSida<T>) => boolean,
  o: Installning,
  lage: Lage,
): Promise<KatalogSida<T>> {
  for (let i = 0; ; i++) {
    let sida: KatalogSida<T> | null = null;
    try {
      sida = await medTidsgrans(forsok(), o.sidtidsgrans);
    } catch (e) {
      // En annan sida har redan fällt hämtningen: inget nytt försök.
      if (lage.avbruten || !arTillfalligt(e) || i >= o.pauser.length) throw e;
    }
    if (sida && (!arKort(sida) || i >= o.pauser.length || lage.avbruten)) return sida;
    lage.omforsok++;
    await o.vanta(o.pauser[i]);
  }
}

/**
 * Hämtar katalogen sida för sida, `samtidiga` sidor åt gången.
 *
 * `hamta(skip, limit)` hämtar en sida. Första sidan ger totalantalet, och
 * resten hämtas på fasta offset. Saknas totalantalet går hämtningen en sida i
 * taget tills en sida är tom, precis som före 2026-10-21.
 */
export async function hamtaKatalogSidor<T>(
  hamta: (skip: number, limit: number) => Promise<KatalogSida<T>>,
  alternativ: KatalogAlternativ = {},
): Promise<KatalogHamtning<T>> {
  const o: Installning = {
    samtidiga: Math.max(1, alternativ.samtidiga ?? KATALOG_SAMTIDIGA),
    maxSidor: alternativ.maxSidor ?? KATALOG_MAX_SIDOR,
    pauser: alternativ.pauser ?? KATALOG_PAUSER_MS,
    sidtidsgrans: alternativ.sidtidsgrans ?? KATALOG_SIDTIDSGRANS_MS,
    vanta: alternativ.vanta ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms))),
  };
  const L = KATALOG_SIDSTORLEK;
  const lage: Lage = { omforsok: 0, avbruten: false };

  // Kort är en sida som har färre rader än vad som borde finnas från dess
  // offset, räknat på sidans eget totalantal. En sista sida är därför inte kort.
  const kortMot = (total: number | null) => (sida: KatalogSida<T>, skip: number) => {
    const t = sida.totalCount ?? total;
    return t !== null && sida.items.length < Math.min(L, t - skip);
  };

  const forsta = await medOmforsok(() => hamta(0, L), (s) => kortMot(null)(s, 0), o, lage);
  if (forsta.totalCount === null) return enITaget(forsta, hamta, o, lage);
  if (forsta.items.length === 0) {
    return { items: [], rapporteratTotalt: forsta.totalCount, slogITaket: false, sidor: 1, omforsok: lage.omforsok, kortaSidor: 0 };
  }

  const total = forsta.totalCount;
  let storstaTotal = total;
  let slogITaket = false;
  let planerade = Math.ceil(total / L);
  if (planerade > o.maxSidor) {
    planerade = o.maxSidor;
    slogITaket = true;
  }
  const sidor: T[][] = new Array(planerade);
  sidor[0] = forsta.items;
  const arKort = kortMot(total);
  let kortaSidor = arKort(forsta, 0) ? 1 : 0;

  const hamtaSida = async (index: number) => {
    const skip = index * L;
    const sida = await medOmforsok(() => hamta(skip, L), (s) => arKort(s, skip), o, lage);
    if (sida.totalCount !== null && sida.totalCount > storstaTotal) storstaTotal = sida.totalCount;
    if (arKort(sida, skip)) kortaSidor++;
    sidor[index] = sida.items;
  };

  // En arbetare per samtidigt anrop. Ett fel stoppar nya sidor, och de som redan
  // väntar på ett nytt försök ger upp (lage.avbruten), så felet når anroparen
  // utan att resten av katalogen hämtas först.
  let nasta = 1;
  let forstaFelet: { e: unknown } | null = null;
  const arbetare = async () => {
    while (!lage.avbruten && nasta < planerade) {
      const index = nasta++;
      try {
        await hamtaSida(index);
      } catch (e) {
        if (!forstaFelet) forstaFelet = { e };
        lage.avbruten = true;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(o.samtidiga, Math.max(0, planerade - 1)) }, arbetare));
  if (forstaFelet) throw (forstaFelet as { e: unknown }).e;

  // Växte katalogen under hämtningen: hämta sidorna som tillkom, en i taget
  // (det är högst någon enstaka), tills en sida är tom eller antalet nås.
  while (!slogITaket && sidor.length * L < storstaTotal) {
    if (sidor.length >= o.maxSidor) {
      slogITaket = true;
      break;
    }
    const index = sidor.length;
    await hamtaSida(index);
    if (sidor[index].length === 0) break;
  }

  return {
    items: sidor.flatMap((s) => s ?? []),
    rapporteratTotalt: storstaTotal,
    slogITaket,
    sidor: sidor.length,
    omforsok: lage.omforsok,
    kortaSidor,
  };
}

/**
 * Utan totalantal går det inte att räkna ut sidorna i förväg. Då hämtas de en i
 * taget, med steg lika med antalet rader som faktiskt kom, tills en sida är tom
 * eller ett totalantal dyker upp och nås — samma regel som före 2026-10-21.
 */
async function enITaget<T>(
  forsta: KatalogSida<T>,
  hamta: (skip: number, limit: number) => Promise<KatalogSida<T>>,
  o: Installning,
  lage: Lage,
): Promise<KatalogHamtning<T>> {
  const L = KATALOG_SIDSTORLEK;
  const alla: T[] = [...forsta.items];
  let total: number | null = null;
  let slogITaket = true;
  let sidor = 1;
  if (forsta.items.length === 0) slogITaket = false;
  else {
    for (; sidor < o.maxSidor; sidor++) {
      const sida = await medOmforsok(() => hamta(alla.length, L), () => false, o, lage);
      if (sida.totalCount !== null) total = Math.max(total ?? 0, sida.totalCount);
      if (sida.items.length === 0) {
        sidor++;
        slogITaket = false;
        break;
      }
      alla.push(...sida.items);
      if (total !== null && alla.length >= total) {
        sidor++;
        slogITaket = false;
        break;
      }
    }
  }
  return { items: alla, rapporteratTotalt: total, slogITaket, sidor, omforsok: lage.omforsok, kortaSidor: 0 };
}
