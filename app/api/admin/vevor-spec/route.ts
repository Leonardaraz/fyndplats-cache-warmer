// POST /api/admin/vevor-spec {dryRun, bekrafta, idn?}
//
// Ger VEVOR-utkast som importerades utan specifikation sin flik "Tekniska
// specifikationer" när läsaren har läst sidan igen (lib/vevor/spec-ratta.ts).
// Anropas av workflowen "VEVOR — specifikationen på utkast som saknar den" med
// CRON_SECRET.
//
// Torrt som default: utan `dryRun: false` skrivs ingenting. En skarp körning
// kräver `bekrafta` (planens antal sidor att rätta) och stannar på en
// tidsbudget eller vid första sida som inte läser tillbaka som planen.
//
// ☠️ SVARET BÄR BARA ANTAL OCH WIX-ID. Det skrivs ut i en publik Actions-logg.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";
import { VEVOR_ID_PREFIX } from "@/lib/store/leverantorsprefix";
import { skapaWixAnrop } from "@/lib/polish/skrivplan-wix";
import { WixVevorLager } from "@/lib/vevor/lager";
import { SpecFel, korSpec } from "@/lib/vevor/spec-ratta";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Tidsbudget, med marginal mot maxDuration. */
const BUDGET_MS = 240_000;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!auktoriserad(req)) return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });
  const kropp = (await req.json().catch(() => null)) as { dryRun?: unknown; bekrafta?: unknown; idn?: unknown } | null;
  const dryRun = kropp?.dryRun !== false;
  const bekrafta = typeof kropp?.bekrafta === "number" ? kropp.bekrafta : null;
  const idn = Array.isArray(kropp?.idn) ? kropp.idn.filter((x): x is string => typeof x === "string") : undefined;
  const store = getStore();
  const lager = new WixVevorLager();
  try {
    const svar = await korSpec(
      {
        wix: skapaWixAnrop(),
        mappningar: () => store.listMappingsMedPrefix(VEVOR_ID_PREFIX),
        avlasningar: (skus) => lager.avlasningar(skus),
      },
      { dryRun, bekrafta, idn, budgetMs: BUDGET_MS },
    );
    const h = svar.hinder;
    console.log(
      `[vevor-spec] ${dryRun ? "torr" : "skarp"}: ${svar.utkast} utkast, ${svar.attRatta} att rätta, ` +
        `${svar.redanRatt} redan rätt, ${svar.tomma} utan specifikation, ${svar.skrivna} skrivna, ${svar.kvar} kvar, ` +
        `stopp ${svar.stoppadAv}, hinder publicerad ${h.publicerad} polerad ${h.polerad} ` +
        `avlasning_saknas ${h.avlasning_saknas} ej_omlast ${h.ej_omlast} flik_utan_rader ${h.flik_utan_rader} las_fel ${h.las_fel}`,
    );
    return NextResponse.json({ ok: true, ...svar });
  } catch (err) {
    if (err instanceof SpecFel) return NextResponse.json({ ok: false, error: err.message }, { status: 409 });
    console.error("[vevor-spec] föll:", err instanceof Error ? err.name : "");
    return NextResponse.json({ ok: false, error: "rättningen föll, se Vercels logg" }, { status: 502 });
  }
}
