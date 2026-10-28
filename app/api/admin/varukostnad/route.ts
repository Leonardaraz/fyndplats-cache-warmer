// GET/POST /api/admin/varukostnad — fyll i varukostnaden (`revenueDetails.cost`) på Aosom-varianter
// som saknar den, ur mappningens `landedCostSek` (punkt 5b, Leonards ja 2026-10-27).
//
// Logiken, bakgrunden och alla skäl står i lib/wix/varukostnad.ts. Rutten är gränssnittet: auktorisering,
// parametrar, spärren mot Aosoms synkfönster, bekräftelsen av planens antal och vad som skrivs ut.
//
// TORRT ÄR DEFAULT. Utan `dryRun=false` skrivs ingenting; du får planen.
//
// Query:
//   ?dryRun=false     skarp skrivning
//   ?bekrafta=N       första skarpa varvet: torrkörningens `totalt` (antalet produkter i planen)
//   ?hogst=K          följande varv: förra varvets `aterstod`. Planen får krympa men aldrig växa.
//   ?efter=<wix-id>   fortsätt efter den här produkten (`nasta` ur förra varvet)
//   ?limit=N          högst N produkter skrivs det här varvet
//   ?ids=a,b          bara de här produkterna (provet, högst 60). `bekrafta` gäller då deras antal.
//   ?utkast=0         hoppa dolda utkast (default: de tas med)
//   ?maxSeconds=240   tidsbudget (ruttens maxDuration är 300 s)
//   ?leverantor=aosom bara Aosom stöds
//
// ☠️ BARA AOSOM. AliExpress-radernas `landedCostSek` är importtidens tal och fryser; ett skrivet tal hade gett
// Wix en för bra vinstsiffra (CLAUDE.md, *AE-radernas kostnad FRYSER vid importen*). Ett annat värde på
// `leverantor` är 400, så att en framtida leverantör är ett beslut och ingen tyst följd.
//
// ☠️ INGEN SKRIVNING INNE I SYNKFÖNSTRET. Aosoms lager- och priskörningar går 00, 03 … 21 UTC runt :12–:29
// (lib/wix/synkfonster.ts). Skrivaren jämför lagret före och efter varje produkt och stannar på en ändring,
// så en skarp körning där vägras (409) och tidsbudgeten kortas så att den slutar före nästa fönster.
//
// ☠️ SVARET BÄR BARA WIX-ID OCH RÄKNARE. Det hamnar i en publik Actions-logg: inga kostnader, artikelnummer,
// namn eller sluggar. Felkroppar från Wix redigeras (decimaltal och artikelnummer) innan de lämnar modulen.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { skapaWixAnrop } from "@/lib/polish/skrivplan-wix";
import { getStore } from "@/lib/store/factory";
import { nastaFonsterSlut, sekunderTillSkrivning } from "@/lib/wix/synkfonster";
import { BekraftaFel, korVarukostnad, lasKatalogVarianter, redigeraFeltext } from "@/lib/wix/varukostnad";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Så många sekunder före nästa synkfönster ska en körning vara klar. */
const SYNK_MARGINAL_SEK = 30;
/** Mindre än så är inte värt ett varv: katalogsvepet ensamt tar ungefär en kvart av det. */
const MIN_SKIVA_SEK = 45;
const MAX_IDS = 60;
const WIX_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

/** Ett icke-negativt heltal, annars undefined. */
function heltal(v: string | null): number | undefined {
  if (v === null || !/^\d+$/.test(v.trim())) return undefined;
  return Number(v.trim());
}

function fel(status: number, error: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, error, ...extra }, { status });
}

async function handle(req: NextRequest) {
  const t0 = Date.now();
  if (!auktoriserad(req)) return fel(401, "Otillåten");

  const q = req.nextUrl.searchParams;
  const torr = q.get("dryRun") !== "false";
  const utkast = q.get("utkast") !== "0";

  const leverantor = (q.get("leverantor") ?? "aosom").trim().toLowerCase();
  if (leverantor !== "aosom") {
    return fel(400, "leverantor ska vara aosom: AliExpress-radernas kostnad fryser vid importen och skrivs inte hit");
  }

  const ids = (q.get("ids") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (ids.length > MAX_IDS || ids.some((id) => !WIX_ID.test(id))) {
    return fel(400, `ids ska vara upp till ${MAX_IDS} Wix-produkt-id (uuid), kommaseparerade`);
  }
  const efter = (q.get("efter") ?? "").trim();
  if (efter && !WIX_ID.test(efter)) return fel(400, "efter ska vara ett Wix-produkt-id (uuid)");

  const limitParam = q.get("limit");
  const limit = heltal(limitParam);
  if (limitParam !== null && (limit === undefined || limit < 1)) return fel(400, "limit ska vara ett heltal, 1 eller större");

  const bekraftaParam = q.get("bekrafta");
  const hogstParam = q.get("hogst");
  if (bekraftaParam !== null && heltal(bekraftaParam) === undefined) return fel(400, "bekrafta ska vara planens antal produkter (ett heltal)");
  if (hogstParam !== null && heltal(hogstParam) === undefined) return fel(400, "hogst ska vara ett heltal");

  const maxParam = q.get("maxSeconds");
  const begart = heltal(maxParam) || 240;
  let sekunder = Math.min(begart, 270);

  if (!torr) {
    const nu = new Date(t0);
    const rum = sekunderTillSkrivning(nu, SYNK_MARGINAL_SEK);
    if (rum < MIN_SKIVA_SEK) {
      return fel(409, "synkfonster: Aosoms synk skriver lager och priser nu eller strax. Vänta tills fönstret är slut.", {
        vantaTillUtc: nastaFonsterSlut(nu).toISOString(),
      });
    }
    sekunder = Math.min(sekunder, rum);
  }

  const wix = skapaWixAnrop();
  let mappningar;
  let katalog;
  try {
    mappningar = await getStore().listMappings();
    katalog = await lasKatalogVarianter(wix);
  } catch (err) {
    const message = redigeraFeltext(err instanceof Error ? err.message : String(err)).slice(0, 300);
    console.error(`[varukostnad] underlaget gick inte att läsa: ${message}`);
    return fel(503, "underlaget gick inte att läsa", { message });
  }

  try {
    const rapport = await korVarukostnad(wix, mappningar, katalog, {
      torr,
      utkast,
      ids: ids.length ? ids : undefined,
      efter: efter || undefined,
      limit,
      deadline: t0 + sekunder * 1000,
      bekrafta: bekraftaParam ?? undefined,
      hogst: hogstParam !== null ? heltal(hogstParam) : undefined,
    });

    const hard = rapport.stoppadAv === "avvikelse" || rapport.stoppadAv === "fel_i_foljd";
    console.log(
      `[varukostnad] ${torr ? "torrt" : "skarpt"}: planen har ${rapport.totalt} produkter `
        + `(${rapport.plan.attSkriva} varianter, ${rapport.plan.redanKostnad} har redan kostnad, ${rapport.plan.utanKatalogvariant} saknas i Wix), `
        + `${rapport.behandlade} behandlade, ${rapport.skrivna} skrivna (${rapport.varianterSkrivna} varianter), `
        + `${rapport.redanKlara} redan klara, ${rapport.fel} fel, ${rapport.avvikelser} avvikelser, `
        + `${rapport.ejNadda} ej nådda, ${rapport.aterstod} återstår${rapport.stoppadAv ? `, stopp: ${rapport.stoppadAv}` : ""}`,
    );
    for (const p of rapport.produkter) {
      console.log(`[varukostnad] ${p.id} ${p.status}${p.variantbild ? ` variantbild=${p.variantbild}` : ""}${p.avvikelser ? ` ${p.avvikelser.join("; ")}` : ""}`);
    }
    if (!torr && rapport.behandlade > 0) {
      await audit(
        "varukostnad",
        "batch",
        `${rapport.skrivna} produkter skrivna (${rapport.varianterSkrivna} varianter), ${rapport.redanKlara} redan klara, `
          + `${rapport.fel} fel, ${rapport.avvikelser} avvikelser, ${rapport.aterstod} återstår`
          + (hard ? ` — STOPPAD (${rapport.stoppadAv})` : ""),
      );
    }

    return NextResponse.json({ ok: !hard, ...rapport }, { status: hard ? 500 : 200 });
  } catch (err) {
    if (err instanceof BekraftaFel) {
      return fel(409, err.message, { rad: "Kör torrt, läs planen, och skicka DESS antal som bekrafta (första varvet) eller förra varvets aterstod som hogst." });
    }
    const message = redigeraFeltext(err instanceof Error ? err.message : String(err)).slice(0, 300);
    console.error(`[varukostnad] körningen föll: ${message}`);
    return fel(500, "körningen föll — se Vercel-loggen", { message });
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
