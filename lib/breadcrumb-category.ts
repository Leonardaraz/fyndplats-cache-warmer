// Produktsidans brödsmula: Hem / avdelning / underkategori / produkt.
//
// Brödsmulan visade bara avdelningen, alltså Hem / Möbler / produkt. De
// smala sökordskategorierna (Snurrfåtöljer, Hörnskrivbord, Massagebänkar …)
// fick därför ingen länk från sina egna produkter. Bläddringsraden länkar
// visserligen till ett avsnitt, men det är det första i menyordningen. Mätt
// 2026-09-24 på 40 produkter som ligger i flera underkategorier: 5 länkade till
// sin smalaste. De åtta hörnskrivborden länkade till Dator & Gaming, och
// massagebänkarna till Massage & Återhämtning.
//
// Regeln: den SMALASTE underkategorin produkten ligger i, räknat i produkter
// på kategorisidan, och bara om den sidan får indexeras. Avdelningen blir
// underkategorins förälder, så att kedjan alltid är sammanhängande. En
// underkategori med 1–4 produkter hoppas över, eftersom den sidan är noindex.
// Ligger produkten inte i någon indexerbar underkategori gäller den gamla
// regeln: första avdelningen, annars första kategorin.
//
// PRODUKTENS EGEN AVDELNING FÖRST (2026-11-04). ChatGPT:s audit hittade en
// uppresningsfåtölj med brödsmulan Skönhet & Hälsa / Massage & Återhämtning,
// fast produkten bara låg i avdelningen Möbler. Massage & Återhämtning var
// smalare än Fåtöljer, och regeln ovan tog den smalaste oavsett avdelning.
// Nu väljs den smalaste underkategorin först bland produktens EGNA
// avdelningar (de avdelningar den själv är kopplad till). Finns ingen där
// gäller regeln ovan. Långsvansregeln står alltså kvar inom avdelningen.
// Bläddringsraden följer samma val (lib/product-neighbours.ts), så att
// "N av M i …" och brödsmulan alltid pekar på samma kategori.
//
// PRODUKTTYPENS KATEGORI FÖRST (Leonard 2026-11-05). Kategorikollen räknade
// regeln ovan över hela katalogen: 204 av 5 887 produkter bytte brödsmula, och
// 150 av dem gick från sin egen typkategori (Skoskåp & skobänkar, Bokhyllor,
// Byråer, TV-bänkar …) till Hem & Inredning / Förvaring & Organisering. De är
// kopplade direkt till den avdelningen men inte till Möbler. Två julgranar
// hamnade under Dekoration & Prydnad. Nu går den underkategori först som
// produktnamnet självt pekar ut: ett ord i namnets huvudfras (före första
// prepositionen eller tankstrecket) är kategorins namn, eller ett av dess led,
// i plural eller singular. Bara produktens egna, indexerbara underkategorier
// räknas. Sedan produktens egen avdelning, sedan den smalaste av alla. Samma
// ordformer som motorns polerspärr (lib/polish/typkategori.ts), men här räknas
// också namn med "&" och bindestreck, led för led.
//
// Motorn räknar samma regel över hela katalogen i kategorikollen
// (fyndplats-cache-warmer lib/kategorikoll/brodsmula.ts, en kopia med
// samma testfall). Ändras regeln här ska kopian och dess fall ändras där.
//
// Tröskeln skickas in (categoryIndexable) i stället för att importeras, så att
// modulen saknar beroenden och går att testa med node --test. Regeln har
// fortfarande bara en definition, i lib/category-threshold.ts.

export type BrodsmuleKategori = { id: string; name: string; slug: string; parentId: string | null };

const GEMENER = (s: string) => s.toLocaleLowerCase("sv-SE");

/** Det som avslutar huvudfrasen: en preposition, ett tankstreck, komma, parentes eller kolon. */
const SLUT_PA_HUVUDFRAS = /\s(?:med|för|i|på|till|och|av|utan|från)\s|\s[–—-]\s|[,(:]/i;

/** Orden i produktnamnets huvudfras, gemener. "TV-bänk i ek" → tv, bänk. */
export function huvudord(namn: string): Set<string> {
  const s = ` ${namn.trim()} `;
  const m = SLUT_PA_HUVUDFRAS.exec(s);
  const fras = GEMENER((m ? s.slice(0, m.index) : s).trim());
  return new Set(fras.split(/[^a-zåäöéü]+/).filter(Boolean));
}

const typordCache = new Map<string, string[]>();

/**
 * Ordformerna ett kategorinamn kan ha i ett produktnamn: varje led (delat på
 * "&", mellanslag och bindestreck) som det står och i troliga singularer.
 * Svensk plural är inte regelbunden, så formerna är kandidater; en form som
 * inte finns i något produktnamn kostar ingenting. Led kortare än tre
 * bokstäver ("tv") räknas inte.
 */
export function typord(kategorinamn: string): string[] {
  const sparad = typordCache.get(kategorinamn);
  if (sparad) return sparad;
  const ut = new Set<string>();
  for (const led of GEMENER(kategorinamn).split(/[^a-zåäöéü]+/)) {
    if (led.length < 3) continue;
    ut.add(led);
    if (led.length > 4 && led.endsWith("or")) ut.add(`${led.slice(0, -2)}a`); // soptunnor → soptunna
    if (led.length > 4 && led.endsWith("ar")) {
      ut.add(led.slice(0, -2)); // julgranar → julgran
      ut.add(`${led.slice(0, -2)}e`); // kuddar → kudde
    }
    if (led.length > 4 && led.endsWith("er")) ut.add(led.slice(0, -2)); // byråer → byrå
    if (led.length > 5 && led.endsWith("s") && !led.endsWith("ss")) ut.add(led.slice(0, -1)); // sideboards → sideboard
  }
  const lista = [...ut];
  typordCache.set(kategorinamn, lista);
  return lista;
}

export function valjBrodsmula<C extends BrodsmuleKategori>(
  egna: C[],
  alla: C[],
  antal: Map<string, number>,
  indexerbar: (antal: number) => boolean,
  produktnamn?: string,
): { avdelning?: C; underkategori?: C } {
  const avdelningar = new Map(alla.filter((c) => c.parentId === null).map((c) => [c.id, c]));
  const smalaste = (tillats: (c: C) => boolean): C | undefined => {
    let bast: C | undefined;
    for (const c of egna) {
      if (!c.parentId || !avdelningar.has(c.parentId) || !tillats(c)) continue;
      const n = antal.get(c.id) || 0;
      if (!indexerbar(n)) continue;
      if (!bast) {
        bast = c;
        continue;
      }
      const m = antal.get(bast.id) || 0;
      if (n < m || (n === m && c.slug < bast.slug)) bast = c;
    }
    return bast;
  };
  // Först typkategorin, sedan bland produktens egna avdelningar, sedan bland alla.
  const ord = produktnamn ? huvudord(produktnamn) : new Set<string>();
  const egnaAvdelningar = new Set(egna.filter((c) => c.parentId === null).map((c) => c.id));
  const underkategori =
    (ord.size > 0 ? smalaste((c) => typord(c.name).some((f) => ord.has(f))) : undefined) ??
    smalaste((c) => egnaAvdelningar.has(c.parentId as string)) ??
    smalaste(() => true);
  if (underkategori) return { avdelning: avdelningar.get(underkategori.parentId as string), underkategori };
  return { avdelning: egna.find((c) => c.parentId === null) || egna[0] };
}
