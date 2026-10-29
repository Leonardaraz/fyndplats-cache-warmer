// Byt ut vissa bokstäver i recensionernas initialer mot andra bokstäver.
//
// Leonard 2026-10-29: alla recensioner vars initialer har bokstäverna Y, X, Z
// eller W ska få andra, slumpmässiga bokstäver. Bara den förbjudna bokstaven
// byts; "Z.K." blir "R.K." och "K." i andra ledet rörs inte.
//
// "Slumpmässig" är här DETERMINISTISK: bokstaven väljs ur en hash av
// produkt-id, recensions-id och plats. Då visar torrkörningen exakt vad en
// skarp körning skriver, en omkörning ger samma bokstav, och samma recension
// får alltid samma initialer (som deriveInitials i review-import.ts).
//
// Kundomdömen (source "customer") rörs INTE som standard. De bär initialerna
// ur kundens namn på ordern och räknas som förstahandsomdömen; ett påhittat
// namn på dem vore vilseledande. `medKundomdomen` släpper spärren.
import type { StoredReview } from "../store/reviews";
import { isCustomerReview } from "./queue";

/** Bokstäverna som ska bort ur initialerna. */
export const FORBJUDNA = ["Y", "X", "Z", "W"] as const;

/**
 * Bokstäverna ersättningarna väljs bland: A–V utan Q och utan de fyra
 * förbjudna. Q utelämnas för att det sällan är en initial i Sverige.
 */
export const ERSATTNINGAR = "ABCDEFGHIJKLMNOPRSTUV".split("");

/** Initialer som butiken visar: "S." eller "S.K.". */
const FORM = /^\p{L}\.(\p{L}\.)?$/u;

function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

const ärForbjuden = (b: string) => (FORBJUDNA as readonly string[]).includes(b.toLocaleUpperCase("sv-SE"));

/** Innehåller initialerna någon av de förbjudna bokstäverna? */
export function harForbjudenBokstav(initials: string | undefined): boolean {
  return [...(initials ?? "")].some((c) => /\p{L}/u.test(c) && ärForbjuden(c));
}

/**
 * Nya initialer för en rad, eller null när raden inte ska ändras: fel form
 * ("Verifierad köpare", ett helt namn) eller ingen förbjuden bokstav.
 */
export function nyaInitialer(r: Pick<StoredReview, "productId" | "reviewIdAE" | "initials">): string | null {
  const gamla = (r.initials ?? "").trim();
  if (!FORM.test(gamla) || !harForbjudenBokstav(gamla)) return null;
  const bokstaver = [...gamla].filter((c) => /\p{L}/u.test(c));
  const nya = bokstaver.map((b, i) =>
    ärForbjuden(b)
      ? ERSATTNINGAR[hash(`${r.productId}#${r.reviewIdAE}#${i}`) % ERSATTNINGAR.length]
      : b.toLocaleUpperCase("sv-SE"),
  );
  return nya.map((b) => `${b}.`).join("");
}

export interface SlumpaDeps {
  /** Hela recensionslagret. */
  rader: StoredReview[];
  upsert(r: StoredReview): Promise<void>;
  /** Raden som den står i lagret efter skrivningen. */
  lasOm(productId: string, reviewIdAE: string): Promise<StoredReview | null>;
  /** True när tidsbudgeten är slut. */
  slut?: () => boolean;
}

export interface SlumpaPlan {
  /** Rader som en skarp körning skriver (högst `hogst`). */
  attAndra: { r: StoredReview; nya: string }[];
  /** Alla rader som har en förbjuden bokstav och rätt form, före `hogst`. */
  totalt: number;
  /** Av dem: kundomdömen som lämnades orörda. */
  kundomdomenHoppade: number;
  /** Rader med en förbjuden bokstav men fel form, rörs inte. */
  annanForm: number;
  /** Antal rader per förbjuden bokstav (en rad med två räknas två gånger). */
  perBokstav: Record<string, number>;
}

export function planeraSlumpa(
  rader: StoredReview[],
  opts: { medKundomdomen: boolean; hogst: number },
): SlumpaPlan {
  const perBokstav: Record<string, number> = Object.fromEntries(FORBJUDNA.map((b) => [b, 0]));
  let kundomdomenHoppade = 0;
  let annanForm = 0;
  const alla: { r: StoredReview; nya: string }[] = [];
  for (const r of rader) {
    if (!harForbjudenBokstav(r.initials)) continue;
    const nya = nyaInitialer(r);
    if (!nya) {
      annanForm++;
      continue;
    }
    if (isCustomerReview(r) && !opts.medKundomdomen) {
      kundomdomenHoppade++;
      continue;
    }
    for (const b of FORBJUDNA) if ((r.initials ?? "").toUpperCase().includes(b)) perBokstav[b]++;
    alla.push({ r, nya });
  }
  return {
    attAndra: alla.slice(0, Math.max(0, opts.hogst)),
    totalt: alla.length,
    kundomdomenHoppade,
    annanForm,
    perBokstav,
  };
}

export interface SlumpaSvar {
  andrade: number;
  fel: number;
  /** Rader som återstår efter den här körningen (tidsbudget eller `hogst`). */
  kvar: number;
}

/**
 * Skriver planen. ☠️ En rad räknas som ändrad först när den läses tillbaka med
 * de nya initialerna, oförändrad status och oförändrad text.
 */
export async function skrivSlumpa(deps: SlumpaDeps, plan: SlumpaPlan): Promise<SlumpaSvar> {
  const svar: SlumpaSvar = { andrade: 0, fel: 0, kvar: plan.totalt };
  for (const { r, nya } of plan.attAndra) {
    if (deps.slut?.()) break;
    try {
      await deps.upsert({ ...r, initials: nya });
      const efter = await deps.lasOm(r.productId, r.reviewIdAE);
      if (efter && efter.initials === nya && efter.status === r.status && efter.textSwedish === r.textSwedish) {
        svar.andrade++;
      } else {
        svar.fel++;
      }
    } catch {
      svar.fel++;
    }
  }
  svar.kvar = plan.totalt - svar.andrade;
  return svar;
}
