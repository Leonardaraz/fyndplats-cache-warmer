// En klocka för hela sidan (Black Week, planens del C2, 2026-11-04).
//
// Varje auktionskort hade en egen setInterval i useClientNow. Med 50 och 100
// fynd om dagen blev det 100 timers i sekundtakt på /fyndauktion, och varje
// timer gav en egen React-rendering, eftersom React bara buntar ihop det som
// sker i samma uppgift. Här finns i stället en timer per takt (1 s, 20 s, 60 s),
// och ett slag meddelar alla kort på den takten i samma uppgift. React ritar
// då om dem i ett svep.
//
// Fyra egenskaper som inte ska tas bort:
//
// 1. ☠️ TIDEN ÄR GEMENSAM FÖR ALLA TAKTER, så ett taktbyte flyttar den aldrig
//    bakåt. Ett kort byter takt vid fasbytet (nedräkning 1 s, sen sänkning
//    20 s). Hade varje takt haft sin egen tid kunde 20-sekundersklockan ligga
//    upp till 20 s efter. Kortet hade då räknat ut den gamla fasen, bytt
//    tillbaka till 1 s och pendlat mellan takterna. Takten avgör bara NÄR ett
//    kort meddelas.
// 2. Klockan får sakta ner men ALDRIG stanna medan fliken är synlig. Varje takt
//    med minst en lyssnare har en timer så länge fliken syns (se
//    use-client-now.ts: en stoppad klocka gjorde att 19:00 aldrig kom).
// 3. När fliken kommer tillbaka läses tiden om direkt och alla meddelas. En
//    flik som varit dold över 07:00 eller 19:00 hinner då ikapp utan att vänta
//    på nästa slag.
// 4. Utan lyssnare är tiden null. Ett kort som monteras när ingen klocka går
//    renderar då som förut med serverns tid först. Annars kunde det rita en
//    tid från förra besöket på sidan.

export type Lyssnare = () => void;

/** Det klockan behöver av omvärlden. I webbläsaren är det `Date`, timers och
 *  `document`; i testerna en låtsasvärld. */
export interface KlockMiljo {
  nu(): number;
  /** Sant medan fliken är dold. */
  dold(): boolean;
  /** Anropar `f` vid varje synlighetsbyte. Returnerar avregistreringen. */
  vidSynlighet(f: () => void): () => void;
  starta(f: () => void, ms: number): unknown;
  stoppa(timer: unknown): void;
}

export interface DeladKlocka {
  /** Lyssna med takten `ms`. Returnerar avregistreringen. */
  prenumerera(ms: number, lyssnare: Lyssnare): () => void;
  /** Senast lästa tid, eller null när ingen lyssnar. Ändras bara vid ett slag,
   *  en ny takt eller ett synlighetsbyte, så två läsningar i rad ger samma
   *  värde, vilket useSyncExternalStore kräver. */
  las(): number | null;
}

interface Takt {
  lyssnare: Set<Lyssnare>;
  timer: unknown | null;
}

export function skapaDeladKlocka(m: KlockMiljo): DeladKlocka {
  let senast: number | null = null;
  const takter = new Map<number, Takt>();
  let antal = 0;
  let slappSynlighet: (() => void) | null = null;

  /** Läs tiden. Ingen spärr mot en datorklocka som ställs bakåt: då hade
   *  klockan stått still tills tiden hunnit ikapp, och den får aldrig stanna. */
  function lasOm() {
    senast = m.nu();
  }

  function meddela(lyssnare: Iterable<Lyssnare>) {
    // En kopia: en lyssnare kan avregistrera sig medan vi går igenom listan.
    for (const l of [...lyssnare]) l();
  }

  function startaTakt(ms: number, takt: Takt) {
    if (takt.timer !== null || m.dold()) return;
    takt.timer = m.starta(() => {
      lasOm();
      meddela(takt.lyssnare);
    }, ms);
  }

  function stoppaTakt(takt: Takt) {
    if (takt.timer === null) return;
    m.stoppa(takt.timer);
    takt.timer = null;
  }

  function synlighetBytt() {
    if (m.dold()) {
      for (const takt of takter.values()) stoppaTakt(takt);
      return;
    }
    lasOm();
    for (const [ms, takt] of takter) startaTakt(ms, takt);
    meddela([...takter.values()].flatMap((t) => [...t.lyssnare]));
  }

  return {
    prenumerera(ms, lyssnare) {
      if (!(ms > 0 && Number.isFinite(ms))) throw new Error(`Klockans takt måste vara ett positivt tal, fick ${ms}`);
      let takt = takter.get(ms);
      if (!takt) {
        takt = { lyssnare: new Set(), timer: null };
        takter.set(ms, takt);
      }
      if (takt.lyssnare.has(lyssnare)) return () => {};
      takt.lyssnare.add(lyssnare);
      antal++;
      if (!slappSynlighet) slappSynlighet = m.vidSynlighet(synlighetBytt);
      if (takt.timer === null) {
        // En ny takt läser om tiden. Kortet som just renderade med den gamla
        // tiden ritas då om direkt (useSyncExternalStore jämför efter
        // prenumerationen).
        lasOm();
        startaTakt(ms, takt);
      }
      const t = takt;
      let aktiv = true;
      return () => {
        if (!aktiv) return;
        aktiv = false;
        t.lyssnare.delete(lyssnare);
        antal--;
        if (t.lyssnare.size === 0) {
          stoppaTakt(t);
          takter.delete(ms);
        }
        if (antal === 0) {
          senast = null;
          slappSynlighet?.();
          slappSynlighet = null;
        }
      };
    },
    las: () => senast,
  };
}

/** Webbläsarens klocka. Skapas först när den behövs, så att servern aldrig rör
 *  `document`. */
const webblasaren: KlockMiljo = {
  nu: () => Date.now(),
  dold: () => typeof document !== "undefined" && document.hidden,
  vidSynlighet(f) {
    if (typeof document === "undefined") return () => {};
    document.addEventListener("visibilitychange", f);
    return () => document.removeEventListener("visibilitychange", f);
  },
  starta: (f, ms) => setInterval(f, ms),
  stoppa: (t) => clearInterval(t as ReturnType<typeof setInterval>),
};

let sidansKlocka: DeladKlocka | null = null;

/** Sidans gemensamma klocka. */
export function deladKlocka(): DeladKlocka {
  sidansKlocka ??= skapaDeladKlocka(webblasaren);
  return sidansKlocka;
}
