// Restock-mejlet till kunden: varan hen bevakade finns i lager igen.
//
// Leonard 2026-09-30, om mejlet som det såg ut: *"fixa så det är vår bild som
// skickas och inte leverantörens, vårt produktnamn ska stå inte leverantörens …
// länken ska vara till vår produkt till vår sida … gör en audit, så den blir
// proffsig"*.
//
// ☠️ ALLT SOM SYNS KOMMER UR BUTIKEN. Namnet var mappningens `seoTitle`, alltså
// leverantörens sidtitel från importen (ibland med "- AliExpress" sist), och
// bilden var leverantörens källbild på leverantörens egen server. Byggaren tar
// därför bara emot det butiken visar, och en bild som inte ligger hos Wix släpps
// inte igenom alls. Var värdena hämtas står i `lib/restock/notify.ts`.
//
// Utseendet följer butikens kundmejl (`lib/email/kundmejl.ts`): rubrik, ett
// produktkort med bild, namn och pris, en knapp, och en rad om varför kunden
// får mejlet. Raden "Den säljer ofta slut snabbt" är borta. Den stämmer inte
// för varje vara, och ett påstående om brist ska vara sant.

import { escapeHtml } from "../email/html";
import { KUND_BRAND, kundSidfotText } from "../email/kundmejl";

export interface RestockMejlInput {
  /** Butikens namn på varan, ur Wix. */
  produktnamn: string;
  /** Produktsidan i butiken. */
  produktUrl: string;
  /** Produktens huvudbild hos Wix. En adress någon annanstans ignoreras. */
  bildUrl?: string;
  /** Butikens pris i kronor. Olika pris per variant ger "Från …". */
  pris?: { min: number; max: number };
  /**
   * Varianterna som kom tillbaka, t.ex. ["Vit"], när andra varianter fanns
   * hela tiden. Då väntade kunden på just den här, och mejlet säger vilken.
   */
  varianter?: string[];
}

export interface RestockMejl {
  subject: string;
  /** Innehållet. `sendEmail` lägger kundomslaget runt det. */
  html: string;
  text: string;
  /** Raden efter ämnesraden i inkorgen. */
  forhandstext: string;
}

const WIX_MEDIA = "https://static.wixstatic.com/media/";
/** Bildens storlek i mejlet. Filen hämtas i dubbel storlek för skarpa skärmar. */
const BILD_PX = 240;
const KORTNAMN_MAX = 60;

/**
 * Namnets första led, för ämnesraden: "3D-träpussel raket – mekanisk rymdfärja
 * med …" → "3D-träpussel raket". Butikens namn är långa, och en mobil visar
 * bara början av ämnesraden. Hela namnet står i mejlet.
 */
export function kortnamn(namn: string): string {
  const helt = namn.replace(/\s+/g, " ").trim();
  const forsta = helt.split(/\s[–—-]\s/)[0].trim() || helt;
  if (forsta.length <= KORTNAMN_MAX) return forsta;
  const kapat = forsta.slice(0, KORTNAMN_MAX - 1);
  const mellanslag = kapat.lastIndexOf(" ");
  const ord = mellanslag > KORTNAMN_MAX / 2 ? kapat.slice(0, mellanslag) : kapat;
  return `${ord.replace(/[\s,;:]+$/, "")}…`;
}

/**
 * Vår bild, i kvadrat ur mitten — samma utsnitt som butikens galleri visar.
 * Null för allt som inte ligger i Wix mediebibliotek.
 */
export function mejlbild(url: string | undefined): string | null {
  if (!url || !url.startsWith(WIX_MEDIA)) return null;
  const fil = url.split("/v1/")[0];
  const px = BILD_PX * 2;
  return `${fil}/v1/fill/w_${px},h_${px},al_c,q_85/produkt.jpg`;
}

/** "Vit", "Vit och Grå", "Vit, Grå och Svart". */
export function uppraknat(namn: string[]): string {
  if (namn.length <= 1) return namn.join("");
  return `${namn.slice(0, -1).join(", ")} och ${namn[namn.length - 1]}`;
}

/** "1 139 kr", eller "Från 499 kr" när varianterna kostar olika. */
export function formateraPris(pris: { min: number; max: number } | undefined): string | null {
  if (!pris || !Number.isFinite(pris.min) || pris.min <= 0) return null;
  const kr = (n: number) => `${new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 2 }).format(n)} kr`;
  return Number.isFinite(pris.max) && pris.max > pris.min ? `Från ${kr(pris.min)}` : kr(pris.min);
}

export function byggRestockMejl(input: RestockMejlInput): RestockMejl {
  const b = KUND_BRAND;
  const e = escapeHtml;
  const namn = input.produktnamn.replace(/\s+/g, " ").trim();
  const url = input.produktUrl;
  const bild = mejlbild(input.bildUrl);
  const pris = formateraPris(input.pris);

  const varianter = (input.varianter ?? []).map((v) => v.replace(/\s+/g, " ").trim()).filter(Boolean);
  const vilka = varianter.length ? uppraknat(varianter) : "";

  const subject = `Tillbaka i lager: ${kortnamn(namn)}${vilka ? ` – ${vilka}` : ""}`;
  const forhandstext = "Du bad oss säga till när den fanns igen. Nu kan du beställa den.";
  // "Utförande" och inte "färg": varianten kan lika gärna vara en storlek
  // eller "Grå / 110 cm", och ordet böjs inte efter värdet.
  const intro = vilka
    ? `Du bad oss säga till när den här varan kom tillbaka. Nu finns den i ${varianter.length > 1 ? "utförandena" : "utförandet"} ${vilka} igen.`
    : "Du bad oss säga till när den här varan kom tillbaka. Nu finns den i lager hos oss igen.";
  const utforande = vilka ? `Utförande: ${varianter.join(", ")}` : "";
  const lager = "Varan säljs så länge lagret räcker, och vi kan inte reservera den åt dig.";
  const varfor = "Du får det här mejlet för att du bad om en påminnelse på fyndplats.se. "
    + "Det är ett engångsmejl, så du får inget mer om den här varan.";

  const muted = `margin:0 0 8px 0;font-size:13px;line-height:1.5;color:${b.muted};`;
  const bildrad = bild
    ? `<tr>
    <td align="center" style="padding:20px 20px 0 20px;">
      <a href="${e(url)}" style="text-decoration:none;"><img src="${e(bild)}" alt="${e(namn)}" width="${BILD_PX}" height="${BILD_PX}" style="display:block;width:${BILD_PX}px;height:${BILD_PX}px;max-width:100%;border:1px solid ${b.line};border-radius:10px;background:#ffffff;" /></a>
    </td>
  </tr>`
    : "";

  const html = `<p style="margin:0 0 6px 0;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${b.orange2};">Tillbaka i lager</p>
<h1 style="margin:0 0 8px 0;font-size:24px;font-weight:800;line-height:1.25;color:${b.ink};">Nu finns den igen!</h1>
<p style="margin:0 0 14px 0;font-size:15px;line-height:1.55;color:${b.ink};">${e(intro)}</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${b.warm};border:1px solid ${b.line};border-radius:12px;margin:16px 0;">
  ${bildrad}
  <tr>
    <td align="center" style="padding:16px 20px 22px 20px;">
      <p style="margin:0 0 ${pris || vilka ? 6 : 16}px 0;font-size:16px;font-weight:700;line-height:1.35;color:${b.ink};">${e(namn)}</p>
      ${utforande ? `<p style="margin:0 0 ${pris ? 6 : 16}px 0;font-size:14px;line-height:1.4;color:${b.muted};">${e(utforande)}</p>` : ""}
      ${pris ? `<p style="margin:0 0 16px 0;font-size:18px;font-weight:800;color:${b.ink};">${e(pris)}</p>` : ""}
      <a href="${e(url)}" style="display:inline-block;background:${b.cta};color:#ffffff;font-weight:700;font-size:15px;padding:12px 22px;border-radius:10px;text-decoration:none;">Visa produkten</a>
    </td>
  </tr>
</table>
<p style="${muted}">${e(lager)}</p>
<p style="${muted}">${e(varfor)}</p>`;

  const text = [
    "Tillbaka i lager",
    "",
    intro,
    "",
    namn,
    ...(utforande ? [utforande] : []),
    ...(pris ? [pris] : []),
    `Visa produkten: ${url}`,
    "",
    lager,
    varfor,
    "",
    "--",
    kundSidfotText(),
  ].join("\n");

  return { subject, html, text, forhandstext };
}
