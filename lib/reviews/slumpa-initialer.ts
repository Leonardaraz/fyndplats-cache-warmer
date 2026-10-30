// Slumpa om initialer som ser påhittade ut eller har bokstäver som ska bort.
//
// Leonard 2026-10-29: recensioner vars initialer har bokstäverna Y, X, Z eller W
// ska få andra, slumpmässiga bokstäver. Leonard 2026-10-30: initialer i
// bokstavsordning ("A.B.", "L.M.") ser förfalskade ut och ska också få slumpade
// bokstäver, Q ska bort precis som de andra, och Å och Ö får komma ibland.
//
// Reglerna, slumpen och orsaken till att det blev så bor i ./initialer.ts
// (☠️ varenda recension utan läsbart namn fick bokstavsordning av en hashbugg).
// Här är det som berör lagret: vilka rader som ändras, att varje skrivning läses
// tillbaka, och vilka produkter butiken ska be om nya recensioner för.
//
// "Slumpmässig" är DETERMINISTISK: bokstäverna väljs ur ett frö av produkt-id och
// recensions-id. Då visar torrkörningen exakt vad en skarp körning skriver, en
// omkörning ger samma bokstäver, och samma recension får alltid samma initialer.
//
// Kundomdömen (source "customer") rörs INTE som standard. De bär initialerna
// ur kundens namn på ordern och räknas som förstahandsomdömen; ett påhittat
// namn på dem vore vilseledande. `medKundomdomen` släpper spärren.
import type { StoredReview } from "../store/reviews";
import { FORBJUDNA, arForbjuden, bokstaverIInitialer, bristerIInitialer, rattaInitialer } from "./initialer";
import { isCustomerReview } from "./queue";

export { FORBJUDNA };

/** Initialer som butiken visar: "S." eller "S.K.". */
const FORM = /^\p{L}\.(\p{L}\.)?$/u;

/** Innehåller initialerna någon av de förbjudna bokstäverna? */
export function harForbjudenBokstav(initials: string | undefined): boolean {
  return bokstaverIInitialer(initials).some(arForbjuden);
}

/** Varifrån raden kommer, för rapporten: Aosom, ett import (AliExpress) eller en kund. */
export type Kalla = "aosom" | "import" | "kund";

export function kallaFor(r: Pick<StoredReview, "source">): Kalla {
  if (isCustomerReview(r)) return "kund";
  return r.source === "aosom" ? "aosom" : "import";
}

/**
 * Nya initialer för en rad, eller null när raden inte ska ändras: fel form
 * ("Verifierad köpare", ett helt namn) eller inget som bryter mot reglerna.
 */
export function nyaInitialer(r: Pick<StoredReview, "productId" | "reviewIdAE" | "initials">): string | null {
  const gamla = (r.initials ?? "").trim();
  if (!FORM.test(gamla)) return null;
  return rattaInitialer(gamla, `${r.productId}#${r.reviewIdAE}`);
}

export interface SlumpaDeps {
  /** Hela recensionslagret. */
  rader: StoredReview[];
  upsert(r: StoredReview): Promise<void>;
  /** Raden som den står i lagret just nu (före skrivningen och efter den). */
  lasOm(productId: string, reviewIdAE: string): Promise<StoredReview | null>;
  /** True när tidsbudgeten är slut. */
  slut?: () => boolean;
  /** Paus mellan återläsningsförsöken. Injicerbar så testerna slipper vänta. */
  vanta?: (ms: number) => Promise<void>;
}

export interface SlumpaPlan {
  /** Rader som en skarp körning skriver (högst `hogst`). */
  attAndra: { r: StoredReview; nya: string }[];
  /** Alla rader som bryter mot reglerna och har rätt form, före `hogst`. */
  totalt: number;
  /** Rader som bryter mot reglerna men är kundomdömen: lämnades orörda. */
  kundomdomenHoppade: number;
  /** Rader som bryter mot reglerna men har fel form (till exempel "Zara"): rörs inte. */
  annanForm: number;
  /** Antal rader per förbjuden bokstav (en rad med två olika räknas två gånger). */
  perBokstav: Record<string, number>;
  /**
   * Av `totalt`: varför raden ändras. En rad i bokstavsordning räknas som
   * `bokstavsordning` även när den också har en förbjuden bokstav ("W.X.").
   */
  perOrsak: { bokstavsordning: number; barForbjuden: number };
  /** Av `totalt`: varifrån raderna kommer. */
  perKalla: Record<Kalla, number>;
  /**
   * Av `totalt`: rader vars NYA initialer har ett Å eller Ö. Leonard 2026-10-30:
   * "du får även använda å och ö ibland". Förväntat ungefär 8 %; noll av tusen
   * hade betytt att generatorn tappat dem.
   */
  nyaMedAringEllerOumlaut: number;
}

export function planeraSlumpa(
  rader: StoredReview[],
  opts: { medKundomdomen: boolean; hogst: number },
): SlumpaPlan {
  const perBokstav: Record<string, number> = Object.fromEntries(FORBJUDNA.map((b) => [b, 0]));
  const perOrsak = { bokstavsordning: 0, barForbjuden: 0 };
  const perKalla: Record<Kalla, number> = { aosom: 0, import: 0, kund: 0 };
  let kundomdomenHoppade = 0;
  let annanForm = 0;
  let nyaMedAringEllerOumlaut = 0;
  const alla: { r: StoredReview; nya: string }[] = [];
  for (const r of rader) {
    const brist = bristerIInitialer((r.initials ?? "").trim());
    if (!brist) continue;
    const nya = nyaInitialer(r);
    if (!nya) {
      annanForm++;
      continue;
    }
    const kalla = kallaFor(r);
    if (kalla === "kund" && !opts.medKundomdomen) {
      kundomdomenHoppade++;
      continue;
    }
    for (const b of new Set(brist.forbjudna)) perBokstav[b]++;
    if (brist.bokstavsordning) perOrsak.bokstavsordning++;
    else perOrsak.barForbjuden++;
    perKalla[kalla]++;
    if (/[ÅÖ]/u.test(nya)) nyaMedAringEllerOumlaut++;
    alla.push({ r, nya });
  }
  return {
    attAndra: alla.slice(0, Math.max(0, opts.hogst)),
    totalt: alla.length,
    kundomdomenHoppade,
    annanForm,
    perBokstav,
    perOrsak,
    perKalla,
    nyaMedAringEllerOumlaut,
  };
}

/** Vad som skilde sig när en rad inte läste tillbaka som planerat. */
export interface Avvikelser {
  saknas: number;
  initialer: number;
  status: number;
  text: number;
}

/** Pauser (ms) före varje återläsningsförsök. Lagret kan ligga efter en skrivning. */
export const ATERLAS_PAUSER = [0, 300, 900, 2000];

export interface SlumpaSvar {
  andrade: number;
  fel: number;
  /** Av felen: vilket fält som skilde sig efter sista försöket. Bara räknare. */
  avvikelser: Avvikelser;
  /** Rader som läste tillbaka rätt först vid ett andra eller senare försök. */
  sentOmLasta: number;
  /**
   * Rader som ändrats av någon annan (eller försvunnit) sedan planen gjordes. De
   * lämnades orörda och planeras om i nästa körning, med sitt nya läge.
   */
  andratUnderTiden: number;
  /** Rader som återstår efter den här körningen (tidsbudget eller `hogst`). */
  kvar: number;
  /**
   * Produkterna vars rader skrevs, eller försöktes skrivas: butiken ska hämta om
   * deras recensioner. ☠️ Id:n lämnar aldrig rutten i svaret (loggen är publik).
   */
  skrivnaProdukter: string[];
}

/**
 * Skriver planen. ☠️ En rad räknas som ändrad först när den läses tillbaka med
 * de nya initialerna, oförändrad status och oförändrad text.
 *
 * ☠️ Raden läses om precis före skrivningen och skrivs från den färska kopian.
 * `upsert` skriver hela raden, och planen byggdes av en läsning som kan vara flera
 * minuter gammal: utan omläsningen hade en status eller text som ändrats under
 * tiden skrivits över med det gamla, tyst. Har raden ändrats (eller försvunnit)
 * rörs den inte, och nästa körning planerar om den.
 */
export async function skrivSlumpa(deps: SlumpaDeps, plan: SlumpaPlan): Promise<SlumpaSvar> {
  const vanta = deps.vanta ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const produkter = new Set<string>();
  const svar: SlumpaSvar = {
    andrade: 0,
    fel: 0,
    avvikelser: { saknas: 0, initialer: 0, status: 0, text: 0 },
    sentOmLasta: 0,
    andratUnderTiden: 0,
    kvar: plan.totalt,
    skrivnaProdukter: [],
  };
  for (const { r, nya } of plan.attAndra) {
    if (deps.slut?.()) break;
    try {
      const farsk = await deps.lasOm(r.productId, r.reviewIdAE);
      if (
        !farsk
        || farsk.initials !== r.initials
        || farsk.status !== r.status
        || farsk.textSwedish !== r.textSwedish
      ) {
        svar.andratUnderTiden++;
        continue;
      }
      produkter.add(r.productId);
      await deps.upsert({ ...farsk, initials: nya });
      // ☠️ Återläsningen provas flera gånger: lagret kan ligga efter en skrivning
      // (127 av 1 000 rader föll på första försöket 2026-10-29 trots att
      // skrivningen satt). En rad räknas som fel först när alla försök avvikit.
      let avvik: keyof Avvikelser | null = "saknas";
      let forsok = 0;
      for (const paus of ATERLAS_PAUSER) {
        if (paus) await vanta(paus);
        forsok++;
        const efter = await deps.lasOm(r.productId, r.reviewIdAE);
        if (!efter) avvik = "saknas";
        else if (efter.initials !== nya) avvik = "initialer";
        else if (efter.status !== r.status) avvik = "status";
        else if (efter.textSwedish !== r.textSwedish) avvik = "text";
        else {
          avvik = null;
          break;
        }
      }
      if (avvik === null) {
        svar.andrade++;
        if (forsok > 1) svar.sentOmLasta++;
      } else {
        svar.fel++;
        svar.avvikelser[avvik]++;
      }
    } catch {
      svar.fel++;
      svar.avvikelser.saknas++;
    }
  }
  svar.kvar = plan.totalt - svar.andrade;
  svar.skrivnaProdukter = [...produkter];
  return svar;
}
