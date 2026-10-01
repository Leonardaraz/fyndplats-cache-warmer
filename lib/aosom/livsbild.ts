// Leverantörens miljöbild som ANDRA bild på varje publicerad Aosom-sida.
//
// VARFÖR DEN FINNS (2026-10-01)
//
// Leonard: bilden på feedens position 2 är (nästan) alltid ett rent miljöfoto,
// och den ska vara sidans andra bild. Mätningen 2026-08-27 sa 30 av 30 rena
// (CLAUDE.md, "Bilderna: bara position 1, 2, 3, 8 och 9"). Importen hämtar den,
// men poleringen kan ha strukit eller flyttat den, en reparation kan ha tappat
// den och en sammanslagning lämnade den hos givaren. På en sammanslagen sida
// ska VARJE färg ha sin egen artikels miljöbild som andra bild i det som
// butiken visar för färgen.
//
// FYRA LÄGEN
//
//   rapport     Läser de synliga produkterna sida för sida och bedömer varje
//               sida, eller varje färg på en sammanslagen sida. Skriver ingenting.
//   kandidater  Laddar upp position 2 till Media Manager för granskning, utan
//               att röra produkten. Torrkörning som standard.
//   plan        Räknar fram vad en skrivning gör: FLYTTA en bild som redan sitter
//               på sidan, eller INFOGA en godkänd kandidat. Ger planens sha.
//   skriv       Skriver planen. Kräver sha:n.
//
// STATUSARNA
//
//   har_som_tva          klart
//   har_annan_plats      bilden finns men står inte som två — `flytta`
//   ar_huvudbild         bilden ÄR huvudbilden (sidans eller färgens). Lämnas.
//   i_galleriet_olankad  sammanslagen sida: bilden ligger i galleriet men är
//                        inte länkad till färgen — `flytta` länkar den
//   saknas               ingen galleribild är den, och varje bild är spårad
//   okand                ingen spårad bild är den, men någon bild gick inte
//                        att spåra
//
// ☠️ "SAKNAS" BETYDER ATT VI ÄR SÄKRA. En bild som inte går att spåra kan vara
// miljöbilden. Då blir svaret `okand`, och en människa tittar innan något
// infogas: miljöbilden två gånger på en kundsida är värre än en orörd sida.
//
// HUR EN BILD SPÅRAS TILL SIN KÄLLA
//
// Wix minns inte varifrån en galleribild kom, men två saker gör det:
// mappningens `aosomBildFiler` (sparad av bildreparationen och av det här
// verktyget) och Wix egen `sourceUrl` (`getMediaSourceUrls`, ett hopp genom
// Wix egna kopior). Mappningen läses först; resten frågas Wix om i klump
// över hela sidan. Samma väg som lib/aosom/image-repair.ts.
//
// FÄRGENS ANDRA BILD — SOM BUTIKEN RÄKNAR (headless-site, lib/variant-bilder.ts)
//
// Butiken visar för en färg galleriet i Wix ordning, filtrerat till färgens
// egna bilder och de gemensamma, med valets första länkade bild först
// (`synligaBilder`). Vem som äger en olänkad bild avgör `olankadeAgare`, som
// färgbildsverktyget redan kopierat ordagrant (./fargbilder.ts). "Andra bild"
// är alltså plats 1 i den vyn. Färgens bild läggs därför i GALLERIET precis
// före den första bild vyn visar efter valets egen, och länkas som valets
// andra (`linkedMedia[1]`). Valets första länkade bild rörs aldrig.
//
// SEX SAKER SOM INTE SKA TAS BORT
//
// 1. ☠️ SVARET ÄR PUBLIKT (Actions-loggen). Det bär bara Wix produkt-id,
//    val-id, Wix egna fil-id och wixstatic-adresser, räknare och hinderkoder:
//    aldrig artikelnummer, feedens adresser, filernas källadresser eller
//    Aosoms produktadress. Felmeddelanden från media- och importanropen följer
//    aldrig med, för de bär källadressen.
// 2. ☠️ GALLERIET SKRIVS VID ID, ALDRIG VID ADRESS. En wixstatic-adress får Wix
//    att importera om bilden till en NY fil (lib/wix/client.ts, image-repair).
// 3. ☠️ HUVUDBILDEN (galleriets första) RÖRS ALDRIG, och ingen bild faller ur
//    galleriet. En flytt ändrar aldrig antalet; en infogning stannar vid Wix
//    tak på 15.
// 4. ☠️ STEGVIS SOM FÄRGBILDERNA (./fargbilder-kor.ts): galleriet ENSAMT
//    (fieldMask media), sedan länkarna med options + variantsInfo ordagrant ur
//    GET:en och `visible` (en variantsInfo-PATCH publicerar annars ett utkast),
//    omförsök bara vid 404 PRODUCT_MEDIA_NOT_EXIST/409, och återläsning av
//    galleri, alt-texter, länkar, synlighet och varianter. Körningen stannar
//    vid första sida som inte läser tillbaka.
// 5. ☠️ SKRIVNINGEN KRÄVER PLANENS SHA. Planen räknas om ur färska läsningar i
//    samma anrop, och sha:n täcker paren och det som skrivs. Har något ändrats
//    sedan en människa läste planen skrivs ingenting.
// 6. ☠️ TAKET KASTAR ELLER SÄGS, DET KAPAR ALDRIG TYST. Rapporten stannar på
//    tid eller sidtak med `nasta` i svaret, och en fråga utan produktlista
//    kastar i stället för att se ut som en tom katalog.
//
// ⚠️ Kandidaterna som ingen godkänner tas av nattens bildstädning
// (`/api/cron/aosom-media-cleanup`, 03:50 UTC). Det är meningen. En godkänd
// kandidat måste alltså skrivas före dess.

import { createHash } from "node:crypto";
import type { ProductMappingRecord } from "../store";
import type { AosomRow } from "./feed";
import type { WixAnrop } from "../polish/skrivplan";
import { felText } from "../polish/skrivplan";
import { isAosomMapping } from "../store/supplier";
import { aosomArtikelbild, type AosomVariantArtikel } from "./artiklar";
import { kandidatNamn } from "./bildkandidater";
import {
  GALLERI_AVVIKELSE,
  LANK_AVVIKELSE,
  altFor as fargAlt,
  kontrolleraEfter,
  lasGodkanda,
  olankadeAgare,
  type Bild,
  type SidOption,
  type SidPlan,
} from "./fargbilder";
import {
  GALLERI_OMLASNINGAR,
  KOPPLING_FORSOK,
  KOPPLING_PAUS_MS,
  arOvergaende,
  lasProdukt,
  optionerMedLankar,
  sammaUtgangslage,
  tolkaProdukt,
  type ProduktLast,
} from "./fargbilder-kor";

// ── konstanter ──────────────────────────────────────────────────────────────

/** Wix tak: en produkt tar högst femton bilder. */
export const MAX_BILDER = 15;
/** Åtgärder per plan/skrivning. */
export const MAX_PAR = 25;
/** Mål per kandidatkörning. */
export const MAX_KANDIDATER = 50;
/** Produkter per sida i Wix sökning (API:ets tak). */
export const SIDSTORLEK = 100;
/** `get-files` per anrop. Samma tak som `getFileStates` i lib/wix/media-audit.ts. */
export const KALLOR_PER_ANROP = 50;
/** Prövas före varje sida, aldrig mitt i en. Ruttens tak är 300 s. */
export const RAPPORT_TIDSBUDGET_MS = 200_000;
/** Prövas före varje produkt i `skriv`. */
export const SKRIV_TIDSBUDGET_MS = 200_000;
/** Prövas före varje mål i `kandidater`, som i bildkandidater.ts. */
export const KANDIDAT_TIDSBUDGET_MS = 150_000;
/** Sidor per körning. Nås taket står det i svaret, med `nasta`. */
export const MAX_SIDOR_PER_KORNING = 80;
/** Pauserna för en sökning som svarar 429/5xx. En POST försöks annars aldrig om. */
const SOK_PAUSER_MS = [0, 1_000, 3_000, 8_000];
const WIXSTATIC = "https://static.wixstatic.com/";

// ── typer ───────────────────────────────────────────────────────────────────

export type Status =
  | "har_som_tva"
  | "har_annan_plats"
  | "ar_huvudbild"
  | "i_galleriet_olankad"
  | "saknas"
  | "okand";

/** Skäl att en sida eller en färg inte går att bedöma. */
export type Hinder =
  | "ingen_mappning"
  | "inte_aosom"
  | "tvetydig"
  | "utan_artikel"
  | "saknas_i_feeden"
  | "feed_utan_bild_2"
  | "val_utan_artikel"
  | "val_utan_bild";

/** Skäl att en åtgärd inte skrivs. */
export type SkrivHinder =
  | Hinder
  | "ogiltigt_fil_id"
  | "saknas_i_wix"
  | "inte_publicerad"
  | "finns_redan"
  | "fullt"
  | "tomt_galleri"
  | "annan_kalla"
  | "inte_sammanslagen"
  | "val_kravs"
  | "val_finns_inte"
  | "lankad_till_annat_val"
  | "saknas_pa_sidan"
  | "ar_huvudbild"
  | "redan_tva"
  | "huvudbilden_i_vagen"
  | "plan_ogiltig";

export const STATUSAR: readonly Status[] = [
  "har_som_tva", "har_annan_plats", "ar_huvudbild", "i_galleriet_olankad", "saknas", "okand",
];
export const HINDER: readonly Hinder[] = [
  "ingen_mappning", "inte_aosom", "tvetydig", "utan_artikel", "saknas_i_feeden", "feed_utan_bild_2",
  "val_utan_artikel", "val_utan_bild",
];
/** Statusarna vars nycklar listas i rapporten. `har_som_tva` är normalfallet. */
export const LISTADE: readonly Exclude<Status, "har_som_tva">[] = [
  "har_annan_plats", "ar_huvudbild", "i_galleriet_olankad", "saknas", "okand",
];

export type Raknare = Record<Status | Hinder, number>;

/** En bedömd rad: en sida, eller en färg på en sammanslagen sida. */
export interface Rad {
  id: string;
  /** Färgvalets id, bara på en sammanslagen sida. */
  val?: string;
  status?: Status;
  hinder?: Hinder;
}

/** Radens nyckel i svaret och i `par`: `wix-id` eller `wix-id:val-id`. */
export const nyckel = (r: { id: string; val?: string }) => (r.val ? `${r.id}:${r.val}` : r.id);

export interface Rapport {
  lage: "rapport";
  /** Synliga produkter som lästs i den här körningen. */
  granskade: number;
  /** Bedömda rader: en per enkel sida, en per färg på en sammanslagen. */
  rader: number;
  sidor: number;
  raknare: Raknare;
  /** Nycklar per status (`wix-id` eller `wix-id:val-id`). */
  ids: Record<Exclude<Status, "har_som_tva">, string[]>;
  /** Galleribilder vars källa varken mappningen eller Wix kunde säga. */
  oharleddaBilder: number;
  /** Markören till nästa körning, eller null när katalogen är genomläst. */
  nasta: string | null;
  stoppadAv: "klart" | "tidsbudget" | "sidtak";
}

export interface LivsbildDeps {
  wix: WixAnrop;
  /** Hela mappningstabellen. Läses en gång per rapportkörning. */
  mappningar(): Promise<ProductMappingRecord[]>;
  hamtaMappning(wixProductId: string): Promise<ProductMappingRecord | null>;
  sparaMappning(rad: ProductMappingRecord): Promise<void>;
  hamtaFeed(): Promise<AosomRow[]>;
  /** Fil-id → källadress (`getMediaSourceUrls`). Saknade id = okänd källa. */
  hamtaKallor(fileIds: string[]): Promise<Map<string, string>>;
  /** Laddar upp en bild till Media Manager (`importMediaByUrl`). */
  laddaUpp(url: string, namn: string): Promise<{ id: string; url: string }>;
  vanta?(ms: number): Promise<void>;
  nu?(): number;
}

// ── små rena hjälpare ───────────────────────────────────────────────────────

const lika = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
const sammaLista = (a: readonly string[], b: readonly string[]) => a.join("|") === b.join("|");

/**
 * En källadress i jämförbar form: värd och sökväg, utan protokoll, query och
 * fragment. Bildreparationen jämför adresserna ordagrant, och det räcker där
 * eftersom både `aosomBildFiler` och `sourceUrl` bär feedens egen sträng. Här
 * hade en skillnad i protokoll eller en cache-parameter räknat en bild som
 * finns som saknad. Två olika bilder delar aldrig sökväg på Aosoms CDN.
 */
export function normKalla(url: string): string {
  const s = (url ?? "").trim();
  try {
    const u = new URL(s);
    return `${u.hostname.toLowerCase()}${u.pathname}`;
  } catch {
    return s.split(/[?#]/)[0];
  }
}

const WIX_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VAL_ID = /^[A-Za-z0-9_-]{1,64}$/;

/** Ett fil-id i Wix form (`b379ce_<32 hex>~mv2.jpg`), eller null. Samma tolkning som färgbildernas `godkanda`. */
export function tolkaFilId(s: string): string | null {
  const ut = lasGodkanda(s);
  if (!ut || ut.size !== 1) return null;
  return [...ut][0];
}

export function tomRaknare(): Raknare {
  const r = {} as Raknare;
  for (const k of [...STATUSAR, ...HINDER]) r[k] = 0;
  return r;
}

/** Bildtexten för en infogad bild på en enkel sida. Svensk, byggd av sidans eget namn. */
export function miljoAlt(namn: string): string {
  const n = (namn ?? "").trim();
  return n ? `${n} i en miljöbild`.slice(0, 200) : "";
}

function fargOption(optioner: readonly SidOption[]): SidOption | null {
  return optioner.find((o) => lika(o.namn, "Färg")) ?? null;
}

// ── målet: vilka adresser är "position 2" för sidan eller färgen ────────────

/** Position 2 för artiklarna: normerad adress → feedens egen sträng, i artiklarnas ordning. */
export function malFor(
  artiklar: readonly string[],
  feed: ReadonlyMap<string, AosomRow>,
): { hinder: Hinder } | { mal: Map<string, string> } {
  const rader = artiklar.map((a) => feed.get(a)).filter((r): r is AosomRow => !!r);
  if (rader.length === 0) return { hinder: "saknas_i_feeden" };
  const mal = new Map<string, string>();
  for (const r of rader) {
    const url = r.imageUrls[1];
    if (url && !mal.has(normKalla(url))) mal.set(normKalla(url), url);
  }
  if (mal.size === 0) return { hinder: "feed_utan_bild_2" };
  return { mal };
}

export interface ValMal {
  valId: string;
  /** Valets plats i färgaxeln, 0-baserad. Filnamnet bär den, aldrig namnet. */
  valIndex: number;
  namn: string;
  mal?: Map<string, string>;
  hinder?: Hinder;
}

/**
 * `galleri`: en enkel sida, eller en sammanslagen utan färgaxel (bilderna är
 * desamma oavsett storlek) — sidans galleri bedöms mot alla artiklarna.
 * `val`: en sammanslagen sida med färgaxel — varje färg mot sina artiklar.
 */
export type Mal =
  | { typ: "galleri"; mal: Map<string, string> }
  | { typ: "val"; farg: SidOption; val: ValMal[] };

/** Den enda Aosom-raden bakom sidan, eller hindret. */
export function aosomRadFor(
  rader: readonly ProductMappingRecord[] | undefined,
): { hinder: Hinder } | { rad: ProductMappingRecord } {
  if (!rader || rader.length === 0) return { hinder: "ingen_mappning" };
  const aosom = rader.filter((r) => isAosomMapping(r));
  if (aosom.length === 0) return { hinder: "inte_aosom" };
  // Två Aosom-rader på samma sida är inget vi vet hur vi ska läsa.
  if (aosom.length > 1) return { hinder: "tvetydig" };
  return { rad: aosom[0] };
}

const fargPaVarianten = (v: AosomVariantArtikel) => {
  const k = Object.keys(v.choices ?? {}).find((x) => lika(x, "Färg"));
  return k ? String(v.choices[k] ?? "") : "";
};

/**
 * Målet för sidan. Färgen knyts till sina artiklar via mappningens
 * `choices.Färg` och valets namn i Wix — samma namn som sammanslagningen
 * skrev. Ett val utan artikel är ett hinder för det valet, inte en gissning.
 */
export function malForSida(
  rader: readonly ProductMappingRecord[] | undefined,
  optioner: readonly SidOption[],
  feed: ReadonlyMap<string, AosomRow>,
): { hinder: Hinder } | Mal {
  const r = aosomRadFor(rader);
  if ("hinder" in r) return r;
  const bild = aosomArtikelbild(r.rad);
  if (bild.typ === "tvetydig") return { hinder: "tvetydig" };
  if (!bild.artikel) return { hinder: "utan_artikel" };
  const farg = fargOption(optioner);
  if (bild.typ === "en" || !farg) {
    const alla = bild.typ === "en" ? [bild.artikel] : [bild.artikel, ...bild.varianter.map((v) => v.artikel)];
    const m = malFor([...new Set(alla)], feed);
    return "hinder" in m ? m : { typ: "galleri", mal: m.mal };
  }
  const val: ValMal[] = farg.val.map((c, valIndex) => {
    const egna = bild.varianter.filter((v) => lika(fargPaVarianten(v), c.namn)).map((v) => v.artikel);
    // Radens artikel först när den hör till valet: det är den som laddas upp.
    const artiklar = [...new Set(egna.includes(bild.artikel) ? [bild.artikel, ...egna] : egna)];
    if (artiklar.length === 0) return { valId: c.id, valIndex, namn: c.namn, hinder: "val_utan_artikel" as const };
    const m = malFor(artiklar, feed);
    return "hinder" in m
      ? { valId: c.id, valIndex, namn: c.namn, hinder: m.hinder }
      : { valId: c.id, valIndex, namn: c.namn, mal: m.mal };
  });
  return { typ: "val", farg, val };
}

// ── färgens vy, som butiken visar den ───────────────────────────────────────

type SidaBilder = { bilder: readonly Bild[]; optioner: readonly SidOption[] };

/**
 * Det butiken visar för färgen: galleriet i Wix ordning, filtrerat till
 * färgens egna bilder och de gemensamma, med valets första länkade bild först
 * (headless-site `synligaBilder`). Ägarskapet för olänkade bilder är
 * `olankadeAgare` — butikens regler, kopierade till ./fargbilder.ts.
 */
export function fargVy(sida: SidaBilder, valId: string): string[] {
  const farg = fargOption(sida.optioner);
  const c = farg?.val.find((v) => v.id === valId);
  if (!farg || !c) return sida.bilder.map((b) => b.id);
  const allaLankade = new Set<string>();
  for (const o of sida.optioner) for (const v of o.val) for (const id of v.lankade) allaLankade.add(id);
  const egna = new Set(c.lankade);
  const huvud = sida.bilder[0]?.id;
  const ursprung = farg.val.find((v) => !!huvud && v.lankade.includes(huvud))?.namn ?? null;
  const agare = olankadeAgare(sida.bilder, allaLankade, farg.val.map((v) => v.namn), ursprung);
  const vy = sida.bilder
    .map((b) => b.id)
    .filter((id) => {
      if (egna.has(id)) return true;
      if (allaLankade.has(id)) return false;
      const a = agare.get(id);
      return a === null || (a !== undefined && lika(a, c.namn));
    });
  const forst = c.lankade[0];
  const i = forst ? vy.indexOf(forst) : -1;
  return i > 0 ? [vy[i], ...vy.slice(0, i), ...vy.slice(i + 1)] : vy;
}

// ── bedömningen ─────────────────────────────────────────────────────────────

/** Spårad till målet? */
const iMalet = (kalla: ReadonlyMap<string, string>, mal: ReadonlyMap<string, string>) => (id: string) => {
  const k = kalla.get(id);
  return k !== undefined && mal.has(normKalla(k));
};

/**
 * En sidas galleri mot målet. Första spårade träffen avgör platsen; utan
 * träff är svaret `okand` så snart någon bild inte gick att spåra.
 */
export function bedomGalleri(
  galleri: readonly string[],
  kalla: ReadonlyMap<string, string>,
  mal: ReadonlyMap<string, string>,
): { status: Status; fil?: string } {
  const traff = galleri.findIndex(iMalet(kalla, mal));
  if (traff === 0) return { status: "ar_huvudbild", fil: galleri[0] };
  if (traff === 1) return { status: "har_som_tva", fil: galleri[1] };
  if (traff > 1) return { status: "har_annan_plats", fil: galleri[traff] };
  return { status: galleri.some((id) => !kalla.has(id)) ? "okand" : "saknas" };
}

/**
 * En färg på en sammanslagen sida. Räknas som `har_*` bara när färgens egen
 * miljöbild är LÄNKAD till valet; ligger den bara i galleriet är den
 * `i_galleriet_olankad`.
 */
export function bedomVal(
  sida: SidaBilder,
  valId: string,
  kalla: ReadonlyMap<string, string>,
  mal: ReadonlyMap<string, string>,
): { status: Status; fil?: string } | { hinder: Hinder } {
  const c = fargOption(sida.optioner)?.val.find((v) => v.id === valId);
  if (!c || c.lankade.length === 0) return { hinder: "val_utan_bild" };
  const traff = iMalet(kalla, mal);
  const lankad = c.lankade.find(traff);
  if (lankad) {
    if (lankad === c.lankade[0]) return { status: "ar_huvudbild", fil: lankad };
    return { status: fargVy(sida, valId)[1] === lankad ? "har_som_tva" : "har_annan_plats", fil: lankad };
  }
  const iGalleriet = sida.bilder.map((b) => b.id).find(traff);
  if (iGalleriet) return { status: "i_galleriet_olankad", fil: iGalleriet };
  return { status: sida.bilder.some((b) => !kalla.has(b.id)) ? "okand" : "saknas" };
}

/** Raderna för en sida: en, eller en per färg. */
export function bedomSida(
  id: string,
  sida: SidaBilder,
  mal: Mal,
  kalla: ReadonlyMap<string, string>,
): (Rad & { fil?: string })[] {
  if (mal.typ === "galleri") return [{ id, ...bedomGalleri(sida.bilder.map((b) => b.id), kalla, mal.mal) }];
  return mal.val.map((v) => {
    if (v.hinder || !v.mal) return { id, val: v.valId, hinder: v.hinder ?? "val_utan_artikel" };
    return { id, val: v.valId, ...bedomVal(sida, v.valId, kalla, v.mal) };
  });
}

// ── Wix-sökningen ───────────────────────────────────────────────────────────

type Obj = Record<string, unknown>;
const str = (x: unknown) => (typeof x === "string" ? x : "");

/**
 * En sida synliga produkter med galleri och val.
 *
 * `products/search` med MEDIA_ITEMS_INFO är samma projektion som katalogsvepet
 * (lib/wix/media-audit.ts): galleriet och valens `linkedMedia`. `variantsInfo`
 * finns aldrig där, och behövs inte: färgen knyts till artikeln via
 * mappningen.
 *
 * ☠️ FILTRET GÅR BARA MED PÅ FÖRSTA SIDAN. Filter plus markör svarar 400
 * INVALID_CURSOR (CLAUDE.md, 2026-09-24): markören bär frågan själv. `fields`
 * är inget filter och skickas på VARJE sida, annars kommer galleriet tomt på
 * sida två (uppmätt 2026-09-16).
 *
 * ☠️ Wix lägger inte på något implicit `visible: true`, så filtret står där,
 * och en dold produkt i svaret hoppas ändå över. Ett svar utan produktlista
 * kastar: en tom lista hade sett ut som en genomläst katalog.
 */
export async function lasSida(
  wix: WixAnrop,
  markor: string | undefined,
  vanta: (ms: number) => Promise<void>,
): Promise<{ produkter: ProduktLast[]; nasta: string | null }> {
  const kropp = markor
    ? { fields: ["MEDIA_ITEMS_INFO"], search: { cursorPaging: { limit: SIDSTORLEK, cursor: markor } } }
    : { fields: ["MEDIA_ITEMS_INFO"], search: { filter: { visible: true }, cursorPaging: { limit: SIDSTORLEK } } };
  let svar: unknown = null;
  let sistaFel = "";
  for (const paus of SOK_PAUSER_MS) {
    if (paus) await vanta(paus);
    try {
      svar = await wix("POST", "/stores/v3/products/search", kropp);
      sistaFel = "";
      break;
    } catch (e) {
      sistaFel = felText(e);
      if (!/Wix (429|5\d\d)|nätverksfel/.test(sistaFel)) break;
    }
  }
  if (sistaFel) throw new Error(`produktsökningen föll: ${sistaFel.slice(0, 200)}`);
  const s = (svar ?? {}) as Obj;
  const data = (Array.isArray(s.products) ? s : ((s.data as Obj | undefined) ?? {})) as Obj;
  if (!Array.isArray(data.products)) throw new Error("produktsökningen svarade utan produktlista");
  const produkter = (data.products as Obj[])
    .filter((p) => str(p.id))
    // Samma riktning som resten av huset: saknat fält räknas som synligt.
    .map((p) => ({ ...tolkaProdukt(p), synlig: p.visible !== false }));
  const meta = (data.pagingMetadata ?? {}) as Obj;
  const nasta = str((meta.cursors as Obj | undefined)?.next);
  const slut = produkter.length === 0 || !nasta || meta.hasNext === false;
  return { produkter, nasta: slut ? null : nasta };
}

/**
 * Källorna i klumpar om KALLOR_PER_ANROP. ☠️ Ett fel kastas med en FAST text:
 * get-files svar kan bära källadresserna, och felet når den publika loggen.
 */
export async function kallorIKlump(
  hamta: (ids: string[]) => Promise<Map<string, string>>,
  ids: readonly string[],
): Promise<Map<string, string>> {
  const unika = [...new Set(ids.filter(Boolean))];
  const ut = new Map<string, string>();
  for (let i = 0; i < unika.length; i += KALLOR_PER_ANROP) {
    let svar: Map<string, string>;
    try {
      svar = await hamta(unika.slice(i, i + KALLOR_PER_ANROP));
    } catch {
      throw new Error("filernas källor gick inte att läsa (get-files)");
    }
    for (const [id, k] of svar) ut.set(id, k);
  }
  return ut;
}

/** Fil-id → källa ur mappningens `aosomBildFiler`. Kostar ingenting. */
function kandaKallor(rad: ProductMappingRecord | null | undefined): Map<string, string> {
  const ut = new Map<string, string>();
  for (const f of rad?.aosomBildFiler ?? []) if (f.fileId && f.kalla) ut.set(f.fileId, f.kalla);
  return ut;
}

const feedIndex = (rader: AosomRow[]) => new Map(rader.map((r) => [r.sku, r]));

// ── rapport ─────────────────────────────────────────────────────────────────

/**
 * En körning av rapporten: sidor ur Wix tills katalogen är slut eller
 * tidsbudgeten tagit slut. Första sidan läses alltid, så varje körning går
 * framåt.
 */
export async function rapportera(
  deps: LivsbildDeps,
  opts: { efter?: string; tidsbudgetMs?: number } = {},
): Promise<Rapport> {
  const nu = deps.nu ?? (() => Date.now());
  const vanta = deps.vanta ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const budget = opts.tidsbudgetMs ?? RAPPORT_TIDSBUDGET_MS;
  const start = nu();

  const r: Rapport = {
    lage: "rapport",
    granskade: 0,
    rader: 0,
    sidor: 0,
    raknare: tomRaknare(),
    ids: { har_annan_plats: [], ar_huvudbild: [], i_galleriet_olankad: [], saknas: [], okand: [] },
    oharleddaBilder: 0,
    nasta: null,
    stoppadAv: "klart",
  };
  let markor: string | undefined = opts.efter || undefined;
  let index: Map<string, ProductMappingRecord[]> | null = null;
  let feed: Map<string, AosomRow> | null = null;

  for (let sida = 0; ; sida++) {
    if (sida > 0 && nu() - start > budget) {
      r.stoppadAv = "tidsbudget";
      r.nasta = markor ?? null;
      break;
    }
    if (sida >= MAX_SIDOR_PER_KORNING) {
      r.stoppadAv = "sidtak";
      r.nasta = markor ?? null;
      break;
    }
    const { produkter, nasta } = await lasSida(deps.wix, markor, vanta);
    r.sidor++;
    if (!index) {
      index = new Map();
      for (const m of await deps.mappningar()) {
        if (!m.wixProductId) continue;
        index.set(m.wixProductId, [...(index.get(m.wixProductId) ?? []), m]);
      }
    }

    // Allt på sidan som går att bedöma, och källorna det behöver — frågade
    // i klump för hela sidan, inte per produkt.
    const att: { p: ProduktLast; mal: Mal; kalla: Map<string, string> }[] = [];
    for (const p of produkter) {
      if (!p.synlig) continue;
      r.granskade++;
      const rader = index.get(p.id);
      const forst = aosomRadFor(rader);
      if ("hinder" in forst) {
        r.rader++;
        r.raknare[forst.hinder]++;
        continue;
      }
      // Feeden hämtas först när en produkt faktiskt behöver den, och en gång.
      feed ??= feedIndex(await deps.hamtaFeed());
      const mal = malForSida(rader, p.optioner, feed);
      if ("hinder" in mal) {
        r.rader++;
        r.raknare[mal.hinder]++;
        continue;
      }
      att.push({ p, mal, kalla: kandaKallor(forst.rad) });
    }
    const okanda = att.flatMap((a) => a.p.bilder.map((b) => b.id).filter((id) => !a.kalla.has(id)));
    const fran = okanda.length ? await kallorIKlump(deps.hamtaKallor, okanda) : new Map<string, string>();
    for (const a of att) {
      for (const b of a.p.bilder) {
        const k = fran.get(b.id);
        if (k && !a.kalla.has(b.id)) a.kalla.set(b.id, k);
      }
      r.oharleddaBilder += a.p.bilder.filter((b) => !a.kalla.has(b.id)).length;
      for (const rad of bedomSida(a.p.id, a.p, a.mal, a.kalla)) {
        r.rader++;
        if (rad.hinder) r.raknare[rad.hinder]++;
        else if (rad.status) {
          r.raknare[rad.status]++;
          if (rad.status !== "har_som_tva") r.ids[rad.status].push(nyckel(rad));
        }
      }
    }

    markor = nasta ?? undefined;
    if (!nasta) break;
  }
  return r;
}

// ── nycklar och par ─────────────────────────────────────────────────────────

export interface Mal1 {
  id: string;
  val?: string;
}

/** `wix-id` eller `wix-id:val-id`, kommaseparerade. För `kandidater`. */
export function tolkaNycklar(varden: readonly unknown[]): { mal: Mal1[] } | { fel: string } {
  const ut = new Map<string, Mal1>();
  let felaktiga = 0;
  for (const v of varden) {
    const s = String(v ?? "").trim();
    if (!s) continue;
    const [wix, val, ...rest] = s.split(":").map((x) => x.trim());
    if (!WIX_ID.test(wix ?? "") || rest.length > 0 || (val !== undefined && !VAL_ID.test(val))) {
      felaktiga++;
      continue;
    }
    const m = { id: wix.toLowerCase(), ...(val ? { val } : {}) };
    ut.set(nyckel(m), m);
  }
  // Värdet skrivs aldrig tillbaka: det kan vara ett artikelnummer i fel fält.
  if (felaktiga > 0) return { fel: `${felaktiga} värden är inte wix-id eller wix-id:val-id` };
  if (ut.size === 0) return { fel: "inga mål" };
  if (ut.size > MAX_KANDIDATER) return { fel: `högst ${MAX_KANDIDATER} mål per körning` };
  return { mal: [...ut.values()].sort((a, b) => nyckel(a).localeCompare(nyckel(b))) };
}

export interface Atgard {
  id: string;
  /** Färgvalets id på en sammanslagen sida. */
  val?: string;
  typ: "infoga" | "flytta";
  /** Den godkända filen för `infoga`. Tom = ogiltigt fil-id. */
  fileId?: string;
}

/**
 * Paren för `plan` och `skriv`:
 *
 *   wix-id:fil-id            infoga en godkänd kandidat (enkel sida)
 *   wix-id:val-id:fil-id     infoga för en färg (sammanslagen sida)
 *   wix-id:flytta            flytta sidans miljöbild till plats två
 *   wix-id:val-id:flytta     länka färgens miljöbild och flytta den till två
 *
 * Wix-id:t måste vara ett id, annars vägras hela listan (det kan vara ett
 * artikelnummer i fel fält, och då ska det inte skrivas tillbaka). Ett
 * ogiltigt fil-id blir ett hinder på sin åtgärd.
 */
export function tolkaPar(varden: readonly unknown[]): { atgarder: Atgard[] } | { fel: string } {
  const ut = new Map<string, Atgard>();
  let felaktiga = 0;
  for (const v of varden) {
    const s = String(v ?? "").trim();
    if (!s) continue;
    const delar = s.split(":").map((x) => x.trim());
    const wix = (delar[0] ?? "").toLowerCase();
    const val = delar.length === 3 ? delar[1] : undefined;
    const sista = delar[delar.length - 1] ?? "";
    if (!WIX_ID.test(wix) || delar.length < 2 || delar.length > 3 || (val !== undefined && !VAL_ID.test(val))) {
      felaktiga++;
      continue;
    }
    const a: Atgard = sista.toLowerCase() === "flytta"
      ? { id: wix, ...(val ? { val } : {}), typ: "flytta" }
      : { id: wix, ...(val ? { val } : {}), typ: "infoga", fileId: tolkaFilId(sista) ?? "" };
    if (ut.has(nyckel(a))) return { fel: "samma sida eller färg står två gånger" };
    ut.set(nyckel(a), a);
  }
  if (felaktiga > 0) return { fel: `${felaktiga} par är inte wix-id:fil-id, wix-id:val-id:fil-id eller …:flytta` };
  if (ut.size === 0) return { fel: "inga par" };
  if (ut.size > MAX_PAR) return { fel: `högst ${MAX_PAR} par per körning` };
  return { atgarder: [...ut.values()].sort((a, b) => nyckel(a).localeCompare(nyckel(b))) };
}

// ── planen ──────────────────────────────────────────────────────────────────

export interface AtgardPlan {
  val?: string;
  typ: "infoga" | "flytta";
  /** `matchar`: filens källa är målets position 2. `okand`: källan gick inte att läsa. */
  kalla: "matchar" | "okand";
  hinder?: SkrivHinder;
  /** Intern: filen som infogas eller flyttas. Når aldrig svaret. */
  fil?: string;
  /** Intern: källan kopplingen sparar efter en infogning. Når aldrig svaret. */
  sparaKalla?: string;
}

export interface ProduktPlan {
  id: string;
  /** Hinder för hela sidan. */
  hinder?: SkrivHinder;
  galleriFore: Bild[];
  galleriEfter: Bild[];
  /** Färgaxelns val före och efter. Tomt på en enkel sida. */
  val: { valId: string; namn: string; lankadeFore: string[]; lankadeEfter: string[] }[];
  atgarder: AtgardPlan[];
}

/** Sidan som planen ser den. Färsk ur Wix. */
export type SidaIn = Pick<ProduktLast, "id" | "namn" | "synlig" | "bilder" | "optioner">;

/** Arbetsläget medan åtgärderna läggs på i tur och ordning. */
interface Lage {
  bilder: Bild[];
  optioner: SidOption[];
}

function medLankar(lage: Lage, valId: string, lankade: string[]): SidOption[] {
  return lage.optioner.map((o) =>
    lika(o.namn, "Färg") ? { ...o, val: o.val.map((v) => (v.id === valId ? { ...v, lankade } : v)) } : o,
  );
}

/**
 * Lägger `fil` som färgens ANDRA bild: andra i valets `linkedMedia` och, i
 * galleriet, precis före den bild butikens vy annars hade visat som två.
 * Valets första bild och galleriets första rörs inte.
 */
export function placeraIVal(lage: Lage, valId: string, fil: Bild): { hinder: SkrivHinder } | Lage {
  const c = fargOption(lage.optioner)?.val.find((v) => v.id === valId);
  if (!c || c.lankade.length === 0) return { hinder: "val_utan_bild" };
  const forsta = c.lankade[0];
  const lankade = [forsta, fil.id, ...c.lankade.filter((x) => x !== forsta && x !== fil.id)];
  const utan = lage.bilder.filter((b) => b.id !== fil.id);
  const optioner = medLankar(lage, valId, lankade);
  const vy = fargVy({ bilder: utan, optioner }, valId);
  const nasta = vy.find((id) => id !== forsta);
  const vid = nasta ? utan.findIndex((b) => b.id === nasta) : utan.findIndex((b) => b.id === forsta) + 1;
  // Plats 0 hade gjort filen till sidans huvudbild.
  if (vid <= 0) return { hinder: "huvudbilden_i_vagen" };
  const bilder = [...utan.slice(0, vid), fil, ...utan.slice(vid)];
  if (fargVy({ bilder, optioner }, valId)[1] !== fil.id) return { hinder: "plan_ogiltig" };
  return { bilder, optioner };
}

/**
 * Planens invarianter. Tom lista = den går att skriva. Bryter den något blir
 * sidan `plan_ogiltig` och skrivs aldrig.
 */
export function kontrolleraLivsplan(p: Pick<ProduktPlan, "galleriFore" | "galleriEfter" | "val">): string[] {
  const fel: string[] = [];
  const efter = p.galleriEfter.map((b) => b.id);
  const iEfter = new Set(efter);
  if (efter.length > MAX_BILDER) fel.push("över Wix tak");
  if (iEfter.size !== efter.length) fel.push("samma bild två gånger");
  if (p.galleriFore[0] && efter[0] !== p.galleriFore[0].id) fel.push("huvudbilden flyttas");
  if (p.galleriFore.some((b) => !iEfter.has(b.id))) fel.push("en bild faller ur galleriet");
  for (const v of p.val) {
    if (v.lankadeFore[0] && v.lankadeEfter[0] !== v.lankadeFore[0]) fel.push("ett vals första bild ändras");
    if (v.lankadeFore.some((id) => !v.lankadeEfter.includes(id))) fel.push("en länk faller bort");
    if (v.lankadeEfter.some((id) => !iEfter.has(id))) fel.push("en länkad bild saknas i galleriet");
  }
  return [...new Set(fel)];
}

/**
 * Planen för en sida: åtgärderna i tur och ordning på ett arbetsläge.
 *
 * @param mal    Målet ur mappningen och feeden, eller hindret.
 * @param kalla  Fil-id → källa för galleriets bilder och de infogade filerna.
 */
export function planeraSida(
  sida: SidaIn | null,
  id: string,
  atgarder: readonly Atgard[],
  mal: Mal | { hinder: Hinder },
  kalla: ReadonlyMap<string, string>,
): ProduktPlan {
  const plan: ProduktPlan = {
    id,
    galleriFore: sida?.bilder.map((b) => ({ ...b })) ?? [],
    galleriEfter: sida?.bilder.map((b) => ({ ...b })) ?? [],
    val: [],
    atgarder: atgarder.map((a) => ({ ...(a.val ? { val: a.val } : {}), typ: a.typ, kalla: "okand" as const })),
  };
  if (!sida) {
    plan.hinder = "saknas_i_wix";
    return plan;
  }
  if (!sida.synlig) {
    plan.hinder = "inte_publicerad";
    return plan;
  }
  const farg = fargOption(sida.optioner);
  if (farg) {
    plan.val = farg.val.map((v) => ({ valId: v.id, namn: v.namn, lankadeFore: [...v.lankade], lankadeEfter: [...v.lankade] }));
  }
  let lage: Lage = { bilder: plan.galleriEfter, optioner: sida.optioner.map((o) => ({ ...o, val: o.val.map((v) => ({ ...v })) })) };

  atgarder.forEach((a, i) => {
    const ap = plan.atgarder[i];
    const hindra = (h: SkrivHinder) => { ap.hinder = h; };
    if (a.typ === "infoga" && !a.fileId) return hindra("ogiltigt_fil_id");

    // Målet för åtgärden: sidans galleri eller färgens.
    let malet: Map<string, string> | null = null;
    if ("hinder" in mal) {
      // Utan mål går en infogning på en enkel sida ändå (källan blir okänd);
      // allt annat behöver målet.
      if (!(a.typ === "infoga" && !a.val)) return hindra(mal.hinder);
    } else if (mal.typ === "galleri") {
      if (a.val) return hindra("inte_sammanslagen");
      malet = mal.mal;
    } else {
      if (!a.val) return hindra("val_kravs");
      const vm = mal.val.find((v) => v.valId === a.val);
      if (!vm) return hindra("val_finns_inte");
      if (vm.hinder || !vm.mal) return hindra(vm.hinder ?? "val_utan_artikel");
      malet = vm.mal;
    }
    const iMal = malet ? iMalet(kalla, malet) : () => false;

    // Vilken fil, och varifrån kom den?
    let fil: string;
    if (a.typ === "infoga") {
      fil = a.fileId!;
      if (lage.bilder.some((b) => b.id === fil)) return hindra("finns_redan");
      if (lage.bilder.length >= MAX_BILDER) return hindra("fullt");
      if (lage.bilder.length === 0) return hindra("tomt_galleri");
      const k = kalla.get(fil);
      if (k && malet) {
        // Filen kom någon annanstans ifrån: en annan position eller en annan
        // produkt. Ett par som klistrats fel ska inte bli en bild på fel sida.
        if (!iMal(fil)) return hindra("annan_kalla");
        ap.kalla = "matchar";
        ap.sparaKalla = malet.get(normKalla(k));
      } else if (malet) {
        // Okänd källa: kopplingen sparas mot målets första adress (radens
        // artikel står först), som en människa godkänt bilden som.
        ap.sparaKalla = [...malet.values()][0];
      }
    } else {
      const c = a.val ? fargOption(lage.optioner)?.val.find((v) => v.id === a.val) : undefined;
      const hittad = (c?.lankade.find(iMal)) ?? lage.bilder.map((b) => b.id).find(iMal);
      if (!hittad) return hindra("saknas_pa_sidan");
      fil = hittad;
      ap.kalla = "matchar";
    }
    ap.fil = fil;

    // Lägg den som två.
    if (!a.val) {
      const idx = lage.bilder.findIndex((b) => b.id === fil);
      if (idx === 0) return hindra("ar_huvudbild");
      if (idx === 1) return hindra("redan_tva");
      const ny: Bild = idx > 0 ? lage.bilder[idx] : { id: fil, alt: miljoAlt(sida.namn) };
      const utan = lage.bilder.filter((b) => b.id !== fil);
      lage = { ...lage, bilder: [utan[0], ny, ...utan.slice(1)] };
      return;
    }
    const fv = fargOption(lage.optioner)!;
    const c = fv.val.find((v) => v.id === a.val)!;
    if (c.lankade.length === 0) return hindra("val_utan_bild");
    // Färgens första bild, eller sidans: att flytta den hade bytt huvudbild.
    if (c.lankade[0] === fil || lage.bilder[0]?.id === fil) return hindra("ar_huvudbild");
    if (fv.val.some((v) => v.id !== c.id && v.lankade.includes(fil))) return hindra("lankad_till_annat_val");
    if (c.lankade.includes(fil) && fargVy(lage, c.id)[1] === fil) return hindra("redan_tva");
    const befintlig = lage.bilder.find((b) => b.id === fil);
    const nyBild: Bild = befintlig ?? { id: fil, alt: fargAlt(sida.namn, { Färg: c.namn }, 2) };
    const placerad = placeraIVal(lage, c.id, nyBild);
    if ("hinder" in placerad) return hindra(placerad.hinder);
    lage = placerad;
  });

  plan.galleriEfter = lage.bilder;
  const fargEfter = fargOption(lage.optioner);
  for (const v of plan.val) v.lankadeEfter = [...(fargEfter?.val.find((x) => x.id === v.valId)?.lankade ?? v.lankadeFore)];
  if (kontrolleraLivsplan(plan).length > 0) {
    plan.hinder = "plan_ogiltig";
    plan.galleriEfter = plan.galleriFore.map((b) => ({ ...b }));
    for (const v of plan.val) v.lankadeEfter = [...v.lankadeFore];
  }
  return plan;
}

/** Ändrar planen något i Wix? */
export function andrar(p: ProduktPlan): boolean {
  if (p.hinder) return false;
  return !sammaLista(p.galleriEfter.map((b) => b.id), p.galleriFore.map((b) => b.id))
    || p.val.some((v) => !sammaLista(v.lankadeEfter, v.lankadeFore));
}

/**
 * sha256 av paren och det som skrivs, i kanonisk form. Samma par mot samma
 * sidor ger samma sha; en ändrad lista ELLER en sida som ändrats sedan
 * planen ger en annan, och då skrivs ingenting.
 */
export function planSha(atgarder: readonly Atgard[], planer: readonly ProduktPlan[]): string {
  const kanon = {
    v: "aosom-livsbild:v2",
    par: atgarder.map((a) => `${nyckel(a)}:${a.typ === "flytta" ? "flytta" : a.fileId ?? ""}`).sort(),
    sidor: [...planer]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((p) => ({
        id: p.id,
        hinder: p.hinder ?? "",
        fore: p.galleriFore.map((b) => b.id),
        galleri: p.galleriEfter.map((b) => [b.id, b.alt]),
        val: p.val.map((v) => [v.valId, v.lankadeEfter]),
        atgarder: p.atgarder.map((a) => [a.val ?? "", a.typ, a.fil ?? "", a.hinder ?? ""]),
      })),
  };
  return createHash("sha256").update(JSON.stringify(kanon)).digest("hex");
}

/** Det som får stå i den publika loggen: id, räknare och koder. */
export function publikPlan(p: ProduktPlan) {
  return {
    id: p.id,
    ...(p.hinder ? { hinder: p.hinder } : {}),
    andrar: andrar(p),
    bilderFore: p.galleriFore.length,
    bilderEfter: p.galleriEfter.length,
    lankarAndras: p.val.filter((v) => !sammaLista(v.lankadeEfter, v.lankadeFore)).length,
    atgarder: p.atgarder.map((a) => ({
      ...(a.val ? { val: a.val } : {}),
      typ: a.typ,
      kalla: a.kalla,
      ...(a.hinder ? { hinder: a.hinder } : {}),
    })),
  };
}

// ── plan och skriv ──────────────────────────────────────────────────────────

export interface ParUtfall {
  id: string;
  ok: boolean;
  /** Fasta texter och räknare — aldrig en adress. */
  steg: string[];
  fel?: string;
}

export interface PlanSvar {
  lage: "plan" | "skriv";
  sha: string;
  produkter: ReturnType<typeof publikPlan>[];
  /** Sidor där något ändras. */
  skrivbara: number;
  utfall: ParUtfall[];
  skrivna: number;
  stoppadAv: "klart" | "avvikelse" | "tidsbudget" | "sha";
  /** Sidor som tidsbudgeten inte räckte till. Kör en ny plan med dem. */
  kvar: string[];
}

/**
 * Planerna ur färska läsningar. Samma väg i `plan` och `skriv`, så att samma
 * par mot oförändrade sidor ger samma sha.
 */
export async function planera(atgarder: readonly Atgard[], deps: LivsbildDeps): Promise<ProduktPlan[]> {
  const perSida = new Map<string, Atgard[]>();
  for (const a of atgarder) perSida.set(a.id, [...(perSida.get(a.id) ?? []), a]);
  let feed: Map<string, AosomRow> | null = null;
  const las: { id: string; sida: ProduktLast | null; rad: ProductMappingRecord | null; mal: Mal | { hinder: Hinder } }[] = [];
  for (const id of [...perSida.keys()].sort()) {
    const sida = await lasProdukt(deps.wix, id);
    const rad = await deps.hamtaMappning(id);
    const forst = aosomRadFor(rad ? [rad] : []);
    let mal: Mal | { hinder: Hinder };
    if ("hinder" in forst) mal = forst;
    else {
      feed ??= feedIndex(await deps.hamtaFeed());
      mal = malForSida([forst.rad], sida?.optioner ?? [], feed);
    }
    las.push({ id, sida, rad, mal });
  }
  // Källorna för alla gallerier och alla infogade filer, i ett svep.
  // ☠️ Ett anrop som FALLER är inte "okänd källa": då hade spärren mot fel
  // källa (`annan_kalla`) släppt igenom allt. Det kastar med fast text.
  const kalla = new Map<string, string>();
  for (const l of las) for (const [k, v] of kandaKallor(l.rad)) kalla.set(k, v);
  const okanda = [
    ...las.flatMap((l) => l.sida?.bilder.map((b) => b.id) ?? []),
    ...atgarder.flatMap((a) => (a.fileId ? [a.fileId] : [])),
  ].filter((id) => !kalla.has(id));
  for (const [k, v] of await kallorIKlump(deps.hamtaKallor, okanda)) kalla.set(k, v);

  return las.map((l) => planeraSida(l.sida, l.id, perSida.get(l.id)!, l.mal, kalla));
}

/** Planen i färgbildernas form, så att deras återläsning och länkskrivning kan användas. */
function somSidPlan(p: ProduktPlan): SidPlan {
  return {
    id: p.id,
    hinder: [],
    varningar: [],
    taMedGranskade: false,
    val: p.val.map((v) => ({
      valId: v.valId,
      namn: v.namn,
      ursprung: false,
      givareId: null,
      lankadeFore: v.lankadeFore,
      lankadeEfter: v.lankadeEfter,
      bilder: [],
      galleri: v.lankadeEfter,
      overflow: [],
      granskas: [],
    })),
    gemensamma: [],
    fasta: [],
    galleriFore: p.galleriFore,
    galleriEfter: p.galleriEfter,
    andrarWix: andrar(p),
    andrarTabell: false,
    rader: [],
    givarkort: 0,
  };
}

/**
 * Skriver en sidas plan, steg för steg som ./fargbilder-kor.ts `skrivSida`
 * (utan färgbildstabellen, som det här verktyget inte rör), och sparar sedan
 * kopplingen för de infogade filerna. `ok: false` betyder att körningen ska
 * stanna.
 */
export async function skrivSida(p: ProduktPlan, deps: LivsbildDeps): Promise<ParUtfall> {
  const vanta = deps.vanta ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const steg: string[] = [];
  const fall = (fel: string): ParUtfall => ({ id: p.id, ok: false, steg, fel });
  const plan = somSidPlan(p);

  const fore = await lasProdukt(deps.wix, p.id);
  if (!fore) return fall("sidan gick inte att läsa");
  if (!sammaUtgangslage(plan, fore)) return fall("sidan har ändrats sedan planen — kör planen igen");
  const foreLage = { synlig: fore.synlig, optioner: fore.optioner, varianter: fore.varianter };

  // ── 1: galleriet, ensamt, vid id ───────────────────────────────────────
  let galleriPatchat = false;
  try {
    if (JSON.stringify(plan.galleriEfter) !== JSON.stringify(plan.galleriFore)) {
      await deps.wix("PATCH", `/stores/v3/products/${encodeURIComponent(p.id)}`, {
        product: {
          revision: fore.revision,
          media: { itemsInfo: { items: plan.galleriEfter.map((b) => ({ id: b.id, altText: b.alt })) } },
        },
        fieldMask: { paths: ["media"] },
      });
      galleriPatchat = true;
      steg.push(`galleri ${plan.galleriFore.length} → ${plan.galleriEfter.length}`);
    }
  } catch (e) {
    // Produktanropets fel bär inga källadresser; felText stryker artikelnummer.
    return fall(`galleriet föll: ${felText(e).slice(0, 200)}`);
  }

  // ── 2 + 3: länkarna, med försök, och återläsningen ────────────────────
  const behoverLankar = plan.val.some((v) => !sammaLista(v.lankadeEfter, v.lankadeFore));
  const las = async () => {
    const e = await lasProdukt(deps.wix, p.id);
    return { e, avvikelser: e ? kontrolleraEfter(plan, foreLage, e) : ["sidan gick inte att läsa efter skrivningen"] };
  };
  let sistaFel = "";
  let forsok = 0;
  try {
    let { e: efter, avvikelser } = await las();
    let omlasningar = 0;
    while (galleriPatchat && efter && avvikelser.includes(GALLERI_AVVIKELSE) && omlasningar < GALLERI_OMLASNINGAR) {
      omlasningar++;
      await vanta(KOPPLING_PAUS_MS);
      ({ e: efter, avvikelser } = await las());
    }
    if (omlasningar > 0) steg.push(`galleriet omläst ${omlasningar} ${omlasningar === 1 ? "gång" : "gånger"}`);
    const baraLankar = () => avvikelser.length > 0 && avvikelser.every((a) => a === LANK_AVVIKELSE);
    while (behoverLankar && efter && baraLankar() && forsok < KOPPLING_FORSOK) {
      forsok++;
      try {
        await deps.wix("PATCH", `/stores/v3/products/${encodeURIComponent(p.id)}`, {
          product: {
            revision: efter.revision,
            visible: efter.ra.visible,
            options: optionerMedLankar(efter, plan),
            variantsInfo: efter.ra.variantsInfo,
          },
          fieldMask: { paths: ["options", "variantsInfo", "visible"] },
        });
      } catch (e) {
        sistaFel = felText(e);
        if (!arOvergaende(e)) return fall(`länkningen föll: ${sistaFel.slice(0, 200)} — galleriet är skrivet`);
      }
      await vanta(KOPPLING_PAUS_MS);
      ({ e: efter, avvikelser } = await las());
    }
    if (avvikelser.length > 0) {
      return fall(
        `Wix stämmer inte med planen (${avvikelser.join("; ")})${sistaFel ? ` — sista fel: ${sistaFel.slice(0, 200)}` : ""}`,
      );
    }
  } catch (e) {
    return fall(`återläsningen föll: ${felText(e).slice(0, 200)}`);
  }
  if (behoverLankar) steg.push(`länkar: ${plan.val.filter((v) => !sammaLista(v.lankadeEfter, v.lankadeFore)).length} val (${forsok} försök)`);
  steg.push("återläst");

  // ── 4: kopplingen, sist och bara efter en verifierad skrivning ─────────
  // Raden läses om precis före sparandet, så att en synk som skrivit under
  // tiden inte skrivs över med en gammal rad. En koppling som inte sparas är
  // bokföring, inte en skada: Wix är skrivet och läst tillbaka.
  const nya = p.atgarder.filter((a) => a.typ === "infoga" && !a.hinder && a.fil && a.sparaKalla);
  if (nya.length > 0) {
    try {
      const rad = await deps.hamtaMappning(p.id);
      if (!rad || !isAosomMapping(rad)) {
        steg.push("koppling: ingen Aosom-rad, sparas inte");
      } else {
        const filer = (rad.aosomBildFiler ?? []).filter((f) => !nya.some((a) => a.fil === f.fileId));
        for (const a of nya) filer.push({ kalla: a.sparaKalla!, fileId: a.fil! });
        await deps.sparaMappning({ ...rad, aosomBildFiler: filer });
        steg.push(`koppling sparad (${nya.length})`);
      }
    } catch {
      steg.push("koppling: sparandet föll");
    }
  }
  return { id: p.id, ok: true, steg };
}

/**
 * `plan` och `skriv`. I `skriv` räknas planen om ur färska läsningar och
 * jämförs med `bekrafta`; skiljer de sig skrivs ingenting (`stoppadAv: "sha"`).
 */
export async function planeraOchSkriv(
  atgarder: readonly Atgard[],
  opts: { skriv: boolean; bekrafta?: string; tidsbudgetMs?: number },
  deps: LivsbildDeps,
): Promise<PlanSvar> {
  const nu = deps.nu ?? (() => Date.now());
  const budget = opts.tidsbudgetMs ?? SKRIV_TIDSBUDGET_MS;
  const start = nu();
  const planer = await planera(atgarder, deps);
  const svar: PlanSvar = {
    lage: opts.skriv ? "skriv" : "plan",
    sha: planSha(atgarder, planer),
    produkter: planer.map(publikPlan),
    skrivbara: planer.filter(andrar).length,
    utfall: [],
    skrivna: 0,
    stoppadAv: "klart",
    kvar: [],
  };
  if (!opts.skriv) return svar;
  if (opts.bekrafta !== svar.sha) {
    svar.stoppadAv = "sha";
    return svar;
  }
  const attSkriva = planer.filter(andrar);
  for (const [i, p] of attSkriva.entries()) {
    if (i > 0 && nu() - start > budget) {
      svar.stoppadAv = "tidsbudget";
      svar.kvar = attSkriva.slice(i).map((x) => x.id);
      break;
    }
    const u = await skrivSida(p, deps);
    svar.utfall.push(u);
    if (!u.ok) {
      svar.stoppadAv = "avvikelse";
      break;
    }
    svar.skrivna++;
  }
  return svar;
}

// ── kandidater ──────────────────────────────────────────────────────────────

export interface KandidatRad {
  id: string;
  val?: string;
  /** Valets plats i färgaxeln (1-baserad), som filnamnet bär. */
  valNr?: number;
  hinder?: SkrivHinder;
  /** Wix egen fil: id och wixstatic-adress. Saknas i torrkörning. */
  kandidat?: { fileId: string; url: string };
  /** Uppladdningen gick inte. Felet följer inte med — det bär källadressen. */
  miss?: true;
}

export interface KandidatSvar {
  lage: "kandidater";
  dryRun: boolean;
  rader: KandidatRad[];
  uppladdade: number;
  missar: number;
  /** Mål som tidsbudgeten inte räckte till (nycklar). Skicka dem i nästa körning. */
  kvar: string[];
}

/**
 * Filnamnet i Media Manager. Byggs av wix-id och färgens plats, aldrig av
 * källadressen eller namnet. En enkel sida får bildkandidaternas namn.
 */
export function kandidatFilnamn(wixProductId: string, valNr?: number): string {
  return valNr ? `kandidat-${wixProductId.slice(0, 8)}-v${valNr}-2.jpg` : kandidatNamn(wixProductId, 2);
}

/**
 * Laddar upp feedens position 2 för varje mål till Media Manager, utan att
 * röra produkten. Ett mål utan val på en sammanslagen sida tar de färger som
 * är `saknas` eller `okand`. Torrkörning som standard.
 */
export async function hamtaKandidater(
  mal: readonly Mal1[],
  opts: { dryRun?: boolean; tidsbudgetMs?: number },
  deps: LivsbildDeps,
): Promise<KandidatSvar> {
  const dryRun = opts.dryRun !== false;
  const nu = deps.nu ?? (() => Date.now());
  const vanta = deps.vanta ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const budget = opts.tidsbudgetMs ?? KANDIDAT_TIDSBUDGET_MS;
  const start = nu();
  const svar: KandidatSvar = { lage: "kandidater", dryRun, rader: [], uppladdade: 0, missar: 0, kvar: [] };
  let feed: Map<string, AosomRow> | null = null;
  let forsta = true;

  for (const [i, m] of mal.entries()) {
    if (i > 0 && nu() - start > budget) {
      svar.kvar = mal.slice(i).map(nyckel);
      break;
    }
    const rad = (h: SkrivHinder): void => { svar.rader.push({ id: m.id, ...(m.val ? { val: m.val } : {}), hinder: h }); };
    const sida = await lasProdukt(deps.wix, m.id);
    if (!sida) { rad("saknas_i_wix"); continue; }
    const mappning = await deps.hamtaMappning(m.id);
    const forst = aosomRadFor(mappning ? [mappning] : []);
    if ("hinder" in forst) { rad(forst.hinder); continue; }
    feed ??= feedIndex(await deps.hamtaFeed());
    const malet = malForSida([forst.rad], sida.optioner, feed);
    if ("hinder" in malet) { rad(malet.hinder); continue; }

    // Vad ska laddas upp: [valId?, valNr?, källadress]
    const mal2: { val?: string; valNr?: number; url: string }[] = [];
    if (malet.typ === "galleri") {
      if (m.val) { rad("inte_sammanslagen"); continue; }
      mal2.push({ url: [...malet.mal.values()][0] });
    } else if (m.val) {
      const vm = malet.val.find((v) => v.valId === m.val);
      if (!vm) { rad("val_finns_inte"); continue; }
      if (vm.hinder || !vm.mal) { rad(vm.hinder ?? "val_utan_artikel"); continue; }
      mal2.push({ val: vm.valId, valNr: vm.valIndex + 1, url: [...vm.mal.values()][0] });
    } else {
      // Hela sidan: de färger som saknar sin bild eller inte går att avgöra.
      const kalla = kandaKallor(forst.rad);
      const okanda = sida.bilder.map((b) => b.id).filter((id) => !kalla.has(id));
      for (const [k, v] of await kallorIKlump(deps.hamtaKallor, okanda)) kalla.set(k, v);
      const bedomda = bedomSida(m.id, sida, malet, kalla);
      for (const b of bedomda) {
        if (b.hinder) { svar.rader.push({ id: m.id, val: b.val, hinder: b.hinder }); continue; }
        if (b.status !== "saknas" && b.status !== "okand") continue;
        const vm = malet.val.find((v) => v.valId === b.val)!;
        mal2.push({ val: vm.valId, valNr: vm.valIndex + 1, url: [...vm.mal!.values()][0] });
      }
    }

    for (const t of mal2) {
      const ut: KandidatRad = { id: m.id, ...(t.val ? { val: t.val, valNr: t.valNr } : {}) };
      svar.rader.push(ut);
      if (dryRun) continue;
      if (!forsta) await vanta(150);
      forsta = false;
      try {
        const fil = await deps.laddaUpp(t.url, kandidatFilnamn(m.id, t.valNr));
        // ☠️ Bara Wix egen adress får stå i svaret. En torrkörd uppladdning
        // (DRY_RUN i miljön) svarar med källadressen — den räknas som en miss.
        if (!fil.id || !fil.url?.startsWith(WIXSTATIC)) throw new Error("inte en Wix-fil");
        ut.kandidat = { fileId: fil.id, url: fil.url };
        svar.uppladdade++;
      } catch {
        ut.miss = true;
        svar.missar++;
      }
    }
  }
  return svar;
}

// ── skarpa beroenden ────────────────────────────────────────────────────────

/** Deps mot skarpa systemet. Bryts ut så testerna slipper mocka moduler. */
export async function liveDeps(): Promise<LivsbildDeps> {
  const [{ getStore }, { fetchAosomFeed }, media, { skapaWixAnrop }] = await Promise.all([
    import("../store/factory"),
    import("./feed"),
    import("../wix/media"),
    import("../polish/skrivplan-wix"),
  ]);
  const store = getStore();
  return {
    wix: skapaWixAnrop(),
    mappningar: () => store.listMappings(),
    hamtaMappning: (id) => store.getMappingByWixProductId(id),
    sparaMappning: (rad) => store.saveMapping(rad),
    hamtaFeed: () => fetchAosomFeed(),
    hamtaKallor: (ids) => media.getMediaSourceUrls(ids),
    laddaUpp: async (url, namn) => {
      const f = await media.importMediaByUrl(url, namn);
      return { id: f.id, url: f.url };
    },
  };
}
