// Genererar de strukturerade PDP-flikarna (utöver Beskrivning) som
// headless-storefronten renderar genom att splitta produktbeskrivningens
// <h2>-block (se components/productview.tsx → splitFlikar/FLIK_TITLE_PATTERNS):
//
//   • "Tekniska specifikationer" — översatta specs + ev. paketinnehåll
//   • "Vanliga frågor"           — 3–5 FAQ genererade av Claude (Haiku)
//   • "Användning och skötsel"   — bara för relevanta kategorier (Kök/Skönhet/Elektronik)
//
// "Kontakta oss" persisteras AVSIKTLIGT inte: storefronten lägger alltid till
// den statiskt (CONTACT_FLIK_HTML) och hoppar över den om beskrivningen redan
// innehåller fliken — så vi låter frontenden äga den för enhetlig text.
//
// Allt går via Haiku (lib/claude/client → completeJsonRouted) som ärver
// persistent cache + daglig budgetcap + Gemini-fallback från llm/router. Ett
// enda kombinerat anrop per produkt (översätt + FAQ + skötsel) håller kostnaden
// nere (~$0.005–0.01/produkt). Fail-open: vid fel faller vi tillbaka på
// oöversatta specs så att åtminstone spec-fliken alltid kan byggas.

import { completeJsonRouted } from "../claude/client";
import { makeCacheKey } from "../llm/cache";

export interface TabInput {
  /** Stabilt id för cache-nyckeln (Wix-produkt-id eller leverantörs-id). */
  productId: string;
  /** Svenskt produktnamn (helst seo.title). */
  name: string;
  /** Wix-kategorinamn — styr om "Användning och skötsel" genereras. */
  categoryName?: string | null;
  /** Rå specs (engelska/kinesiska) från skrapan. */
  specifications?: Record<string, string>;
  /** Rå säljpunkter. */
  features?: string[];
  /** Rå paketinnehåll, t.ex. ["1 x Cable"]. */
  packageContents?: string[];
  /**
   * Befintlig spec-text (för back-fill av redan importerade produkter där vi
   * inte längre har den strukturerade skrapdatan). Tolkas som "Label: Value"-rader.
   */
  existingSpecText?: string;
}

export interface GeneratedTabs {
  /** Översatta specifikationer (svenska label+värde). */
  specs: { label: string; value: string }[];
  /** Översatt paketinnehåll (svenska). */
  packageContents: string[];
  /** 3–5 vanliga frågor med svar (svenska). */
  faq: { q: string; a: string }[];
  /** Skötselråd (svensk HTML, 2–3 stycken) eller null om ej relevant kategori. */
  careHtml: string | null;
}

export interface TabSection {
  title: string;
  html: string;
}

/** Kategorier där skötsel-/användningsråd är meningsfulla. */
const CARE_CATEGORY_RE = /k[öo]k|sk[öo]nhet|elektronik/i;

export function isCareRelevant(categoryName?: string | null): boolean {
  return !!categoryName && CARE_CATEGORY_RE.test(categoryName);
}

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Tolkar "Label: Value"-rader (befintlig spec-text vid back-fill) → mapp. */
function parseSpecText(text?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!text) return out;
  for (const line of text.split(/\n|;/)) {
    const m = line.match(/^\s*([^:：]{2,60})[:：]\s*(.+?)\s*$/);
    if (m) {
      const l = m[1].trim();
      const v = m[2].trim();
      if (l && v && !(l in out)) out[l] = v;
    }
  }
  return out;
}

const SYSTEM = `Du är en svensk e-handelscopywriter för en webshop som säljer prylar och heminredning.
Du får rådata om EN produkt (specifikationer/säljpunkter ofta på engelska eller kinesiska).
Uppgift: producera korrekt, säljande svenskt innehåll FÖR JUST DEN PRODUKTEN.

REGLER:
- Översätt specifikationer och paketinnehåll till naturlig svenska (både etikett och värde).
- Hitta ALDRIG på specifikationer, mått eller material som inte framgår av rådatan.
- FAQ ska vara konkreta, relevanta frågor en svensk kund faktiskt ställer om produkten,
  med korta, ärliga svar grundade i rådatan. Spekulera inte om du saknar underlag.
- Skriv aldrig om butiken/varumärket. Inget "Välkommen till …", inga rabattlöften.
- Svara ENDAST med giltig JSON enligt schemat.`;

function buildUser(input: TabInput, wantCare: boolean): string {
  const specs = { ...parseSpecText(input.existingSpecText), ...(input.specifications || {}) };
  const specsText = Object.entries(specs)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n")
    .slice(0, 3000);
  const featuresText = (input.features || []).join("\n").slice(0, 1500);
  const pkgText = (input.packageContents || []).join("\n").slice(0, 800);

  return `Produktnamn: ${input.name}
Kategori: ${input.categoryName || "(okänd)"}

Specifikationer (råa):
${specsText || "(inga)"}

Säljpunkter (råa):
${featuresText || "(inga)"}

Paketinnehåll (råt):
${pkgText || "(okänt)"}

Svara med JSON:
{
  "specs": [{"label": "svensk etikett", "value": "svenskt värde"}],
  "packageContents": ["svensk rad", "..."],
  "faq": [{"q": "Fråga på svenska?", "a": "Kort svar."}],
  "careHtml": ${wantCare
    ? '"<p>2–3 stycken svensk text om användning och skötsel, grundad i produkttypen.</p>"'
    : "null"}
}
Krav: 3–5 FAQ. ${wantCare ? "careHtml = enkel HTML (<p>…</p>), 2–3 stycken." : "careHtml ska vara null."}
Översätt alla specs/paketrader; utelämna inget som finns i rådatan.`;
}

/**
 * Genererar de svenska flik-data-blocken via Haiku. Fail-open: vid fel
 * returneras oöversatta specs (så spec-fliken ändå kan byggas) + tom FAQ.
 */
export async function generateTabs(input: TabInput): Promise<GeneratedTabs> {
  const wantCare = isCareRelevant(input.categoryName);
  const mergedSpecs = { ...parseSpecText(input.existingSpecText), ...(input.specifications || {}) };

  const fallback: GeneratedTabs = {
    specs: Object.entries(mergedSpecs).map(([label, value]) => ({ label, value })),
    packageContents: input.packageContents || [],
    faq: [],
    careHtml: null,
  };

  // Inget underlag alls → ingen LLM (spara credits); returnera tomt.
  const hasInput =
    Object.keys(mergedSpecs).length > 0 ||
    (input.features || []).length > 0 ||
    (input.packageContents || []).length > 0 ||
    input.name.length >= 6;
  if (!hasInput) return fallback;

  const cacheKey = makeCacheKey({
    op: "generateTabs",
    name: input.name,
    description: "",
    dependencyFingerprint: `pid=${input.productId}|cat=${input.categoryName || ""}|care=${wantCare}|specs=${JSON.stringify(
      mergedSpecs,
    ).slice(0, 1500)}|feat=${(input.features || []).join("|").slice(0, 600)}|pkg=${(input.packageContents || []).join("|").slice(0, 400)}`,
  });

  const raw = await completeJsonRouted<Partial<GeneratedTabs>>({
    op: "generateTabs",
    cacheKey,
    system: SYSTEM,
    user: buildUser(input, wantCare),
    maxTokens: 1500,
    failOpen: fallback,
  });

  // Normalisera/validera modellens svar.
  const specs = Array.isArray(raw.specs)
    ? raw.specs
        .filter((s) => s && typeof s.label === "string" && typeof s.value === "string")
        .map((s) => ({ label: s.label.trim(), value: s.value.trim() }))
        .filter((s) => s.label && s.value)
    : fallback.specs;
  const packageContents = Array.isArray(raw.packageContents)
    ? raw.packageContents.filter((s): s is string => typeof s === "string" && s.trim().length > 0).map((s) => s.trim())
    : fallback.packageContents;
  const faq = Array.isArray(raw.faq)
    ? raw.faq
        .filter((f) => f && typeof f.q === "string" && typeof f.a === "string")
        .map((f) => ({ q: f.q.trim(), a: f.a.trim() }))
        .filter((f) => f.q && f.a)
        .slice(0, 5)
    : [];
  const careHtml = wantCare && typeof raw.careHtml === "string" && raw.careHtml.trim() ? raw.careHtml.trim() : null;

  return {
    specs: specs.length ? specs : fallback.specs,
    packageContents,
    faq,
    careHtml,
  };
}

/**
 * Bygger flik-sektionerna (titel + HTML) som ska fogas in i beskrivningen som
 * <h2>-block. Returnerar bara sektioner som faktiskt har innehåll. "Kontakta
 * oss" ingår inte avsiktligt (frontenden lägger till den).
 */
export function buildTabSections(tabs: GeneratedTabs): TabSection[] {
  const sections: TabSection[] = [];

  if (tabs.specs.length || tabs.packageContents.length) {
    let html = "";
    if (tabs.specs.length) {
      html +=
        "<ul>" +
        tabs.specs
          .map((s) => `<li><strong>${escapeHtml(s.label)}:</strong> ${escapeHtml(s.value)}</li>`)
          .join("") +
        "</ul>";
    }
    if (tabs.packageContents.length) {
      html +=
        "<p><strong>Innehåll i paketet:</strong></p><ul>" +
        tabs.packageContents.map((p) => `<li>${escapeHtml(p)}</li>`).join("") +
        "</ul>";
    }
    sections.push({ title: "Tekniska specifikationer", html });
  }

  if (tabs.faq.length) {
    const html = tabs.faq
      .map((f) => `<p><strong>${escapeHtml(f.q)}</strong><br/>${escapeHtml(f.a)}</p>`)
      .join("");
    sections.push({ title: "Vanliga frågor", html });
  }

  if (tabs.careHtml) {
    // careHtml kommer från LLM:en — tillåt enkel HTML men sanera <script>/<style>.
    const safe = tabs.careHtml.replace(/<\/?(script|style)[^>]*>/gi, "");
    sections.push({ title: "Användning och skötsel", html: safe });
  }

  return sections;
}

/** Titlar vi äger — låter back-fill ersätta gamla genererade block utan dubbletter. */
const SECTION_TITLE_RES: Record<string, RegExp> = {
  "Tekniska specifikationer": /Tekniska\s+[Ss]pecifikationer/,
  "Vanliga frågor": /(Vanliga\s+fr[åa]gor|Ofta\s+st[äa]llda\s+fr[åa]gor)/,
  "Användning och skötsel": /Anv[äa]ndning\s+och\s+sk[öo]tsel/,
};

/** Kollar om beskrivnings-HTML redan har ett <h2>-block med given fliktitel. */
export function descriptionHasSection(descHtml: string, title: string): boolean {
  const re = SECTION_TITLE_RES[title];
  if (!re) return false;
  return new RegExp(`<h2[^>]*>\\s*(?:${re.source})\\s*</h2>`, "i").test(descHtml || "");
}

/**
 * Fogar in flik-sektioner i beskrivnings-HTML som <h2>Titel</h2>…innehåll…
 * Hoppar över sektioner vars titel redan finns (idempotent — säkert att köra om
 * vid back-fill). Returnerar { html, added: titlar som faktiskt lades till }.
 */
export function appendTabSections(
  descHtml: string,
  sections: TabSection[],
): { html: string; added: string[] } {
  let html = descHtml || "";
  const added: string[] = [];
  for (const sec of sections) {
    if (descriptionHasSection(html, sec.title)) continue;
    html += `<h2>${sec.title}</h2>${sec.html}`;
    added.push(sec.title);
  }
  return { html, added };
}
