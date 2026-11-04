// lib/medlem/pris.ts
//
// Prismotorn för medlemmar (E2) och företag (E3). Den räknar radpriset som
// skickas till Wix-kassan och förklarar varje beslut, så att prisbeslutsloggen
// kan visa varför en rad fick det pris den fick (E2-9).
//
// Reglerna, ur specifikationen och Leonards beslut 2026-11-04:
//   - Radpris P = max(round(A · (1 − d)), G), avrundat half up till hela ören,
//     och aldrig över A. A är aktuellt pris inkl. moms (kampanjpriset om ett
//     sådant gäller [P4]); G är golvpriset per styck inkl. moms. Motorn räknar
//     G ur den landade kostnaden, så kostnaden når aldrig butiken.
//   - En rad utan känt golv, eller med ett undantag (flaggad i admin,
//     presentkort, tjänst, fyndauktion), är inte rabattberättigad: P = A.
//   - Privat: d är nivåns procent.
//   - Företag: d är det högsta av nivåns procent och ordertrappan O(B), aldrig
//     båda tillsammans (Leonards "Kör hårt" på F2, 2026-11-04). B är summan av
//     A · q för de rabattberättigade raderna, räknad exkl. moms.
//   - Fri frakt-skyddet (alla profiler): låg delsumman med A på eller över
//     gränsen men hamnar under med P, minskas rabatten så att delsumman landar
//     på gränsen. Gränsen är 500,00 kr: provordern i E0 visade att 499,01 kr
//     gav frakt.
//   - "Begär offert" visas bara för företag: från 6 exemplar av samma vara
//     eller från 20 000 kr exkl. moms (F7, Leonards ja 2026-11-04).
//
// Ren modul utan lokala imports. Belopp är heltal i öre.

/** Gränsen för fri frakt i öre, inkl. moms (E0-5: 500,00 kr, inte 499). */
export const FRI_FRAKT_ORE = 50_000;

/** Ordertrappan för företag (F2): gräns exkl. moms i öre och procent. */
export const ORDERTRAPPA: readonly { franOreExMoms: number; procent: number }[] = [
  { franOreExMoms: 0, procent: 0 },
  { franOreExMoms: 500_000, procent: 1 },
  { franOreExMoms: 1_000_000, procent: 2 },
  { franOreExMoms: 2_000_000, procent: 3 },
  { franOreExMoms: 3_000_000, procent: 4 },
  { franOreExMoms: 5_000_000, procent: 5 },
];

/** "Begär offert" från så många exemplar av samma vara (F7). */
export const OFFERT_EXEMPLAR = 6;
/** ... eller från så stor rabattberättigad bas, exkl. moms i öre (F7). */
export const OFFERT_BAS_ORE_EX_MOMS = 2_000_000;

export type Undantag = "flaggad" | "presentkort" | "tjanst" | "auktion";

export interface Prisrad {
  /** Radens id i varukorgen. */
  id: string;
  /** Produkten; flera varianter av samma produkt räknas som samma vara. */
  produktId: string;
  variantId?: string;
  antal: number;
  /** Aktuellt pris A per styck inkl. moms, i öre. */
  aOre: number;
  /** Momssats i hela procent, i dag 25 för hela sortimentet. */
  momsProcent: number;
  /** Golvpriset G per styck inkl. moms, i öre. null: kostnaden är okänd. */
  golvOre: number | null;
  undantag?: Undantag;
}

export type Profil =
  | { typ: "privat"; niva: string; nivaProcent: number }
  | { typ: "foretag"; niva: string; nivaProcent: number };

export type Begransning =
  /** Hela procenten gavs. */
  | "ingen"
  /** Golvet höll radpriset uppe (eller över A: ingen rabatt alls). */
  | "golv"
  /** Raden saknar golv eller har ett undantag. */
  | "ej-berattigad"
  /** Rabatten minskades för att delsumman ska behålla fri frakt. */
  | "fri-frakt"
  /** Profilen ger ingen rabatt (0 %). */
  | "ingen-rabatt";

export interface Radbeslut {
  id: string;
  produktId: string;
  variantId?: string;
  antal: number;
  aOre: number;
  golvOre: number | null;
  /** Procenten som prövades på raden (0 om raden inte är berättigad). */
  procent: number;
  /** Radpriset P per styck inkl. moms, i öre. */
  pOre: number;
  begransning: Begransning;
  undantag?: Undantag;
}

export interface NastaSteg {
  procent: number;
  kvarOreExMoms: number;
  kvarOreInklMoms: number;
}

export interface Prisbeslut {
  profil: Profil["typ"];
  niva: string;
  nivaProcent: number;
  /** Ordertrappans procent för korgen; bara företag. */
  trappaProcent?: number;
  /** Den procent som gäller för korgen. */
  procent: number;
  /** Var procenten kommer ifrån. Lika: nivån. */
  kalla: "niva" | "trappa" | "ingen";
  /** Rabattberättigad bas B exkl. moms, i öre. Räknas för alla profiler. */
  basOreExMoms: number;
  rader: Radbeslut[];
  /** Summa A · q och P · q för alla rader, inkl. moms, i öre. */
  summaAOre: number;
  summaPOre: number;
  rabattOre: number;
  /** Fri frakt-skyddet minskade rabatten. */
  friFraktSkydd: boolean;
  /** Företag: nästa steg i trappan som ger mer än korgen har nu. */
  nastaSteg: NastaSteg | null;
  /** Företag: visa "Begär offert". */
  offert: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Små räkningar
// ─────────────────────────────────────────────────────────────────────────────

function heltal(v: number, namn: string, min = 0): void {
  if (!Number.isSafeInteger(v) || v < min) throw new Error(`${namn} måste vara ett heltal ≥ ${min}, fick ${v}`);
}

/** round_half_up(A · (100 − procent) / 100) i öre, med heltal hela vägen. */
export function procentAv(aOre: number, procent: number): number {
  heltal(aOre, "A");
  heltal(procent, "procent");
  if (procent > 100) throw new Error(`procent över 100: ${procent}`);
  return Math.floor((aOre * (100 - procent) + 50) / 100);
}

/** Beloppet exkl. moms, half up till öre (E3-4: 499,90 kr → 399,92 kr). */
export function exklMoms(ore: number, momsProcent: number): number {
  heltal(ore, "belopp");
  heltal(momsProcent, "moms");
  return Math.floor((ore * 100 * 2 + (100 + momsProcent)) / (2 * (100 + momsProcent)));
}

/** Beloppet inkl. moms, half up till öre. */
export function inklMoms(oreExMoms: number, momsProcent: number): number {
  heltal(oreExMoms, "belopp");
  heltal(momsProcent, "moms");
  return Math.floor((oreExMoms * (100 + momsProcent) + 50) / 100);
}

/** Ordertrappans procent för basen B (exkl. moms, öre). */
export function trappaProcent(basOreExMoms: number): number {
  let p = 0;
  for (const s of ORDERTRAPPA) if (basOreExMoms >= s.franOreExMoms) p = s.procent;
  return p;
}

/**
 * Ett radpris för en procent: P = max(round(A · (1 − d)), G), aldrig över A.
 * Det produktsidan behöver för rutan "Ditt medlemspris".
 */
export function radpris(
  aOre: number,
  golvOre: number | null,
  procent: number,
): { pOre: number; begransning: Begransning } {
  heltal(aOre, "A");
  if (golvOre === null) return { pOre: aOre, begransning: "ej-berattigad" };
  heltal(golvOre, "G");
  if (procent === 0) return { pOre: aOre, begransning: "ingen-rabatt" };
  const fritt = procentAv(aOre, procent);
  if (fritt >= golvOre) return { pOre: fritt, begransning: "ingen" };
  return { pOre: Math.min(aOre, golvOre), begransning: "golv" };
}

/**
 * Den högsta rabatten i hela procent som golvet tillåter, för texten "högst x %"
 * när golvet begränsar (E3-8). 0 när G ligger på eller över A.
 */
export function hogstaProcent(aOre: number, golvOre: number | null): number {
  if (golvOre === null || golvOre >= aOre) return 0;
  // Största p med round(A · (100 − p) / 100) ≥ G.
  let p = Math.floor(((aOre - golvOre) * 100) / aOre);
  while (p > 0 && procentAv(aOre, p) < golvOre) p--;
  while (p < 100 && procentAv(aOre, p + 1) >= golvOre) p++;
  return p;
}

function berattigad(r: Prisrad): boolean {
  return r.golvOre !== null && !r.undantag;
}

// ─────────────────────────────────────────────────────────────────────────────
// Varukorgen
// ─────────────────────────────────────────────────────────────────────────────

/** Rabattberättigad bas B exkl. moms i öre, avrundad nedåt så att ett öre
 *  aldrig lyfter korgen över en gräns. */
export function bas(rader: readonly Prisrad[]): number {
  // Exakt: summera täljare per momssats och dela en gång per sats.
  const perSats = new Map<number, number>();
  for (const r of rader) {
    if (!berattigad(r)) continue;
    perSats.set(r.momsProcent, (perSats.get(r.momsProcent) ?? 0) + r.aOre * r.antal);
  }
  let b = 0;
  for (const [sats, summa] of perSats) b += Math.floor((summa * 100) / (100 + sats));
  return b;
}

/**
 * Minskar rabatten så att delsumman behåller fri frakt (alla profiler).
 * Minskningen fördelas proportionellt mot radernas rabatt; det som blir över
 * efter avrundningen läggs på de dyraste raderna först. Kan delsumman inte
 * landa exakt på gränsen (antal över 1 på alla rader) hamnar den så nära över
 * som möjligt, aldrig under.
 */
function friFrakt(beslut: Radbeslut[], grans: number): boolean {
  const summaA = beslut.reduce((s, r) => s + r.aOre * r.antal, 0);
  const summaP = beslut.reduce((s, r) => s + r.pOre * r.antal, 0);
  if (summaA < grans || summaP >= grans) return false;
  const rabatt = summaA - summaP;
  const tillaten = summaA - grans;
  const nya = beslut.map((r) => Math.floor(((r.aOre - r.pOre) * tillaten) / rabatt));
  let over = tillaten - beslut.reduce((s, r, i) => s + nya[i] * r.antal, 0);
  const ordning = beslut.map((_, i) => i).sort((x, y) => beslut[y].aOre - beslut[x].aOre || x - y);
  for (const i of ordning) {
    if (over <= 0) break;
    const r = beslut[i];
    const utrymme = r.aOre - r.pOre - nya[i];
    const steg = Math.min(utrymme, Math.floor(over / r.antal));
    if (steg > 0) {
      nya[i] += steg;
      over -= steg * r.antal;
    }
  }
  beslut.forEach((r, i) => {
    const pOre = r.aOre - nya[i];
    if (pOre !== r.pOre) {
      r.pOre = pOre;
      r.begransning = "fri-frakt";
    }
  });
  return true;
}

/** Prissätter en varukorg för en profil. */
export function prissatt(
  rader: readonly Prisrad[],
  profil: Profil,
  friFraktOre: number = FRI_FRAKT_ORE,
): Prisbeslut {
  for (const r of rader) {
    heltal(r.antal, "antal", 1);
    heltal(r.aOre, "A");
    heltal(r.momsProcent, "moms");
    if (r.golvOre !== null) heltal(r.golvOre, "G");
  }
  heltal(profil.nivaProcent, "nivåns procent");

  const basOreExMoms = bas(rader);
  const trappa = profil.typ === "foretag" ? trappaProcent(basOreExMoms) : undefined;
  const procent = Math.max(profil.nivaProcent, trappa ?? 0);
  const kalla: Prisbeslut["kalla"] =
    procent === 0 ? "ingen" : trappa !== undefined && trappa > profil.nivaProcent ? "trappa" : "niva";

  const beslut: Radbeslut[] = rader.map((r) => {
    const ok = berattigad(r);
    const { pOre, begransning } = ok ? radpris(r.aOre, r.golvOre, procent) : { pOre: r.aOre, begransning: "ej-berattigad" as const };
    return {
      id: r.id,
      produktId: r.produktId,
      ...(r.variantId ? { variantId: r.variantId } : {}),
      antal: r.antal,
      aOre: r.aOre,
      golvOre: r.golvOre,
      procent: ok ? procent : 0,
      pOre,
      begransning,
      ...(r.undantag ? { undantag: r.undantag } : {}),
    };
  });
  const friFraktSkydd = friFrakt(beslut, friFraktOre);

  const summaAOre = beslut.reduce((s, r) => s + r.aOre * r.antal, 0);
  const summaPOre = beslut.reduce((s, r) => s + r.pOre * r.antal, 0);

  let nastaSteg: NastaSteg | null = null;
  let offert = false;
  if (profil.typ === "foretag") {
    const steg = ORDERTRAPPA.find((s) => s.procent > procent && s.franOreExMoms > basOreExMoms);
    if (steg) {
      const kvar = steg.franOreExMoms - basOreExMoms;
      // Momsen för texten inkl. moms: korgens egen, i dag 25 % på allt.
      const sats = rader.find(berattigad)?.momsProcent ?? 25;
      nastaSteg = { procent: steg.procent, kvarOreExMoms: kvar, kvarOreInklMoms: inklMoms(kvar, sats) };
    }
    const perVara = new Map<string, number>();
    for (const r of rader) if (!r.undantag) perVara.set(r.produktId, (perVara.get(r.produktId) ?? 0) + r.antal);
    offert = basOreExMoms >= OFFERT_BAS_ORE_EX_MOMS || [...perVara.values()].some((n) => n >= OFFERT_EXEMPLAR);
  }

  return {
    profil: profil.typ,
    niva: profil.niva,
    nivaProcent: profil.nivaProcent,
    ...(trappa !== undefined ? { trappaProcent: trappa } : {}),
    procent,
    kalla,
    basOreExMoms,
    rader: beslut,
    summaAOre,
    summaPOre,
    rabattOre: summaAOre - summaPOre,
    friFraktSkydd,
    nastaSteg,
    offert,
  };
}
