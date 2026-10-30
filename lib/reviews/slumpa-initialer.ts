// Slumpa om initialer som ser påhittade ut, har bokstäver som ska bort eller delas av
// en annan recension på samma produkt.
//
// Leonard 2026-10-29: recensioner vars initialer har bokstäverna Y, X, Z eller W
// ska få andra, slumpmässiga bokstäver. Leonard 2026-10-30: initialer i
// bokstavsordning ("A.B.", "L.M.") ser förfalskade ut och ska också få slumpade
// bokstäver, Q ska bort precis som de andra, och Å och Ö får komma ibland. Samma dag:
// "är det möjligt att inte ha så många med samma initialer på samma produkt?" — två
// recensioner på en produkt ska inte dela initialer.
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
// ☠️ UNIKA INITIALER PER PRODUKT. Planen går produkt för produkt, och en rads "plats"
// är dess initialer i versaler med punkt efter varje bokstav ("S.K."):
//
//   1. Raderna sorteras efter vem som får BEHÅLLA sin plats (`behallOrdning`):
//      kundomdömen först, sedan synliga före väntande, sedan äldst, sist id. Ordningen
//      beror på radens egna fält och inte på i vilken ordning lagret lämnar dem.
//   2. Första raden för varje plats behåller den. En rad som bryter mot reglerna 1–2
//      (förbjuden bokstav, bokstavsordning) behåller ingenting, den ska bytas ändå.
//   3. Raderna som ska bytas får nya initialer i samma ordning, och varje ny plats
//      läggs bland de upptagna. Två nya initialer krockar därför aldrig med varandra,
//      och inte med en rad som får vara kvar.
//
// Bara det som måste ändras ändras: en rad utan krock och utan regelbrott behåller sina
// initialer, och en produkt där alla är olika berörs inte. Avvisade recensioner syns
// aldrig och upptar ingen plats; väntande gör det, eftersom de blir synliga när någon
// godkänner dem. En avvisad rad som bryter mot reglerna rättas ändå (utan hänsyn till
// platserna), så att den är i sin ordning om den någon gång godkänns.
//
// Kundomdömen (source "customer") rörs INTE som standard. De bär initialerna
// ur kundens namn på ordern och räknas som förstahandsomdömen; ett påhittat
// namn på dem vore vilseledande. `medKundomdomen` släpper spärren för regelbrott.
// Två kundomdömen med samma initialer på en produkt rörs aldrig, de räknas bara
// (`kundDubbletter`): det är två riktiga kunder.
//
// ☠️ En körning med `hogst` kan lämna rader kvar. Nästa körning planerar om från
// lagrets nya läge och konvergerar: de som redan fått nya, unika initialer krockar inte
// längre, och vem som får behålla en plats beror inte på initialerna.
import type { StoredReview } from "../store/reviews";
import { isVisibleStatus } from "../store/reviews";
import {
  FORBJUDNA,
  FORM_INITIALER,
  arForbjuden,
  bokstaverIInitialer,
  bristerIInitialer,
  platsPaProdukt,
  rattaInitialer,
  rattaInitialerUnika,
  slumpaUnika,
} from "./initialer";
import { isCustomerReview } from "./queue";

export { FORBJUDNA };

/** Innehåller initialerna någon av de förbjudna bokstäverna? */
export function harForbjudenBokstav(initials: string | undefined): boolean {
  return bokstaverIInitialer(initials).some(arForbjuden);
}

/** Varifrån raden kommer, för rapporten: Aosom, VEVOR, ett import (AliExpress) eller en kund. */
export type Kalla = "aosom" | "vevor" | "import" | "kund";

export function kallaFor(r: Pick<StoredReview, "source">): Kalla {
  if (isCustomerReview(r)) return "kund";
  if (r.source === "aosom") return "aosom";
  if (r.source === "vevor") return "vevor";
  return "import";
}

/**
 * Nya initialer för en rad, eller null när raden inte ska ändras: fel form
 * ("Verifierad köpare", ett helt namn) eller inget som bryter mot reglerna.
 * Tar ingen hänsyn till andra rader på produkten, se `planeraSlumpa` för det.
 */
export function nyaInitialer(r: Pick<StoredReview, "productId" | "reviewIdAE" | "initials">): string | null {
  const gamla = (r.initials ?? "").trim();
  if (!FORM_INITIALER.test(gamla)) return null;
  return rattaInitialer(gamla, `${r.productId}#${r.reviewIdAE}`);
}

const jamfor = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/** När recensionen skrevs; saknas datum används importtiden, och saknas båda hamnar raden sist. */
function tidFor(r: Pick<StoredReview, "date" | "importedAt">): number {
  return Date.parse(r.date ?? "") || Date.parse(r.importedAt ?? "") || Number.POSITIVE_INFINITY;
}

/**
 * Sorteringsordningen för vem som får behålla sina initialer när flera delar dem:
 * kundomdömen först, sedan synliga före väntande, sedan äldst, sist id. Sist kommer id
 * så att ordningen är total: samma rader ger samma ordning vilken ordning lagret än
 * lämnar dem i.
 */
export function behallOrdning(a: StoredReview, b: StoredReview): number {
  const ka = isCustomerReview(a);
  const kb = isCustomerReview(b);
  if (ka !== kb) return ka ? -1 : 1;
  const va = isVisibleStatus(a.status);
  const vb = isVisibleStatus(b.status);
  if (va !== vb) return va ? -1 : 1;
  const ta = tidFor(a);
  const tb = tidFor(b);
  if (ta !== tb) return ta < tb ? -1 : 1;
  return jamfor(a.reviewIdAE, b.reviewIdAE);
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

/** Varför en rad får nya initialer. */
export type Orsak = "bokstavsordning" | "barForbjuden" | "dubblett";

/** En rad som ska få nya initialer. */
export interface PlaneradRad {
  r: StoredReview;
  nya: string;
  orsak: Orsak;
}

export interface SlumpaPlan {
  /** Rader som en skarp körning skriver (högst `hogst`), sorterade på produkt och id. */
  attAndra: PlaneradRad[];
  /** Alla rader som ska få nya initialer och har rätt form, före `hogst`. */
  totalt: number;
  /** Antal produkter som berörs av `totalt`. */
  produkter: number;
  /** Rader som bryter mot reglerna men är kundomdömen: lämnades orörda. */
  kundomdomenHoppade: number;
  /** Rader som bryter mot reglerna men har fel form (till exempel "Zara"): rörs inte. */
  annanForm: number;
  /**
   * Kundomdömen som delar initialer med ett annat kundomdöme på samma produkt. De
   * rörs aldrig (det är två riktiga kunder) och räknas bara. Förväntat 0.
   */
  kundDubbletter: number;
  /**
   * Rader som inte fick ett ledigt par: de fick ändå det första, regelrätta resultatet
   * (reglerna 1–3 går före unikheten) eller lämnades orörda. Kan bara hända på en
   * produkt med fler än ~500 recensioner. Förväntat 0.
   */
  ejUnika: number;
  /** Antal rader per förbjuden bokstav (en rad med två olika räknas två gånger). */
  perBokstav: Record<string, number>;
  /**
   * Av `totalt`: varför raden ändras. En rad i bokstavsordning räknas som
   * `bokstavsordning` även när den också har en förbjuden bokstav ("W.X."), och
   * en rad med en förbjuden bokstav räknas så även när den dessutom delas av en annan.
   * `dubblett` är rader som bara delar sina initialer med en annan rad på produkten.
   */
  perOrsak: Record<Orsak, number>;
  /** Av `totalt`: varifrån raderna kommer. */
  perKalla: Record<Kalla, number>;
  /**
   * Av `totalt`: rader vars NYA initialer har ett Å eller Ö. Leonard 2026-10-30:
   * "du får även använda å och ö ibland". Förväntat ungefär 8 %; noll av tusen
   * hade betytt att generatorn tappat dem.
   */
  nyaMedAringEllerOumlaut: number;
}

/**
 * Planerar vilka rader som får nya initialer, och vilka. Rör ingenting.
 *
 * Se filens huvud för hur platserna delas ut. ☠️ Planen är en ren funktion av
 * raderna: samma lager ger samma plan, vilken ordning raderna än kommer i och hur
 * många körningar den delas på.
 */
export function planeraSlumpa(
  rader: StoredReview[],
  opts: { medKundomdomen: boolean; hogst: number },
): SlumpaPlan {
  const perBokstav: Record<string, number> = Object.fromEntries(FORBJUDNA.map((b) => [b, 0]));
  const perOrsak: Record<Orsak, number> = { bokstavsordning: 0, barForbjuden: 0, dubblett: 0 };
  const perKalla: Record<Kalla, number> = { aosom: 0, vevor: 0, import: 0, kund: 0 };
  let kundomdomenHoppade = 0;
  let annanForm = 0;
  let kundDubbletter = 0;
  let ejUnika = 0;
  let nyaMedAringEllerOumlaut = 0;
  const alla: PlaneradRad[] = [];

  const registrera = (r: StoredReview, nya: string, orsak: Orsak, forbjudna: readonly string[]) => {
    for (const b of new Set(forbjudna)) perBokstav[b]++;
    perOrsak[orsak]++;
    perKalla[kallaFor(r)]++;
    if (/[ÅÖ]/u.test(nya)) nyaMedAringEllerOumlaut++;
    alla.push({ r, nya, orsak });
  };

  const perProdukt = new Map<string, StoredReview[]>();
  for (const r of rader) {
    const lista = perProdukt.get(r.productId);
    if (lista) lista.push(r);
    else perProdukt.set(r.productId, [r]);
  }

  for (const raderHar of perProdukt.values()) {
    const upptagna = new Set<string>();
    /** Levande rader som ska få nya initialer, i `behallOrdning`. */
    const att: { r: StoredReview; orsak: Orsak; forbjudna: string[] }[] = [];
    /** Avvisade rader som bryter mot reglerna: rättas utan hänsyn till platserna. */
    const avvisade: { r: StoredReview; orsak: Orsak; forbjudna: string[] }[] = [];

    // Steg 1–2: vem får vara kvar?
    for (const r of [...raderHar].sort(behallOrdning)) {
      const gamla = (r.initials ?? "").trim();
      const brist = bristerIInitialer(gamla);
      if (!FORM_INITIALER.test(gamla)) {
        if (brist) annanForm++;
        continue;
      }
      const kund = isCustomerReview(r);
      const plats = platsPaProdukt(r); // null för en avvisad rad
      if (brist) {
        const orsak: Orsak = brist.bokstavsordning ? "bokstavsordning" : "barForbjuden";
        if (kund && !opts.medKundomdomen) {
          kundomdomenHoppade++;
          if (plats) upptagna.add(plats); // raden står kvar som den är, och upptar sin plats
        } else if (plats) {
          att.push({ r, orsak, forbjudna: brist.forbjudna });
        } else {
          avvisade.push({ r, orsak, forbjudna: brist.forbjudna });
        }
        continue;
      }
      if (!plats) continue; // en avvisad rad utan regelbrott: ingenting att göra
      if (!upptagna.has(plats)) {
        upptagna.add(plats);
        continue;
      }
      if (kund) {
        kundDubbletter++; // två riktiga kunder: rörs aldrig
        continue;
      }
      att.push({ r, orsak: "dubblett", forbjudna: [] });
    }

    // Steg 3: nya initialer, en rad i taget, och varje ny plats upptas direkt.
    for (const { r, orsak, forbjudna } of att) {
      const seed = `${r.productId}#${r.reviewIdAE}`;
      const nya =
        orsak === "dubblett"
          ? slumpaUnika(seed, upptagna)
          : rattaInitialerUnika((r.initials ?? "").trim(), seed, upptagna);
      if (nya === null) {
        ejUnika++; // inget ledigt par fanns: raden står kvar som den är
        continue;
      }
      const ny = platsPaProdukt({ initials: nya, status: r.status });
      if (ny && upptagna.has(ny)) ejUnika++; // reglerna 1–3 går före unikheten
      if (ny) upptagna.add(ny);
      registrera(r, nya, orsak, forbjudna);
    }

    for (const { r, orsak, forbjudna } of avvisade) {
      const nya = nyaInitialer(r);
      if (nya) registrera(r, nya, orsak, forbjudna);
    }
  }

  // Samma ordning vilken ordning lagret lämnade raderna i, så att `hogst` alltid tar samma första rader.
  alla.sort((x, y) => jamfor(x.r.productId, y.r.productId) || jamfor(x.r.reviewIdAE, y.r.reviewIdAE));
  return {
    attAndra: alla.slice(0, Math.max(0, opts.hogst)),
    totalt: alla.length,
    produkter: new Set(alla.map((x) => x.r.productId)).size,
    kundomdomenHoppade,
    annanForm,
    kundDubbletter,
    ejUnika,
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
