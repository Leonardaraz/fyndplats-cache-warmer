// POST /api/admin/aosom-sammanslagning
//
// Lägger en Aosom-artikel som ett VAL — en färg eller en storlek — på en
// publicerad sida, och pensionerar givaren. Givaren är ett utkast, eller med
// `omdirigera` en publicerad sida vars adress omdirigeras hit. Hela förloppet,
// hindren och varför ordningen är som den är står i lib/aosom/sammanslagning.ts.
//
// Kropp:
//   { behall, utkast, fargBehall?, fargUtkast, axel?, sku?, bilder?, omdirigera?, apply? }
//
// `fargBehall` krävs bara första gången, när sidan saknar optioner. `axel` är
// "Färg" (default) eller "Storlek".
//
// ☠️ TORRKÖRNING ÄR DEFAULT. Utan `apply: true` skrivs ingenting — svaret är
// planen: priser, saldon, bildantal, recensioner, omdirigering och hinder.
//
// ☠️ EN GIVARE PER ANROP, OCH INGEN KÖR-ALLT-FLAGGA. Paret (sida, givare) är en
// människas bedömning av att två sidor är samma vara i olika färger eller
// storlekar, och bilderna som följer med är en människas granskning. Samma
// hållning som ommappningen och prisreparationen.
//
// ☠️ SVARET BÄR ALDRIG ETT ARTIKELNUMMER ELLER EN KOSTNAD — det går till en
// publik Actions-logg. Auth följer huset: CRON_SECRET eller EXTENSION_API_TOKEN.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";
import { fetchAosomFeed } from "@/lib/aosom/feed";
import {
  AXLAR,
  MAX_OMDIRIGERINGAR,
  korSammanslagning,
  type Axel,
  type SammanslagningInput,
} from "@/lib/aosom/sammanslagning";
import { getReviewStore } from "@/lib/store/reviews";
import { listRedirects, upsertRedirect } from "@/lib/wix/redirects";
import { skapaWixAnrop } from "@/lib/polish/skrivplan-wix";
import { felText } from "@/lib/polish/skrivplan";

export const runtime = "nodejs";
export const maxDuration = 120;

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

  let body: Partial<SammanslagningInput> & { apply?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Ogiltig JSON" }, { status: 400 });
  }
  const behall = body.behall?.trim();
  const utkast = body.utkast?.trim();
  const fargBehall = body.fargBehall?.trim() ?? "";
  const fargUtkast = body.fargUtkast?.trim();
  if (!behall || !utkast || !fargUtkast) {
    return NextResponse.json(
      { ok: false, error: "behall, utkast och fargUtkast krävs (fargBehall första gången)" },
      { status: 400 },
    );
  }
  const axel = (body.axel?.trim() || "Färg") as Axel;
  if (!(AXLAR as readonly string[]).includes(axel)) {
    return NextResponse.json({ ok: false, error: `axel ska vara en av ${AXLAR.join(", ")}` }, { status: 400 });
  }
  const bilder = Array.isArray(body.bilder) ? body.bilder.map(Number) : undefined;
  const apply = body.apply === true;
  const omdirigera = body.omdirigera === true;

  try {
    const store = getStore();
    const svar = await korSammanslagning(
      { behall, utkast, fargBehall, fargUtkast, axel, sku: body.sku?.trim() || undefined, bilder, omdirigera },
      {
        wix: skapaWixAnrop(),
        getMapping: (id) => store.getMappingByWixProductId(id),
        listMappings: () => store.listMappings(),
        saveMapping: (m) => store.saveMapping(m),
        fetchFeed: () => fetchAosomFeed(),
        recensioner: getReviewStore(),
        omdirigeringar: {
          lista: () => listRedirects(MAX_OMDIRIGERINGAR),
          skriv: (rad) => upsertRedirect(rad),
        },
        // En order som ännu inte lagts hos Aosom läser artikeln ur givarens
        // mappning. Pensioneras givaren innan den lagts går den inte att lägga.
        oppnaOrdrar: async (id) => (await store.listTasks())
          .filter((t) => t.wixCatalogItemId === id && (t.status === "pending" || t.status === "pending_payment"))
          .length,
      },
      { apply },
    );

    if (apply && svar.ok && svar.steg.length > 0) {
      await store.appendAudit({
        at: new Date().toISOString(),
        kind: "aosom-sammanslagning",
        ref: behall,
        detail: `${svar.plan.givarenPublicerad ? "publicerade sidan" : "utkastet"} ${utkast} blev `
          + `${axel.toLowerCase()} ${svar.plan.fargUtkast} (${svar.plan.prisUtkast} kr) — ${svar.steg.join(" · ")}`,
      });
    }

    const status = svar.ok ? 200 : svar.plan.hinder.length > 0 ? 422 : 500;
    return NextResponse.json(svar, { status });
  } catch (e) {
    return NextResponse.json({ ok: false, error: felText(e) }, { status: 500 });
  }
}
