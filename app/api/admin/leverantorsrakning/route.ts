// GET /api/admin/leverantorsrakning — mappningarna räknade per leverantör.
//
// Kvittot på att VEVOR-steget (2026-10-21) inte flyttade någon befintlig rad
// till en annan klass, och underlaget för att skärpa regeln för rader utan
// `supplier`-fält. Svaret bär bara antal. Logiken och skälen står i
// lib/store/leverantorsrakning.ts.
//
// Anropas av workflowen "Leverantörer — räkna mappningarna per leverantör"
// med CRON_SECRET. Rutten läser bara, och skriver ingenting.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";
import { raknaLeverantorer } from "@/lib/store/leverantorsrakning";

export const runtime = "nodejs";
export const maxDuration = 120;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!auktoriserad(req)) {
    return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });
  }
  try {
    const r = raknaLeverantorer(await getStore().listMappings());
    const p = r.perLeverantor;
    console.log(
      `[leverantorsrakning] ${r.totalt} mappningar: ${p.aliexpress} AliExpress, ${p.aosom} Aosom, `
        + `${p.vevor} VEVOR, ${p.okand} okänd. Utan fält: ${r.sparatFalt.saknas} `
        + `(vevor:-prefix ${r.utanFalt.vevorPrefix}). AE-synkens urval ${r.aeSynkensUrval}, `
        + `Aosom-synkens ${r.aosomSynkensUrval}.`,
    );
    return NextResponse.json({ ok: true, ...r });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg.slice(0, 200) }, { status: 502 });
  }
}
