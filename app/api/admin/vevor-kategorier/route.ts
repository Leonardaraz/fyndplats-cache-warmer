// POST /api/admin/vevor-kategorier {dryRun, bekrafta}
//
// Lägger opolerade VEVOR-utkast i sin avdelning och underkategori och märker
// vapenskåpen (lib/vevor/kategorier-kor.ts, Leonards ja 2026-10-31). Anropas av
// workflowen "VEVOR — kategorier till utkasten" med CRON_SECRET.
//
// Torrt som default: utan `dryRun: false` skrivs ingenting. En skarp körning
// kräver `bekrafta` (planens antal produkter att koppla) och stannar på en
// tidsbudget.
//
// ☠️ SVARET BÄR BARA ANTAL, KATEGORINAMN OCH WIX-ID. Det skrivs ut i en publik
// Actions-logg.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";
import { VEVOR_ID_PREFIX } from "@/lib/store/leverantorsprefix";
import { skapaWixAnrop } from "@/lib/polish/skrivplan-wix";
import { WixVevorLager } from "@/lib/vevor/lager";
import { KategoriFel, korKategorier } from "@/lib/vevor/kategorier-kor";

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
  const kropp = (await req.json().catch(() => null)) as { dryRun?: unknown; bekrafta?: unknown } | null;
  const dryRun = kropp?.dryRun !== false;
  const bekrafta = typeof kropp?.bekrafta === "number" ? kropp.bekrafta : null;
  const store = getStore();
  const lager = new WixVevorLager();
  try {
    const svar = await korKategorier(
      {
        wix: skapaWixAnrop(),
        mappningar: () => store.listMappingsMedPrefix(VEVOR_ID_PREFIX),
        avlasningar: (skus) => lager.avlasningar(skus),
        lasMappningar: (ids) => store.getMappingsByWixProductIds(ids),
        sparaMappningar: (rader) => store.saveMappings(rader),
      },
      { dryRun, bekrafta, budgetMs: BUDGET_MS },
    );
    const v = svar.vapenskap;
    console.log(
      `[vevor-kategorier] ${dryRun ? "torr" : "skarp"}: ${svar.utkast} utkast, ${svar.attKoppla} att koppla, ` +
        `${svar.redanKopplade} redan kopplade, ${svar.utanRegel} utan regel, ${svar.avlasningSaknas} utan avläsning, ` +
        `vapenskåp ${v.totalt} (att märka ${v.attMarka}, märkta ${v.markta}, fel ${v.fel}), ` +
        `${svar.kopplade} kopplade, ${svar.fel} fel, ${svar.kvar} kvar, stopp ${svar.stoppadAv}, trädfel ${svar.tradFel.length}`,
    );
    return NextResponse.json({ ok: true, ...svar });
  } catch (err) {
    if (err instanceof KategoriFel) return NextResponse.json({ ok: false, error: err.message }, { status: 409 });
    console.error("[vevor-kategorier] föll:", err instanceof Error ? err.message.slice(0, 200) : "");
    return NextResponse.json({ ok: false, error: "körningen föll, se Vercels logg" }, { status: 502 });
  }
}
