// lib/gpsr-flik.ts
//
// Innehållet i produktsidans flik "Produktsäkerhet". Ren modul utan importer,
// så att node-testköraren laddar den direkt (samma mönster som
// lib/retur-policy.ts). Hämtningen bor i lib/gpsr.ts.
//
// VARFÖR FLIKEN FINNS (Leonard 2026-09-27). EU:s produktsäkerhetsförordning
// (EU) 2023/988, artikel 19, kräver att varje produktsida i distansförsäljning
// visar tillverkarens namn eller varumärke med post- och e-postadress, den
// ansvariga i EU, uppgifter som identifierar produkten (namn och bild) och
// säkerhetsinformation på svenska. Uppgifterna tas fram i motorn
// (lib/gpsr/ där); butiken visar dem.
//
// TILLVERKAREN NÄMNS HÄR OCH BARA HÄR. Regeln att butiken aldrig namnger var
// vi köper in (lib/leverantor.test.ts) gäller fortfarande överallt annars.
// Lagen kräver den här uppgiften, och den står redan på kartongen och i
// bruksanvisningen. Namnet kommer från motorns svar vid körning, aldrig från
// källkoden — därför behöver leverantörsprovet inget undantag. Fliken säger
// "Tillverkare och ansvarig i EU", aldrig "leverantör", och e-postadressen är
// text, inte en länk: lagen kräver att den syns, inte att vi skickar kunden dit.
//
// FLIKEN RENDERAS I HTML:EN FRÅN BÖRJAN, hopfälld i en <details>. En uppgift
// som lagen kräver ska finnas för myndigheter och sökmotorer som aldrig klickar.

export interface GpsrAnsvarig {
  namn: string;
  gata: string;
  postnummer: string;
  ort: string;
  land: string;
  epost: string;
}

export interface GpsrData {
  marke: string | null;
  ansvarig: GpsrAnsvarig;
  sakerhet: string[];
}

export const GPSR_FLIK_TITEL = "Produktsäkerhet";

/** Gäller varje vara: alla levereras med bruksanvisning. */
export const GPSR_BRUKSANVISNING =
  "Läs bruksanvisningen som följer med varan före montering och användning, och spara den.";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Validerar motorns svar. Null när en uppgift lagen kräver saknas — då visas
 * ingen flik alls, hellre än en flik som ser komplett ut men inte är det.
 */
export function tolkaGpsr(body: unknown): GpsrData | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const a = (b.ansvarig && typeof b.ansvarig === "object" ? b.ansvarig : {}) as Record<string, unknown>;
  const ansvarig: GpsrAnsvarig = {
    namn: str(a.namn),
    gata: str(a.gata),
    postnummer: str(a.postnummer),
    ort: str(a.ort),
    land: str(a.land),
    epost: str(a.epost),
  };
  if (!ansvarig.namn || !ansvarig.gata || !ansvarig.ort || !ansvarig.epost) return null;
  const sakerhet = Array.isArray(b.sakerhet)
    ? b.sakerhet.map(str).filter((s) => s.length > 0).slice(0, 12)
    : [];
  const marke = str(b.marke) || null;
  return { marke, ansvarig, sakerhet };
}

/** Flikens HTML. Allt från motorn escapas. */
export function gpsrFlikHtml(g: GpsrData, produktnamn: string): string {
  const a = g.ansvarig;
  const ort = [a.postnummer, a.ort].filter(Boolean).join(" ");
  const adress = [a.namn, a.gata, [ort, a.land].filter(Boolean).join(", "), `E-post: ${a.epost}`]
    .map(esc)
    .join("<br />");
  const delar: string[] = [];
  if (g.marke) delar.push(`<p><strong>Varumärke:</strong> ${esc(g.marke)}</p>`);
  delar.push(`<p><strong>Tillverkare och ansvarig i EU:</strong><br />${adress}</p>`);
  delar.push(`<p><strong>Produkt:</strong> ${esc(produktnamn)} (se bilderna ovan)</p>`);
  delar.push("<p><strong>Säkerhetsinformation</strong></p>");
  const rader = [...g.sakerhet, GPSR_BRUKSANVISNING];
  delar.push(`<ul>${rader.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>`);
  return delar.join("");
}
