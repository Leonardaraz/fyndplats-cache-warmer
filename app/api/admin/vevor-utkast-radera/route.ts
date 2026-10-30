// POST /api/admin/vevor-utkast-radera {dryRun, bekrafta}
//
// Raderar de opolerade VEVOR-utkasten och nollställer importen, så att den
// börjar om med syskon, betyg och recensioner (steg 8, lib/vevor/radera-utkast.ts).
// Anropas av workflowen "VEVOR — radera opolerade utkast" med CRON_SECRET.
//
// Torrt som default: utan `dryRun: false` raderas ingenting. En skarp körning
// kräver `bekrafta` (planens antal) och stannar på en tidsbudget. Svaret säger
// hur många som är `kvar`, och workflowen kör igen tills det är noll.
//
// ☠️ SVARET BÄR BARA ANTAL OCH WIX-ID. Det skrivs ut i en publik Actions-logg.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";
import { VEVOR_ID_PREFIX } from "@/lib/store/leverantorsprefix";
import { deleteV3Product, lasProduktForRadering } from "@/lib/wix/v3-products";
import { WixVevorImportLager } from "@/lib/vevor/import-lager";
import { RaderingsFel, raderaOpoleradeUtkast } from "@/lib/vevor/radera-utkast";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Tidsbudget för raderingarna, med marginal mot maxDuration. */
const BUDGET_MS = 240_000;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!auktoriserad(req)) return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });
  const kropp = (await req.json().catch(() => null)) as { dryRun?: unknown; bekrafta?: unknown } | null;
  const dryRun = kropp?.dryRun !== false;
  const bekrafta = typeof kropp?.bekrafta === "number" ? kropp.bekrafta : null;
  const store = getStore();
  const lager = new WixVevorImportLager();
  try {
    const svar = await raderaOpoleradeUtkast(
      {
        mappningar: () => store.listMappingsMedPrefix(VEVOR_ID_PREFIX),
        produkterIOrdrar: async () =>
          new Set((await store.listTasks()).map((t) => t.wixCatalogItemId).filter((id): id is string => !!id)),
        lasProdukt: lasProduktForRadering,
        raderaProdukt: deleteV3Product,
        raderaMappning: (id) => store.deleteMapping(id),
        lasImport: () => lager.lasImport(),
        uppdateraImport: (andring) => lager.uppdateraImport(andring),
      },
      { dryRun, bekrafta, budgetMs: BUDGET_MS },
    );
    console.log(
      `[vevor-utkast-radera] ${dryRun ? "torr" : "skarp"}: ${svar.utkast} utkast, ${svar.raderbara} raderbara, ` +
        `${svar.raderade} raderade, ${svar.fannsInte} fanns inte, ${svar.obekraftade} obekräftade, ${svar.fel} fel, ` +
        `${svar.kvar} kvar, hinder order ${svar.hinder.iOrder} synlig ${svar.hinder.synlig} läsfel ${svar.hinder.lasfel}, ` +
        `importen nollställd ${svar.importNollstalld ? "ja" : "nej"}`,
    );
    return NextResponse.json({ ok: true, ...svar });
  } catch (err) {
    if (err instanceof RaderingsFel) return NextResponse.json({ ok: false, error: err.message }, { status: 409 });
    console.error("[vevor-utkast-radera] föll:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ ok: false, error: "raderingen föll, se Vercels logg" }, { status: 502 });
  }
}
