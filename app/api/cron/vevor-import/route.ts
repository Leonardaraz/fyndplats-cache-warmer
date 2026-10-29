// GET /api/cron/vevor-import
//
// VEVOR-importen: läsarens avläsningar i lager blir osynliga utkast i Wix, så
// många som ryms i körningen. Allt om hur och varför står i lib/vevor/import.ts.
//
// Schemalagd var femte minut (vercel.json). En schemalagd körning gör ingenting
// förrän importen slagits på (workflowen "VEVOR — importen", läget pa), och
// ingenting när läsaren står fryst efter en spärr.
//
// Query (bara för hand, workflowens läge prov):
//   ?manuell=1      går även när importen är avstängd eller vilar
//   ?dryRun=false   skarpt; för hand är torrläge standard
//   ?max=5          högst så många utkast (1–50)
//
// ☠️ SVARET BÄR BARA ANTAL OCH WIX-ID. Det skrivs ut i en publik Actions-logg
// när workflowen kör prov.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { importloggrad, korVevorImport } from "@/lib/vevor/import";
import { liveImportDeps } from "@/lib/vevor/import-drift";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Under maxDuration med marginal för den sista produkten. Budgeten prövas
 * före varje produkt, och en produkt med sex bilder och återförsök kan ta en
 * minut: dör funktionen mitt i den finns produkten utan mappningsrad.
 */
const BUDGET_MS = 200_000;
const MAX_STANDARD = 5;
const MAX_TAK = 50;
/** Schemat har inget eget tak: budgeten bestämmer. */
const SCHEMA_TAK = 100_000;

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
  const limit = manuell ? (Number.isInteger(n) && n > 0 ? Math.min(n, MAX_TAK) : MAX_STANDARD) : SCHEMA_TAK;
  // För hand: torrt utan uttryckligt dryRun=false. Schemat: alltid skarpt.
  const dryRun = manuell ? p.get("dryRun") !== "false" : false;
  try {
    const s = await korVevorImport(liveImportDeps(), { manuell, dryRun, limit, budgetMs: BUDGET_MS });
    // En avstängd eller vilande körning loggar ingenting: tolv rader i timmen
    // om ingenting hade dränkt de rader som betyder något.
    if (s.utfall !== "avstangd" && s.utfall !== "vilar") console.log(importloggrad(s));
    return NextResponse.json({ ok: true, ...s });
  } catch (err) {
    // Hela felet bara i Vercels logg: ett fel från Wix eller pipelinen kan bära produktens id.
    console.error("[vevor-import] körningen föll:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ ok: false, error: "körningen föll, se Vercels logg" }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
