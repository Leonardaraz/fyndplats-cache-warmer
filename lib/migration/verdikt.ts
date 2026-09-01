// Vad som är DATAFÖRLUST och vad som bara är DRIFT, när kopian jämförs mot
// källan.
//
// Frågan har två olika svar beroende på när den ställs, och det är hela
// poängen med filen:
//
//   FÖRE växlingen  Wix är sanningen och Postgres ska spegla den. Varje rad
//                   som saknas är en rad kopieringen tappade. Strikt.
//
//   EFTER växlingen Produktionen skriver till Postgres och Wix är fruset —
//                   dels för att 4 000-taket blockerar nya rader, dels för att
//                   ingen kod skriver dit längre. Då MÅSTE sidorna glida isär,
//                   och glidningen är kvittot på att växlingen fungerar.
//
// ☠️ Uppmätt 2026-08-31, en halvtimme efter växlingen: verifieringen fällde på
// tre "avvikelser" som alla var frisk drift — synken hade skrivit 14 nya larm
// (sync_alerts 18 → 32, exakt de skrivningar som föll på WDE0195 kl 04:00),
// dess egen städning hade tagit 7 audit-rader äldre än 14 dygn, och en
// currentCostUsd hade uppdaterats. En verifiering som lyser rött varje gång
// driften är frisk lär man sig att ignorera, och då fångar den inte det den
// finns för — samma argument som mot att varna vid 48 h på token-förnyelsen.
//
// Kvar som verkligt larm är MASSFEL. Samma spärr-form som MIN_FEED_RADER i
// Aosom-synken och halvbildsspärren i media-cleanup: skydda mot att allt rasar,
// inte mot att en rad rör sig.

/** Andel av källans rader som måste saknas för att kalla det dataförlust.
 *  Under växlingsdygnet rör sig enstaka rader hela tiden; att en tabell tappat
 *  en tiondel gör det inte. */
export const MASSFEL_ANDEL = 0.1;

/** Golv i absoluta rader, så en liten tabell inte fäller på en enda rad:
 *  webhook_events har 16 rader, och 10 % av 16 är 1,6. */
export const MASSFEL_GOLV = 25;

export type TabellVerdikt = {
  /** Sant när tabellen får passera. */
  stämmer: boolean;
  /** Rader kopian har som källan inte längre har. */
  överskott: number;
  /** Efter växlingen: rader/fält som rört sig och som INTE är fel. */
  drift: number;
  /** ☠️ Källan är TOM medan kopian har rader — jämförelsen säger ingenting.
   *  Se `källanTom` nedan. */
  källanTom: boolean;
};

/**
 * Avgör om en tabells avvikelse mot källan är acceptabel.
 *
 * @param wix          radantal i källan
 * @param postgres     radantal i kopian
 * @param avvikande    antal fält i stickprovet som skiljer sig
 * @param efterVäxling om produktionen redan skriver till Postgres
 */
export function bedömTabell(
  wix: number,
  postgres: number,
  avvikande: number,
  efterVäxling: boolean,
): TabellVerdikt {
  const brist = Math.max(0, wix - postgres);
  const överskott = Math.max(0, postgres - wix);

  // ☠️ EN TOM KÄLLA GÖR JÄMFÖRELSEN MENINGSLÖS, INTE GODKÄND.
  //
  // Efter steg 6 är Wix-kollektionerna tömda. `brist` blir då noll för varje
  // tabell — inte för att kopian är korrekt utan för att det inte finns något
  // att sakna. Verifieringen skulle lysa grönt för alltid, även om Postgres
  // tömdes i morgon.
  //
  // Uppmätt 2026-09-01 efter raderingen: bedömTabell(0, 5470, 0, true) gav
  // `stämmer: true`, och bedömTabell(0, 0, 0, true) gav också `stämmer: true`.
  // En kontroll som inte kan fälla är inget kvitto — samma klass av fel som
  // torrkörningen som strukturellt alltid rapporterade "0 köade", och som
  // prissynken som räknade upp prisUppdaterade utan att skriva.
  //
  // Verdikten blir därför INTE "godkänd" utan "går inte att uttala sig om".
  // Anroparen ska säga det rakt ut i stället för att visa ett grönt OK.
  const källanTom = wix === 0 && postgres > 0;

  if (!efterVäxling) {
    // Strikt: färre rader är dataförlust. Fler är källans egen retention som
    // hunnit städa medan kopieringen pågick — det får inte fälla, annars kan
    // en tabell som städas aldrig verifieras.
    return { stämmer: brist === 0, överskott, drift: 0, källanTom };
  }

  const massfel = brist > MASSFEL_GOLV && brist / Math.max(wix, 1) > MASSFEL_ANDEL;
  return {
    stämmer: !massfel,
    överskott,
    drift: brist + avvikande,
    källanTom,
  };
}
