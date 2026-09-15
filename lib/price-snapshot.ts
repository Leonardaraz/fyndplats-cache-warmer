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
  byggUpsert,
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

/** Rader per INSERT. 500 × 4 parametrar = 2 000, väl under Postgres tak på
 *  65 535, och få nog att felsöka när en sats gör fel. */
const SATS = 500;

/**
 * Skriv dagens pris för hela katalogen. Idempotent: körs cronet två gånger
 * samma dag skrivs samma rad igen, inte en till.
 *
 * SKRIVNINGEN ÄR BATCHAD, och det är inte en optimering utan en rättelse.
 * Första versionen gjorde en INSERT per produkt. Mätt skarpt mot previewen
 * 2026-09-11: 2 584 rader på 265 sekunder, mot maxDuration 300. Katalogen växer,
 * och nästa gång den gör det slår cronet i taket. Ett snapshot som inte hinner
 * klart blir en lucka i historiken — och en lucka i fönstrets början gör att
 * ingen rea får visas alls i 30 dagar. Det var alltså en latent produktionsbugg
 * som bara syntes för att körningen mättes i stället för antogs.
 *
 * sql.query i stället för taggen: taggen tar bara primitiver, och en
 * flerradig INSERT behöver genererade platshållare. Samma väg som
 * app/api/cron/ae-delivery-poll använder.
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

    for (let i = 0; i < rader.length; i += SATS) {
      const sats = rader.slice(i, i + SATS);
      const upsert = byggUpsert(sats);
      if (!upsert) continue;
      upsert.varden[0] = datum;
      await sql.query(upsert.text, upsert.varden);
      skrivna += sats.length;
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
