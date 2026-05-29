// POST /api/grade  { url: string, email?: string }
// Kör en statisk WCAG-scan av angiven URL och returnerar poäng + fel.
// Om en e-post anges loggas den som lead (MVP: server-logg; byt mot DB/CRM senare).
// AI-förklaring på svenska läggs till om ANTHROPIC_API_KEY finns — annars utan.

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { evaluateHtml, fetchPageHtml, type ScanResult } from "@/lib/accessibility/scanner";
import { analyzeSeo } from "@/lib/seo/analyzer";
import { analyzeAeo } from "@/lib/aeo/analyzer";
import { analyzePerformance } from "@/lib/perf/analyzer";
import { extractInternalLinks } from "@/lib/scan/crawl";
import { mergeCategoryPages } from "@/lib/scan/aggregate";
import { fetchSiteFiles } from "@/lib/scan/site-files";
import { analyzeRobotsAndFiles } from "@/lib/aeo/robots";
import { buildCategory, type CategoryResult, type Finding } from "@/lib/scan/types";
import { completeJson } from "@/lib/ai/claude";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  url: z.string().min(3, "Ange en webbadress."),
  email: z.string().email().optional(),
  // Djup-läge: granska även några viktiga undersidor och slå ihop resultatet.
  deep: z.boolean().optional(),
});

/** Kör alla kategori-analyser på en redan hämtad sida. */
function analyzePage(url: string, html: string): CategoryResult[] {
  return [
    accessibilityToCategory(evaluateHtml(url, html)),
    analyzeSeo(html, url),
    analyzeAeo(html),
    analyzePerformance(html),
  ];
}

export async function POST(req: NextRequest) {
  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.issues[0]?.message : "Ogiltig begäran.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  let result: ScanResult;
  let categories: CategoryResult[];
  let pagesScanned = 1;
  try {
    // Hämta startsidan en gång; kör alla kategori-analyser på den.
    const { url, html } = await fetchPageHtml(parsed.url);
    result = evaluateHtml(url, html); // för lead/summary (huvudsidan, tillgänglighet)

    if (parsed.deep) {
      // Djup-läge: hämta även några viktiga undersidor (parallellt) och slå ihop.
      const links = extractInternalLinks(html, url, 3);
      const settled = await Promise.allSettled(links.map((l) => fetchPageHtml(l)));
      const pages = [
        { url, html },
        ...settled.flatMap((r) => (r.status === "fulfilled" ? [r.value] : [])),
      ];
      pagesScanned = pages.length;
      categories = mergeCategoryPages(pages.map((p) => analyzePage(p.url, p.html)));
    } else {
      categories = analyzePage(url, html);
    }

    // Domännivå-signaler för AI-synlighet: robots.txt + llms.txt (best-effort).
    const siteFindings = analyzeRobotsAndFiles(await fetchSiteFiles(url));
    if (siteFindings.length > 0) {
      categories = categories.map((c) =>
        c.category === "aeo"
          ? buildCategory(c.category, c.label, [...c.findings, ...siteFindings], c.checksRun + 3)
          : c,
      );
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Kunde inte analysera sidan: ${err instanceof Error ? err.message : String(err)}` },
      { status: 422 },
    );
  }

  // Tillgänglighet är huvudkategorin (och det betalda erbjudandet); övriga är
  // gratis värde-höjare. Tillgänglighetsfälten ligger kvar på toppnivå för bakåt-
  // kompatibilitet, och alla kategorier finns i categories.
  const overall = Math.round(categories.reduce((s, c) => s + c.score, 0) / categories.length);

  // Lead-capture. Loggas alltid; skickas dessutom till en valfri webhook
  // (LEAD_WEBHOOK_URL, t.ex. Zapier/Make/egen endpoint) så leads inte tappas i
  // produktion. Webhooken är av som default och får aldrig blockera svaret.
  if (parsed.email) {
    console.log(`[grade] lead: ${parsed.email} -> ${result.url} (score ${result.score})`);
    void forwardLead(parsed.email, result);
  }

  const summary = await maybeSummarize(result);

  return NextResponse.json({ ...result, summary, categories, overall, pagesScanned });
}

/** Mappar tillgänglighetsresultatet till det gemensamma kategori-formatet. */
function accessibilityToCategory(r: ScanResult): CategoryResult {
  const findings: Finding[] = r.issues.map((i) => ({
    id: i.id,
    title: i.title,
    severity: i.severity,
    ref: `WCAG ${i.wcag}`,
    count: i.count,
    examples: i.examples,
  }));
  return buildCategory("accessibility", "Tillgänglighet (EAA)", findings, r.checksRun);
}

/** Skickar leadet till LEAD_WEBHOOK_URL om satt. Sväljer alla fel (best-effort). */
async function forwardLead(email: string, result: ScanResult): Promise<void> {
  const webhook = process.env.LEAD_WEBHOOK_URL;
  if (!webhook) return;
  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        url: result.url,
        score: result.score,
        grade: result.grade,
        issueCount: result.issues.length,
        scannedAt: result.scannedAt,
      }),
    });
  } catch (err) {
    console.error(`[grade] webhook-fel: ${err instanceof Error ? err.message : err}`);
  }
}

/** Ber Claude förklara resultatet kort på svenska. Returnerar null om AI saknas/fel. */
async function maybeSummarize(result: ScanResult): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (result.issues.length === 0) return null;
  try {
    const data = await completeJson<{ summary: string }>({
      system:
        "Du är en svensk tillgänglighetsexpert. Förklara WCAG-fel kort, konkret och " +
        "icke-skrämmande för en e-handlare utan teknisk bakgrund. Returnera JSON " +
        '{"summary": "..."} med max 3 meningar. Nämn EAA-relevans om det passar, ' +
        "men lova aldrig juridisk efterlevnad.",
      user: JSON.stringify({
        score: result.score,
        grade: result.grade,
        issues: result.issues.map((i) => ({ title: i.title, count: i.count, wcag: i.wcag })),
      }),
      maxTokens: 400,
    });
    return data.summary ?? null;
  } catch {
    return null; // AI är en bonus, aldrig en blockerare för gradern.
  }
}
