// GET /api/cron/vevor-lasare
//
// VEVOR-läsaren: läser de produktsidor som står på tur, en i taget, och
// sparar avläsningarna i Wix. Allt om hur och varför står i lib/vevor/lasare.ts.
//
// Schemalagd var femte minut (vercel.json). En schemalagd körning gör
// ingenting förrän läsaren slagits på (workflowen "VEVOR — läsaren", läget
// pa), och ingenting alls när den är fryst efter en spärr.
//
// Query:
//   ?manuell=1   körd för hand: går även när läsaren är avstängd, aldrig när
//                den är fryst. Workflowens läge prov.
//   ?max=50      högst så många sidor ur kön (default 100, högst 200)
//
// ☠️ SVARET BÄR BARA ANTAL. Det skrivs ut i en publik Actions-logg när
// workflowen kör prov.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { korVevorLasare, loggrad } from "@/lib/vevor/lasare";
import { liveDeps } from "@/lib/vevor/drift";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Under maxDuration med marginal för skrivningen i slutet. */
const BUDGET_MS = 240_000;
const MAX_STANDARD = 100;
const MAX_TAK = 200;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

async function handle(req: NextRequest) {
  if (!auktoriserad(req)) return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });
  const p = req.nextUrl.searchParams;
  const manuell = p.get("manuell") === "1";
  const n = Number(p.get("max"));
  const maxSidor = Number.isInteger(n) && n > 0 ? Math.min(n, MAX_TAK) : MAX_STANDARD;
  try {
    const s = await korVevorLasare(liveDeps(), { manuell, maxSidor, budgetMs: BUDGET_MS });
    console.log(loggrad(s));
    return NextResponse.json({ ok: true, ...s });
  } catch (err) {
    // Hela felet bara i Vercels logg: ett fel från Wix kan eka fält ur en rad.
    console.error("[vevor-lasare] körningen föll:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ ok: false, error: "körningen föll, se Vercels logg" }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
