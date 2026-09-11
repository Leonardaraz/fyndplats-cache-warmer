// lib/price-snapshot.ts
//
// Skrivningen och läsningen av prishistoriken. Uträkningen bor i
// lib/price-history.ts, som är beroendefri och därför beteendetestad; den här
// filen rör Postgres och Wix och kan inte laddas i node-testköraren.
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

import { sql } from "./db";
import { getProducts } from "./products";
import {
  jamforpris,
  idagISO,
  tillMinor,
  FONSTER_DAGAR,
  type Observation,
  type Jamforpris,
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

/**
 * Skriv dagens pris för hela katalogen. Idempotent: körs cronet två gånger
 * samma dag skrivs samma rad igen, inte en till.
 */
export async function skrivDagensPriser(nu: Date = new Date()): Promise<SnapshotResultat> {
  const datum = idagISO(nu);
  let skrivna = 0;
  let hoppade = 0;
  try {
    const produkter = await getProducts();
    for (const p of produkter) {
      const lagsta = p.priceFromNum ?? p.priceNum;
      const minor = tillMinor(lagsta);
      if (!p.id || minor === null) {
        hoppade++;
        continue;
      }
      await sql/*sql*/`
        INSERT INTO price_history (product_id, observed_on, price_minor, currency)
        VALUES (${p.id}, ${datum}::date, ${minor}, ${p.currency || "SEK"})
        ON CONFLICT (product_id, observed_on)
        DO UPDATE SET price_minor = EXCLUDED.price_minor, recorded_at = NOW();
      `;
      skrivna++;
    }
    const gallring = await sql/*sql*/`
      DELETE FROM price_history
      WHERE observed_on < (${datum}::date - ${SPAR_DAGAR}::int);
    `;
    return { ok: true, datum, skrivna, hoppade, gallrade: gallring.rowCount ?? 0 };
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
 * Fel mot databasen sväljs med flit och ger null: en trasig uppslagning ska
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
    const rader = await sql/*sql*/`
      SELECT to_char(observed_on, 'YYYY-MM-DD') AS datum, price_minor
      FROM price_history
      WHERE product_id = ${produktId}
        AND observed_on >= (${datum}::date - ${SPAR_DAGAR}::int)
      ORDER BY observed_on ASC;
    `;
    const observationer: Observation[] = rader.rows.map((r) => ({
      datum: String(r.datum),
      prisMinor: Number(r.price_minor),
    }));
    return jamforpris(observationer, datum, aktuellt);
  } catch {
    return null;
  }
}
