// Recensionerna poleras med produkten de hör till (Leonard 2026-10-30).
//
// VARFÖR. Leonard: "den som polerar produkterna fixar allt o sen fixar
// recensionerna till produkten som ett steg". Förut översattes recensionerna i
// en egen kö (/api/cron/review-translate), utan produkten framför sig och
// oftast långt efter att sidan publicerats. Nu tar rundan dem i samma pass:
// den som just har läst varan, bilderna och måtten översätter också vad
// kunderna skrev om den.
//
// Tre lägen, alla per produkt:
//
//   las    produktens väntande recensioner, för rundans katalog
//          (recensioner-kalla.json). Bara text som redan är publik hos
//          leverantören: id, betyg, datum, språk, "Köpt", antal foton och
//          originaltexten. Aldrig namn eller land.
//   torr   kontrollerar rundans beslut (recensioner.json) och skriver inget.
//   skriv  samma kontroll, skriver, och läser tillbaka.
//
// Fem egenskaper som inte ska tas bort:
//
//   1. ☠️ VARJE VÄNTANDE RECENSION FÅR ETT BESLUT. Översätt eller dölj. En
//      plan som lämnar en väntande rad obeslutad skriver ingenting, så att
//      ingen recension blir liggande osynlig utan att någon valt det.
//   2. ☠️ BESLUTET GÄLLER PRODUKTENS EGEN RAD. Samma recensions-id kan finnas
//      på flera produkter (samma text hos syskon), så id:t slås upp per
//      produkt, aldrig globalt.
//   3. ☠️ ALLT ELLER INGET. Faller ett beslut i kontrollen skrivs ingenting i
//      hela anropet. En halvt översatt produkt syns inte i någon räknare.
//   4. ☠️ KUNDENS EGNA OMDÖMEN RÖRS INTE. De är redan svenska och godkänns i
//      /admin/reviews av Leonard.
//   5. Svaret bär bara id, antal och skäl, aldrig texterna: loggen är publik.
//   7. ☠️ EN RECENSION VARS ORIGINAL BÄR ETT NAMN KAN INTE ÖVERSÄTTAS. Namnet
//      (recensentens eget, eller ett namn efter en hälsning som "Liebe Grüße")
//      redigeras bort i läsningen, för recensioner-kalla.json committas till
//      det publika repot. Husets regel sedan omgång 5 (2026-09-30): en sådan
//      recension döljs.
//   6. ☠️ EN VEVOR-RECENSION BESLUTAS BARA NÄR DEN GÄLLER PRODUKTENS EGEN
//      ARTIKEL. VEVOR visar en familjs recensioner på varje artikel, och en
//      översättning publicerar raden för gott: verktyget för recensioner om en
//      annan artikel (lib/vevor/recensionsartikel.ts) rör aldrig en publicerad
//      rad. En rad om en annan artikel, eller vars artikel inte går att avgöra,
//      tas inte med i läsningen, får inget beslut och räknas för sig.

import { isVisibleStatus, type StoredReview } from "../store/reviews";
import { isCustomerReview } from "./queue";
import { validateTranslation } from "./translate";
import { artikelnummerformer, redigera } from "../polish/skrivplan";
import { reviewImages } from "./images";
import { isExternalSupplierImage } from "../wix/media-import";
import { recensionsnyckel } from "../vevor/recensionsfoton";

/** En runda är ungefär åtta produkter. Taket håller anropet inom ruttens tid. */
export const MAX_PRODUKTER = 20;
/** Läs så här många rader per produkt. Importen sparar högst tio per artikel. */
export const MAX_RADER_PER_PRODUKT = 500;
const MAX_TEXT = 2000;
const MAX_SKAL = 200;

/**
 * Husets stil för recensionernas svenska (CLAUDE.md, *Recensionernas svenska
 * ska låta som en kund*, 2026-09-24) och tvätten av det som inte får stå i en
 * kundtext. Varje regel har ett namn, för skälet går till en publik logg.
 */
const STIL: ReadonlyArray<[string, RegExp]> = [
  ["tankstreck", /[–—]| - /],
  // En blinkande smilis (";)", ";-)", ";D") står kvar som kunden skrev den
  // (Leonard 2026-10-31). Ett semikolon mellan två satser gör det inte.
  ["semikolon", /;(?!-?[)(DPp])/],
  ["citattecken", /["“”„«»]/],
  ["tre punkter", /…|\.\.\./],
  ["AI-fras", /\b(sammantaget|sammanfattningsvis|helt och hållet|förhållandet mellan pris och kvalitet|kan varmt rekommenderas|ett riktigt blickfång)\b/i],
  ["marknadsplats eller leverantör", /\b(aliexpress|ali express|alibaba|amazon|temu|ebay|aosom|vevor|homcom|outsunny|pawhut|aiyaplay|vinsetto|kleankin|zonekiz|sportnow|durhand)\b/i],
  ["budfirma", /\b(dhl|ups|postnord|gls|dpd|hermes|bring|schenker|inpost|fedex|budbee|instabox|early bird)\b/i],
  ["pris", /\d\s*(?:kr|kronor|sek|eur|euro|usd|dollar|pln)(?![a-zåäö])|\d\s*(?:€|\$|zł)|[€$]\s*\d/i],
  ["säljare eller kundtjänst", /(?<![a-zåäö])(?:säljaren|säljare|kundtjänst|kundtjänsten|kundservice)(?![a-zåäö])/i],
];

/** Stilfelen i en översättning, som namn. Tom lista = inga fel. */
export function stilfel(sv: string): string[] {
  const fel: string[] = [];
  for (const [namn, re] of STIL) if (re.test(sv)) fel.push(namn);
  if (artikelnummerformer(sv) > 0) fel.push("artikelnummerform");
  return fel;
}

// --- Namn i originaltexten -------------------------------------------------------

/**
 * En signatur i slutet av texten: en hälsning, på leverantörernas språk, och
 * ett eller två ord med versal ("Liebe Grüße, Klaus M."). Hälsningen läses
 * utan hänsyn till skiftläge, namnet måste börja med versal och stå sist, så
 * att en mening som börjar efter "Saludos." inte tas för ett namn.
 */
const SIGNATUR =
  /(?<![\p{L}])(?:mit freundlichen gr(?:ü|ue)(?:ß|ss)en|freundliche gr(?:ü|ue)(?:ß|ss)e|liebe gr(?:ü|ue)(?:ß|ss)e|viele gr(?:ü|ue)(?:ß|ss)e|gr(?:ü|ue)(?:ß|ss)e|gru(?:ß|ss)|lg|mfg|best regards|kind regards|regards|saludos|un saludo|cordialement|cordiali saluti|saluti|met vriendelijke groet|groetjes|pozdrawiam|med vänlig hälsning|mvh|hälsningar)[\s,]+/giu;
const SIGNATURNAMN = /^(\p{Lu}[\p{L}'-]*(?:\s+\p{Lu}[\p{L}'.-]*)?)[\s.!]*$/u;

/** Delarna av recensentens namn som går att leta efter: minst tre bokstäver, inte maskerade. */
function namndelar(namn: string | undefined): string[] {
  return String(namn ?? "")
    .split(/[^\p{L}*]+/u)
    .filter((d) => d.length >= 3 && !d.includes("*"));
}

/**
 * Originaltexten med namn bortredigerade, och om något namn fanns. Ren.
 * Letar efter recensentens eget namn (hela ord, oavsett skiftläge) och efter
 * ett namn direkt efter en hälsning.
 */
export function utanNamn(r: Pick<StoredReview, "textOriginal" | "customerNameRaw">): { text: string; namn: boolean } {
  let text = String(r.textOriginal ?? "");
  let namn = false;
  for (const del of namndelar(r.customerNameRaw)) {
    const re = new RegExp(`(?<![\\p{L}])${del.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}])`, "giu");
    if (re.test(text)) {
      namn = true;
      text = text.replace(re, "‹NAMN›");
    }
  }
  for (const m of text.matchAll(SIGNATUR)) {
    const efter = text.slice((m.index ?? 0) + m[0].length);
    const vem = SIGNATURNAMN.exec(efter);
    if (vem) {
      namn = true;
      text = text.slice(0, (m.index ?? 0) + m[0].length) + "‹NAMN›";
      break;
    }
  }
  return { text, namn };
}

/** Raden väntar på ett beslut: dold för kunden, inte ett eget kundomdöme. */
export function vantarPaBeslut(r: StoredReview): boolean {
  return r.status === "pending" && !isCustomerReview(r);
}

/** Vilken artikel en VEVOR-recension gäller, sett från produkten. */
export type Artikelstatus = "egen" | "annan" | "okand";
/**
 * Recensions-id → artikelstatus för en VEVOR-produkt. `null` betyder att
 * produkten inte är en VEVOR-produkt, och då går varje väntande rad att besluta.
 */
export type Artikelkarta = ReadonlyMap<string, Artikelstatus> | null;

/**
 * Artikelstatus per rad. Radens egen artikel (`vevorArtikel`, satt av importen
 * sedan 2026-10-30) går först. Annars avläsningarnas artikel per
 * recensionstext (`artikelPerText` i lib/vevor/recensionsartikel.ts): en
 * avläsning bär bara sidans senaste recensioner, så en äldre rad kan saknas
 * där och blir då okänd. Ren.
 */
export function artikelkartaFor(
  rader: ReadonlyArray<StoredReview>,
  artiklar: ReadonlySet<string>,
  perText: ReadonlyMap<string, string | null>,
): Map<string, Artikelstatus> {
  const ut = new Map<string, Artikelstatus>();
  for (const r of rader) {
    const artikel = r.vevorArtikel || perText.get(recensionsnyckel(String(r.textOriginal ?? "")));
    ut.set(r.reviewIdAE, artikel === undefined || artikel === null ? "okand" : artiklar.has(artikel) ? "egen" : "annan");
  }
  return ut;
}

/** Raden väntar och går att besluta här: på en VEVOR-produkt bara om den egna artikeln. */
export function beslutbar(r: StoredReview, karta: Artikelkarta): boolean {
  return vantarPaBeslut(r) && (karta === null || karta.get(r.reviewIdAE) === "egen");
}

/**
 * Står raden redan som beslutet säger? Då är en omkörning efter en avbruten
 * skrivning ofarlig: raden räknas som gjord och skrivs inte igen.
 */
export function redanGjord(r: StoredReview, beslut: { sv?: string; dolj?: boolean }): boolean {
  if (isCustomerReview(r)) return false;
  if (beslut.dolj) return r.status === "rejected";
  return isVisibleStatus(r.status) && String(r.textSwedish ?? "").trim() === beslut.sv;
}

// --- Läsningen -----------------------------------------------------------------

export interface KallRad {
  id: string;
  betyg: number;
  datum?: string;
  sprak?: string;
  kopt?: string;
  foton: number;
  /** Originalet bär ett namn (bortredigerat). Recensionen ska döljas. */
  namn?: true;
  /** Originaltexten, med namn och artikelnummerformer redigerade. */
  text: string;
}

export interface KallProdukt {
  productId: string;
  /** Redan synliga på produktsidan. */
  synliga: number;
  /** Dolda (avvisade eller dolda av ett verktyg). */
  dolda: number;
  /** Butikens egna kunders omdömen som väntar på Leonard. */
  kundVantar: number;
  /** VEVOR: väntande om en annan artikel. VEVOR-verktyget döljer dem. */
  annanArtikel: number;
  /** VEVOR: väntande vars artikel inte går att avgöra. Läs om efter VEVOR-läsaren. */
  okandArtikel: number;
  attBesluta: KallRad[];
}

export function kallaFor(productId: string, rader: ReadonlyArray<StoredReview>, karta: Artikelkarta): KallProdukt {
  const ut: KallProdukt = {
    productId,
    synliga: 0,
    dolda: 0,
    kundVantar: 0,
    annanArtikel: 0,
    okandArtikel: 0,
    attBesluta: [],
  };
  for (const r of rader) {
    if (r.productId !== productId) continue;
    if (isVisibleStatus(r.status)) ut.synliga++;
    else if (r.status === "rejected") ut.dolda++;
    else if (isCustomerReview(r)) ut.kundVantar++;
    if (!vantarPaBeslut(r)) continue;
    if (!beslutbar(r, karta)) {
      if (karta?.get(r.reviewIdAE) === "annan") ut.annanArtikel++;
      else ut.okandArtikel++;
      continue;
    }
    ut.attBesluta.push({
      id: r.reviewIdAE,
      betyg: r.rating,
      datum: r.date || undefined,
      sprak: r.sourceLanguage || undefined,
      kopt: r.kopt || undefined,
      foton: reviewImages(r).length,
      ...(utanNamn(r).namn ? { namn: true as const } : {}),
      text: redigera(utanNamn(r).text),
    });
  }
  ut.attBesluta.sort((a, b) => b.betyg - a.betyg || String(b.datum ?? "").localeCompare(String(a.datum ?? "")));
  return ut;
}

// --- Besluten ------------------------------------------------------------------

export interface ProduktBeslut {
  productId: string;
  /** Recensions-id → svensk text. Raden publiceras. */
  oversatt: Record<string, string>;
  /** Recensions-id → skäl. Raden döljs. */
  dolj: Record<string, string>;
}

/**
 * Läser en begäran om att pröva eller skriva besluten: `produkter` är rundans
 * alla produkter och `beslut` besluten för dem. Svaret har ett beslut per
 * produkt i `produkter`, i samma ordning; en produkt utan beslut får ett tomt.
 *
 * ☠️ PRODUKTERNA ÄR RUNDANS ALLA, INTE BARA DE SOM HAR BESLUT. En produkt som
 * saknas i recensioner.json prövas ändå, och har den väntande recensioner
 * fäller den anropet (punkt 1). Annars hade en glömd produkt gått igenom.
 */
export function tolkaBeslut(x: unknown): { beslut: ProduktBeslut[] } | { fel: string[] } {
  const o0 = x && typeof x === "object" ? (x as { produkter?: unknown; beslut?: unknown }) : {};
  const produkter = Array.isArray(o0.produkter)
    ? o0.produkter.filter((p): p is string => typeof p === "string").map((p) => p.trim()).filter(Boolean)
    : [];
  if (produkter.length === 0) return { fel: ["`produkter` (rundans alla produkter) saknas eller är tom"] };
  if (produkter.length > MAX_PRODUKTER) return { fel: [`för många produkter (${produkter.length} > ${MAX_PRODUKTER})`] };
  if (new Set(produkter).size !== produkter.length) return { fel: ["`produkter` har samma produkt två gånger"] };
  const rå = o0.beslut === undefined ? [] : o0.beslut;
  if (!Array.isArray(rå)) return { fel: ["`beslut` ska vara en lista"] };
  const fel: string[] = [];
  const perProdukt = new Map<string, ProduktBeslut>();
  rå.forEach((p, i) => {
    if (!p || typeof p !== "object") return void fel.push(`produkt ${i}: inte ett objekt`);
    const o = p as Record<string, unknown>;
    const productId = typeof o.productId === "string" ? o.productId.trim() : "";
    if (!productId) return void fel.push(`produkt ${i}: productId saknas`);
    if (!produkter.includes(productId)) return void fel.push(`${productId}: står inte bland rundans produkter`);
    if (perProdukt.has(productId)) return void fel.push(`${productId}: står två gånger`);
    const oversatt: Record<string, string> = {};
    const dolj: Record<string, string> = {};
    for (const [falt, mal, max] of [["oversatt", oversatt, MAX_TEXT], ["dolj", dolj, MAX_SKAL]] as const) {
      const v = o[falt];
      if (v === undefined) continue;
      if (!v || typeof v !== "object" || Array.isArray(v)) {
        fel.push(`${productId}: ${falt} ska vara ett objekt id → text`);
        continue;
      }
      for (const [id, text] of Object.entries(v as Record<string, unknown>)) {
        if (typeof text !== "string" || !text.trim() || text.length > max) {
          fel.push(`${productId}/${id}: ${falt} ska vara en text på 1–${max} tecken`);
          continue;
        }
        mal[id.trim()] = text.trim();
      }
    }
    perProdukt.set(productId, { productId, oversatt, dolj });
  });
  if (fel.length > 0) return { fel };
  return { beslut: produkter.map((id) => perProdukt.get(id) ?? { productId: id, oversatt: {}, dolj: {} }) };
}

/**
 * Prövar en produkts beslut mot dess rader. Returnerar felen, som
 * `<productId>/<id>: <skäl>` eller `<productId>: <skäl>`. Tom lista = beslutet
 * kan skrivas.
 */
export function provaBeslut(b: ProduktBeslut, rader: ReadonlyArray<StoredReview>, karta: Artikelkarta): string[] {
  const fel: string[] = [];
  const egna = new Map(rader.filter((r) => r.productId === b.productId).map((r) => [r.reviewIdAE, r]));
  const vantar = [...egna.values()].filter((r) => beslutbar(r, karta));
  const vantarIds = new Set(vantar.map((r) => r.reviewIdAE));

  for (const id of Object.keys(b.oversatt)) {
    if (id in b.dolj) fel.push(`${b.productId}/${id}: står både som översatt och dold`);
  }
  for (const id of [...Object.keys(b.oversatt), ...Object.keys(b.dolj)]) {
    if (vantarIds.has(id)) continue;
    const r = egna.get(id);
    if (r && redanGjord(r, { sv: b.oversatt[id], dolj: id in b.dolj })) continue;
    if (!r) fel.push(`${b.productId}/${id}: finns inte på produkten`);
    else if (isCustomerReview(r)) fel.push(`${b.productId}/${id}: ett eget kundomdöme, rörs inte`);
    else if (vantarPaBeslut(r) && karta?.get(id) === "annan") {
      fel.push(`${b.productId}/${id}: gäller en annan artikel, VEVOR-verktyget döljer den`);
    } else if (vantarPaBeslut(r)) fel.push(`${b.productId}/${id}: artikeln går inte att avgöra, läs om senare`);
    else fel.push(`${b.productId}/${id}: väntar inte (status ${r.status})`);
  }
  for (const [id, sv] of Object.entries(b.oversatt)) {
    const r = egna.get(id);
    if (!r || !vantarIds.has(id)) continue;
    if (utanNamn(r).namn) fel.push(`${b.productId}/${id}: originalet bär ett namn, dölj recensionen`);
    const dom = validateTranslation(r.textOriginal, sv);
    if (!dom.ok) fel.push(`${b.productId}/${id}: ${dom.reason ?? "underkänd"}`);
    for (const s of stilfel(sv)) fel.push(`${b.productId}/${id}: ${s}`);
  }
  const obeslutade = vantar.filter((r) => !(r.reviewIdAE in b.oversatt) && !(r.reviewIdAE in b.dolj));
  if (obeslutade.length > 0) {
    fel.push(`${b.productId}: ${obeslutade.length} väntande utan beslut (${obeslutade.map((r) => r.reviewIdAE).slice(0, 5).join(", ")})`);
  }
  return fel;
}

// --- Restlistan ----------------------------------------------------------------

/** En publicerad produkt med väntande recensioner som någon ska besluta om. */
export interface RestKandidat {
  productId: string;
  /** Väntande rader som inte är kundens egna. */
  vantande: number;
  /** Någon rad kommer från VEVOR: artikelstatus räknas per rad innan den listas. */
  vevor: boolean;
}

/**
 * Publicerade produkter med väntande recensioner från leverantören. Recensioner
 * kan bli väntande efter poleringen (en senare inläsning, eller en VEVOR-rad
 * vars artikel blivit känd), och då fångar restlistan dem. Butikens egna
 * kunders omdömen räknas inte: dem godkänner Leonard. Ren.
 */
export function restKandidater(
  vantande: ReadonlyArray<{ productId: string; source?: string; antal: number }>,
  synliga: ReadonlySet<string>,
): RestKandidat[] {
  const per = new Map<string, RestKandidat>();
  for (const v of vantande) {
    if (!synliga.has(v.productId) || v.source === "customer" || !(v.antal > 0)) continue;
    const k = per.get(v.productId) ?? { productId: v.productId, vantande: 0, vevor: false };
    k.vantande += v.antal;
    if (v.source === "vevor") k.vevor = true;
    per.set(v.productId, k);
  }
  return [...per.values()].sort((a, b) => b.vantande - a.vantande || a.productId.localeCompare(b.productId));
}

// --- Skrivningen ---------------------------------------------------------------

export interface PoleringDeps {
  listByProduct: (productId: string) => Promise<StoredReview[]>;
  /** Artikelstatus per rad på en VEVOR-produkt, `null` för andra. Obligatorisk: en valfri dep glöms. */
  artikelkarta: (productId: string, rader: StoredReview[]) => Promise<Artikelkarta>;
  editText: (productId: string, reviewIdAE: string, svenska: string) => Promise<void>;
  setStatus: (productId: string, reviewIdAE: string, status: "rejected") => Promise<void>;
  /** Säger till butiken. Kastar aldrig; svaret står i summeringen. */
  meddelaButiken: (productIds: string[]) => Promise<{ uppdaterade: number; misslyckade: number; utanNyckel: boolean }>;
}

export interface ProduktUtfall {
  productId: string;
  oversatta: number;
  dolda: number;
  /** Stod redan som beslutet (en omkörning). Skrivs inte igen. */
  redan: number;
  /** Rader som inte läste tillbaka som planen. Ska vara noll. */
  avvikelser: string[];
}

export interface PoleringSvar {
  dryRun: boolean;
  ok: boolean;
  fel: string[];
  produkter: ProduktUtfall[];
  butiken?: { uppdaterade: number; misslyckade: number; utanNyckel: boolean };
}

export async function polera(beslut: ProduktBeslut[], dryRun: boolean, deps: PoleringDeps): Promise<PoleringSvar> {
  const rader = new Map<string, StoredReview[]>();
  const kartor = new Map<string, Artikelkarta>();
  for (const b of beslut) {
    const r = await deps.listByProduct(b.productId);
    rader.set(b.productId, r);
    kartor.set(b.productId, await deps.artikelkarta(b.productId, r));
  }

  const fel = beslut.flatMap((b) => provaBeslut(b, rader.get(b.productId) ?? [], kartor.get(b.productId) ?? null));
  const svar: PoleringSvar = { dryRun, ok: fel.length === 0, fel, produkter: [] };
  if (fel.length > 0) return svar;

  for (const b of beslut) {
    const fore = new Map((rader.get(b.productId) ?? []).map((r) => [r.reviewIdAE, r]));
    const gjord = (id: string, beslut: { sv?: string; dolj?: boolean }) => {
      const r = fore.get(id);
      return r !== undefined && redanGjord(r, beslut);
    };
    const attOversatta = Object.entries(b.oversatt).filter(([id, sv]) => !gjord(id, { sv }));
    const attDolja = Object.keys(b.dolj).filter((id) => !gjord(id, { dolj: true }));
    const utfall: ProduktUtfall = {
      productId: b.productId,
      oversatta: attOversatta.length,
      dolda: attDolja.length,
      redan: Object.keys(b.oversatt).length + Object.keys(b.dolj).length - attOversatta.length - attDolja.length,
      avvikelser: [],
    };
    svar.produkter.push(utfall);
    if (dryRun) continue;
    for (const [id, sv] of attOversatta) await deps.editText(b.productId, id, sv);
    for (const id of attDolja) await deps.setStatus(b.productId, id, "rejected");

    // Läs tillbaka: ett svar utan fel är inget kvitto.
    const efter = new Map((await deps.listByProduct(b.productId)).map((r) => [r.reviewIdAE, r]));
    for (const [id, sv] of Object.entries(b.oversatt)) {
      const r = efter.get(id);
      if (!r || !isVisibleStatus(r.status) || String(r.textSwedish ?? "").trim() !== sv) {
        utfall.avvikelser.push(`${id}: inte publicerad med texten`);
      } else if (reviewImages(r).some(isExternalSupplierImage)) {
        // Hemflytten sker när raden blir synlig (withOwnImage). Faller den
        // står leverantörens adress kvar på en publicerad recension.
        utfall.avvikelser.push(`${id}: fotot ligger kvar hos leverantören`);
      }
    }
    for (const id of Object.keys(b.dolj)) {
      if (efter.get(id)?.status !== "rejected") utfall.avvikelser.push(`${id}: inte dold`);
    }
  }

  if (!dryRun) {
    const andrade = svar.produkter.filter((p) => p.oversatta + p.dolda > 0).map((p) => p.productId);
    if (andrade.length > 0) svar.butiken = await deps.meddelaButiken(andrade);
    if (svar.produkter.some((p) => p.avvikelser.length > 0)) svar.ok = false;
  }
  return svar;
}
