// GET/POST /api/cron/vevor-synk
//
// VEVOR-synken: lager och pris på VEVOR-raderna i butiken, med samma motor som
// Aosom-synken och läsarens avläsningar som källa. Allt om hur och varför står
// i lib/vevor/synk.ts.
//
// Schemalagd en gång i timmen, minut 50 (vercel.json): efter Aosom-synken,
// som går minut 20, och fri från de andra timvisa jobben. En schemalagd
// körning gör ingenting förrän synken slagits på (workflowen "VEVOR — synken",
// läget pa), är alltid skarp och fortsätter där förra schemalagda körningen
// slutade.
//
// Query (bara för hand, workflowens lägen torr och skarp):
//   ?manuell=1        går även när synken är avstängd, och rör inte schemats markör
//   ?dryRun=false     skarpt; för hand är torrläge standard
//   ?limit=1200       tak på antal produkter som skrivs
//   ?after=<markör>   fortsätt efter förra svarets `cursor` (förseglad, se
//                     lib/aosom/markor.ts)
//   ?godkannPris=<wix-id>,…  släpp 40 %-taket för just dessa produkter i den
//                     här körningen (motorns `godkannPrisandring`). Bara för
//                     hand: schemat godkänner aldrig ett prishopp.
//
// ☠️ SVARET BÄR BARA ANTAL OCH WIX-ID. Motorns fel och varningar bär
// artikelnumret, och det tas bort här (`utanArtikelnummer`). Markören går ut
// förseglad. Svaret skrivs ut i en publik Actions-logg.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { forseglaMarkor, MarkorFel, oppnaMarkor } from "@/lib/aosom/markor";
import { korVevorSynk, liveSynkKorDeps, synkloggrad, utanArtikelnummer } from "@/lib/vevor/synk";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Under maxDuration med marginal. Källan och mappningarna läses före loopen och räknas in. */
const BUDGET_MS = 240_000;
const LIMIT_STANDARD = 1200;
const WIX_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  // För hand: torrt utan uttryckligt dryRun=false. Schemat: alltid skarpt.
  const dryRun = manuell ? p.get("dryRun") !== "false" : false;
  const n = Number(p.get("limit"));
  const limit = Number.isInteger(n) && n > 0 ? n : LIMIT_STANDARD;

  // ☠️ ETT GODKÄNNANDE SOM INTE GÅR ATT FÖLJA VÄGRAS. Ett id som inte ser ut
  // som ett Wix-id, eller ett godkännande utan `manuell=1`, hade annars tyst
  // betytt "ingenting godkänt": körningen hade sett lyckad ut medan priset
  // stod kvar. Samma regel som Aosom-ruttens `godkannPris`.
  const godkannPris = (p.get("godkannPris") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (godkannPris.length > 0 && !manuell) {
    return NextResponse.json(
      { ok: false, error: "godkannPris gäller bara en körning för hand (manuell=1)" },
      { status: 400 },
    );
  }
  const ogiltiga = godkannPris.filter((id) => !WIX_ID.test(id));
  if (ogiltiga.length > 0) {
    return NextResponse.json(
      { ok: false, error: `godkannPris tar Wix-produkt-id: ${ogiltiga.join(", ").slice(0, 200)}` },
      { status: 400 },
    );
  }

  // ☠️ Markören är ett artikelnummer. Den kommer tillbaka förseglad; en som
  // inte går att öppna är 400, aldrig "börja om från början".
  const hemlighet = process.env.CRON_SECRET ?? "";
  let after: string | undefined;
  try {
    after = manuell ? oppnaMarkor(p.get("after"), hemlighet) : undefined;
  } catch (err) {
    if (err instanceof MarkorFel) return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
    throw err;
  }

  try {
    const u = await korVevorSynk(await liveSynkKorDeps(), {
      manuell,
      dryRun,
      limit,
      budgetMs: BUDGET_MS,
      after,
      godkannPrisandring: godkannPris.length ? new Set(godkannPris) : undefined,
    });
    // En avstängd körning loggar ingenting: 24 rader om dygnet om ingenting
    // hade dränkt de rader som betyder något.
    if (u.utfall !== "avstangd") console.log(synkloggrad(u));
    const s = u.summary;
    if (!s) return NextResponse.json({ ok: true, utfall: u.utfall });

    // Samma villkor som Aosom-synkens audit-rad: allt som skrev, föll eller
    // inte gick att avgöra ska gå att hitta i efterhand.
    if (!s.dryRun && (s.lagerUppdaterade > 0 || s.prisUppdaterade > 0 || s.misslyckade > 0
      || s.okandaVarianter > 0 || s.tvetydiga > 0 || s.leverantorOense > 0 || s.stampelHoppade > 0
      || s.varningar.length > 0 || s.godkandaHopp.length > 0
      || s.restockMejl > 0 || s.restockEjSkickade > 0 || s.restockFel || s.prislistaFel)) {
      await audit("vevor-sync", "batch", synkloggrad(u).replace(/^\[vevor-synk\] /, ""));
    }

    const cursor = forseglaMarkor(s.cursor, hemlighet);
    return NextResponse.json({ ok: true, utfall: u.utfall, markor: u.markor, markorFel: u.markorFel, ...utanArtikelnummer(s), cursor });
  } catch (err) {
    // Hela felet bara i Vercels logg: ett fel från Wix kan bära ett artikelnummer.
    console.error("[vevor-synk] körningen föll:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ ok: false, error: "VEVOR-synken föll, se Vercels logg" }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
