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
// TILLVERKAREN NÄMNS HÄR, och som mottagare på returadressen i returmejlen
// (lib/returadress.ts), där paketet annars inte kommer fram. Regeln att butiken
// aldrig namnger var vi köper in (lib/leverantor.test.ts) gäller fortfarande
// överallt annars. Lagen kräver den här uppgiften, och den står redan på
// kartongen och i bruksanvisningen. Namnet kommer från motorns svar vid körning, aldrig från
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

/** En part som fliken och orderbekräftelsen visar: rollen, namnet, adressraderna och e-posten. */
export interface GpsrPart {
  roll: string;
  namn: string;
  rader: string[];
  epost: string;
}

export interface GpsrData {
  marke: string | null;
  /** Aosoms form: en part som är både tillverkare och ansvarig i EU. Null för VEVOR. */
  ansvarig: GpsrAnsvarig | null;
  /** Parterna som de visas, i ordning. Aosom har en, VEVOR två. */
  parter: GpsrPart[];
  sakerhet: string[];
  /** Raden om bruksanvisningen sist bland säkerhetsraderna. */
  bruksanvisning: string;
}

export const GPSR_FLIK_TITEL = "Produktsäkerhet";

/** Rubriken poleringen skriver i beskrivningen (docs/seo-polish-runbook.md i motorn). */
export const GPSR_FLIK_RE = /Produkts[äa]kerhet/;

/** Aosoms varor levereras alla med bruksanvisning. */
export const GPSR_BRUKSANVISNING =
  "Läs bruksanvisningen som följer med varan före montering och användning, och spara den.";

/**
 * VEVOR:s varor: alla har ingen bruksanvisning. Lagen kräver den bara när
 * varan inte kan användas säkert utan (EU 2023/988, artikel 9.7).
 */
export const GPSR_BRUKSANVISNING_OM =
  "Följer en bruksanvisning med varan: läs den före montering och användning, och spara den.";

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
  const sakerhetsrader = Array.isArray(b.sakerhet)
    ? b.sakerhet.map(str).filter((s) => s.length > 0).slice(0, 12)
    : [];
  // VEVOR (motorns steg 7): tillverkaren och ansvarig i EU som två parter, var
  // och en med namn, adress på en rad och e-post. Båda krävs.
  if ("tillverkare" in b || "euAnsvarig" in b) {
    const part = (v: unknown, roll: string): GpsrPart | null => {
      const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
      const namn = str(o.namn);
      const adress = str(o.adress);
      const epost = str(o.epost);
      return namn && adress && epost ? { roll, namn, rader: [adress], epost } : null;
    };
    const tillverkare = part(b.tillverkare, "Tillverkare");
    const eu = part(b.euAnsvarig, "Ansvarig i EU");
    if (!tillverkare || !eu) return null;
    return {
      marke: str(b.marke) || null,
      ansvarig: null,
      parter: [tillverkare, eu],
      sakerhet: sakerhetsrader,
      bruksanvisning: GPSR_BRUKSANVISNING_OM,
    };
  }
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
  const marke = str(b.marke) || null;
  const ort = [ansvarig.postnummer, ansvarig.ort].filter(Boolean).join(" ");
  const parter: GpsrPart[] = [{
    roll: "Tillverkare och ansvarig i EU",
    namn: ansvarig.namn,
    rader: [ansvarig.gata, [ort, ansvarig.land].filter(Boolean).join(", ")],
    epost: ansvarig.epost,
  }];
  return { marke, ansvarig, parter, sakerhet: sakerhetsrader, bruksanvisning: GPSR_BRUKSANVISNING };
}

function textUr(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Säkerhetsraderna ur beskrivningens eget avsnitt <h2>Produktsäkerhet</h2>,
 * eller null när avsnittet saknas.
 *
 * VARFÖR. Poleringen skriver produktens säkerhetsinformation i beskrivningen
 * när den polerar varan, på samma sätt som specifikationerna — ur samma tyska
 * källa den ändå läser. Då behöver ingen ny produkt vänta på att motorns
 * datafil byggs om, och ingen deploy behövs. Avsnittet vinner över motorns
 * data: det är skrivet för den polerade produkten.
 *
 * Raderna är avsnittets <li>, eller dess stycken om det saknar lista. Ett
 * avsnitt utan text räknas som saknat.
 */
export function sakerhetUrBeskrivning(html: string | null | undefined): string[] | null {
  if (!html) return null;
  const m = /<h2[^>]*>\s*Produkts[äa]kerhet\s*<\/h2>/i.exec(html);
  if (!m) return null;
  const efter = html.slice(m.index + m[0].length);
  const nasta = efter.search(/<h2[^>]*>/i);
  const avsnitt = nasta >= 0 ? efter.slice(0, nasta) : efter;
  const li = [...avsnitt.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((x) => textUr(x[1]));
  const rader = (li.length ? li : [...avsnitt.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((x) => textUr(x[1])))
    .filter((r) => r.length > 0)
    .slice(0, 12);
  return rader.length ? rader : null;
}

/** Flikens HTML. Allt från motorn escapas. */
export function gpsrFlikHtml(g: GpsrData, produktnamn: string): string {
  const delar: string[] = [];
  // Ingen rad "Varumärke" (Leonard 2026-10-06): Aosoms märke på fliken sade
  // emot märket i strukturerad data och flöden (lib/varumarke.ts). GPSR kräver
  // tillverkarens namn ELLER varumärke, och namnet står på raden nedan.
  for (const p of g.parter) {
    const adress = [p.namn, ...p.rader, `E-post: ${p.epost}`].map(esc).join("<br />");
    delar.push(`<p><strong>${esc(p.roll)}:</strong><br />${adress}</p>`);
  }
  delar.push(`<p><strong>Produkt:</strong> ${esc(produktnamn)} (se bilderna ovan)</p>`);
  delar.push("<p><strong>Säkerhetsinformation</strong></p>");
  const rader = [...g.sakerhet, g.bruksanvisning];
  delar.push(`<ul>${rader.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>`);
  return delar.join("");
}
