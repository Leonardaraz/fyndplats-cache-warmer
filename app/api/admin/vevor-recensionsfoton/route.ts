// POST /api/admin/vevor-recensionsfoton {dryRun, fran}
//
// Ger VEVOR-recensioner som importerades utan foton de foton kunden lade upp
// hos VEVOR (lib/vevor/recensionsfoton.ts). Fotona kommer ur artiklarnas
// avläsningar, så en sida måste ha lästs om efter 2026-10-30 för att bära dem.
// Anropas av workflowen "VEVOR — recensionernas foton" med CRON_SECRET.
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
import { korRecensionsfoton, vevorKundbild } from "@/lib/vevor/recensionsfoton";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Tidsbudget, med marginal för den sista produktens foton. */
const BUDGET_MS = 200_000;

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
    const svar = await korRecensionsfoton(
      {
        mappningar: () => store.listMappingsMedPrefix(VEVOR_ID_PREFIX),
        avlasningar: (skus) => lager.avlasningar(skus),
        recensioner: (id) => recensioner.listByProduct(id, 200),
        spara: (rad) => recensioner.upsert(rad),
        laddaUpp: (kalla, namn) => vevorKundbild(kalla, namn),
      },
      { dryRun, fran, budgetMs: BUDGET_MS },
    );
    console.log(
      `[vevor-recensionsfoton] ${dryRun ? "torr" : "skarp"}: ${svar.granskade} av ${svar.produkter} produkter, ` +
        `${svar.medFoton} recensioner med foton, ${svar.attRatta} att rätta, ${svar.redanMedFoton} redan med foton, ` +
        `${svar.utanRad} utan rad, ${svar.rattade} rättade, ${svar.fotonUppladdade} foton, ${svar.fotoMissar} missar, ` +
        `${svar.fel} fel, kvar från ${svar.kvarFran ?? "-"}`,
    );
    return NextResponse.json({ ok: true, ...svar });
  } catch (err) {
    console.error("[vevor-recensionsfoton] föll:", err instanceof Error ? err.name : "");
    return NextResponse.json({ ok: false, error: "körningen föll, se Vercels logg" }, { status: 502 });
  }
}
