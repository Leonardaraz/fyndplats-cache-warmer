// Genererar de tabbade PDP-flikarna (Tekniska specifikationer / Vanliga frågor /
// Användning och skötsel) för EN produkt med Claude Haiku och fogar in dem i
// produktens beskrivning som <h2>-block. Storefronten (components/productview.tsx
// → splitFlikar/FLIK_TITLE_PATTERNS) splittar dessa <h2>-block till klickbara
// flikar. "Kontakta oss" genereras INTE här — frontenden lägger alltid till den
// statiskt (CONTACT_FLIK_HTML) och hoppar över den om beskrivningen redan har den.
//
// Idempotent: en flik vars titel redan finns i beskrivningen hoppas över, så det
// är säkert att köra om. dryRun=true genererar + returnerar förhandsvisning utan
// att skriva till Wix (driver "Granska & redigera").
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { getAdminProduct, updateAdminProductDescription } from "./wix-client";

// Haiku 4.5 — samma modell som cache-warmer-importens textsteg. Override via env.
const MODEL = process.env.CLAUDE_TEXT_MODEL || "claude-haiku-4-5-20251001";

// Best-effort daglig budgetcap. Serverless kan nollställa mellan kallstarter, men
// inom en varm instans / en masskörning hindrar den skenande kostnad. UI:t driver
// dessutom massjobbet sekventiellt så Leonard ser kostnaden växa och kan stoppa.
const DAILY_BUDGET_USD = Number(process.env.ENRICH_DAILY_BUDGET_USD || "2");
// Haiku 4.5-pris (USD per token): input 1.0/1M, output 5.0/1M (jan 2026).
const PRICE_IN = 1.0 / 1_000_000;
const PRICE_OUT = 5.0 / 1_000_000;

let _spendDay = "";
let _spendUsd = 0;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
function spentToday(): number {
  if (_spendDay !== today()) {
    _spendDay = today();
    _spendUsd = 0;
  }
  return _spendUsd;
}
function trackSpend(usd: number): void {
  spentToday();
  _spendUsd += usd;
}
export function budgetExceeded(): boolean {
  return spentToday() >= DAILY_BUDGET_USD;
}
export function budgetStatus(): { spentUsd: number; capUsd: number } {
  return { spentUsd: Math.round(spentToday() * 1000) / 1000, capUsd: DAILY_BUDGET_USD };
}

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY saknas i miljön.");
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

// --- Flik-mönster: MÅSTE matcha components/productview.tsx FLIK_TITLE_PATTERNS ---
const SPEC_RE = /Tekniska\s+[Ss]pecifikationer/;
const FAQ_RE = /(Vanliga\s+fr[åa]gor|Ofta\s+st[äa]llda\s+fr[åa]gor)/;
const CARE_RE = /Anv[äa]ndning\s+och\s+sk[öo]tsel/;
// Skötselråd är bara relevanta för vissa kategorier.
const CARE_CATEGORY_RE = /k[öo]k|sk[öo]nhet|elektronik/i;

export function isCareRelevant(categoryName?: string | null): boolean {
  return !!categoryName && CARE_CATEGORY_RE.test(categoryName);
}

function hasH2(html: string, re: RegExp): boolean {
  return new RegExp(`<h2[^>]*>\\s*(?:${re.source})\\s*</h2>`, "i").test(html || "");
}

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Drar ut "Tekniska specifikationer"-blockets text som "Label: Value"-rader. */
function extractExistingSpecText(descHtml: string): string {
  const m = (descHtml || "").match(/<h2[^>]*>\s*Tekniska\s+[Ss]pecifikationer\s*<\/h2>([\s\S]*?)(?=<h2|$)/i);
  if (!m) return "";
  return m[1]
    .replace(/<li[^>]*>/gi, "\n")
    .replace(/<\/(strong|b)>/gi, ": ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function parseJsonObject<T>(text: string): T | null {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const clean = (fence ? fence[1] : text).trim();
  try {
    return JSON.parse(clean) as T;
  } catch {
    const m = clean.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

interface GeneratedJson {
  specs?: { label?: string; value?: string }[];
  packageContents?: string[];
  faq?: { q?: string; a?: string }[];
  careHtml?: string | null;
}

export interface EnrichTabsOptions {
  categoryName?: string | null;
  dryRun?: boolean;
}

export interface EnrichTabsResult {
  productId: string;
  name: string;
  /** Fliktitlar som lades till denna körning. */
  generated: string[];
  /** true om beskrivningen faktiskt skrevs till Wix. */
  saved: boolean;
  dryRun: boolean;
  message: string;
  /** Hela den nya beskrivnings-HTML:en (för "Granska & redigera"). */
  previewHtml: string;
  /** Daglig spend efter körningen. */
  budget: { spentUsd: number; capUsd: number };
}

/**
 * Genererar de saknade flikarna för en produkt och (om ej dryRun) sparar i Wix.
 */
export async function enrichProductTabs(
  productId: string,
  opts: EnrichTabsOptions = {},
): Promise<EnrichTabsResult> {
  if (!opts.dryRun && budgetExceeded()) {
    throw new Error(`Daglig AI-budget (${DAILY_BUDGET_USD} USD) nådd – försök igen imorgon.`);
  }

  const product = await getAdminProduct(productId);
  if (!product) throw new Error("Produkten hittades inte i Wix.");

  const wantCare = isCareRelevant(opts.categoryName);
  const need = {
    specs: !hasH2(product.description, SPEC_RE),
    faq: !hasH2(product.description, FAQ_RE),
    care: wantCare && !hasH2(product.description, CARE_RE),
  };

  if (!need.specs && !need.faq && !need.care) {
    return {
      productId,
      name: product.name,
      generated: [],
      saved: false,
      dryRun: !!opts.dryRun,
      message: "Alla relevanta flikar finns redan.",
      previewHtml: product.description,
      budget: budgetStatus(),
    };
  }

  const existingSpec = extractExistingSpecText(product.description);
  const context = product.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1500);

  const prompt = `Du är en svensk e-handelscopywriter. Skapa strukturerat svenskt produktinnehåll
för JUST denna produkt. Hitta ALDRIG på specifikationer, mått eller material som inte framgår.
Skriv aldrig om butiken/varumärket. Svara ENDAST med giltig JSON.

Produktnamn: ${product.name}
Kategori: ${opts.categoryName || "(okänd)"}
${existingSpec ? `Kända specifikationer:\n${existingSpec.slice(0, 1500)}\n` : ""}Befintlig beskrivning (referens):
${context || "(saknas)"}

Svara med JSON:
{
  "specs": [{"label": "svensk etikett", "value": "svenskt värde"}],
  "packageContents": ["svensk rad"],
  "faq": [{"q": "Fråga på svenska?", "a": "Kort svar."}],
  "careHtml": ${need.care ? '"<p>2–3 stycken om användning och skötsel.</p>"' : "null"}
}
Krav: ${need.faq ? "3–5 relevanta FAQ. " : '"faq" kan vara []. '}${
    need.specs ? 'Fyll "specs" med sanna specifikationer (≥3 om möjligt). ' : '"specs" kan vara []. '
  }${need.care ? "careHtml = enkel HTML (<p>…</p>), 2–3 stycken." : "careHtml ska vara null."}`;

  const msg = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });
  trackSpend((msg.usage.input_tokens || 0) * PRICE_IN + (msg.usage.output_tokens || 0) * PRICE_OUT);

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  const parsed = parseJsonObject<GeneratedJson>(text) ?? {};

  const sections: { title: string; html: string }[] = [];

  if (need.specs) {
    const specs = (parsed.specs || [])
      .filter((s) => s && typeof s.label === "string" && typeof s.value === "string" && s.label!.trim() && s.value!.trim())
      .map((s) => ({ label: s.label!.trim(), value: s.value!.trim() }));
    const pkg = (parsed.packageContents || []).filter((p): p is string => typeof p === "string" && !!p.trim());
    if (specs.length || pkg.length) {
      let html = "";
      if (specs.length) {
        html += "<ul>" + specs.map((s) => `<li><strong>${escapeHtml(s.label)}:</strong> ${escapeHtml(s.value)}</li>`).join("") + "</ul>";
      }
      if (pkg.length) {
        html += "<p><strong>Innehåll i paketet:</strong></p><ul>" + pkg.map((p) => `<li>${escapeHtml(p.trim())}</li>`).join("") + "</ul>";
      }
      sections.push({ title: "Tekniska specifikationer", html });
    }
  }

  if (need.faq) {
    const faq = (parsed.faq || [])
      .filter((f) => f && typeof f.q === "string" && typeof f.a === "string" && f.q!.trim() && f.a!.trim())
      .map((f) => ({ q: f.q!.trim(), a: f.a!.trim() }))
      .slice(0, 5);
    if (faq.length) {
      sections.push({
        title: "Vanliga frågor",
        html: faq.map((f) => `<p><strong>${escapeHtml(f.q)}</strong><br/>${escapeHtml(f.a)}</p>`).join(""),
      });
    }
  }

  if (need.care && typeof parsed.careHtml === "string" && parsed.careHtml.trim()) {
    sections.push({ title: "Användning och skötsel", html: parsed.careHtml.replace(/<\/?(script|style)[^>]*>/gi, "") });
  }

  // Foga in (idempotent — hoppa över titlar som redan finns).
  let html = product.description;
  const generated: string[] = [];
  for (const sec of sections) {
    if (hasH2(html, new RegExp(sec.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))) continue;
    html += `<h2>${sec.title}</h2>${sec.html}`;
    generated.push(sec.title);
  }

  let saved = false;
  if (generated.length > 0 && !opts.dryRun) {
    await updateAdminProductDescription(productId, product.revision, html);
    saved = true;
  }

  return {
    productId,
    name: product.name,
    generated,
    saved,
    dryRun: !!opts.dryRun,
    message: generated.length
      ? `${opts.dryRun ? "Förhandsvisar" : "Sparade"}: ${generated.join(", ")}`
      : "Modellen saknade underlag – inget nytt lades till.",
    previewHtml: html,
    budget: budgetStatus(),
  };
}
