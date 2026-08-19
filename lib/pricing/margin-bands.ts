// Marginalöversikt över hela katalogen — underlaget till /admin/margins.
//
// VARFÖR SIDAN FINNS. /admin/sync-alerts?filter=price är REAKTIV: den visar bara
// produkter där leverantören nyss höjt priset. Den svarar aldrig på frågan
// "vilken marginal har mina produkter?" — och den frågan gick tidigare bara att
// besvara genom att räkna för hand, en produkt i taget.
//
// TRE SAKER SOM GÖR DEN ANVÄNDBAR, i stigande ordning:
//
//   1. BAND. Marginalen i procent, hinkad, så fördelningen syns direkt i stället
//      för som 500 lösa tal.
//
//   2. KRONOR, INTE BARA PROCENT. 12 % på en soffa för 2 999 kr är helt andra
//      pengar än 12 % på en pryl för 99 kr. Sidan rankar därför på KRONOR per
//      order som saknas upp till målmarginalen — det är den listan som svarar
//      "var ligger pengarna", medan en procentlista svarar "var är det värst",
//      vilket sällan är samma sak.
//
//   3. MULTIPELKLUSTER. Det här är sidans egentliga poäng. Priset sattes vid
//      import som landad kostnad × en multiplikator. Räknar man baklänges —
//      pris ÷ landad kostnad — och grupperar, avslöjas SYSTEMATISKA fel som en
//      procentspridning döljer: en tät klump på exakt samma multipel betyder att
//      en och samma felinställning satt priset på alla dem samtidigt.
//
//      Det är inte hypotetiskt. Mätningen 2026-08-19 visade att ~85 % av
//      katalogen låg på 1,31× i stället för avsedda 2,5× — spårat till en sparad
//      "Marginal-tier"-override i importtillägget. I en procentvy ser det ut som
//      brus; i en multipelvy är det en stapel som skriker.
//
// Filen är REN (ingen Wix, ingen React) så matten går att testa.

/** Det minsta en produkt behöver för att kunna räknas på. */
export interface MarginInput {
  wixProductId: string;
  title: string;
  /** Landad kostnad i SEK (inköp + frakt + ev. avgifter), per styck. */
  landedCostSek: number;
  /** Kundens pris inkl. moms, per styck. */
  grossSek: number;
}

export interface MarginRow extends MarginInput {
  /** Nettointäkt exkl. moms. */
  netSek: number;
  /** Vinst per sålt styck, i kronor. */
  profitSek: number;
  /** Marginal i procent av nettointäkten. */
  marginPct: number;
  /** Pris ÷ landad kostnad. Avslöjar systematiska prissättningsfel. */
  multiple: number;
  /** Kronor per order som saknas upp till målmarginalen. 0 när målet nås. */
  gapSek: number;
  bandId: BandId;
}

export type BandId =
  | "loss"
  | "0-10"
  | "10-20"
  | "20-25"
  | "25-35"
  | "35-50"
  | "50+"
  | "unknown";

export interface Band {
  id: BandId;
  label: string;
  /** Nedre gräns inklusive (procent). null för "unknown". */
  min: number | null;
  /** Övre gräns exklusive (procent). null = uppåt obegränsat. */
  max: number | null;
  /** Färgen bandet ritas i. Röd → gul → grön, med målbandet markerat. */
  color: string;
  /** true för bandet Leonard siktar på. */
  target?: boolean;
}

// Banden är valda efter hur besluten faktiskt ser ut, inte efter jämna tal:
// under noll säljer vi med förlust (agera nu), 0–10 % äts upp av Klarna-avgift
// och returer (i praktiken nolla), 10–20 % är tunt men levande, 20–25 % är
// målet, och allt över är utrymme att sänka priset för att sälja mer.
export const BANDS: Band[] = [
  { id: "loss", label: "Förlust (< 0 %)", min: null, max: 0, color: "#b91c1c" },
  { id: "0-10", label: "0–10 %", min: 0, max: 10, color: "#dc2626" },
  { id: "10-20", label: "10–20 %", min: 10, max: 20, color: "#f59e0b" },
  { id: "20-25", label: "20–25 % (mål)", min: 20, max: 25, color: "#16a34a", target: true },
  { id: "25-35", label: "25–35 %", min: 25, max: 35, color: "#0891b2" },
  { id: "35-50", label: "35–50 %", min: 35, max: 50, color: "#2563eb" },
  { id: "50+", label: "över 50 %", min: 50, max: null, color: "#7c3aed" },
  { id: "unknown", label: "Okänd", min: null, max: null, color: "#9ca3af" },
];

/** Målmarginalen kronor-gapet räknas mot (mitten av målbandet). */
export const TARGET_MARGIN_PCT = 22.5;

export function bandFor(marginPct: number | null): BandId {
  if (marginPct === null || !Number.isFinite(marginPct)) return "unknown";
  if (marginPct < 0) return "loss";
  if (marginPct < 10) return "0-10";
  if (marginPct < 20) return "10-20";
  if (marginPct < 25) return "20-25";
  if (marginPct < 35) return "25-35";
  if (marginPct < 50) return "35-50";
  return "50+";
}

/**
 * Kronor per styck som saknas upp till målmarginalen.
 *
 * Vid målmarginalen t gäller netto = landad / (1 − t), alltså vinst =
 * landad · t / (1 − t). Gapet är den vinsten minus dagens. Aldrig negativt —
 * en produkt som ÖVERstiger målet har inget att hämta, den har utrymme att
 * sänkas, vilket är en annan sorts beslut.
 */
export function gapToTargetSek(
  landedCostSek: number,
  profitSek: number,
  targetPct = TARGET_MARGIN_PCT,
): number {
  const t = targetPct / 100;
  if (!(landedCostSek > 0) || t <= 0 || t >= 1) return 0;
  const målvinst = (landedCostSek * t) / (1 - t);
  return Math.max(0, målvinst - profitSek);
}

/**
 * Räknar ut en rad. Returnerar null när underlaget saknas — hellre "okänd" än
 * en påhittad marginal, eftersom sidan används för att fatta prisbeslut.
 */
export function toMarginRow(
  input: MarginInput,
  vatRatePercent: number,
  targetPct = TARGET_MARGIN_PCT,
): MarginRow | null {
  const { landedCostSek, grossSek } = input;
  if (!(grossSek > 0) || !(landedCostSek > 0)) return null;
  const netSek = grossSek / (1 + vatRatePercent / 100);
  if (!(netSek > 0)) return null;
  const profitSek = netSek - landedCostSek;
  const marginPct = (profitSek / netSek) * 100;
  return {
    ...input,
    netSek,
    profitSek,
    marginPct,
    multiple: grossSek / landedCostSek,
    gapSek: gapToTargetSek(landedCostSek, profitSek, targetPct),
    bandId: bandFor(marginPct),
  };
}

export interface BandSummary {
  band: Band;
  count: number;
  /** Summa kronor per order som saknas i bandet. */
  gapSek: number;
  /** Andel av alla produkter, 0–100. */
  sharePct: number;
}

/** Fördelningen över band, i BANDS-ordning. Tomma band tas inte bort. */
export function summarizeBands(rows: MarginRow[], unknownCount = 0): BandSummary[] {
  const total = rows.length + unknownCount;
  return BANDS.map((band) => {
    const i = band.id === "unknown" ? [] : rows.filter((r) => r.bandId === band.id);
    const count = band.id === "unknown" ? unknownCount : i.length;
    return {
      band,
      count,
      gapSek: i.reduce((s, r) => s + r.gapSek, 0),
      sharePct: total > 0 ? (count / total) * 100 : 0,
    };
  });
}

export interface MultipleCluster {
  /** Multipeln avrundad till två decimaler, t.ex. 1.31. */
  multiple: number;
  count: number;
  sharePct: number;
  /** Median-marginalen i klustret — vad multipeln motsvarar i procent. */
  medianMarginPct: number;
}

/**
 * Grupperar på pris ÷ landad kostnad, avrundat till två decimaler, störst
 * kluster först.
 *
 * Två decimaler är valt med avsikt. Med en decimal smetas 1,31 och 1,35 ihop
 * och signalen försvinner; med tre blir varje produkt sitt eget kluster
 * eftersom charm-avrundningen (…9) gör multipeln nästan unik. Två decimaler
 * är den upplösning där en gemensam FELINSTÄLLNING syns som en klump medan
 * normal prissättning sprider ut sig.
 */
export function clusterByMultiple(rows: MarginRow[], minCount = 2): MultipleCluster[] {
  const hinkar = new Map<number, MarginRow[]>();
  for (const r of rows) {
    if (!Number.isFinite(r.multiple)) continue;
    const nyckel = Math.round(r.multiple * 100) / 100;
    const lista = hinkar.get(nyckel);
    if (lista) lista.push(r);
    else hinkar.set(nyckel, [r]);
  }
  const ut: MultipleCluster[] = [];
  for (const [multiple, lista] of hinkar) {
    if (lista.length < minCount) continue;
    const sorterade = lista.map((r) => r.marginPct).sort((a, b) => a - b);
    const mitt = Math.floor(sorterade.length / 2);
    ut.push({
      multiple,
      count: lista.length,
      sharePct: rows.length > 0 ? (lista.length / rows.length) * 100 : 0,
      medianMarginPct:
        sorterade.length % 2 === 1
          ? sorterade[mitt]
          : (sorterade[mitt - 1] + sorterade[mitt]) / 2,
    });
  }
  return ut.sort((a, b) => b.count - a.count || a.multiple - b.multiple);
}

/**
 * Produkterna där mest pengar ligger, mätt i kronor per order upp till målet.
 *
 * Det här är sidans viktigaste lista. En sortering på PROCENT sätter alltid
 * billiga prylar överst — 8 % på en 79-kronorspryl är sex kronor. Sorteringen
 * på kronor sätter i stället soffan med 12 % överst, där samma procentlyft är
 * hundralappar.
 */
export function biggestOpportunities(rows: MarginRow[], limit = 25): MarginRow[] {
  return [...rows].sort((a, b) => b.gapSek - a.gapSek).slice(0, limit);
}
