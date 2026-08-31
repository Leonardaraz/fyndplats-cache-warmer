// Kopierar drift-datan från Wix Data till Postgres.
//
// Läsning ur Wix fungerar — det är bara SKRIVNING som blockeras av 4 000-taket
// — så kopieringen kan köras medan produktionen fortfarande går på wix-data.
// Den rör inte en enda Wix-rad. Raderingen sker SIST, i ett eget steg, först
// när växlingen stått en dygnscykel: fram till dess är rollback en env-variabel.
//
// ☠️ TRE EGENSKAPER SOM INTE SKA TAS BORT
//
// 1. **Den använder INTE queryAll.** Den funktionen avkortade tyst vid 10 000
//    rader (lagat, men den paginerar fortfarande via offset mot ett tak). Ett
//    kopieringsskript som tyst tar 10 000 av 15 353 rader och rapporterar
//    "klart" är precis den halvmigrering som inte får hända.
//
// 2. **Markör, inte en lång loop.** ~154 sidor i rad; Wix har strypt oss vid
//    ~40–50 tidigare. Svepet återupptas från `cursor` i svaret, exakt som
//    aosom-importen och bildstädningen.
//
// 3. **Räkna efter, lita inte på svaret.** Antalet lästa OCH skrivna rader
//    rapporteras per tabell. Sjunde gången i det här projektet ett svar utan
//    fel visat sig vara tomt.

import { ATT_KOPIERA, LLM_SAMLINGAR, type TabellSpec } from "../db/tabeller";

export interface KopieraOptions {
  /** Torrkörning: läs och räkna, skriv ingenting. Default TRUE. */
  dryRun?: boolean;
  /** Fortsätt här (ur föregående svar). */
  after?: { tabell: string; offset: number } | null;
  /** Bara dessa tabeller. Tom = alla. */
  baraTabeller?: string[];
  /** Väggklocka innan vi lämnar tillbaka en markör. */
  timeBudgetMs?: number;
}

export interface TabellResultat {
  tabell: string;
  läst: number;
  skrivet: number;
  fel: string[];
}

export interface KopieraSummary {
  dryRun: boolean;
  tabeller: TabellResultat[];
  totaltLäst: number;
  totaltSkrivet: number;
  /** Skicka tillbaka som `after`. Null = allt klart. */
  cursor: { tabell: string; offset: number } | null;
  stoppadAv: "klart" | "tidsbudget";
}

export interface KopieraDeps {
  /** En sida ur en Wix-kollektion. Anroparen äger backoff och retry. */
  läsSida: (kollektion: string, offset: number, limit: number) => Promise<Record<string, unknown>[]>;
  /** Upsertar en sida till Postgres. Returnerar antal skrivna rader. */
  skrivSida: (spec: TabellSpec, rader: Record<string, unknown>[]) => Promise<number>;
  /** LLM-samlingarna delar tabell och nycklas på (collection, key). */
  skrivLlmSida: (kollektion: string, rader: Record<string, unknown>[]) => Promise<number>;
  now?: () => number;
}

export const SIDSTORLEK = 100;
export const DEFAULT_TIME_BUDGET_MS = 240_000;

export async function runCopy(
  opts: KopieraOptions,
  deps: KopieraDeps,
): Promise<KopieraSummary> {
  const dryRun = opts.dryRun !== false;
  const now = deps.now ?? (() => Date.now());
  const start = now();
  const budget = opts.timeBudgetMs ?? DEFAULT_TIME_BUDGET_MS;

  // LLM-samlingarna får syntetiska specar så de kan ligga i samma kö och dela
  // markörens form. `tabell` är samlingsnamnet — de skriver alla till llm_kv.
  const kö: { namn: string; spec: TabellSpec | null; kollektion: string }[] = [
    ...ATT_KOPIERA.map((s) => ({ namn: s.tabell, spec: s, kollektion: s.kollektion })),
    ...LLM_SAMLINGAR.map((k) => ({ namn: `llm_kv:${k}`, spec: null, kollektion: k })),
  ].filter((p) => !opts.baraTabeller?.length || opts.baraTabeller.includes(p.namn));

  const s: KopieraSummary = {
    dryRun,
    tabeller: [],
    totaltLäst: 0,
    totaltSkrivet: 0,
    cursor: null,
    stoppadAv: "klart",
  };

  // Hoppa fram till markörens tabell.
  const startIdx = opts.after ? kö.findIndex((p) => p.namn === opts.after!.tabell) : 0;
  if (opts.after && startIdx === -1) {
    throw new Error(`Markören pekar på okänd tabell "${opts.after.tabell}".`);
  }

  for (let i = Math.max(0, startIdx); i < kö.length; i++) {
    const post = kö[i];
    const res: TabellResultat = { tabell: post.namn, läst: 0, skrivet: 0, fel: [] };
    s.tabeller.push(res);

    let offset = i === startIdx && opts.after ? opts.after.offset : 0;

    for (;;) {
      if (now() - start > budget) {
        s.cursor = { tabell: post.namn, offset };
        s.stoppadAv = "tidsbudget";
        return s;
      }

      const rader = await deps.läsSida(post.kollektion, offset, SIDSTORLEK);
      res.läst += rader.length;
      s.totaltLäst += rader.length;

      if (rader.length > 0 && !dryRun) {
        try {
          const n = post.spec
            ? await deps.skrivSida(post.spec, rader)
            : await deps.skrivLlmSida(post.kollektion, rader);
          res.skrivet += n;
          s.totaltSkrivet += n;
        } catch (err) {
          // En trasig sida får inte fälla resten — men den ska SYNAS, med sin
          // offset, så den går att köra om riktat i stället för att gissa.
          res.fel.push(
            `offset ${offset}: ${err instanceof Error ? err.message.slice(0, 200) : String(err)}`,
          );
        }
      }

      offset += SIDSTORLEK;
      // En kortare sida än full betyder att kollektionen är slut. Det är samma
      // villkor Wix-hjälparna använder, så kopieringen kan inte sluta tidigare
      // än en vanlig listning skulle ha gjort.
      if (rader.length < SIDSTORLEK) break;
    }
  }

  return s;
}
