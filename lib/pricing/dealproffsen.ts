// Prisjämförelse mot dealproffsen.se — ren logik, ingen IO.
//
// BAKGRUNDEN. De säljer samma Aosom-artiklar som vi, och de PUBLICERAR Aosoms
// artikelnummer som `sku`/`mpn` i sin JSON-LD. Matchningen är därför mekanisk
// och inte en gissning: vårt `supplierProductId` mot deras `reference`.
//
// ☠️ DÄRFÖR FINNS INGEN NAMN- ELLER MÅTTMATCHNING HÄR, MED FLIT. Huset har
// redan mätt att måttjämförelse är otillräcklig som ensam grund (hörnsoffan
// 69c5e15c), och en felmatchning här sätter fel pris på fel vara. Artikelnumret
// matchar eller så matchar ingenting.
//
// ☠️ OCH SVARET BÄR ALDRIG ARTIKELNUMRET. Rapporten hamnar i en PUBLIK
// Actions-logg och i en fil i ett PUBLIKT repo. Artikelnumret är exakt den
// sträng dealproffsen publicerar — läcker vi den joinar vem som helst vår sida
// mot deras och därmed mot vårt inköpsled. Raderna nycklas på `wixProductId`,
// som redan står i produktsidans JSON-LD. Ett test låser det.

import type { ProductMappingRecord } from "../store";
import { isAliExpressMapping } from "../store/supplier";
import type { WixProduktPris } from "../wix/v3-products";

/** En rad ur dealproffsens JSON-svar, avskalad till det vi använder. */
export interface DerasRad {
  /** Aosoms artikelnummer, t.ex. "845-030CG". */
  reference: string;
  /** Det kunden FAKTISKT betalar. */
  prisSek: number;
  /** Det överstrukna priset, eller null. */
  ordinariePrisSek: number | null;
  /** Streckkod när den går att läsa ur produktlänken. */
  ean: string | null;
}

export interface JamforelseRad {
  wixProductId: string;
  vartPris: number;
  derasPris: number;
  derasOrdinariePris: number | null;
  /** Kronor vi ligger UNDER dem. Negativt = vi är dyrare. */
  underMedKr: number;
  /** Samma sak i procent av deras pris. */
  underMedPct: number;
  publicerad: boolean;
  behoverPolering: boolean;
  ean: string | null;
}

export interface Jamforelse {
  granskade: number;
  ejAosom: number;
  /** Vi saknar ett entydigt butikspris — jämförs ALDRIG, gissas ALDRIG. */
  utanVartPris: number;
  /** ☠️ De har inte varan. Det är INTE samma sak som att vi är billigast. */
  utanTraff: number;
  /** Vår rad bär inget artikelnummer — vi kunde alltså inte ens fråga. */
  utanArtikelnummer: number;
  viBilligare: number;
  viDyrare: number;
  likaPris: number;
  rader: JamforelseRad[];
}

/**
 * Prefixet vi söker deras sortiment med, t.ex. "845-" ur "845-030CG".
 *
 * Deras sökruta matchar på artikelnumret, och ett prefix ger hela serien i
 * ett anrop om hundra. Det är skillnaden mellan ~120 anrop och 4 754.
 */
export function prefixAv(artikelnummer: string): string | null {
  const m = /^([0-9A-Z]{3})-/i.exec(artikelnummer.trim());
  return m ? `${m[1].toUpperCase()}-` : null;
}

/** Artikelnumret på en mappningsrad, utan `aosom:`-prefixet. */
export function artikelnummerAv(m: ProductMappingRecord): string | null {
  const raa = (m.supplierProductId ?? "").trim();
  if (!raa) return null;
  const utan = raa.startsWith("aosom:") ? raa.slice("aosom:".length) : raa;
  return utan || null;
}

/**
 * Alla prefix vi behöver fråga efter, härledda ur VÅR katalog.
 *
 * Att härleda dem i stället för att gissa 800–999 sparar hundratals tomma
 * anrop mot deras sajt, och garanterar att vi frågar efter exakt det vi säljer.
 */
export function prefixLista(mappningar: readonly ProductMappingRecord[]): string[] {
  const ut = new Set<string>();
  for (const m of mappningar) {
    if (isAliExpressMapping(m)) continue;
    const nr = artikelnummerAv(m);
    const p = nr ? prefixAv(nr) : null;
    if (p) ut.add(p);
  }
  return [...ut].sort();
}

/**
 * Tolkar deras JSON-svar.
 *
 * ☠️ PRISET ÄR `price_amount`, ALDRIG `regular_price_amount`. Det andra är det
 * ÖVERSTRUKNA priset. Uppmätt på redskapsboden 845-030CG: 4 289 mot 6 049 —
 * tar man fel fält ser de ut att vara 41 % dyrare än de är, och vi höjer våra
 * priser på ett underlag som är fel åt exakt det dyra hållet. Alla deras rader
 * ligger på "Kampanj", så felet hade drabbat HELA katalogen, inte en rad.
 */
export function tolkaDerasSvar(json: unknown): DerasRad[] {
  const rot = json as { products?: unknown };
  const lista = Array.isArray(rot?.products) ? rot.products : [];
  const ut: DerasRad[] = [];
  for (const p of lista) {
    const rad = p as Record<string, unknown>;
    const ref = typeof rad.reference === "string" ? rad.reference.trim().toUpperCase() : "";
    const pris = Number(rad.price_amount);
    if (!ref || !Number.isFinite(pris) || pris <= 0) continue;
    const ord = Number(rad.regular_price_amount);
    const lank = typeof rad.link === "string" ? rad.link : "";
    const ean = /-(\d{13})\.html/.exec(lank);
    ut.push({
      reference: ref,
      prisSek: pris,
      ordinariePrisSek: Number.isFinite(ord) && ord > 0 ? ord : null,
      ean: ean ? ean[1] : null,
    });
  }
  return ut;
}

/**
 * Slår ihop deras rader till ett uppslag på artikelnummer.
 *
 * ☠️ DYKER SAMMA ARTIKELNUMMER UPP TVÅ GÅNGER VINNER DET LÄGSTA PRISET, och
 * riktningen är inte godtycklig. Ett prefix-svep hämtar hundra rader i taget
 * och samma vara kan ligga i mer än en träfflista; att låta den SISTA vinna
 * hade gjort utfallet beroende av sidordningen. Det lägsta priset är det enda
 * konservativa valet: det gör oss mindre billiga i rapporten, aldrig mer. Fel
 * åt det hållet kostar en utebliven annons, fel åt det andra kostar en
 * prishöjning byggd på ett pris kunden aldrig behövde betala.
 */
export function samlaDeras(rader: readonly DerasRad[]): Map<string, DerasRad> {
  const ut = new Map<string, DerasRad>();
  for (const r of rader) {
    const fanns = ut.get(r.reference);
    if (!fanns || r.prisSek < fanns.prisSek) ut.set(r.reference, r);
  }
  return ut;
}

/**
 * Ställer vår katalog mot deras.
 *
 * ☠️ ETT UTEBLIVET FYND ÄR INGEN JÄMFÖRELSE. En vara de inte säljer hamnar i
 * `utanTraff` — aldrig i `viBilligare`. Skillnaden är hela skillnaden mellan
 * "vi vet att vi är billigast" och "vi vet ingenting", och det är den andra
 * som annars blir en prishöjning på lösan sand. Samma hållning som
 * `utanWixPris` i Aosom-synken och `unknown` i hyllstatusen.
 *
 * ☠️ OCH ETT OKÄNT PRIS HOS OSS GISSAS ALDRIG ur mappningen. Facit är butiken.
 */
export function jamforPriser(
  mappningar: readonly ProductMappingRecord[],
  vartPris: ReadonlyMap<string, WixProduktPris>,
  deras: ReadonlyMap<string, DerasRad>,
  publicerade: ReadonlySet<string>,
): Jamforelse {
  const ut: Jamforelse = {
    granskade: 0,
    ejAosom: 0,
    utanVartPris: 0,
    utanTraff: 0,
    utanArtikelnummer: 0,
    viBilligare: 0,
    viDyrare: 0,
    likaPris: 0,
    rader: [],
  };

  for (const m of mappningar) {
    ut.granskade++;
    if (isAliExpressMapping(m)) {
      ut.ejAosom++;
      continue;
    }
    const nr = artikelnummerAv(m);
    if (!nr) {
      // ☠️ INTE `utanTraff`. "De säljer den inte" och "vi kunde inte fråga" är
      // två olika utfall, och att slå ihop dem hade fått en trasig
      // mappningsrad att se ut som ett bevis om deras sortiment.
      ut.utanArtikelnummer++;
      continue;
    }
    const d = deras.get(nr.toUpperCase());
    if (!d) {
      ut.utanTraff++;
      continue;
    }
    const vart = vartPris.get(m.wixProductId)?.priceSek ?? null;
    if (vart === null || vart <= 0) {
      ut.utanVartPris++;
      continue;
    }

    const underKr = d.prisSek - vart;
    if (underKr > 0) ut.viBilligare++;
    else if (underKr < 0) ut.viDyrare++;
    else ut.likaPris++;

    ut.rader.push({
      wixProductId: m.wixProductId,
      vartPris: vart,
      derasPris: d.prisSek,
      derasOrdinariePris: d.ordinariePrisSek,
      underMedKr: Math.round(underKr),
      underMedPct: Math.round((underKr / d.prisSek) * 1000) / 10,
      publicerad: publicerade.has(m.wixProductId),
      behoverPolering: m.needsAiPolish === true,
      ean: d.ean,
    });
  }

  // Störst gap först — det är där pengarna ligger.
  ut.rader.sort((a, b) => b.underMedKr - a.underMedKr);
  return ut;
}
