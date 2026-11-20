// Var kunden står på sidan: produktsidan öppnas vid bilderna, och bakåt
// till en listsida landar vid kortet man tryckte på (Leonard 2026-10-07).
//
// Uppmätt i produktion samma dag, mobil 390 × 844:
//
// - Ett tryck på ett kort öppnade produktsidan överst. Bilderna började
//   435 px ner, under brödsmulorna och föregående/nästa-raden, och
//   kunden fick själv dra upp dem.
// - Bakåt från en produkt, efter två "Visa fler", gav 24 kort i stället
//   för 72 och y = 16 443 px, alltså en plats ingen hade varit på.
//   Produktsidan och listan är samma dokument (mjuk navigering), så
//   ShopBrowser monteras om från början och glömmer sina kort. Webbläsaren
//   återställer sedan sitt gamla y på en sida som är mycket kortare.
//
// Två signaler sätts av skriptet i sidhuvudet (SIDBYTE_SKRIPT i
// app/layout.tsx), som lyssnar innan React gör det:
//
//   window.__fpKlick    = { p, t }  en länk i butiken trycktes, mot sökvägen p
//   window.__fpTrav     = t         bakåt eller framåt i historiken
//   window.__fpTravTill = adress    sidan steget landade på (sökväg + sökdel)
//   window.__fpNy       = t         en ny post lades i historiken (pushState)
//   window.__fpStart    = adress    sidan dokumentet laddades på
//
// Bara ett tryck flyttar produktsidan. Bakåt, framåt, en omladdning och en
// landning från Google lämnar webbläsarens egen plats orörd.
//
// ☠️ EN SÖKNING STRAX EFTER BAKÅT ÅTERSTÄLLDE ETT GAMMALT LÄGE (2026-11-20).
// Sökrutan byter sida med router.push från en knapp, ett chip eller Enter, och
// det är inget tryck på en länk: __fpKlick sattes aldrig. Inom tio sekunder
// efter ett bakåtsteg trodde resultatsidan därför att kunden kommit dit med
// bakåt, och fanns det ett sparat läge för sökningen (ett kort man tryckt på
// där tidigare) visades 72 kort och sidan rullades 9 564 px ner (mätt på www,
// audit/sok-hopp.cjs). Leonard: "ibland kastas man längst ner på sidan".
//
// Nu räcker inte ett färskt bakåtsteg. Två saker till ska stämma:
//   • ingen ny post i historiken efter steget. Varje byte framåt, vem som än
//     gör det, går genom history.pushState, och skriptet i sidhuvudet noterar
//     det. Ingen behöver komma ihåg att sätta en signal vid nästa router.push.
//   • steget landade på just den här adressen.
// Vart och ett stoppar felet för sig; det andra finns kvar om det ena faller.

export type Fonster = {
  __fpKlick?: { p: string; t: number };
  __fpTrav?: number;
  __fpTravTill?: string;
  __fpNy?: number;
  __fpStart?: string;
};

/** Hur gammal en signal får vara. En mjuk navigering hämtar sidan först,
 *  och på en långsam mobil kan det ta några sekunder. */
export const SIGNAL_MS = 10_000;

/** Kom kunden hit med ett tryck på en länk till just den här sökvägen? */
export function klickadeHit(w: Fonster, sokvag: string, nu: number): boolean {
  const k = w.__fpKlick;
  return !!k && k.p === sokvag && nu - k.t >= 0 && nu - k.t < SIGNAL_MS
    && !(w.__fpTrav && w.__fpTrav > k.t);
}

/** Kom kunden hit med bakåt eller framåt? Mjukt: popstate nyss, inget tryck
 *  och ingen ny post i historiken efter det, och steget landade på `adress`
 *  (sökväg + sökdel) när den är given. Hårt: dokumentet laddades som
 *  back_forward, på just den här adressen, och har inte bytt sida sedan dess,
 *  varken med ett tryck på en länk eller med en ny post i historiken. */
export function komMedHistoriken(w: Fonster, nu: number, navigeringstyp: string | undefined, adress?: string): boolean {
  const trav = w.__fpTrav;
  const samma = (kand: string | undefined) => adress === undefined || kand === undefined || kand === adress;
  if (trav && nu - trav >= 0 && nu - trav < SIGNAL_MS) {
    if ((w.__fpKlick && w.__fpKlick.t > trav) || (w.__fpNy && w.__fpNy > trav)) return false;
    return samma(w.__fpTravTill);
  }
  return !w.__fpKlick && !trav && !w.__fpNy && navigeringstyp === "back_forward" && samma(w.__fpStart);
}

/**
 * Laddades dokumentet om på den här adressen, och har det inte bytt sida sedan
 * dess? En omladdning behåller platsen på sidan i varje webbläsare, och på en
 * telefon laddas en flik om av sig själv när den legat i bakgrunden och minnet
 * tagit slut. Listan börjar då om med 24 kort, och den gamla platsen ligger
 * nedanför dem: kunden stod vid sidfoten. Listsidan ställer därför tillbaka
 * sitt sparade läge också efter en omladdning (components/shopbrowser.tsx).
 */
export function laddadesOm(w: Fonster, navigeringstyp: string | undefined, adress?: string): boolean {
  return navigeringstyp === "reload" && !w.__fpKlick && !w.__fpTrav && !w.__fpNy
    && (adress === undefined || w.__fpStart === undefined || w.__fpStart === adress);
}

// ── Produktsidan efter en hel sidladdning ────────────────────────────────────
//
// Några länkar till produkter är vanliga <a> (förslagen i varukorgen,
// auktionskorten, köpguidernas produkter) och laddar om hela sidan. Då finns
// window.__fpKlick inte kvar, så sidhuvudets skript sparar trycket även i
// sessionStorage. Skriptet nedan ligger sist i produktvyn och körs bara vid en
// hel sidladdning (React kör inte skript den lägger in själv), innan sidan
// ritats färdigt. Det ligger sist och inte direkt efter galleriet: först då
// är sidan lång nog att rullas ner till bilderna utan att stanna för tidigt.

export const KLICK_NYCKEL = "fp-klick";

export const LANDA_SKRIPT =
  "(function(){try{var r=sessionStorage.getItem('" + KLICK_NYCKEL + "');if(!r)return;" +
  "sessionStorage.removeItem('" + KLICK_NYCKEL + "');var k=JSON.parse(r),nu=Date.now()," +
  "n=performance.getEntriesByType&&performance.getEntriesByType('navigation')[0];" +
  "if(!k||k.p!==location.pathname||nu<k.t||nu-k.t>" + SIGNAL_MS + "||location.hash||" +
  "n&&n.type!=='navigate'||!matchMedia('(max-width: 760px)').matches)return;" +
  "var g=document.querySelector('.pdp > .gallery');if(!g)return;" +
  "var h=document.documentElement,b=h.style.scrollBehavior;h.style.scrollBehavior='auto';" +
  "var till=function(){var e=document.querySelector('header'),u=e?Math.max(0,e.getBoundingClientRect().bottom):0;" +
  "return Math.max(0,Math.round(scrollY+g.getBoundingClientRect().top-u-12))};" +
  "scrollTo(0,till());var y=till();if(Math.abs(y-scrollY)>1)scrollTo(0,y);h.style.scrollBehavior=b}catch(e){}})()";

// ── Listsidan ────────────────────────────────────────────────────────────────

// ☠️ LÄGET SPARAS HUR KUNDEN ÄN LÄMNAR LISTAN (2026-11-20). Förr sparades det
// bara när ett kort i listan trycktes. Den som lämnade listan på annat sätt
// (en vara i sökläget, loggan, menyn, varukorgen, en vanlig länk) och sedan
// gick bakåt fick 24 kort i stället för 72, och webbläsaren ställde tillbaka
// sin gamla plats på en sida som blivit kortare: sidfoten. Mätt på www samma
// dag (audit/bakat-annan-vag.cjs): fyra vägar av fyra gav 24 kort, tre av dem
// med "kvar till botten 0". Leonard: "ibland kastas man längst ner på sidan".
//
// Nu sparas också var sidan stod (`y`), varje gång kunden rullat och när
// listan lämnas (components/shopbrowser.tsx). Med platsen sparas ett kort: det
// som trycktes, eller det som stod överst i fönstret när sidan stannade. Kortet
// är exaktare än `y` när något ovanför det ändrat höjd (efter en hel
// sidladdning står raderna några pixlar annorlunda tills typsnitten kommit).
// Bakåt letar först efter kortet och tar annars `y`.

export type Listlage = {
  /** Hur många kort som visades ("Visa fler" × 24 + 24). */
  shown: number;
  /** Kortets länk: det som trycktes, eller det som stod överst i fönstret när
   *  sidan stannade. Tom när inget kort hann mätas. */
  href: string;
  /** Kortets överkant i fönstret när läget sparades. */
  top: number;
  /** Sidans rullning (scrollY) när läget sparades. */
  y?: number;
  t: number;
};

type Lagring = Pick<Storage, "getItem" | "setItem">;
type Glomska = Pick<Storage, "removeItem">;

const NYCKEL = "fp-listlage:";
/** Ett läge äldre än så återställs inte. */
export const LISTLAGE_MAX_MS = 30 * 60_000;

export function sparaListlage(s: Lagring, adress: string, l: Listlage): void {
  try {
    s.setItem(NYCKEL + adress, JSON.stringify(l));
  } catch {
    /* privat läge eller full lagring: bakåt beter sig då som förut */
  }
}

/**
 * Ett nytt besök på listan glömmer det gamla läget. Läget hör till besöket det
 * sparades under: den som var djupt nere i listan för en kvart sedan, kommer
 * dit igen med en länk, lämnar den utan att rulla och går bakåt ska stå överst,
 * inte där den stod förra gången. Listsidan anropar det när den ritas utan att
 * kunden kommit med bakåt eller en omladdning.
 */
export function glomListlage(s: Glomska, adress: string): void {
  try {
    s.removeItem(NYCKEL + adress);
  } catch {
    /* privat läge: det fanns inget att glömma */
  }
}

export function lasListlage(s: Lagring, adress: string, nu: number): Listlage | null {
  try {
    const r = s.getItem(NYCKEL + adress);
    if (!r) return null;
    const l = JSON.parse(r) as Partial<Listlage>;
    if (typeof l.shown !== "number" || !(l.shown > 0) || typeof l.href !== "string"
      || typeof l.top !== "number" || typeof l.t !== "number") return null;
    if (l.y !== undefined && (typeof l.y !== "number" || !(l.y >= 0))) return null;
    if (nu - l.t > LISTLAGE_MAX_MS || nu < l.t) return null;
    return l as Listlage;
  } catch {
    return null;
  }
}
