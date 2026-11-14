// lib/favoriter.ts
//
// Kundens favoriter: listan i webbläsaren, ändringarna mot medlemskontot och
// det som lådan och Mina sidor visar.
//
// Listan är produktadresser (slug), äldst först, i `fp_wishlist`: samma nyckel
// och samma form som före 2026-11-14, så att ingen tappar sina favoriter.
// Utloggad är listan webbläsarens egen. Inloggad är kontots lista den som
// gäller (FyndplatsMedlemmar, fältet `favoriter`), och webbläsaren håller en
// kopia:
//
//   - Första gången en enhet är inloggad läggs enhetens lista till kontots.
//   - Varje tryck på ett hjärta ändrar kopian direkt och ställs i en kö, som
//     skickas till kontot. Går nätet ner står kön kvar till nästa sida.
//   - Kontots svar ersätter kopian, med det som hänt under tiden ovanpå.
//   - Den som loggar ut tar kontots lista med sig: den lämnar enheten (en
//     delad dator ska inte visa någon annans favoriter) och står kvar på
//     kontot. Går inloggningen bara ut av sig själv står listan kvar i
//     webbläsaren som en vanlig lista, och läggs till kontots igen vid nästa
//     inloggning, så att ingen tappar sina favoriter för att tiden gick.
//
// Ren modul utan importer: node --test laddar den direkt, och den går till
// webbläsaren med sidhuvudets hjärta, så den ska vara liten.

export const FAVORIT_NYCKLAR = {
  /** Listan: JSON med produktadresser, äldst först. */
  lista: "fp_wishlist",
  /** Det sparade kortet per favorit (namn, bild, pris), så att lådan har något att visa direkt. */
  info: "fp_wishlist_info",
  /** "1": listan är kontots kopia. "ut": kunden loggade ut, och kontots lista lämnade enheten. */
  konto: "fp_wishlist_konto",
  /** Ändringar som inte nått kontot än. */
  ko: "fp_wishlist_ko",
  /** När kontot senast svarade, i millisekunder. */
  synkad: "fp_wishlist_synkad",
} as const;

export const MAX_FAVORITER = 100;
export const MAX_KO = 200;
/** En sida som bara laddas frågar kontot högst så här ofta. */
export const SYNK_MAX_ALDER_MS = 5 * 60_000;
/** Lådan och Mina sidor vill ha ett färskare svar. */
export const SYNK_LADA_MS = 30_000;

// Samma form som kontaktformulärets produktadress (giltigSlug i
// lib/kontakt/kontakt.ts; provet håller ihop dem).
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,159}$/;

export function giltigFavorit(s: unknown): s is string {
  return typeof s === "string" && SLUG_RE.test(s);
}

function somLista(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  if (typeof v !== "string" || !v) return [];
  try {
    const p: unknown = JSON.parse(v);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

const unika = (rader: string[]): string[] => [...new Set(rader)];
/** Listan rymmer MAX_FAVORITER: de nyaste står kvar. */
const kapad = (rader: string[]): string[] => (rader.length > MAX_FAVORITER ? rader.slice(rader.length - MAX_FAVORITER) : rader);

/** Listan ur webbläsarens minne eller ur kontots rad. Skräp ger en tom lista, aldrig ett kast. */
export function lasLista(v: unknown): string[] {
  return kapad(unika(somLista(v).filter(giltigFavorit)));
}

export type Andring = { lagg: string[]; taBort: string[] };

/** Borttagningarna först, sedan tilläggen sist. Det som redan finns behåller sin plats. */
export function tillampa(lista: readonly string[], a: Andring): string[] {
  const bort = new Set(a.taBort);
  const ut = lista.filter((s) => !bort.has(s));
  for (const s of a.lagg) if (!ut.includes(s)) ut.push(s);
  return kapad(ut);
}

/** Trycket på hjärtat: av blir på, på blir av. */
export function vaxla(lista: readonly string[], slug: string): string[] {
  if (!giltigFavorit(slug)) return [...lista];
  return lista.includes(slug) ? tillampa(lista, { lagg: [], taBort: [slug] }) : tillampa(lista, { lagg: [slug], taBort: [] });
}

// ── Rutternas indata ──────────────────────────────────────────────────────

function sluglista(v: unknown): string[] | null {
  if (v === undefined) return [];
  if (!Array.isArray(v) || !v.every(giltigFavorit)) return null;
  const rader = unika(v);
  return rader.length > MAX_FAVORITER ? null : rader;
}

/** Kroppen till POST /api/konto/favoriter. Fel form nekas helt, så att en halv ändring aldrig sparas. */
export function lasAndring(v: unknown): Andring | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const k = v as { lagg?: unknown; taBort?: unknown };
  const lagg = sluglista(k.lagg);
  const taBort = sluglista(k.taBort);
  return lagg && taBort ? { lagg, taBort } : null;
}

/** Frågan `?s=a,b,c` till GET /api/favoriter. Null när ingen giltig adress står där. */
export function lasSluggar(param: string | null | undefined): string[] | null {
  if (!param) return null;
  const rader = unika(param.split(",").filter(giltigFavorit)).slice(0, MAX_FAVORITER);
  return rader.length ? rader : null;
}

/** Adressen till uppslaget. Sorterad, så att samma lista delar svar i CDN:et oavsett ordning. */
export function favoritFraga(sluggar: readonly string[]): string {
  return `/api/favoriter?s=${[...sluggar].sort().join(",")}`;
}

// ── Kön med ändringar som inte nått kontot ───────────────────────────────

/** `l`: lagd till. `b`: borttagen. */
export type Koad = { t: "l" | "b"; s: string };

export function lasKo(v: unknown): Koad[] {
  const rader = somLista(v).filter(
    (r): r is Koad => !!r && typeof r === "object" && ((r as Koad).t === "l" || (r as Koad).t === "b") && giltigFavorit((r as Koad).s),
  );
  return (rader.length > MAX_KO ? rader.slice(rader.length - MAX_KO) : rader).map((r) => ({ t: r.t, s: r.s }));
}

/** Kön som en ändring: det sista trycket per vara gäller. */
export function koSomAndring(ko: readonly Koad[]): Andring {
  const sist = new Map<string, Koad["t"]>();
  for (const r of ko) {
    sist.delete(r.s);
    sist.set(r.s, r.t);
  }
  const a: Andring = { lagg: [], taBort: [] };
  for (const [s, t] of sist) (t === "l" ? a.lagg : a.taBort).push(s);
  return a;
}

export type Markor = "1" | "ut" | null;

export function lasMarkor(v: unknown): Markor {
  return v === "1" || v === "ut" ? v : null;
}

// ── Synkplanen ────────────────────────────────────────────────────────────

export type Synklage = {
  /** Tecknet `fp_medlem_inne` finns: besökaren är inloggad. */
  inne: boolean;
  markor: Markor;
  lokal: readonly string[];
  ko: readonly Koad[];
  /** När kontot senast svarade (0: aldrig). */
  senastMs: number;
  nuMs: number;
  maxAlderMs: number;
};

export type Synkplan =
  /** Utloggad: listan är webbläsarens egen. */
  | { typ: "lokal" }
  /**
   * Inte längre inloggad, utan att ha loggat ut (inloggningen gick ut): listan
   * står kvar i webbläsaren som en vanlig lista, och kön töms.
   */
  | { typ: "slapp" }
  /** Skicka ändringen. `sanda`: så många köade ändringar som anropet täcker. */
  | { typ: "skicka"; andring: Andring; sanda: number }
  /** Läs kontots lista. */
  | { typ: "hamta" }
  /** Inloggad och nyss i takt: ingenting att göra. */
  | { typ: "vanta" };

export function synkplan(l: Synklage): Synkplan {
  if (!l.inne) return l.markor === "1" ? { typ: "slapp" } : { typ: "lokal" };
  const koad = koSomAndring(l.ko);
  if (l.markor !== "1") {
    // Enhetens lista läggs till kontots. Ett hjärta som släckts före
    // sändningen skickas med, så att kundens senaste tryck gäller.
    return { typ: "skicka", andring: { lagg: [...l.lokal], taBort: koad.taBort.filter((s) => !l.lokal.includes(s)) }, sanda: l.ko.length };
  }
  if (l.ko.length) return { typ: "skicka", andring: koad, sanda: l.ko.length };
  const alder = l.nuMs - l.senastMs;
  // En klocka som gått bakåt (negativ ålder) räknas som gammal.
  return alder < 0 || alder > l.maxAlderMs ? { typ: "hamta" } : { typ: "vanta" };
}

/**
 * Kunden loggar ut. En lista som är kontots kopia lämnar enheten och står
 * kvar på kontot; det som lagts till men aldrig nått kontot är kundens eget
 * och står kvar. En lista som aldrig stämts av mot kontot rörs inte.
 */
export function vidUtloggning(l: Pick<Synklage, "markor" | "lokal" | "ko">): { lista: string[]; markor: Markor } {
  if (l.markor !== "1") return { lista: [...l.lokal], markor: l.markor };
  return { lista: koSomAndring(l.ko).lagg.filter((s) => l.lokal.includes(s)), markor: "ut" };
}

/** Sökvägen som loggar ut (formulären på /konto). Hjärtats lyssnare känner igen den. */
export const UTLOGGNING = "/api/konto/ut";

/** Kön utan de ändringar som anropet bar: den första likadana per skickad ändring. */
export function utanSkickade(ko: readonly Koad[], skickade: readonly Koad[]): Koad[] {
  const kvar = [...ko];
  for (const r of skickade) {
    const n = kvar.findIndex((k) => k.t === r.t && k.s === r.s);
    if (n >= 0) kvar.splice(n, 1);
  }
  return kvar;
}

/**
 * Kontot har svarat. Dess lista gäller, med det som kunden hunnit trycka på
 * medan svaret var på väg ovanpå: de ändringarna står kvar i kön. `skickade`
 * är ändringarna som anropet bar (kön som den såg ut när anropet gick).
 */
export function efterSvar(kontots: unknown, ko: readonly Koad[], skickade: readonly Koad[]): { lista: string[]; ko: Koad[] } {
  const kvar = utanSkickade(ko, skickade);
  return { lista: tillampa(lasLista(kontots), koSomAndring(kvar)), ko: kvar };
}

// ── Kontots lista ────────────────────────────────────────────────────────

/** Kontots lista och dess version ur medlemsraden (fälten `favoriter` och `favoriterVersion`). */
export function favoriterUrRad(rad: { favoriter?: unknown; favoriterVersion?: unknown }): { lista: string[]; version: number } {
  const v = rad.favoriterVersion;
  return { lista: lasLista(rad.favoriter), version: typeof v === "number" && Number.isInteger(v) && v > 0 ? v : 0 };
}

/**
 * Lagret bakom kontots lista (lib/medlem/lager.ts fyller i det mot Wix).
 * `skriv` är villkorad på versionen: av två samtidiga skrivningar går bara
 * den ena igenom, och den andra läser om och försöker igen. Utan villkoret
 * tappas ett hjärta när kunden trycker på telefonen och datorn samtidigt.
 */
export type Favoritlager = {
  /** Null: kontot finns inte (eller är spärrat). */
  las: () => Promise<{ lista: string[]; version: number } | null>;
  /** "skriven", "upptagen" (versionen stämde inte längre) eller "saknas" (raden finns inte). */
  skriv: (lista: string[], foreVersion: number) => Promise<"skriven" | "upptagen" | "saknas">;
};

export const FAVORIT_FORSOK = 4;

/** Ändrar kontots lista och svarar med den. Null: kontot finns inte. Kastar om listan är upptagen FAVORIT_FORSOK gånger i rad. */
export async function andraILager(lager: Favoritlager, a: Andring): Promise<string[] | null> {
  for (let i = 0; i < FAVORIT_FORSOK; i++) {
    const fore = await lager.las();
    if (!fore) return null;
    const efter = tillampa(fore.lista, a);
    // Ingenting att ändra: ingen skrivning, och svaret är listan som den står.
    if (efter.length === fore.lista.length && efter.every((s, n) => s === fore.lista[n])) return efter;
    const utfall = await lager.skriv(efter, fore.version);
    if (utfall === "skriven") return efter;
    if (utfall === "saknas") return null;
  }
  throw new Error("favoriterna ändrades samtidigt flera gånger i rad");
}

// ── Det lådan visar ───────────────────────────────────────────────────────

/** En favorit som butiken känner den just nu (GET /api/favoriter). */
export type FavoritProdukt = {
  slug: string;
  /** Wix produkt-id, till varukorgen. */
  id: string;
  namn: string;
  /** Liten kvadratisk bild. */
  bild: string;
  /** "1 149 kr" eller "Från 899 kr". */
  pris: string;
  prisNum: number;
  /** Det tidigare priset när varan är nedsatt. */
  tidigare?: string;
  iLager: boolean;
  /** Antal kvar när det är fem eller färre. */
  faKvar?: number;
  /** Varan har val (färg, storlek): den väljs på produktsidan. */
  val: boolean;
};

export type Favoritsvar = { produkter: Record<string, FavoritProdukt>; saknas: string[] };

/** Det uppslaget läser ur en produkt; fälten heter som i Product (lib/products.ts). */
export type FavoritKalla = {
  id: string;
  slug: string;
  name: string;
  img: string;
  inStock: boolean;
  stockQuantity?: number;
  onSale?: boolean;
  originalPriceNum?: number;
  priceNum: number;
  priceFromNum?: number;
  hasRange?: boolean;
};

/** Butikens egna formateringar, så att modulen står utan importer (lib/favoriter-produkter.ts fyller i dem). */
export type FavoritFormat<K extends FavoritKalla = FavoritKalla> = {
  /** "1 149 kr" eller "Från 899 kr", som på produktkortet. */
  listPris: (p: K) => string;
  pris: (n: number) => string;
  /** Den lilla kvadratiska bilden ur produktens bildadress. */
  bild: (url: string) => string;
};

/**
 * Den lilla bildens kant i pixlar. Raden visar bilden i 68–84 px, och en
 * skärm med dubbel eller tredubbel täthet får en skarp bild. Uppslaget och
 * produktsidans hjärta bygger adressen med samma mått, så att det sparade
 * kortet och butikens svar pekar på samma bild.
 */
export const FAVORITBILD_KANT = 240;

/** Så få kvar räknas som "få kvar", samma gräns som produktkortets märke. */
export const FA_KVAR = 5;

/** Produkten som lådan visar den. `harVal`: varan har färg, storlek eller annat som väljs på produktsidan. */
export function somFavoritProdukt<K extends FavoritKalla>(p: K, harVal: boolean, f: FavoritFormat<K>): FavoritProdukt {
  const kvar = p.stockQuantity;
  return {
    slug: p.slug,
    id: p.id,
    namn: p.name,
    bild: p.img ? f.bild(p.img) : "",
    pris: f.listPris(p),
    prisNum: (p.hasRange && p.priceFromNum) || p.priceNum || 0,
    ...(p.onSale && p.originalPriceNum ? { tidigare: f.pris(p.originalPriceNum) } : {}),
    iLager: p.inStock,
    ...(p.inStock && typeof kvar === "number" && kvar > 0 && kvar <= FA_KVAR ? { faKvar: kvar } : {}),
    val: harVal,
  };
}

/** Svaret till lådan: en produkt per adress som finns, och de adresser som inte längre har någon synlig produkt. */
export function favoritsvar(fragade: readonly string[], produkter: readonly FavoritProdukt[]): Favoritsvar {
  const karta: Record<string, FavoritProdukt> = {};
  for (const p of produkter) if (fragade.includes(p.slug)) karta[p.slug] = p;
  return { produkter: karta, saknas: fragade.filter((s) => !karta[s]) };
}

/** Det sparade kortet: namn, bild och pristext som de såg ut när hjärtat trycktes eller senast hämtades. */
export type Favoritinfo = { n: string; b?: string; p?: string };

const NAMN_MAX = 160;
const BILD_MAX = 600;
const PRIS_MAX = 40;

function renInfo(v: unknown): Favoritinfo | null {
  if (!v || typeof v !== "object") return null;
  const k = v as { n?: unknown; b?: unknown; p?: unknown };
  const n = typeof k.n === "string" ? k.n.trim().slice(0, NAMN_MAX) : "";
  if (!n) return null;
  const ut: Favoritinfo = { n };
  if (typeof k.b === "string" && k.b.startsWith("https://") && k.b.length <= BILD_MAX) ut.b = k.b;
  if (typeof k.p === "string" && k.p.trim()) ut.p = k.p.trim().slice(0, PRIS_MAX);
  return ut;
}

export function lasInfo(v: unknown): Record<string, Favoritinfo> {
  let p: unknown = v;
  if (typeof v === "string") {
    try {
      p = JSON.parse(v);
    } catch {
      return {};
    }
  }
  if (!p || typeof p !== "object" || Array.isArray(p)) return {};
  const ut: Record<string, Favoritinfo> = {};
  for (const [slug, kort] of Object.entries(p)) {
    const ren = giltigFavorit(slug) ? renInfo(kort) : null;
    if (ren) ut[slug] = ren;
  }
  return ut;
}

/** Kartan med ett kort till. Ett kort utan namn eller med en ogiltig adress sparas inte. */
export function medInfo(info: Readonly<Record<string, Favoritinfo>>, slug: string, kort: { n?: string; b?: string; p?: string }): Record<string, Favoritinfo> {
  const ren = giltigFavorit(slug) ? renInfo(kort) : null;
  return ren ? { ...info, [slug]: ren } : { ...info };
}

/** Bara favoriternas kort sparas. */
export function gallraInfo(info: Readonly<Record<string, Favoritinfo>>, lista: readonly string[]): Record<string, Favoritinfo> {
  const ut: Record<string, Favoritinfo> = {};
  for (const s of lista) if (info[s]) ut[s] = info[s];
  return ut;
}

/** Adressen som läsbar text, tills namnet är hämtat: "julgran-180-cm" blir "Julgran 180 cm". */
export function namnUrSlug(slug: string): string {
  const text = slug.replace(/-/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export type Favoritrad = {
  slug: string;
  /**
   * laddar: svaret är på väg, det sparade kortet visas så länge.
   * klar:   butikens svar.
   * borta:  varan finns inte längre i sortimentet.
   * okand:  uppslaget gick inte just nu; det sparade kortet visas som det är.
   */
  lage: "laddar" | "klar" | "borta" | "okand";
  namn: string;
  /** Namnet är bara adressen i läsbar form: varken butiken eller det sparade kortet har ett. */
  gissat?: true;
  pris?: string;
  bild?: string;
  sokvag: string;
  produkt?: FavoritProdukt;
};

/** Lådans rader, nyast först. `svar`: null innan uppslaget svarat, "fel" när det inte gick. */
export function favoritrader(
  lista: readonly string[],
  info: Readonly<Record<string, Favoritinfo>>,
  svar: Favoritsvar | "fel" | null,
): Favoritrad[] {
  return [...lista].reverse().map((slug) => {
    const sokvag = `/produkt/${slug}`;
    const kort = info[slug];
    const produkt = svar && svar !== "fel" ? svar.produkter[slug] : undefined;
    if (produkt) return { slug, lage: "klar", namn: produkt.namn, pris: produkt.pris, ...(produkt.bild ? { bild: produkt.bild } : {}), sokvag, produkt };
    const namn = kort ? { namn: kort.n } : { namn: namnUrSlug(slug), gissat: true as const };
    if (svar && svar !== "fel" && svar.saknas.includes(slug)) return { slug, lage: "borta", ...namn, ...(kort?.b ? { bild: kort.b } : {}), sokvag };
    return { slug, lage: svar === "fel" ? "okand" : "laddar", ...namn, ...(kort?.p ? { pris: kort.p } : {}), ...(kort?.b ? { bild: kort.b } : {}), sokvag };
  });
}

/** Radens knapp: köp direkt, välj på produktsidan, eller bevaka en slutsåld vara där. */
export function handling(p: Pick<FavoritProdukt, "id" | "iLager" | "val">): "kop" | "valj" | "bevaka" {
  if (!p.iLager) return "bevaka";
  return p.val || !p.id ? "valj" : "kop";
}
