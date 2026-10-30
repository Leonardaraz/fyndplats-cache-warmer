// POST /api/admin/vevor-familjeregel {dryRun, bekrafta}
//
// Familjeregeln på de VEVOR-utkast som redan finns (Leonard 2026-10-30: "Följ
// rekommendationen", lib/vevor/familjeregel-plan.ts). Planen säger vilka
// familjer som ska delas (en axel för funktion), vilka ensamma utkast som ska
// slås ihop (samma SPU) och vilka gränsfall Leonard ska avgöra. En skarp
// körning raderar utkasten i `dela` och `slaIhop` med samma spärrar som steg 8
// (lib/vevor/radera-utkast.ts), och nollställer importens markör när de är
// raderade, så att importen bygger om dem med regeln.
//
// Anropas av workflowen "VEVOR — familjeregeln på befintliga utkast" med
// CRON_SECRET. Torrt som default. En skarp körning kräver att importen är
// avstängd och `bekrafta` (planens antal att radera). Planen räknas om i varje
// varv och får krympa men aldrig växa.
//
// ☠️ SVARET BÄR BARA ANTAL, WIX-ID OCH AXELNAMN. Det skrivs ut i en publik
// Actions-logg.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { allaRader } from "@/lib/db/wix-data-klient";
import { VEVOR_KOL } from "@/lib/db/wix-kollektioner";
import { getStore } from "@/lib/store/factory";
import { VEVOR_ID_PREFIX } from "@/lib/store/leverantorsprefix";
import { deleteV3Product, lasProduktForRadering } from "@/lib/wix/v3-products";
import { WixVevorImportLager } from "@/lib/vevor/import-lager";
import { SPU_FALT, planeraFamiljeregel, spuKandidater, type SpuRad } from "@/lib/vevor/familjeregel-plan";
import { RaderingsFel, raderaOpoleradeUtkast } from "@/lib/vevor/radera-utkast";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Tidsbudget för planen och raderingarna, med marginal mot maxDuration. */
const BUDGET_MS = 240_000;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!auktoriserad(req)) return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });
  const start = Date.now();
  const kropp = (await req.json().catch(() => null)) as { dryRun?: unknown; bekrafta?: unknown } | null;
  const dryRun = kropp?.dryRun !== false;
  const bekrafta = typeof kropp?.bekrafta === "number" ? kropp.bekrafta : null;
  const store = getStore();
  const lager = new WixVevorImportLager();
  try {
    const mappningar = await store.listMappingsMedPrefix(VEVOR_ID_PREFIX);
    const rader = await allaRader<SpuRad>(VEVOR_KOL.avlasningar, { falt: SPU_FALT, sidstorlek: 1000 });
    const grupper = await lager.lasSpuGrupper(spuKandidater(rader, mappningar));
    const plan = planeraFamiljeregel({ mappningar, grupper, nu: Date.now() });
    const urval = new Set([...plan.dela, ...plan.slaIhop]);
    const planMs = Date.now() - start;

    const radering = await raderaOpoleradeUtkast(
      {
        mappningar: async () => mappningar,
        produkterIOrdrar: async () =>
          new Set((await store.listTasks()).map((t) => t.wixCatalogItemId).filter((id): id is string => !!id)),
        lasProdukt: lasProduktForRadering,
        raderaProdukt: deleteV3Product,
        raderaMappning: (id) => store.deleteMapping(id),
        lasImport: () => lager.lasImport(),
        uppdateraImport: (andring) => lager.uppdateraImport(andring),
      },
      { dryRun, bekrafta, budgetMs: Math.max(0, BUDGET_MS - planMs), urval },
    );
    console.log(
      `[vevor-familjeregel] ${dryRun ? "torr" : "skarp"}: ${plan.utkast} utkast, ${plan.familjer} familjer, ` +
        `dela ${plan.dela.length}, slå ihop ${plan.slaIhop.length} (${plan.slaIhopFamiljer} familjer), ` +
        `gränsfall ${plan.grans.reduce((n, g) => n + g.antal, 0)} på ${plan.grans.length} axlar, ` +
        `SPU väntar ${plan.spuVantar}, SPU ensamma ${plan.spuEnsamma}, ${grupper.size} SPU-grupper lästa på ${planMs} ms; ` +
        `${radering.raderbara} raderbara, ${radering.raderade} raderade, ${radering.fannsInte} fanns inte, ` +
        `${radering.obekraftade} obekräftade, ${radering.fel} fel, ${radering.kvar} kvar, ` +
        `importen nollställd ${radering.importNollstalld ? "ja" : "nej"}`,
    );
    return NextResponse.json({ ok: true, plan, radering, planMs });
  } catch (err) {
    if (err instanceof RaderingsFel) return NextResponse.json({ ok: false, error: err.message }, { status: 409 });
    console.error("[vevor-familjeregel] föll:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ ok: false, error: "familjeregeln föll, se Vercels logg" }, { status: 502 });
  }
}
