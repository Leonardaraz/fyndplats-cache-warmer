// POST /api/compare  { urls: string[] }  (2–5 URL:er)
// Skannar varje sajt (enkel-sid) och returnerar en jämförelse: rangordning +
// vinnare per kategori. För "hur står jag mig mot konkurrenterna?".

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchPageHtml } from "@/lib/accessibility/scanner";
import { analyzePage, overallScore } from "@/lib/scan/analyze-page";
import { compareSites, type CompareEntry } from "@/lib/scan/compare";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  urls: z.array(z.string().min(3)).min(2, "Ange minst två URL:er.").max(5, "Max fem URL:er."),
});

export async function POST(req: NextRequest) {
  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.issues[0]?.message : "Ogiltig begäran.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Skanna alla parallellt; sajter som inte går att hämta hoppas över men listas.
  const settled = await Promise.allSettled(
    parsed.urls.map(async (raw) => {
      const { url, html } = await fetchPageHtml(raw);
      const categories = analyzePage(url, html);
      return { url, overall: overallScore(categories), categories } satisfies CompareEntry;
    }),
  );

  const entries = settled.flatMap((s) => (s.status === "fulfilled" ? [s.value] : []));
  const failed = parsed.urls.filter((_, i) => settled[i].status === "rejected");

  if (entries.length < 2) {
    return NextResponse.json(
      { error: "Kunde inte hämta tillräckligt många sajter för en jämförelse.", failed },
      { status: 422 },
    );
  }

  return NextResponse.json({ ...compareSites(entries), failed });
}
