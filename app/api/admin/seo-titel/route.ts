// POST /api/admin/seo-titel — SEO-titel och metabeskrivning på publicerade sidor.
//
//   POST { lage, bekrafta, plan }
//     lage      torr | skriv | verifiera. Ett utelämnat eller okänt läge är 400,
//               aldrig ett implicit "skriv".
//     bekrafta  läget skriv: antalet sidor som torrkörningen sa att den skriver
//     plan      { namn, rader: [{ kort, pid, seoTitel, seoBesk }] }
//               (tools/polish-assets/seo-titel/<namn>.json)
//
// Anropas av workflowen "SEO — titel och metabeskrivning på publicerade sidor",
// som läser planen ur grenen och kontrollerar dess sha256 innan den skickas hit.
// Reglerna bor i lib/polish/seo-titel.ts: bara `seoData` skrivs, med fältmask,
// och ingen titel får stå på en annan publicerad sida.
//
// ☠️ ALDRIG I AOSOMS SYNKFÖNSTER (lib/wix/synkfonster.ts). Synken skriver priser
// på samma produkter, och två skrivningar på samma revision fäller den ena.
// Läget skriv vägrar inne i fönstret och när fönstret börjar inom rutans tid.
//
// ☠️ SVARET GÅR TILL EN PUBLIK LOGG. Det bär kort-id, fältnamn, utfall och antal,
// aldrig texterna.
//
// Auth följer huset: CRON_SECRET eller EXTENSION_API_TOKEN.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { korSeoTitel, SEO_LAGEN, type SeoLage, valideraSeoPlan } from "@/lib/polish/seo-titel";
import { felText } from "@/lib/polish/skrivplan";
import { skapaWixAnrop } from "@/lib/polish/skrivplan-wix";
import { nastaFonsterSlut, sekunderTillSkrivning } from "@/lib/wix/synkfonster";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Så lång tid ska finnas kvar till nästa synkfönster när en skrivning börjar. */
const MARGINAL_SEK = maxDuration;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!auktoriserad(req)) {
    return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });
  }

  let kropp: { lage?: unknown; bekrafta?: unknown; plan?: unknown };
  try {
    kropp = (await req.json()) as typeof kropp;
  } catch {
    return NextResponse.json({ ok: false, error: "Ogiltig JSON" }, { status: 400 });
  }

  const lage = kropp.lage;
  if (typeof lage !== "string" || !(SEO_LAGEN as readonly string[]).includes(lage)) {
    return NextResponse.json({ ok: false, error: `lage måste vara ett av: ${SEO_LAGEN.join(", ")}` }, { status: 400 });
  }
  const bekrafta = typeof kropp.bekrafta === "number" && Number.isInteger(kropp.bekrafta) ? kropp.bekrafta : null;

  const v = valideraSeoPlan(kropp.plan);
  if ("fel" in v) {
    return NextResponse.json({ ok: false, error: "Ogiltig plan — ingenting skrivet", fel: v.fel.slice(0, 50) }, { status: 400 });
  }

  if (lage === "skriv") {
    const nu = new Date();
    if (sekunderTillSkrivning(nu, MARGINAL_SEK) === 0) {
      return NextResponse.json(
        {
          ok: false,
          lage,
          error: "synkfonster: Aosoms synk skriver priser nu eller strax. Ingenting skrivet. Kör igen efter fönstret.",
          efter: nastaFonsterSlut(nu).toISOString(),
        },
        { status: 409 },
      );
    }
  }

  try {
    const utfall = await korSeoTitel(v.plan, skapaWixAnrop(), lage as SeoLage, bekrafta);
    console.log(`[seo-titel] ${v.plan.namn} ${lage}: ${utfall.avbrutet ?? utfall.sammanfattning}`);
    return NextResponse.json({
      ok: utfall.ok,
      lage,
      plan: v.plan.namn,
      sammanfattning: utfall.sammanfattning,
      attSkriva: utfall.attSkriva,
      ...(utfall.avbrutet ? { avbrutet: utfall.avbrutet } : {}),
      rader: utfall.rader,
    });
  } catch (err) {
    // ☠️ Tvättat innan det lämnar rutten — ett Wix-fel kan citera data vi aldrig skickade.
    const msg = felText(err);
    console.error(`[seo-titel] ${v.plan.namn} ${lage} misslyckades: ${msg}`);
    return NextResponse.json({ ok: false, lage, error: msg }, { status: 500 });
  }
}
