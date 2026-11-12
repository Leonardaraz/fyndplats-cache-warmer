// lib/kontakt/kontakt.ts
//
// Kontaktvägarna bär produkten (Leonard 2026-11-07: "när folk mailar oss om
// produkter så blir det lätt för dom att visa vilken dom menar").
//
// Rena funktioner för tre saker, i den här ordningen:
//   1. Länkarna: produktsidans flik "Kontakta oss" länkar till formuläret med
//      produkten förvald (/kontaktaoss#produkt=<slug>&variant=<id>), och
//      e-postlänken öppnar kundens mejlprogram med produkten i ämnesraden och
//      länken i texten.
//   2. Produkten i formuläret: valen (färg, storlek …), priset och det som
//      visas för det utpekade valet. Formulärets kort och mejlet går genom
//      samma regel (medValt).
//   3. Mejlet till kundtjänst, med produkten överst.
//
// Filen importerar ingenting vid körning (bara typer), så att node:test kan
// läsa den; formateringen av pris och valnamn skickas in (lib/kontakt/produkt.ts).
// Produktsidan tar bara avsnitt 1; resten skakas bort ur dess JavaScript
// (kontrollerat i förhandsbyggets filer 2026-11-07).

import type { Product } from "../products";

export const BUTIK = "https://www.fyndplats.se";
export const KUNDTJANST_EPOST = "info@fyndplats.com";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── 1. Länkarna ─────────────────────────────────────────────────────────────

// Alla 6 016 produktadresser i webbplatskartan (2026-11-07) har den här formen,
// den längsta 68 tecken.
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,159}$/;
const VARIANT_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Wix id för "ingen variant" på en produkt utan val.
const TOM_VARIANT = "00000000-0000-0000-0000-000000000000";

export function giltigSlug(s: unknown): s is string {
  return typeof s === "string" && SLUG_RE.test(s);
}

export function giltigVariant(s: unknown): s is string {
  return typeof s === "string" && VARIANT_RE.test(s) && s !== TOM_VARIANT;
}

/**
 * Variantens id i den form valen och ?variant= har (gemener), eller inget när
 * värdet inte är ett variant-id. Id jämförs med ===, så varje väg in går hit.
 */
export function normVariant(s: unknown): string | undefined {
  return giltigVariant(s) ? s.toLowerCase() : undefined;
}

/** Vilken produkt (och variant) kunden pekar ut. Bara giltiga värden. */
export type KontaktReferens = { slug: string; variantId?: string };

/** Läser produkt= och variant= ur en parametersträng. Ett ogiltigt värde räknas som saknat. */
export function lasKontaktParams(sokdel: string): KontaktReferens | null {
  const p = new URLSearchParams(sokdel);
  const slug = p.get("produkt");
  if (!giltigSlug(slug)) return null;
  const variantId = normVariant(p.get("variant"));
  return variantId ? { slug, variantId } : { slug };
}

/**
 * Förvalet ur adressen efter sökvägen, alltså sökdelen följd av fragmentet
 * (`location.search + location.hash`). Fragmentet går först: det är formen
 * produktsidan länkar med sedan 2026-11-11. Sökdelen läses fortfarande, för
 * länkar som redan ligger i mejl och bokmärken (?produkt=…#meddelande).
 */
export function lasKontaktAdress(efterSokvag: string): KontaktReferens | null {
  const i = efterSokvag.indexOf("#");
  const sokdel = i < 0 ? efterSokvag : efterSokvag.slice(0, i);
  const fragment = i < 0 ? "" : efterSokvag.slice(i + 1);
  return lasKontaktParams(fragment) ?? lasKontaktParams(sokdel);
}

/** Produktsidans sökväg, med varianten när den finns (samma ?variant= som sidan själv sätter). */
export function produktSokvag(ref: KontaktReferens): string {
  return `/produkt/${ref.slug}` + (ref.variantId ? `?variant=${ref.variantId}` : "");
}

/** Produktsidans fullständiga adress, för mejl och e-postlänkar. */
export function produktUrl(ref: KontaktReferens): string {
  return BUTIK + produktSokvag(ref);
}

/** Formulärkortets id på /kontaktaoss, dit förvalda länkar rullar. */
export const KONTAKT_ANKARE = "meddelande";

/**
 * Formuläret med produkten förvald.
 *
 * ☠️ Förvalet står i FRAGMENTET, aldrig i sökdelen (2026-11-11). Med
 * ?produkt=<slug> fick varje produktsida en egen adress till samma formulär:
 * Semrush läste cirka 5 700 av dem som egna sidor, 47 % av hela sin
 * genomsökning, och varje sökmotor som följer länken gör samma sak. Det som
 * står efter # skickas aldrig till servern och räknas inte som en ny sida.
 * Ankaret #meddelande ryms då inte i adressen, så sidan rullar själv till
 * formuläret (KONTAKT_RULLA_SKRIPT nedan och useValdProdukt).
 */
export function kontaktHref(ref: KontaktReferens): string {
  const q = new URLSearchParams({ produkt: ref.slug });
  if (ref.variantId) q.set("variant", ref.variantId);
  return `/kontaktaoss#${q.toString()}`;
}

/**
 * Rullar till formuläret när adressen bär ett förval i fragmentet. Står som
 * ett litet skript sist på /kontaktaoss, så att det körs medan sidan läses in
 * och inte först när React har vaknat: kunden landar vid formuläret direkt,
 * som med ett vanligt ankare. Kortets scroll-margin-top gäller som förut.
 */
export const KONTAKT_RULLA_SKRIPT =
  `(function(){try{if(/^#produkt=/.test(location.hash)){var e=document.getElementById(${JSON.stringify(KONTAKT_ANKARE)});if(e)e.scrollIntoView()}}catch(_){}})()`;

/** Kortar en text på ett ordgräns-oberoende sätt, med "…" sist när den kortades. */
export function kortText(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : t.slice(0, max - 1).trimEnd() + "…";
}

/** Ämnesraden när kunden mejlar från produktsidan. */
export function amneFor(namn: string): string {
  return `Fråga om: ${kortText(namn, 120)}`;
}

export type LankProdukt = KontaktReferens & { namn: string; val?: string | null };

/**
 * E-postlänken med ämne och text ifyllda. Radbrytningarna skrivs som %0D%0A och
 * mellanslagen som %20 (RFC 6068), inte som "+", som flera mejlprogram visar
 * bokstavligt.
 */
export function mailtoHref(p: LankProdukt): string {
  const rader = ["Hej!", "", "Jag har en fråga om:", p.val ? `${p.namn} (${p.val})` : p.namn, produktUrl(p), "", ""];
  return (
    `mailto:${KUNDTJANST_EPOST}` +
    `?subject=${encodeURIComponent(amneFor(p.namn))}` +
    `&body=${encodeURIComponent(rader.join("\r\n"))}`
  );
}

/**
 * Fliken "Kontakta oss" när produktens beskrivning inte har en egen. Statisk
 * och IDENTISK på varje produktsida (Leonards krav: alltid med); bara länkarna
 * byts mot produktens (kontaktFlikLankar nedan, components/productview.tsx).
 * Provet läser samma sträng, så att en ändrad länk här fäller provet i stället
 * för att tyst sluta byta på sidorna.
 */
export const KONTAKT_FLIK_HTML =
  "<p>Har du en fråga om den här produkten – mått, material, leverans eller något annat? Vi svarar normalt inom 24 timmar på vardagar.</p>" +
  "<ul>" +
  `<li>E-post: <a href="mailto:${KUNDTJANST_EPOST}">${KUNDTJANST_EPOST}</a></li>` +
  '<li>Telefon: <a href="tel:+46736630990">+46 73 663 09 90</a></li>' +
  '<li>Mer hjälp: <a href="/kontaktaoss">Kontakta oss</a> · <a href="/vanliga-fragor">Vanliga frågor</a></li>' +
  "</ul>";

const regexText = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Formulärets adress, med eller utan domän, snedstreck sist eller ankare.
const KONTAKT_HREF_RE = /href=(["'])(?:https?:\/\/(?:www\.)?fyndplats\.se)?\/kontaktaoss\/?(?:#[^"']*)?\1/gi;
// Kundtjänstens adress, med eller utan ett ämne som redan står där.
const MAILTO_HREF_RE = new RegExp(`href=(["'])mailto:${regexText(KUNDTJANST_EPOST)}(?:\\?[^"']*)?\\1`, "gi");

/**
 * Flikens länkar till formuläret och kundtjänstens e-post, med produkten.
 * Bara adresserna byts; texten i fliken är densamma på varje produktsida
 * (Leonards krav). Telefonlänken och andra länkar lämnas orörda. Fliken kan
 * också komma ur beskrivningen (V1:s egna block), därför byts länkarna i
 * HTML:en och inte i en mall.
 */
export function kontaktFlikLankar(html: string, p: LankProdukt): string {
  return html
    .replace(KONTAKT_HREF_RE, () => `href="${esc(kontaktHref(p))}"`)
    .replace(MAILTO_HREF_RE, () => `href="${esc(mailtoHref(p))}"`);
}

// ── 2. Produkten i formuläret: valen och priset ────────────────────────────

export type KontaktVal = { id: string; namn: string; iLager: boolean; pris: string; bild?: string };

export type ValKalla = Pick<Product, "options" | "variantAxes" | "variantTable">;
export type PrisKalla = Pick<Product, "price" | "priceNum" | "priceFrom" | "priceFromNum" | "hasRange">;

/** Fler val än så här visas inte i väljaren (den största familjen hade 48, 2026-11-07). */
export const MAX_VAL = 60;

/**
 * Prisets och valnamnens format, samma som på produktsidan och i sökförslagen
 * (formatPrice, listPris och visaValnamn).
 */
export type Formatering = {
  pris: (kronor: number) => string;
  listPris: (p: PrisKalla) => string;
  valnamn: (etikett: string) => string;
};

/**
 * Valen i sidans ordning. Med flera axlar (Färg × Storlek) blir varje rad i
 * varianttabellen ett val med axlarnas värden i axlarnas ordning ("Röd ·
 * 140 × 200 cm"); med en axel blir varje val ett val. Bara val med ett riktigt
 * variant-id kommer med, och namnen är de som produktsidan visar (visaValnamn).
 */
export function kontaktVal(p: ValKalla, f: Formatering): KontaktVal[] {
  const axlar = (p.variantAxes ?? []).map((a) => a.name);
  const rader = p.variantTable?.length
    ? p.variantTable.map((r) => ({
        variantId: r.variantId,
        namn: (axlar.length ? axlar.map((a) => r.choices[a]).filter(Boolean) : Object.values(r.choices)).map(f.valnamn).join(" · "),
        iLager: r.inStock,
        priceNum: r.priceNum,
        price: r.price,
        bild: r.image,
      }))
    : (p.options?.choices ?? []).map((c) => ({
        variantId: c.variantId,
        namn: f.valnamn(c.label),
        iLager: c.inStock !== false,
        priceNum: c.priceNum,
        price: c.price,
        bild: c.image,
      }));
  return rader
    .filter((r) => giltigVariant(r.variantId))
    .slice(0, MAX_VAL)
    .map((r) => ({
      id: r.variantId.toLowerCase(),
      namn: r.namn,
      iLager: r.iLager,
      pris: r.priceNum ? f.pris(r.priceNum) : r.price || "",
      ...(r.bild ? { bild: r.bild } : {}),
    }));
}

/** Det formuläret visar och mejlet bygger på. Bara uppgifter som redan står på produktsidan. */
export type KontaktProdukt = {
  slug: string;
  namn: string;
  bild: string;
  pris: string;
  url: string;
  iLager: boolean;
  /** Produktens val, tomt för en produkt utan val. */
  val: KontaktVal[];
  /** Namnet på det utpekade valet, när det finns bland valen. */
  valtNamn?: string;
};

/** Det som visas för ett utpekat val: valets bild, pris och lager när valet har dem, annars produktens. */
export type ValtVisat = { valt?: KontaktVal; bild: string; pris: string; iLager: boolean; sokvag: string };

/**
 * Regeln för det utpekade valet, delad av formulärets kort
 * (components/kontakt-produkt.tsx) och mejlet (byggKontaktProdukt). Ett okänt
 * eller ogiltigt variant-id räknas som inget val.
 */
export function medValt(p: Pick<KontaktProdukt, "slug" | "bild" | "pris" | "iLager" | "val">, variantId: string | undefined): ValtVisat {
  const id = normVariant(variantId);
  const valt = id ? p.val.find((v) => v.id === id) : undefined;
  return {
    valt,
    bild: valt?.bild || p.bild,
    pris: valt?.pris || p.pris,
    iLager: valt ? valt.iLager : p.iLager,
    sokvag: produktSokvag({ slug: p.slug, variantId: valt?.id }),
  };
}

export type ProduktKalla = Pick<Product, "slug" | "name" | "img" | "inStock"> & ValKalla & PrisKalla;

/** Produkten med det utpekade valet. Ett okänt variant-id räknas som inget val. */
export function byggKontaktProdukt(p: ProduktKalla, variantId: string | undefined, f: Formatering): KontaktProdukt {
  const bas = { slug: p.slug, namn: p.name, bild: p.img, pris: f.listPris(p), iLager: p.inStock, val: kontaktVal(p, f) };
  const { valt, bild, pris, iLager, sokvag } = medValt(bas, variantId);
  return { ...bas, bild, pris, iLager, url: BUTIK + sokvag, ...(valt ? { valtNamn: valt.namn } : {}) };
}

// ── 3. Mejlet till kundtjänst ──────────────────────────────────────────────
//
// Har kunden pekat ut en produkt står den överst, med bild, namn, val, pris och
// länk, och ämnesraden börjar med produkten, så att det syns redan i inkorgen
// vilken vara frågan gäller. Uppgifterna kommer ur katalogen
// (lib/kontakt/produkt.ts), aldrig ur det som kunden skickade, och
// leverantörens artikelnummer står aldrig här.

export type MejlProdukt =
  // bild: den lilla JPG:n (wixMejlBild i lib/wix-media-key.ts), eller tom.
  | { typ: "hittad"; namn: string; url: string; pris: string; bild: string; valtNamn?: string; iLager: boolean }
  // Slugen var giltig men uppslaget svarade inte i tid eller felade: mejlet går
  // ändå, med länken byggd ur slugen.
  | { typ: "okand"; slug: string; url: string };

export type Kontaktmejl = { subject: string; text: string; html: string };

function produktRaderText(p: MejlProdukt): string {
  if (p.typ === "okand") return `Produkt: kunde inte hämtas just nu (${p.slug})\nLänk: ${p.url}`;
  return [
    `Produkt: ${p.namn}`,
    p.valtNamn ? `Val: ${p.valtNamn}` : "",
    `Pris: ${p.pris}${p.iLager ? "" : " (slutsåld)"}`,
    `Länk: ${p.url}`,
  ]
    .filter(Boolean)
    .join("\n");
}

const TEXTSTIL = "font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.45;color:#1F1A17";

function produktRutaHtml(p: MejlProdukt): string {
  if (p.typ === "okand") {
    return (
      `<p style="${TEXTSTIL};margin:0 0 18px">Frågan gäller en produkt som inte gick att hämta just nu: ` +
      `<a href="${esc(p.url)}">${esc(p.url)}</a></p>`
    );
  }
  const bild = p.bild
    ? `<td style="padding:10px;vertical-align:top"><a href="${esc(p.url)}"><img src="${esc(p.bild)}" width="72" height="72" alt="" style="display:block;width:72px;height:72px;border:0;border-radius:6px"></a></td>`
    : "";
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E7E1D8;border-radius:10px;border-collapse:separate;margin:0 0 18px">` +
    `<tr>${bild}<td style="padding:10px 16px 10px ${bild ? "4px" : "14px"};vertical-align:top;${TEXTSTIL}">` +
    `<div style="font-size:12px;color:#7A6F66">Frågan gäller</div>` +
    `<a href="${esc(p.url)}" style="color:#1F1A17;font-weight:bold;text-decoration:none">${esc(p.namn)}</a>` +
    (p.valtNamn ? `<div>Val: ${esc(p.valtNamn)}</div>` : "") +
    `<div>${esc(p.pris)}${p.iLager ? "" : " · Slutsåld"}</div>` +
    `<div style="margin-top:4px"><a href="${esc(p.url)}" style="color:#B5481F">Öppna produktsidan</a></div>` +
    `</td></tr></table>`
  );
}

export function kontaktMejl(a: { namn: string; epost: string; meddelande: string; produkt: MejlProdukt | null }): Kontaktmejl {
  const { namn, epost, meddelande, produkt } = a;
  const subject = produkt
    ? `Fråga om ${kortText(produkt.typ === "hittad" ? produkt.namn : produkt.slug, 70)} – ${namn}`
    : `Kontaktformulär: ${namn}`;
  const text =
    (produkt ? `${produktRaderText(produkt)}\n\n` : "") +
    `${meddelande}\n\n— — —\nFrån: ${namn}\nE-post: ${epost}`;
  const html =
    (produkt ? produktRutaHtml(produkt) : "") +
    `<p style="white-space:pre-wrap">${esc(meddelande)}</p>` +
    `<hr><p><strong>Från:</strong> ${esc(namn)}<br>` +
    `<strong>E-post:</strong> <a href="mailto:${esc(epost)}">${esc(epost)}</a></p>`;
  return { subject, text, html };
}
