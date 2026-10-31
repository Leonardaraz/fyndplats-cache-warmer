// lib/meny-grupper.ts
//
// Rubrikerna i mega-menyn: avdelning › grupp › kategori.
//
// VARFÖR. Wix-trädet har två nivåer, och Möbler fick 25 underkategorier i en
// lång rad. Nästan alla stora butiker visar tre nivåer i menyn (jämförelsen
// 2026-09-30: IKEA, JYSK, Chilli, Trademax, Furniturebox, vidaXL, Aosom, Zooplus,
// Arken Zoo). Möbler delas efter rum, Husdjur efter djur, och så vidare.
//
// Grupperna är bara rubriker i menyn. Varje underkategori har kvar sin sida
// och sin adress (/kategori/<slug>). Därför ligger grupperna i koden och inte i
// Wix: en tredje nivå i Wix hade krävt nya sidor och flyttat adresser.
//
// ☠️ INGEN UNDERKATEGORI FÅR FÖRSVINNA UR MENYN. En kategori som saknas här
// hamnar under "Mer" sist, så en ny kategori i Wix syns direkt. Länkarna måste
// ligga i HTML:en för Googles skull (se lib/meganav-ssr.test.ts).
//
// En slug här som inte finns i menyn gör ingenting. Dolda kategorier kommer
// inte med i Wix-frågan, och kategorier utan köpbara produkter sållas bort i
// getCollections och buildCategoryTree. En grupp utan en enda synlig kategori
// visas inte alls. Därför står VEVOR-trädets nya underkategorier (2026-10-31)
// redan här, fast de flesta är dolda: de dyker upp under sin rubrik när de
// visas i Wix, utan en ny deploy.
//
// Ren modul utan importer, så node --test kör den direkt.

export type MenyGrupp = { rubrik: string; slugs: string[] };

// ── Avdelningarnas ordning ──────────────────────────────────────────────────
//
// Menyn, mobilmenyn, kategorilistan på kategorisidorna och Om oss visar
// avdelningarna i den här ordningen (Leonards ja på VEVOR-trädet 2026-10-31).
// Förut sorterades de efter antal produkter, och då hade VEVOR:s verktyg och
// maskiner hamnat först i menyn så fort de publicerades.
// MAIN_GROUPS i lib/category-groups.ts (korten på /butik och startsidan) följer
// samma ordning, och lib/meny-grupper.test.ts håller ihop dem.
//
// Namnen är Wix-namnen. En avdelning som saknas här hamnar sist, störst först.
export const AVDELNINGSORDNING: readonly string[] = [
  "Hem & Inredning",
  "Möbler",
  "Kök & Husgeråd",
  "Trädgård & Utemöbler",
  "Bygg & Renovering",
  "Barn & Familj",
  "Skönhet & Hälsa",
  "Husdjur",
  "Sport & Fritid",
  "Jul & Högtider",
  "Verktyg & Maskiner",
  "Bil & Garage",
  "Företag & Proffs",
];

/** Avdelningarna i menyns ordning. Okända sist, störst först. Ändrar inte listan. */
export function ordnaAvdelningar<T extends { name: string; count: number }>(avdelningar: readonly T[]): T[] {
  const plats = (namn: string) => {
    const i = AVDELNINGSORDNING.indexOf(namn);
    return i === -1 ? AVDELNINGSORDNING.length : i;
  };
  return [...avdelningar].sort((a, b) => plats(a.name) - plats(b.name) || b.count - a.count);
}

export const MENY_GRUPPER: Record<string, MenyGrupp[]> = {
  mobler: [
    { rubrik: "Vardagsrum", slugs: ["soffor-baddsoffor", "fatoljer", "snurrfatoljer", "oronlappsfatoljer", "baddfatoljer", "uppresningsfatoljer", "massagestolar", "soffbord-smabord", "sidobord", "tv-bankar", "bokhyllor", "sideboards-vitrinskap", "sittpuffar-fotpallar", "rumsavdelare"] },
    { rubrik: "Matplats", slugs: ["matbord-stolar", "matgrupper", "barbord", "pallar"] },
    { rubrik: "Sovrum", slugs: ["sangar-sovrum", "nattduksbord", "byraer", "garderober-kladstall"] },
    { rubrik: "Hall", slugs: ["skoskap-skobankar", "kladhangare-hallmobler"] },
    { rubrik: "Kontor & gaming", slugs: ["kontorsstolar", "knastolar", "gamingstolar", "skrivbord", "hornskrivbord"] },
  ],
  "hem-inredning": [
    { rubrik: "Inredning", slugs: ["dekoration-prydnad", "konstvaxter", "speglar"] },
    { rubrik: "Belysning", slugs: ["belysning", "golvlampor"] },
    { rubrik: "Förvaring", slugs: ["forvaring-organisering"] },
    { rubrik: "Badrum & tvätt", slugs: ["badrumsskap", "badrumsspeglar", "badrum-hemtextil", "tvattkorgar", "tvatt-stad"] },
    { rubrik: "Värme", slugs: ["elkaminer", "varmeflaktar", "gnistskydd", "elementskydd"] },
    { rubrik: "Teknik i hemmet", slugs: ["smart-hem-sakerhet", "projektordukar", "hushallsapparater"] },
  ],
  "kok-husgerad": [
    { rubrik: "Apparater", slugs: ["koksmaskiner-apparater", "vattenkokare-brodrostar", "miniugnar-airfryers", "kyl-frys"] },
    { rubrik: "Kök & servering", slugs: ["koksredskap-tillbehor", "koksoar-koksvagnar", "serveringsvagnar-rullvagnar", "vinstall-vinkylar", "soptunnor"] },
  ],
  "tradgard-utemobler": [
    { rubrik: "Uteplats", slugs: ["utemobler", "solskydd-paviljonger", "grill-utekok", "eldkorgar-eldstader", "terrassvarmare-infravarmare", "skarmtak-entretak"] },
    { rubrik: "Odling", slugs: ["vaxthus-odling", "odlingslador", "blomstall-vaxthyllor", "tradgardsskotsel-bevattning"] },
    { rubrik: "Förråd", slugs: ["redskapsbodar-forrad", "garagetalt", "vedstall-vedbodar"] },
    { rubrik: "Dekor", slugs: ["tradgardsdekor-belysning"] },
  ],
  husdjur: [
    { rubrik: "Hund", slugs: ["hundbaddar-hundsoffor", "hundburar", "hundkojor", "hundgrindar", "valphagar-hundhagar", "hundvagnar", "selar-koppel-transport"] },
    { rubrik: "Katt", slugs: ["klostrad", "kattlador", "katthus"] },
    { rubrik: "Smådjur, fåglar & reptiler", slugs: ["kaninburar-marsvinsburar", "hamsterburar-gnagarburar", "honshus-honsgardar", "terrarier"] },
    { rubrik: "För alla djur", slugs: ["mat-vattenskalar", "lek-tillbehor-for-husdjur", "palsvard-skotsel"] },
  ],
  "barn-familj": [
    { rubrik: "Leksaker", slugs: ["leksaker-spel", "leksakskok", "gunghastar-gungdjur", "baby-smabarn"] },
    { rubrik: "Åkfordon", slugs: ["elbilar-for-barn", "motorcyklar-for-barn", "sparkcyklar-for-barn"] },
    { rubrik: "Barnrum & utelek", slugs: ["barnmobler", "utelek-spel", "sandlador"] },
  ],
  "sport-fritid": [
    { rubrik: "Träning", slugs: ["traning-gym", "hantlar-hantelset", "traningsbankar", "motionscyklar", "boxningssackar", "traningsklader"] },
    { rubrik: "Spel & bollsport", slugs: ["spel-bordsspel", "bollsport"] },
    { rubrik: "Fritid", slugs: ["friluftsliv-resa", "bil-cykel", "hobby-musik"] },
  ],
  // VEVOR-trädet 2026-10-31. Avdelningen hette Verktyg & Fordon, och bilen,
  // släpet och elbilsladdningen har flyttat till Bil & Garage.
  "verktyg-maskiner": [
    { rubrik: "Elverktyg & maskiner", slugs: ["elverktyg", "verkstadsmaskiner", "svetsning", "kompressorer-tryckluft", "hogtryckstvattar-rengoring", "verktygstillbehor"] },
    { rubrik: "Handverktyg", slugs: ["handverktyg", "verktyg-hemmafix"] },
    { rubrik: "Förvaring & lyft", slugs: ["verktygsvagnar-verktygslador", "lyft-transport", "stegar-stallningar"] },
    { rubrik: "Arbetskläder", slugs: ["arbetsklader-skydd"] },
  ],
  "bil-garage": [
    { rubrik: "Verkstad", slugs: ["domkrafter-billyftar", "verkstadsutrustning", "bilverktyg", "garageinredning"] },
    { rubrik: "Bil", slugs: ["bildelar", "biltillbehor", "takracken-lastbarare", "vinschar", "flakboxar-pickuptillbehor"] },
    { rubrik: "Släp & husbil", slugs: ["bil-slap", "husbil-husvagn"] },
    { rubrik: "Laddning & solenergi", slugs: ["elbilsladdning-solenergi"] },
  ],
  "bygg-renovering": [
    { rubrik: "VVS & el", slugs: ["vvs-vatten", "pumpar", "el-installation", "varme-ventilation-ac", "badrumsrenovering"] },
    { rubrik: "Golv, färg & dörrar", slugs: ["golv-golvverktyg", "farg-tapet", "dorrar-dorrbeslag", "beslag-jarnvaror"] },
    { rubrik: "Bygg", slugs: ["byggmaterial-byggverktyg", "trall-racken"] },
  ],
  // Företag & Proffs har fyra underkategorier och inga rubriker: de visas i
  // Wix ordning, som Skönhet & Hälsa.
};

/**
 * Underkategorierna i menyns ordning, under sina rubriker. Varje underkategori
 * kommer med exakt en gång. De som inte står i MENY_GRUPPER hamnar sist under
 * "Mer" (eller utan rubrik, om avdelningen inte har några grupper alls).
 */
export function grupperaUnderkategorier<T extends { slug: string }>(
  avdelning: string,
  subs: readonly T[],
): { rubrik: string | null; subs: T[] }[] {
  const grupper = MENY_GRUPPER[avdelning];
  if (!grupper) return subs.length ? [{ rubrik: null, subs: [...subs] }] : [];
  const bySlug = new Map(subs.map((s) => [s.slug, s]));
  const anvanda = new Set<string>();
  const ut: { rubrik: string | null; subs: T[] }[] = [];
  for (const g of grupper) {
    const i = g.slugs.map((s) => bySlug.get(s)).filter((s): s is T => !!s && !anvanda.has(s.slug));
    for (const s of i) anvanda.add(s.slug);
    if (i.length) ut.push({ rubrik: g.rubrik, subs: i });
  }
  const rest = subs.filter((s) => !anvanda.has(s.slug));
  if (rest.length) ut.push({ rubrik: "Mer", subs: rest });
  return ut;
}

// ── Säsongsavdelningar ──────────────────────────────────────────────────────
//
// Jul & Högtider står i huvudmenyn från september till januari, som Rustas
// Jul- och Halloween-avdelningar. Resten av året är sidan kvar och nås via
// sök, /butik och sina underkategorier, men den tar ingen plats i menyn.
// Månaderna räknas i svensk tid.

/** Avdelningsnamn → månader (1–12) då den står i huvudmenyn. */
export const SASONGSAVDELNINGAR: Record<string, readonly number[]> = {
  "Jul & Högtider": [9, 10, 11, 12, 1],
};

export function manadISverige(d: Date): number {
  const m = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm", month: "numeric" }).format(d);
  return Number(m);
}

/** Ska avdelningen stå i huvudmenyn just nu? Alla utom säsongsavdelningarna gör alltid det. */
export function avdelningIHuvudmenyn(namn: string, nu: Date = new Date()): boolean {
  const manader = SASONGSAVDELNINGAR[namn];
  return !manader || manader.includes(manadISverige(nu));
}
