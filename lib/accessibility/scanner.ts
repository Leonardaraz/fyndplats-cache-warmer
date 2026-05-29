// WCAG 2.1 AA — statisk tillgänglighetsscanner (beroendefri MVP).
//
// Hämtar en publik sidas HTML och kör ett antal högvärdes-kontroller som går att
// göra utan renderad DOM. Detta är medvetet en MVP-lead-magnet: den fångar de
// vanligaste och mest pinsamma WCAG-felen (saknad alt-text, språk, titel, generiska
// länkar m.m.) men ersätter INTE en full audit (kontrast, fokusordning och annat
// som kräver en renderad sida kommer i ett senare steg via axe-core).
//
// Designad så att regelmotorn (rules) kan bytas ut mot en riktig DOM/axe-core-scan
// utan att API:t eller UI:t ändras.

export type Severity = "critical" | "serious" | "moderate" | "minor";

export interface Issue {
  /** Stabilt id, t.ex. "img-alt". */
  id: string;
  /** Kort rubrik på svenska. */
  title: string;
  severity: Severity;
  /** WCAG-kriterium, t.ex. "1.1.1". */
  wcag: string;
  /** Antal förekomster på sidan. */
  count: number;
  /** Upp till några exempel (HTML-utdrag) för kontext. */
  examples: string[];
}

export interface ScanResult {
  url: string;
  /** 0–100, högre = bättre. */
  score: number;
  /** Bokstavsbetyg A–F. */
  grade: string;
  issues: Issue[];
  /** Antal kontroller som kördes (för transparens). */
  checksRun: number;
  /** Sant om sidan kunde hämtas och analyseras. */
  ok: boolean;
  scannedAt: string;
}

const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 15,
  serious: 8,
  moderate: 4,
  minor: 2,
};

/** Normaliserar och validerar en användarinmatad URL. Kastar vid uppenbart fel. */
export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const u = new URL(withProto); // kastar TypeError vid ogiltig URL
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("Endast http/https stöds.");
  }
  return u.toString();
}

/** Hämtar HTML för en sida med timeout och en vänlig user-agent. */
async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        // Tydlig, ärlig UA — vi döljer oss inte.
        "User-Agent": "FyndplatsAccessibilityBot/0.1 (+https://fyndplats.com)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) throw new Error(`Sidan svarade med status ${res.status}.`);
    const ctype = res.headers.get("content-type") ?? "";
    if (!ctype.includes("html")) {
      throw new Error("Adressen pekar inte på en HTML-sida.");
    }
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

// --- Små HTML-hjälpare (regex-baserade; medvetet enkla för MVP) ---

function matchTags(html: string, tag: string): string[] {
  const re = new RegExp(`<${tag}\\b[^>]*>`, "gi");
  return html.match(re) ?? [];
}

function getAttr(tagHtml: string, attr: string): string | null {
  const re = new RegExp(`\\b${attr}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const m = tagHtml.match(re);
  if (!m) return null;
  return m[2] ?? m[3] ?? m[4] ?? "";
}

function hasAttr(tagHtml: string, attr: string): boolean {
  return new RegExp(`\\b${attr}\\b`, "i").test(tagHtml);
}

// --- Regler ---

type Rule = (html: string) => Omit<Issue, "severity"> & { severity: Severity } | null;

const RULES: Rule[] = [
  // 3.1.1 — Sidans språk
  (html) => {
    const htmlTag = html.match(/<html\b[^>]*>/i)?.[0] ?? "";
    const lang = getAttr(htmlTag, "lang");
    if (lang && lang.trim().length > 0) return null;
    return {
      id: "html-lang",
      title: "Sidan saknar språkdeklaration (lang-attribut på <html>)",
      severity: "serious",
      wcag: "3.1.1",
      count: 1,
      examples: [htmlTag.slice(0, 120) || "<html>"],
    };
  },

  // 2.4.2 — Sidtitel
  (html) => {
    const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
    if (title && title.length > 0) return null;
    return {
      id: "doc-title",
      title: "Sidan saknar en beskrivande <title>",
      severity: "serious",
      wcag: "2.4.2",
      count: 1,
      examples: [],
    };
  },

  // 1.1.1 — Bilder utan alt-text
  (html) => {
    const imgs = matchTags(html, "img");
    const missing = imgs.filter((t) => !hasAttr(t, "alt"));
    if (missing.length === 0) return null;
    return {
      id: "img-alt",
      title: "Bilder saknar alt-text",
      severity: "critical",
      wcag: "1.1.1",
      count: missing.length,
      examples: missing.slice(0, 3).map((t) => t.slice(0, 120)),
    };
  },

  // 2.4.4 — Generisk länktext
  (html) => {
    const links = [...html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)];
    const generic = /^(klicka här|läs mer|här|mer|click here|read more|here|more|link)\.?$/i;
    const bad = links.filter((m) => {
      const text = m[1].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
      return generic.test(text);
    });
    if (bad.length === 0) return null;
    return {
      id: "link-text",
      title: "Länkar med intetsägande text (t.ex. ”klicka här”, ”läs mer”)",
      severity: "moderate",
      wcag: "2.4.4",
      count: bad.length,
      examples: bad.slice(0, 3).map((m) => m[0].slice(0, 120)),
    };
  },

  // 1.3.1 — Tomma knappar/länkar (ingen urskiljbar text)
  (html) => {
    const buttons = [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)];
    const empty = buttons.filter((m) => {
      const text = m[2].replace(/<[^>]*>/g, "").trim();
      const aria = getAttr(`<button${m[1]}>`, "aria-label");
      return text.length === 0 && !aria;
    });
    if (empty.length === 0) return null;
    return {
      id: "button-name",
      title: "Knappar utan text eller aria-label (skärmläsare kan inte tolka dem)",
      severity: "serious",
      wcag: "4.1.2",
      count: empty.length,
      examples: empty.slice(0, 3).map((m) => m[0].slice(0, 120)),
    };
  },

  // 1.4.4 — Zoom avstängd via viewport
  (html) => {
    const viewport = matchTags(html, "meta").find((t) =>
      /name\s*=\s*["']?viewport/i.test(t),
    );
    if (!viewport) return null;
    const content = getAttr(viewport, "content") ?? "";
    if (/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(\.0)?\b/i.test(content)) {
      return {
        id: "meta-viewport",
        title: "Sidan blockerar zoom (user-scalable=no / maximum-scale=1)",
        severity: "serious",
        wcag: "1.4.4",
        count: 1,
        examples: [viewport.slice(0, 120)],
      };
    }
    return null;
  },

  // 1.3.1 — Saknad H1 / rubrikstruktur
  (html) => {
    const h1 = matchTags(html, "h1");
    if (h1.length >= 1) return null;
    return {
      id: "page-h1",
      title: "Sidan saknar en huvudrubrik (<h1>)",
      severity: "moderate",
      wcag: "1.3.1",
      count: 1,
      examples: [],
    };
  },

  // 4.1.2 — Formulärfält utan etikett (approximativ)
  (html) => {
    const inputs = matchTags(html, "input").filter((t) => {
      const type = (getAttr(t, "type") ?? "text").toLowerCase();
      return !["hidden", "submit", "button", "image", "reset"].includes(type);
    });
    const unlabeled = inputs.filter(
      (t) => !hasAttr(t, "aria-label") && !hasAttr(t, "aria-labelledby") && !hasAttr(t, "title"),
    );
    // Vi kan inte säkert matcha <label for> via regex, så vi flaggar bara om det
    // finns fält helt utan någon tillgänglig namnkälla OCH inga <label> alls.
    const hasLabels = /<label\b/i.test(html);
    if (unlabeled.length === 0 || hasLabels) return null;
    return {
      id: "input-label",
      title: "Formulärfält verkar sakna etiketter (label/aria-label)",
      severity: "serious",
      wcag: "4.1.2",
      count: unlabeled.length,
      examples: unlabeled.slice(0, 3).map((t) => t.slice(0, 120)),
    };
  },
];

function scoreToGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  if (score >= 50) return "E";
  return "F";
}

/** Kör alla regler mot HTML och räknar fram poäng. Exponerad för enhetstester. */
export function evaluateHtml(url: string, html: string): ScanResult {
  const issues: Issue[] = [];
  for (const rule of RULES) {
    const result = rule(html);
    if (result) issues.push(result);
  }

  // Poäng: börja på 100, dra av viktat per förekomst (med tak per regel så en enda
  // regel inte sänker allt till noll).
  let penalty = 0;
  for (const issue of issues) {
    const perRuleCap = SEVERITY_WEIGHT[issue.severity] * 3;
    penalty += Math.min(issue.count * SEVERITY_WEIGHT[issue.severity], perRuleCap);
  }
  const score = Math.max(0, Math.min(100, Math.round(100 - penalty)));

  // Sortera allvarligast först.
  const order: Severity[] = ["critical", "serious", "moderate", "minor"];
  issues.sort(
    (a, b) =>
      order.indexOf(a.severity) - order.indexOf(b.severity) || b.count - a.count,
  );

  return {
    url,
    score,
    grade: scoreToGrade(score),
    issues,
    checksRun: RULES.length,
    ok: true,
    scannedAt: new Date().toISOString(),
  };
}

/** Hämtar och analyserar en URL. Kastar vid hämtningsfel. */
export async function scanUrl(rawUrl: string): Promise<ScanResult> {
  const url = normalizeUrl(rawUrl);
  const html = await fetchHtml(url);
  return evaluateHtml(url, html);
}
