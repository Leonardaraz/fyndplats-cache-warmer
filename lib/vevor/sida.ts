// En VEVOR-produktsida, tolkad. Ren modul: ingen IO.
//
// VARFÖR SIDAN OCH INTE ETT FLÖDE (Leonard 2026-10-28). VEVOR har inget
// B2B-flöde som Aosom. Vi får läsa de publika produktsidorna, en i taget.
// Varje sida läses på svenska och i kronor (`?lang=sv&currency=SEK`), och
// allt läses ur det sidan själv skickar: JSON-LD, sidans inbäddade
// `window.`-objekt och tabellerna i HTML:en. Ingenting hämtas från /api/*.
//
// Uppmätt 2026-10-29 på 36 slumpade adresser ur VEVOR:s produktkarta:
//
//   34 produktsidor   alla lang="sv", "LANG":"sv" och priceCurrency SEK
//    2 borttagna      riktig 404 ("404 Ej Hittad"), ingen produktdata
//    6 slutsålda      stock 0 OCH availability OutOfStock, alltid överens
//
// ☠️ EN SIDA SOM INTE KLARAR VARJE KONTROLL ÄR OKÄND, INTE SLUT. Fel språk,
// fel valuta, saknat pris, saknat lager eller två uppgifter som säger emot
// varandra ger ett tolkningsfel, och ett tolkningsfel rör aldrig lagret
// (lib/sync/leverantorsrad.ts). En sida som "nästan" gick att läsa är exakt
// den som ljuger: VEVOR kan ha bytt layout, valuta eller språk för just oss.
//
// ☠️ PRISET LÄSES UR JSON-LD:s `price` MED `priceCurrency: "SEK"`, ALDRIG UR
// `shopPrice` (sidans `PRODUCT_DATA_PRICE` är euro i base64). Leonard 2026-10-28.

/** VEVOR:s EU-sajt. Produktsidorna ligger direkt under den. */
export const VEVOR_BAS = "https://eur.vevor.com";

/** Varje sida läses på svenska och i kronor. */
export const SIDFRAGA = "?lang=sv&currency=SEK";

/** Produktadressens sista led: `…-p_<webbid>`. Webb-id:t är inte artikelnumret. */
const WEBB_ID_RE = /-p_(\d{6,20})$/;

/** Webb-id:t ur en produktadress eller sökväg, eller null. */
export function webbIdUr(sokvagEllerUrl: string): string | null {
  const sokvag = sokvagEllerUrl.replace(/^https?:\/\/[^/]+/i, "").replace(/[?#].*$/, "");
  return WEBB_ID_RE.exec(sokvag)?.[1] ?? null;
}

/** Sökvägen ur en adress på VEVOR:s EU-sajt, utan fråga. Null för andra värdar. */
export function sokvagUr(url: string): string | null {
  const m = /^https:\/\/eur\.vevor\.com(\/[^?#\s]*)/i.exec(url.trim());
  return m ? m[1] : null;
}

/** Hela adressen för en sida, med språk och valuta. */
export function sidadress(sokvag: string): string {
  return `${VEVOR_BAS}${sokvag}${SIDFRAGA}`;
}

export interface VevorKategori {
  /** VEVOR:s kategori-id (`c_<id>` i adressen). */
  id: string;
  namn: string;
}

export interface VevorBild {
  /** Originalbilden (`original_img`), utan `format=webp`. */
  url: string;
  /** Ligger bilden i produktens egen mapp? Steg 4 tar bara sådana. */
  egen: boolean;
}

export interface VevorSyskon {
  sku: string;
  webbId: string;
  kanKopas: boolean;
}

export interface Sidinnehall {
  sku: string;
  /** VEVOR:s produktfamilj, eller null. */
  spu: string | null;
  namn: string;
  /** Kronor inklusive moms, ur JSON-LD. */
  prisSek: number;
  /** VEVOR:s eget saldo. */
  saldo: number;
  /** VEVOR:s lagerflöde. "EU" för allt som mätts. */
  flode: string | null;
  /** Finns Sverige bland fraktländerna i JSON-LD? */
  levererasTillSe: boolean;
  /** Frakten till Sverige enligt JSON-LD, eller null. */
  fraktSe: { belopp: number; valuta: string } | null;
  /** Brödsmulan utan "Home", grövst först. */
  kategorier: VevorKategori[];
  /** Variantens egna värden (`PRODUCT_DATA.attr`). */
  egenskaper: Record<string, string>;
  /** Specifikationstabellen, i sidans ordning. */
  spec: [string, string][];
  /** Punktlistan "Funktioner och detaljer". */
  punkter: string[];
  /** Den långa beskrivningen som text. */
  beskrivning: string;
  bilder: VevorBild[];
  /** Sökvägen till manualsidan, eller null när sidan inte länkar någon. */
  manualSokvag: string | null;
  syskon: VevorSyskon[];
}

export type Tolkningsfel =
  | "ej_produktsida"
  | "fel_sprak"
  | "fel_valuta"
  | "saknar_sku"
  | "saknar_pris"
  | "saknar_lager"
  | "motsagelse_sku"
  | "motsagelse_lager"
  | "okand_tillganglighet";

export type Tolkning = { ok: true; sida: Sidinnehall } | { ok: false; fel: Tolkningsfel };

/** Längsta beskrivning vi sparar. Den mätta texten är 0,9–1,3 kB. */
const MAX_BESKRIVNING = 8_000;

// ── små läsare ──────────────────────────────────────────────────────────────

const NAMNGIVNA: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function avkoda(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, namn: string) => NAMNGIVNA[namn.toLowerCase()] ?? m);
}

/** HTML till en rad text: taggar bort, entiteter avkodade, blanktecken ihop. */
function rad(html: string): string {
  return avkoda(html.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .replace(/ ([.,;:!?])/g, "$1")
    .trim();
}

/** HTML till text med radbrytningar vid stycken och listpunkter. */
function text(html: string): string {
  return avkoda(
    html
      .replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, " ")
      .replace(/<\s*br\s*\/?>/gi, "\n")
      .replace(/<\/\s*(p|li|div|h[1-6]|tr|section)\s*>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t\r\f\v]+/g, " ")
    .replace(/ ?\n[ \n]*/g, "\n")
    .trim();
}

/** Indexet för den klammer som stänger den som öppnar på `start`, eller -1. */
function stangande(s: string, start: number): number {
  let djup = 0;
  let iStrang = false;
  let escape = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (iStrang) {
      if (escape) escape = false;
      else if (c === "\\") escape = true;
      else if (c === '"') iStrang = false;
      continue;
    }
    if (c === '"') iStrang = true;
    else if (c === "{" || c === "[") djup++;
    else if (c === "}" || c === "]") {
      djup--;
      if (djup === 0) return i;
    }
  }
  return -1;
}

/**
 * `window.NAMN = {…}` eller `[…]` ur sidan, tolkat som JSON, eller undefined.
 *
 * Tar bara en tilldelning av ett objekt eller en lista: sidan har också
 * `window.GLOBAL = window.GLOBAL || {}`, och den hoppas över.
 */
export function fonsterObjekt(html: string, namn: string): unknown {
  const re = new RegExp(`window\\.${namn}\\s*=\\s*([{\\[])`, "g");
  for (let m = re.exec(html); m; m = re.exec(html)) {
    const start = m.index + m[0].length - 1;
    const slut = stangande(html, start);
    if (slut < 0) continue;
    try {
      return JSON.parse(html.slice(start, slut + 1));
    } catch {
      // Inte JSON. Prova nästa tilldelning.
    }
  }
  return undefined;
}

function jsonLd(html: string): Record<string, unknown>[] {
  const ut: Record<string, unknown>[] = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    try {
      const v = JSON.parse(m[1]);
      for (const d of Array.isArray(v) ? v : [v]) if (d && typeof d === "object") ut.push(d as Record<string, unknown>);
    } catch {
      // Ett trasigt block säger ingenting om de andra.
    }
  }
  return ut;
}

function strang(v: unknown): string | null {
  if (typeof v === "string") return v.trim() || null;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

function tal(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && /^\s*-?\d+(\.\d+)?\s*$/.test(v)) return Number(v);
  return null;
}

function lista<T = unknown>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  return v === undefined || v === null ? [] : [v as T];
}

/** Bildadressen utan `format=webp`, som Wix inte ska få: originalet är jpg eller png. */
export function utanWebp(url: string): string {
  const [bas, fraga = ""] = url.split("?");
  const kvar = fraga
    .split("&")
    .filter((p) => p && !/^format=webp$/i.test(p));
  return kvar.length ? `${bas}?${kvar.join("&")}` : bas;
}

/** Mappen i en bildadress: `https://img.vevorstatic.com/us/<mapp>/…`. */
function bildmapp(url: string): string | null {
  const m = /^https?:\/\/[^/]+\/[a-z]{2}\/([^/?#]+)\//i.exec(decodeURIComponent(url));
  return m ? m[1] : null;
}

// ── tolkningen ──────────────────────────────────────────────────────────────

const PRODUKT_TYP = /(^|\/)Product$/;

function arTyp(d: Record<string, unknown>, typ: RegExp): boolean {
  return lista<unknown>(d["@type"]).some((t) => typeof t === "string" && typ.test(t));
}

function kategorierUr(ld: Record<string, unknown>[]): VevorKategori[] {
  const brod = ld.find((d) => arTyp(d, /(^|\/)BreadcrumbList$/));
  if (!brod) return [];
  const steg = lista<Record<string, unknown>>(brod.itemListElement)
    .filter((e) => e && typeof e === "object")
    .sort((a, b) => (tal(a.position) ?? 0) - (tal(b.position) ?? 0));
  const ut: VevorKategori[] = [];
  for (const e of steg) {
    const item = typeof e.item === "string" ? e.item : strang((e.item as Record<string, unknown> | undefined)?.["@id"]);
    const id = item ? /-c_(\d+)(?:[/?#]|$)/.exec(item)?.[1] : undefined;
    const namn = strang(e.name);
    if (id && namn) ut.push({ id, namn: avkoda(namn) });
  }
  return ut;
}

function fraktTillSe(offer: Record<string, unknown>): { finns: boolean; frakt: Sidinnehall["fraktSe"] } {
  for (const s of lista<Record<string, unknown>>(offer.shippingDetails)) {
    if (!s || typeof s !== "object") continue;
    const lander = lista<Record<string, unknown>>(s.shippingDestination).map((d) => strang(d?.addressCountry));
    if (!lander.includes("SE")) continue;
    const rate = s.shippingRate as Record<string, unknown> | undefined;
    const belopp = tal(rate?.value);
    const valuta = strang(rate?.currency);
    return { finns: true, frakt: belopp !== null && valuta ? { belopp, valuta } : null };
  }
  return { finns: false, frakt: null };
}

function specUr(html: string): [string, string][] {
  const i = html.indexOf("DM_at-goodsDescAttrInner");
  if (i < 0) return [];
  const slut = html.indexOf("</section>", i);
  const del = html.slice(i, slut > i ? slut : i + 50_000);
  const ut: [string, string][] = [];
  const re = /<dl[^>]*class="[^"]*goodsDesc_item[^"]*"[^>]*>\s*<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi;
  for (let m = re.exec(del); m; m = re.exec(del)) {
    const k = rad(m[1]);
    const v = rad(m[2]);
    if (k && v) ut.push([k, v]);
  }
  return ut;
}

function punkterUr(html: string): string[] {
  const m = /<ul[^>]*class="[^"]*detailGuide_cont[^"]*"[^>]*>([\s\S]*?)<\/ul>/i.exec(html);
  if (!m) return [];
  const ut: string[] = [];
  const re = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  for (let li = re.exec(m[1]); li; li = re.exec(m[1])) {
    const t = rad(li[1]);
    if (t) ut.push(t);
  }
  return ut;
}

/** Den långa beskrivningen: ett inbäddat HTML-dokument i `#js-DM_at-goodDescRich`. */
function beskrivningUr(html: string): string {
  const start = html.indexOf('id="js-DM_at-goodDescRich"');
  if (start < 0) return "";
  const borjan = html.indexOf(">", start) + 1;
  const slutHtml = html.indexOf("</html>", borjan);
  const slutDiv = html.indexOf('id="js-DM_at-goodDescMore', borjan);
  const kandidater = [slutHtml, slutDiv].filter((n) => n > borjan);
  const slut = kandidater.length ? Math.min(...kandidater) : borjan + 60_000;
  return text(html.slice(borjan, slut)).slice(0, MAX_BESKRIVNING);
}

function manualUr(html: string): string | null {
  const m = /href="(?:https:\/\/eur\.vevor\.com)?(\/pages\/contact-us\/[^"?#\s]+)"/i.exec(html);
  return m ? m[1] : null;
}

function bilderUr(agg: unknown, sku: string): VevorBild[] {
  const ut: VevorBild[] = [];
  const sedda = new Set<string>();
  for (const e of lista<Record<string, unknown>>(agg)) {
    if (!e || typeof e !== "object" || e.type !== "img") continue;
    const kalla = strang(e.origin) ?? strang(e.bigSrc) ?? strang(e.src);
    if (!kalla || !/^https:\/\//i.test(kalla)) continue;
    const url = utanWebp(kalla);
    if (sedda.has(url)) continue;
    sedda.add(url);
    ut.push({ url, egen: bildmapp(url) === sku });
  }
  return ut;
}

function syskonUr(lankar: unknown, sku: string): VevorSyskon[] {
  const ut: VevorSyskon[] = [];
  for (const e of lista<Record<string, unknown>>(lankar)) {
    if (!e || typeof e !== "object") continue;
    const s = strang(e.goodSn);
    const w = strang(e.webGoodSn) ?? (typeof e.url === "string" ? webbIdUr(e.url) : null);
    if (!s || !w || s === sku) continue;
    ut.push({ sku: s, webbId: w, kanKopas: Number(e.canBuy) === 1 });
  }
  return ut;
}

function egenskaperUr(attr: unknown): Record<string, string> {
  const ut: Record<string, string> = {};
  if (!attr || typeof attr !== "object" || Array.isArray(attr)) return ut;
  for (const [k, v] of Object.entries(attr as Record<string, unknown>)) {
    const nyckel = k.trim();
    const varde = strang(v);
    if (nyckel && varde) ut[nyckel] = varde;
  }
  return ut;
}

/** Artikelnumrets form på VEVOR: bokstäver och siffror, 10–40 tecken. */
const SKU_RE = /^[A-Za-z0-9]{10,40}$/;

/**
 * Tolkar en produktsida. Svarar `ok: false` med skälet så fort en kontroll
 * fäller — se filens huvud för varför en halv tolkning inte finns.
 */
export function tolkaProduktsida(html: string): Tolkning {
  const produktdata = fonsterObjekt(html, "PRODUCT_DATA");
  const ld = jsonLd(html);
  const produkt = ld.find((d) => arTyp(d, PRODUKT_TYP));
  if (!produktdata || typeof produktdata !== "object" || Array.isArray(produktdata) || !produkt) {
    return { ok: false, fel: "ej_produktsida" };
  }
  const pd = produktdata as Record<string, unknown>;

  // Språket: både dokumentets lang och sajtens egen inställning.
  const htmlLang = /<html[^>]*\blang="([^"]+)"/i.exec(html)?.[1];
  const langar = [...html.matchAll(/"LANG"\s*:\s*"([^"]*)"/g)].map((m) => m[1]);
  if (htmlLang !== "sv" || langar.length === 0 || langar.some((l) => l !== "sv")) {
    return { ok: false, fel: "fel_sprak" };
  }

  const offer = lista<Record<string, unknown>>(produkt.offers).find((o) => o && typeof o === "object");
  if (!offer || strang(offer.priceCurrency) !== "SEK") return { ok: false, fel: "fel_valuta" };

  const sku = strang(pd.goodsSn);
  const ldSku = strang(produkt.sku);
  if (!sku || !SKU_RE.test(sku)) return { ok: false, fel: "saknar_sku" };
  if (ldSku !== sku) return { ok: false, fel: "motsagelse_sku" };

  const pris = tal(offer.price);
  if (pris === null || pris <= 0) return { ok: false, fel: "saknar_pris" };

  const saldo = tal(pd.stock);
  if (saldo === null || saldo < 0 || !Number.isInteger(saldo)) return { ok: false, fel: "saknar_lager" };

  const tillganglighet = strang(offer.availability) ?? "";
  let iLager: boolean;
  if (/InStock$/.test(tillganglighet)) iLager = true;
  else if (/OutOfStock$/.test(tillganglighet)) iLager = false;
  else return { ok: false, fel: "okand_tillganglighet" };
  if (iLager !== saldo > 0) return { ok: false, fel: "motsagelse_lager" };

  const namn = strang(produkt.name) ?? strang(pd.title);
  if (!namn) return { ok: false, fel: "ej_produktsida" };

  const se = fraktTillSe(offer);
  return {
    ok: true,
    sida: {
      sku,
      spu: strang(pd.goodsSpu),
      namn: avkoda(namn),
      prisSek: pris,
      saldo,
      flode: strang(pd.pipelineCode),
      levererasTillSe: se.finns,
      fraktSe: se.frakt,
      kategorier: kategorierUr(ld),
      egenskaper: egenskaperUr(pd.attr),
      spec: specUr(html),
      punkter: punkterUr(html),
      beskrivning: beskrivningUr(html),
      bilder: bilderUr(fonsterObjekt(html, "AGGIMAGEANDVIDEOLIST"), sku),
      manualSokvag: manualUr(html),
      syskon: syskonUr(fonsterObjekt(html, "DETAIL_ATTR_LINK"), sku),
    },
  };
}
