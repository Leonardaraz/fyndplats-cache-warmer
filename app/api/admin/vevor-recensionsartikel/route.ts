// POST /api/admin/vevor-recensionsartikel {dryRun, fran}
//
// Döljer VEVOR-recensioner som gäller en annan artikel än produktens
// (lib/vevor/recensionsartikel.ts). Artikeln står i avläsningarna, så en sida
// måste ha lästs om efter 2026-10-30. Anropas av workflowen "VEVOR —
// recensioner om en annan artikel" med CRON_SECRET.
//
// Torrt som default: utan `dryRun: false` skrivs ingenting. Körningen stannar
// på en tidsbudget och svarar med var nästa körning börjar (`kvarFran`).
//
// ☠️ SVARET BÄR BARA ANTAL OCH WIX-ID. Det skrivs ut i en publik Actions-logg.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";
import { getReviewStore } from "@/lib/store/reviews";
import { VEVOR_ID_PREFIX } from "@/lib/store/leverantorsprefix";
import { WixVevorLager } from "@/lib/vevor/lager";
import { korRecensionsartikel } from "@/lib/vevor/recensionsartikel";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Tidsbudget, med marginal för den sista produktens skrivningar. */
const BUDGET_MS = 220_000;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!auktoriserad(req)) return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });
  const kropp = (await req.json().catch(() => null)) as { dryRun?: unknown; fran?: unknown } | null;
  const dryRun = kropp?.dryRun !== false;
  const fran = typeof kropp?.fran === "number" && Number.isInteger(kropp.fran) && kropp.fran >= 0 ? kropp.fran : 0;
  const store = getStore();
  const recensioner = getReviewStore();
  const lager = new WixVevorLager();
  try {
    const svar = await korRecensionsartikel(
      {
        mappningar: () => store.listMappingsMedPrefix(VEVOR_ID_PREFIX),
        avlasningar: (skus) => lager.avlasningar(skus),
        recensioner: (id) => recensioner.listByProduct(id, 200),
        spara: (rad) => recensioner.upsert(rad),
      },
      { dryRun, fran, budgetMs: BUDGET_MS },
    );
    console.log(
      `[vevor-recensionsartikel] ${dryRun ? "torr" : "skarp"}: ${svar.granskade} av ${svar.produkter} produkter, ` +
        `${svar.vantar} väntar på omläsning, ${svar.rader} rader, ${svar.egna} egna, ${svar.attDolja} att dölja, ` +
        `${svar.dolda} dolda, ${svar.attMarka} att märka "Köpt", ${svar.markta} märkta, ` +
        `${svar.redanDolda} redan dolda, ${svar.attVisa} att visa, ${svar.visade} visade, ` +
        `${svar.synligaAnnan} synliga om annan artikel, ${svar.avvisadeAvManniska} avvisade av människa, ` +
        `${svar.okanda} okända, ${svar.fel} fel, kvar från ${svar.kvarFran ?? "-"}`,
    );
    return NextResponse.json({ ok: true, ...svar });
  } catch (err) {
    console.error("[vevor-recensionsartikel] föll:", err instanceof Error ? err.name : "");
    return NextResponse.json({ ok: false, error: "körningen föll, se Vercels logg" }, { status: 502 });
  }
}
