// lib/price-snapshot.ts
//
// Skrivningen och läsningen av prishistoriken. Uträkningen bor i
// lib/price-history.ts, som är beroendefri och därför beteendetestad; den här
// filen rör Wix och kan inte laddas i node-testköraren.
//
// VARFÖR DEN FINNS. 7 a § prisinformationslagen kräver att ett överstruket pris
// är det lägsta vi tillämpat de senaste 30 dagarna. Wix kan inte svara på det —
// `price.price` är butikens listpris, inte ett pris vi bevisligen tagit betalt.
// Uppgiften finns alltså inte, den måste mätas, och mätningen tar 30 dagar att
// bli användbar. Det är därför snapshotet börjar köra långt innan något
// överstruket pris byter grund.
//
// VILKET PRIS SOM SPARAS. Det lägsta priset kunden faktiskt kunde betala den
// dagen: rabatterat pris om produkten var nedsatt, och lägsta varianten när det
// finns flera. Lagen säger "tillämpat". Att spara listpriset hade gjort hela
// historiken lika värdelös som det vi försöker ersätta.
//
// ⚠️ ETT VAL SOM BÖR SES ÖVER: en produkt med varianter får EN rad, byggd på
// den billigaste varianten. Lagen talar om "produkten", och sidan visar
// "från X kr", så det hänger ihop — men säljs en dyr variant ned kraftigt
// medan den billiga står still syns den sänkningen inte i historiken. Rätt
// lösning vore en rad per variant. Det är medvetet inte byggt nu: det
// fyrdubblar radantalet och ingen yta visar variantvis rea idag.

import { prishistorik } from "./wix-lager";
import { getProducts } from "./products";
import {
  jamforpris,
  idagISO,
  tillMinor,
  FONSTER_DAGAR,
  type Observation,
  type Jamforpris,
  type Rad,
} from "./price-history";

// Återexporterade för de anropare som redan pekar hit; de RÄTTA hemvisterna är
// lib/price-history.ts, som är beroendefri och därför går att beteendetesta.
// Den här filen importerar Wix-SDK:n via ./products och kan inte laddas i
// node-testköraren — samma begränsning som lib/category-groups.ts lever med.
export { idagISO, tillMinor };

/** Hur länge rader sparas. Fönstret plus marginal, så att en sen körning inte
 *  river underlaget den skulle ha läst. */
const SPAR_DAGAR = FONSTER_DAGAR + 15;

export type SnapshotResultat = {
  ok: boolean;
  datum: string;
  skrivna: number;
  hoppade: number;
  gallrade: number;
  fel?: string;
};

/** YYYY-MM-DD `dagar` dagar före `datum`. */
function datumMinus(datum: string, dagar: number): string {
  return new Date(Date.parse(`${datum}T00:00:00.000Z`) - dagar * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Skriv dagens pris för hela katalogen. Idempotent: körs cronet två gånger
 * samma dag skrivs samma rad igen, inte en till.
 *
 * SKRIVNINGEN ÄR BATCHAD (`prishistorik.sparaDag`), och det är inte en
 * optimering utan en rättelse. Första versionen gjorde en INSERT per produkt.
 * Mätt skarpt mot previewen 2026-09-11: 2 584 rader på 265 sekunder, mot
 * maxDuration 300. Ett snapshot som inte hinner klart blir en lucka i
 * historiken — och en lucka i fönstrets början gör att ingen rea får visas alls
 * i 30 dagar.
 */
export async function skrivDagensPriser(nu: Date = new Date()): Promise<SnapshotResultat> {
  const datum = idagISO(nu);
  let skrivna = 0;
  let hoppade = 0;
  try {
    const produkter = await getProducts();

    const rader: Rad[] = [];
    for (const p of produkter) {
      const minor = tillMinor(p.priceFromNum ?? p.priceNum);
      if (!p.id || minor === null) {
        hoppade++;
        continue;
      }
      rader.push({ produktId: p.id, prisMinor: minor, valuta: p.currency || "SEK" });
    }

    const u = await prishistorik.sparaDag(datum, rader);
    skrivna = u.sparade;
    if (u.fel.length) throw new Error(`${u.fel.length} rader skrevs inte, första: ${u.fel[0].fel}`);
    const gallrade = await prishistorik.gallra(datumMinus(datum, SPAR_DAGAR));
    return { ok: true, datum, skrivna, hoppade, gallrade };
  } catch (e) {
    return {
      ok: false,
      datum,
      skrivna,
      hoppade,
      gallrade: 0,
      fel: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Jämförpriset för en produkt, eller null när ingen sänkning får påstås.
 *
 * Fel mot Wix sväljs med flit och ger null: en trasig uppslagning ska
 * göra att rean INTE visas, aldrig att den visas på fel grund.
 */
export async function jamforprisFor(
  produktId: string,
  aktuelltKronor: number,
  nu: Date = new Date(),
): Promise<Jamforpris | null> {
  const aktuellt = tillMinor(aktuelltKronor);
  if (!produktId || aktuellt === null) return null;
  const datum = idagISO(nu);
  try {
    const observationer: Observation[] = await prishistorik.forProdukt(produktId, datumMinus(datum, SPAR_DAGAR));
    return jamforpris(observationer, datum, aktuellt);
  } catch {
    return null;
  }
}
