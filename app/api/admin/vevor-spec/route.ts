// POST /api/admin/vevor-spec {dryRun, bekrafta, idn?, allaIdn?}
//
// Ger VEVOR-utkast som importerades utan specifikation sin flik "Tekniska
// specifikationer" när läsaren har läst sidan igen (lib/vevor/spec-ratta.ts).
// Anropas av workflowen "VEVOR — specifikationen på utkast som saknar den" med
// CRON_SECRET.
//
// Torrt som default: utan `dryRun: false` skrivs ingenting. En skarp körning
// kräver `bekrafta` (planens antal sidor att rätta) och stannar på en
// tidsbudget, när Wix stryper takten (429) eller vid första sida som inte läser
// tillbaka som planen.
//
// Workflowen läser planen en gång med `allaIdn` och skriver sedan i tuggor ur
// den (`idn`). Då läser varje varv bara sina egna sidor och mappningar, i stället
// för alla utkast: planen över hela katalogen tog 87 sekunder (2026-11-01).
//
// ☠️ INGEN SKRIVNING INNE I SYNKFÖNSTRET (lib/wix/synkfonster.ts). En skarp körning
// där vägras (409) och tidsbudgeten kortas så att varvet slutar före nästa fönster.
//
// ☠️ SVARET BÄR BARA ANTAL OCH WIX-ID. Det skrivs ut i en publik Actions-logg.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";
import { VEVOR_ID_PREFIX } from "@/lib/store/leverantorsprefix";
import { skapaWixAnrop } from "@/lib/polish/skrivplan-wix";
import { WixVevorLager } from "@/lib/vevor/lager";
import { SpecFel, korSpec } from "@/lib/vevor/spec-ratta";
import { nastaFonsterSlut, sekunderTillSkrivning } from "@/lib/wix/synkfonster";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Tidsbudget, med marginal mot maxDuration. */
const BUDGET_MS = 240_000;
/** Så många sekunder före nästa synkfönster ska ett varv vara klart. */
const SYNK_MARGINAL_SEK = 30;
/** Mindre än så är inte värt ett varv: korSpec slutar skriva 30 sekunder före budgeten. */
const MIN_VARV_SEK = 75;
/** Högst så många sidor i ett skarpt anrop. Workflowens tuggor är 150. */
const MAX_IDN_SKARPT = 500;
const WIX_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

function fel(status: number, error: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, error, ...extra }, { status });
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  if (!auktoriserad(req)) return fel(401, "Otillåten");
  const kropp = (await req.json().catch(() => null)) as
    | { dryRun?: unknown; bekrafta?: unknown; idn?: unknown; allaIdn?: unknown }
    | null;
  const dryRun = kropp?.dryRun !== false;
  const bekrafta = typeof kropp?.bekrafta === "number" ? kropp.bekrafta : null;
  const allaIdn = dryRun && kropp?.allaIdn === true;
  if (kropp?.idn !== undefined && !Array.isArray(kropp.idn)) return fel(400, "idn ska vara en lista med Wix-produkt-id");
  const idn = Array.isArray(kropp?.idn) ? (kropp.idn as unknown[]) : [];
  // Ett id som inte är ett Wix-id hade inte matchat någon sida, och körningen hade sett tom ut.
  if (idn.some((x) => typeof x !== "string" || !WIX_ID.test(x))) return fel(400, "idn ska vara Wix-produkt-id (uuid)");
  const urval = [...new Set(idn as string[])];
  if (!dryRun && urval.length > MAX_IDN_SKARPT) return fel(400, `högst ${MAX_IDN_SKARPT} sidor i ett skarpt anrop`);

  let budgetMs = BUDGET_MS;
  if (!dryRun) {
    const nu = new Date(t0);
    const rum = sekunderTillSkrivning(nu, SYNK_MARGINAL_SEK);
    if (rum < MIN_VARV_SEK) {
      return fel(409, "synkfonster: Aosoms synk skriver lager och priser nu eller strax. Vänta tills fönstret är slut.", {
        vantaTillUtc: nastaFonsterSlut(nu).toISOString(),
      });
    }
    budgetMs = Math.min(budgetMs, rum * 1000);
  }

  const store = getStore();
  const lager = new WixVevorLager();
  try {
    const svar = await korSpec(
      {
        wix: skapaWixAnrop(),
        // Med ett urval läses bara dess rader, inte alla VEVOR-mappningar.
        mappningar: async () =>
          urval.length > 0
            ? [...(await store.getMappingsByWixProductIds(urval)).values()]
            : store.listMappingsMedPrefix(VEVOR_ID_PREFIX),
        avlasningar: (skus) => lager.avlasningar(skus),
      },
      { dryRun, bekrafta, idn: urval.length > 0 ? urval : undefined, allaIdn, budgetMs },
    );
    const h = svar.hinder;
    console.log(
      `[vevor-spec] ${dryRun ? "torr" : "skarp"}${urval.length > 0 ? ` (${urval.length} i urvalet)` : ""}: ` +
        `${svar.utkast} utkast, ${svar.attRatta} att rätta, ` +
        `${svar.redanRatt} redan rätt, ${svar.tomma} utan specifikation, ${svar.skrivna} skrivna, ${svar.kvar} kvar, ` +
        `stopp ${svar.stoppadAv}, hinder publicerad ${h.publicerad} polerad ${h.polerad} ` +
        `avlasning_saknas ${h.avlasning_saknas} ej_omlast ${h.ej_omlast} flik_utan_rader ${h.flik_utan_rader} ` +
        `modellnummer_kvar ${h.modellnummer_kvar} las_fel ${h.las_fel}`,
    );
    return NextResponse.json({ ok: true, ...svar });
  } catch (err) {
    if (err instanceof SpecFel) return fel(409, err.message);
    console.error("[vevor-spec] föll:", err instanceof Error ? err.name : "");
    return fel(502, "rättningen föll, se Vercels logg");
  }
}
