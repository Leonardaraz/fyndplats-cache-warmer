// Analys av robots.txt + llms.txt på domännivå — AI-synlighet (AEO).
// Avgör bl.a. om sidan BLOCKERAR AI-sökmotorernas crawlers, vilket gör att
// butiken inte kan synas/citeras i ChatGPT, Perplexity m.fl. Ren funktion:
// route-handlern hämtar filerna (best-effort) och skickar in texten hit.

import type { Finding } from "../scan/types";

// Kända AI-crawlers (gemener för matchning).
const AI_BOTS = [
  "gptbot",
  "chatgpt-user",
  "oai-searchbot",
  "claudebot",
  "claude-web",
  "anthropic-ai",
  "perplexitybot",
  "google-extended",
  "ccbot",
  "*",
];

/** Returnerar de AI-crawlers (av AI_BOTS) som blockeras via Disallow: / i robots.txt. */
export function blockedAiBots(robotsTxt: string): string[] {
  const blocked = new Set<string>();
  let currentAgents: string[] = [];
  let lastWasRule = false;

  for (const rawLine of robotsTxt.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) {
      currentAgents = [];
      lastWasRule = false;
      continue;
    }
    const ua = line.match(/^user-agent\s*:\s*(.+)$/i);
    if (ua) {
      if (lastWasRule) currentAgents = []; // ny grupp efter regler
      currentAgents.push(ua[1].trim().toLowerCase());
      lastWasRule = false;
      continue;
    }
    const dis = line.match(/^disallow\s*:\s*(.*)$/i);
    if (dis) {
      lastWasRule = true;
      if (dis[1].trim() === "/") {
        for (const a of currentAgents) if (AI_BOTS.includes(a)) blocked.add(a);
      }
      continue;
    }
    if (/^allow\s*:/i.test(line)) lastWasRule = true;
  }
  return [...blocked];
}

export interface RobotsInput {
  /** robots.txt-innehåll, eller null om den saknas/inte gick att hämta. */
  robotsTxt: string | null;
  /** llms.txt-innehåll, eller null. */
  llmsTxt: string | null;
}

/** Bygger AEO-fynd från robots.txt/llms.txt. */
export function analyzeRobotsAndFiles({ robotsTxt, llmsTxt }: RobotsInput): Finding[] {
  const findings: Finding[] = [];

  if (robotsTxt == null) {
    findings.push({
      id: "no-robots",
      title: "Saknar robots.txt – sökmotorer saknar vägledning",
      severity: "minor",
      ref: "robots.txt",
      count: 1,
      examples: [],
    });
  } else {
    const blocked = blockedAiBots(robotsTxt);
    if (blocked.length > 0) {
      findings.push({
        id: "blocks-ai-crawlers",
        title: "Blockerar AI-sökmotorer – syns inte i ChatGPT/Perplexity m.fl.",
        severity: "serious",
        ref: "robots.txt",
        count: blocked.length,
        examples: [blocked.join(", ")],
      });
    }
    if (!/^\s*sitemap\s*:/im.test(robotsTxt)) {
      findings.push({
        id: "no-sitemap",
        title: "Ingen sitemap angiven i robots.txt",
        severity: "minor",
        ref: "robots.txt",
        count: 1,
        examples: [],
      });
    }
  }

  if (llmsTxt == null) {
    findings.push({
      id: "no-llms-txt",
      title: "Saknar llms.txt – missar den framväxande standarden för AI-vägledning",
      severity: "minor",
      ref: "llms.txt",
      count: 1,
      examples: [],
    });
  }

  return findings;
}
