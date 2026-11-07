// lib/kontakt/kontakt.ts
//
// Kontaktvägarna bär produkten (Leonard 2026-11-07: "när folk mailar oss om
// produkter så blir det lätt för dom att visa vilken dom menar").
//
// Rena funktioner för tre saker, i den här ordningen:
//   1. Länkarna: produktsidans flik "Kontakta oss" länkar till formuläret med
//      produkten förvald (/kontaktaoss?produkt=<slug>&variant=<id>#meddelande),
//      och e-postlänken öppnar kundens mejlprogram med produkten i ämnesraden
//      och länken i texten.
//   2. Produkten i formuläret: valen (färg, storlek …) och priset.
//   3. Mejlet till kundtjänst, med produkten överst.
//
// Filen importerar ingenting vid körning (bara typer), så att node:test kan
// läsa den; formateringen av pris och valnamn skickas in (lib/kontakt/produkt.ts).

import type { Product } from "../products";

// ── 1. Länkarna ─────────────────────────────────────────────────────────────

export const BUTIK = "https://www.fyndplats.se";
export const KUNDTJANST_EPOST = "info@fyndplats.com";

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

/** Vilken produkt (och variant) kunden pekar ut. Bara giltiga värden. */
export type KontaktReferens = { slug: string; variantId?: string };

/** Läser ?produkt= och ?variant= ur en adress. Ett ogiltigt värde räknas som saknat. */
export function lasKontaktParams(sok: string | URLSearchParams): KontaktReferens | null {
  const p = typeof sok === "string" ? new URLSearchParams(sok) : sok;
  const slug = p.get("produkt");
  if (!giltigSlug(slug)) return null;
  const variant = p.get("variant");
  return giltigVariant(variant) ? { slug, variantId: variant.toLowerCase() } : { slug };
}

/** Produktsidans adress, med varianten när den finns (samma ?variant= som sidan själv sätter). */
export function produktUrl(ref: KontaktReferens): string {
  return `${BUTIK}/produkt/${ref.slug}` + (ref.variantId ? `?variant=${ref.variantId}` : "");
}

/** Formuläret med produkten förvald. */
export function kontaktHref(ref: KontaktReferens): string {
  const q = new URLSearchParams({ produkt: ref.slug });
  if (ref.variantId) q.set("variant", ref.variantId);
  return `/kontaktaoss?${q.toString()}#meddelande`;
}

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

const ATTR_ESC: Record<string, string> = { "&": "&amp;", '"': "&quot;", "<": "&lt;", ">": "&gt;" };
const attr = (s: string) => s.replace(/[&"<>]/g, (c) => ATTR_ESC[c]);

// Formulärets adress, med eller utan domän, snedstreck sist eller ankare.
const KONTAKT_HREF_RE = /href=(["'])(?:https?:\/\/(?:www\.)?fyndplats\.se)?\/kontaktaoss\/?(?:#[^"']*)?\1/gi;
// Kundtjänstens adress, med eller utan ett ämne som redan står där.
const MAILTO_HREF_RE = /href=(["'])mailto:info@fyndplats\.com(?:\?[^"']*)?\1/gi;

/**
 * Flikens länkar till formuläret och kundtjänstens e-post, med produkten.
 * Bara adresserna byts; texten i fliken är densamma på varje produktsida
 * (Leonards krav, components/productview.tsx). Telefonlänken och andra länkar
 * lämnas orörda.
 */
export function kontaktFlikLankar(html: string, p: LankProdukt): string {
  return html
    .replace(KONTAKT_HREF_RE, () => `href="${attr(kontaktHref(p))}"`)
    .replace(MAILTO_HREF_RE, () => `href="${attr(mailtoHref(p))}"`);
}

// ── 2. Produkten i formuläret: valen och priset ────────────────────────────

export type KontaktVal = { id: string; namn: string; iLager: boolean; pris: string; bild?: string };

export type ValKalla = Pick<Product, "options" | "variantAxes" | "variantTable">;
export type PrisKalla = Pick<Product, "price" | "priceNum" | "priceFrom" | "priceFromNum" | "hasRange">;

/** Fler val än så här visas inte i väljaren (den största familjen hade 48, 2026-11-07). */
export const MAX_VAL = 60;

/** Prisets och valnamnens format, samma som på produktsidan (formatPrice och visaValnamn). */
export type Formatering = { pris: (kronor: number) => string; valnamn: (etikett: string) => string };

function prisAv(f: Formatering, num: number | undefined, text: string | undefined): string {
  return num ? f.pris(num) : text || "";
}

/**
 * Valen i sidans ordning. Med flera axlar (Färg × Storlek) blir varje rad i
 * varianttabellen ett val med axlarnas värden i axlarnas ordning ("Röd ·
 * 140 × 200 cm"); med en axel blir varje val ett val. Bara val med ett riktigt
 * variant-id kommer med, och namnen är de som produktsidan visar (visaValnamn).
 */
export function kontaktVal(p: ValKalla, f: Formatering): KontaktVal[] {
  if (p.variantTable?.length) {
    const axlar = (p.variantAxes ?? []).map((a) => a.name);
    return p.variantTable
      .filter((r) => giltigVariant(r.variantId))
      .slice(0, MAX_VAL)
      .map((r) => {
        const varden = axlar.length ? axlar.map((a) => r.choices[a]).filter(Boolean) : Object.values(r.choices);
        return {
          id: r.variantId.toLowerCase(),
          namn: varden.map(f.valnamn).join(" · "),
          iLager: r.inStock,
          pris: prisAv(f, r.priceNum, r.price),
          ...(r.image ? { bild: r.image } : {}),
        };
      });
  }
  return (p.options?.choices ?? [])
    .filter((c) => giltigVariant(c.variantId))
    .slice(0, MAX_VAL)
    .map((c) => ({
      id: c.variantId.toLowerCase(),
      namn: f.valnamn(c.label),
      iLager: c.inStock !== false,
      pris: prisAv(f, c.priceNum, c.price),
      ...(c.image ? { bild: c.image } : {}),
    }));
}

/** Samma pristext som sökförslagen och produktkorten: "Från …" när varianterna kostar olika. */
export function prisText(p: PrisKalla, f: Formatering): string {
  if (p.hasRange) return `Från ${p.priceFromNum ? f.pris(p.priceFromNum) : p.priceFrom ?? ""}`.trim();
  return prisAv(f, p.priceNum, p.price);
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
  /** Det utpekade valet, när det finns bland valen. */
  valtId?: string;
  valtNamn?: string;
};

export type ProduktKalla = Pick<Product, "slug" | "name" | "img" | "inStock"> & ValKalla & PrisKalla;

/** Produkten med det utpekade valet. Ett okänt variant-id räknas som inget val. */
export function byggKontaktProdukt(p: ProduktKalla, variantId: string | undefined, f: Formatering): KontaktProdukt {
  const val = kontaktVal(p, f);
  const valt = giltigVariant(variantId) ? val.find((v) => v.id === variantId.toLowerCase()) : undefined;
  return {
    slug: p.slug,
    namn: p.name,
    bild: valt?.bild || p.img,
    pris: valt?.pris || prisText(p, f),
    url: produktUrl({ slug: p.slug, variantId: valt?.id }),
    iLager: valt ? valt.iLager : p.inStock,
    val,
    ...(valt ? { valtId: valt.id, valtNamn: valt.namn } : {}),
  };
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

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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
