// POST /api/admin/aosom-bildkandidater — leverantörens övriga bilder, uppladdade
// för granskning.
//
//   { "wixProductIds": ["…"], "positioner": [4, 5, 6, 7], "dryRun": false }
//
// Laddar upp feedens bilder på de begärda positionerna (default 4–7, de som
// importen aldrig hämtar) till Media Manager, utan att röra produkten. Svaret
// bär Wix fil-id och wixstatic-adresser per position. Logiken och skälen bor i
// lib/aosom/bildkandidater.ts.
//
// Torrkörning är default. Svaret och loggen bär aldrig artikelnummer eller
// leverantörens adresser, så anroparen (aosom-bildkandidater.yml) kan skriva ut
// det i en publik logg.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";
import { fetchAosomFeed } from "@/lib/aosom/feed";
import { importMediaByUrl } from "@/lib/wix/media";
import {
  hamtaBildkandidater,
  arWixProduktId,
  MAX_PRODUKTER,
} from "@/lib/aosom/bildkandidater";

export const runtime = "nodejs";
export const maxDuration = 300;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!auktoriserad(req)) {
    return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });
  }

  let kropp: { wixProductIds?: unknown; positioner?: unknown; dryRun?: unknown };
  try {
    kropp = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Kroppen är inte JSON" }, { status: 400 });
  }

  const ids = Array.isArray(kropp.wixProductIds)
    ? kropp.wixProductIds.map((v) => String(v).trim()).filter(Boolean)
    : [];
  if (ids.length === 0) {
    return NextResponse.json({ ok: false, error: "wixProductIds saknas" }, { status: 400 });
  }
  if (ids.length > MAX_PRODUKTER) {
    return NextResponse.json(
      { ok: false, error: `högst ${MAX_PRODUKTER} produkter per anrop` },
      { status: 400 },
    );
  }
  // Ett värde som inte är ett Wix-id skrivs inte tillbaka i svaret: det kan
  // vara ett artikelnummer som klistrats i fel fält.
  const ogiltiga = ids.filter((id) => !arWixProduktId(id)).length;
  if (ogiltiga > 0) {
    return NextResponse.json(
      { ok: false, error: `${ogiltiga} värden är inte Wix produkt-id` },
      { status: 400 },
    );
  }
  if (kropp.dryRun !== undefined && typeof kropp.dryRun !== "boolean") {
    return NextResponse.json({ ok: false, error: "dryRun måste vara true eller false" }, { status: 400 });
  }
  const positioner = Array.isArray(kropp.positioner) ? kropp.positioner : undefined;

  const store = getStore();
  try {
    const svar = await hamtaBildkandidater(
      ids,
      { positioner, dryRun: kropp.dryRun !== false },
      {
        hamtaMappning: (id) => store.getMappingByWixProductId(id),
        hamtaFeed: () => fetchAosomFeed(),
        laddaUpp: (url, namn) => importMediaByUrl(url, namn),
      },
    );
    const hinder = svar.produkter.filter((p) => p.hinder).length;
    console.log(
      `[aosom-bildkandidater] ${svar.produkter.length} produkter, ${svar.uppladdade} uppladdade, `
        + `${svar.missar} missar, ${hinder} med hinder, ${svar.kvar.length} kvar`
        + (svar.dryRun ? " (torrkörning)" : ""),
    );
    return NextResponse.json({ ok: true, ...svar });
  } catch (err) {
    // Ett fel här kommer från mappningsläsningen eller feedhämtningen, aldrig
    // från en uppladdning (de fångas per position). Feedens adress står inte i
    // något av dem, men meddelandet kortas ändå.
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[aosom-bildkandidater] misslyckades: ${msg.slice(0, 200)}`);
    return NextResponse.json({ ok: false, error: msg.slice(0, 200) }, { status: 502 });
  }
}
