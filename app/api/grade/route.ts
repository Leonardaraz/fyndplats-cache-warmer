// POST /api/grade  { url: string, email?: string }
// Kör en statisk WCAG-scan av angiven URL och returnerar poäng + fel.
// Om en e-post anges loggas den som lead (MVP: server-logg; byt mot DB/CRM senare).
// AI-förklaring på svenska läggs till om ANTHROPIC_API_KEY finns — annars utan.

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { scanUrl, type ScanResult } from "@/lib/accessibility/scanner";
import { completeJson } from "@/lib/ai/claude";

export const runtime = "nodejs";
export const maxDuration = 30;

const Body = z.object({
  url: z.string().min(3, "Ange en webbadress."),
  email: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.issues[0]?.message : "Ogiltig begäran.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  let result: ScanResult;
  try {
    result = await scanUrl(parsed.url);
  } catch (err) {
    return NextResponse.json(
      { error: `Kunde inte analysera sidan: ${err instanceof Error ? err.message : String(err)}` },
      { status: 422 },
    );
  }

  // Lead-capture (MVP). I produktion: spara till DB/CRM + maila full rapport.
  if (parsed.email) {
    console.log(`[grade] lead: ${parsed.email} -> ${result.url} (score ${result.score})`);
  }

  const summary = await maybeSummarize(result);

  return NextResponse.json({ ...result, summary });
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
