// Hämtar domännivå-filer (robots.txt, llms.txt) best-effort för AI-synlighetsanalys.
// Bruten ur grade-routen så den kan integrationstestas mot en riktig HTTP-server.

export interface SiteFiles {
  robotsTxt: string | null;
  llmsTxt: string | null;
}

/** Hämtar robots.txt och llms.txt från domänroten. Returnerar null vid fel/404. */
export async function fetchSiteFiles(pageUrl: string): Promise<SiteFiles> {
  let origin: string;
  try {
    origin = new URL(pageUrl).origin;
  } catch {
    return { robotsTxt: null, llmsTxt: null };
  }
  const get = async (path: string): Promise<string | null> => {
    try {
      const res = await fetch(`${origin}${path}`, {
        signal: AbortSignal.timeout(8000),
        headers: { "User-Agent": "FyndplatsAccessibilityBot/0.1 (+https://fyndplats.com)" },
      });
      if (!res.ok) return null;
      return await res.text();
    } catch {
      return null;
    }
  };
  const [robotsTxt, llmsTxt] = await Promise.all([get("/robots.txt"), get("/llms.txt")]);
  return { robotsTxt, llmsTxt };
}
