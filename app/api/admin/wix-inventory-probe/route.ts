// GET /api/admin/wix-inventory-probe
//
// Mäter TVÅ saker om Wix lager-API som måste vara kända innan Aosom-synkens
// skrivningar batchas. Skriver ingenting.
//
// ☠️ VARFÖR EN MÄTNING OCH INTE EN LÄSNING AV DOKUMENTATIONEN. Huset har redan
// betalat för att lita på dev.wix.com: `paging.limit` står som "up to 200
// files" på två ställen och skarpa API:t svarar `400 INVALID_ARGUMENT` över
// 100 (uppmätt 2026-08-28). Och `getProductMedia` returnerar en TOM bildlista
// utan `fields=MEDIA_ITEMS_INFO` — inte ett fel, bara en tystare projektion.
// Båda kostade en felsökning var.
//
// FRÅGA 1: tar `inventory-items/query` FLERA produkt-id i ett filter?
//   Synken läser i dag ett anrop per produkt (898 per svep). Går `$in` att
//   använda blir det ~9. Går det inte, står läsningarna kvar och vinsten
//   halveras — men då vet vi det innan koden är skriven.
//
// FRÅGA 2: bär bulk-svarets `results[]` radens ID, eller bara ordningen?
//   Det här är den farliga. `summarizeBulkInventoryResult` läser i dag bara
//   `itemMetadata.success` — den behöver inte veta VILKEN rad, eftersom
//   anropet bara innehåller en produkts varianter. Batchas hundra produkter
//   i ett anrop måste varje utfall tillbaka till RÄTT produkt: "Wix före
//   mappningen" är en garanti per produkt, och en mappning får aldrig skrivas
//   för en skrivning som föll.
//
//   Måste jag i stället lita på att `results[i]` hör till `updates[i]` och det
//   antagandet är fel, skrivs mappningen för fel produkt. Tyst. Exakt samma
//   klass som `sku`-förväxlingen som lät prissynken skriva till ingenting i en
//   månad.
//
// ☠️ HUR FRÅGA 2 MÄTS UTAN ATT SKRIVA: raderna skickas med en MEDVETET
// FÖRÅLDRAD revision. Wix avvisar båda på revisionskonflikt, ingenting ändras,
// och svaret bär ändå hela `results[]`-formen — inklusive om en FALLEN rad går
// att knyta till sin post. Det är just felfallet attributionen måste klara.

import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";
import { aosomSupplierProductId } from "@/lib/aosom/to-product";

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";

const WIX_BASE = "https://www.wixapis.com";

function wixHeaders(): Record<string, string> {
  const token = process.env.WIX_API_TOKEN;
  if (!token) throw new Error("WIX_API_TOKEN saknas");
  const h: Record<string, string> = { "Content-Type": "application/json", Authorization: token };
  const siteId = process.env.WIX_SITE_ID;
  if (siteId) h["wix-site-id"] = siteId;
  return h;
}

function isCronAuthorized(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

/** Rått anrop — vi vill se statuskod OCH kropp, inte en tolkad version. */
async function raw(sokvag: string, body: unknown) {
  const res = await fetch(`${WIX_BASE}${sokvag}`, {
    method: "POST",
    headers: wixHeaders(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: unknown = null;
  try { json = JSON.parse(text); } catch { /* HTML-kropp = edge-spärr, behåll texten */ }
  return { status: res.status, json, text: json ? "" : text.slice(0, 300) };
}

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    // Riktiga produkt-id ur katalogen — ett syntetiskt id mäter ingenting.
    const aosom = (await getStore().listMappings())
      .filter((m) => (m.supplierProductId ?? "").startsWith(aosomSupplierProductId("")) && m.wixProductId)
      .slice(0, 5);
    if (aosom.length < 2) {
      return NextResponse.json({ ok: false, error: "hittade färre än två Aosom-mappningar" }, { status: 500 });
    }
    const ids = aosom.map((m) => m.wixProductId);

    // ── FRÅGA 1a: ett enda produkt-id (dagens form) — referensmätning ──
    const enskild = await raw("/stores/v3/inventory-items/query", {
      query: { filter: { productId: ids[0] } },
    });

    // ── FRÅGA 1b: flera produkt-id med $in ──
    const flera = await raw("/stores/v3/inventory-items/query", {
      query: { filter: { productId: { $in: ids } } },
    });

    // ── FRÅGA 1c: sidtaket. Dokumentationen är inte facit här. ──
    const tak200 = await raw("/stores/v3/inventory-items/query", {
      query: { filter: { productId: { $in: ids } }, cursorPaging: { limit: 200 } },
    });
    const tak100 = await raw("/stores/v3/inventory-items/query", {
      query: { filter: { productId: { $in: ids } }, cursorPaging: { limit: 100 } },
    });

    // ── FRÅGA 2: bulk-svarets form, UTAN att skriva ──
    // Posterna hämtas för att få riktiga id, men revisionen förvanskas så båda
    // raderna faller. Wix skriver då ingenting alls.
    const poster = ((enskild.json as { inventoryItems?: { id: string; revision: string }[] })?.inventoryItems ?? [])
      .slice(0, 2);
    let bulkform: unknown = "hoppade över — inga lagerposter att bygga anropet av";
    if (poster.length > 0) {
      const svar = await raw("/stores/v3/bulk/inventory-items/update", {
        inventoryItems: poster.map((p) => ({
          inventoryItem: { id: p.id, revision: "1", quantity: 0 },
        })),
      });
      const results = (svar.json as { results?: Record<string, unknown>[] })?.results ?? [];
      bulkform = {
        status: svar.status,
        antalResultat: results.length,
        antalSkickade: poster.length,
        // Det här är svaret på frågan: finns radens id i utfallet?
        nycklarPerRad: results.map((r) => Object.keys(r)),
        bärItemId: results.map((r) => {
          const item = (r as { item?: { id?: string } }).item;
          return item?.id ?? null;
        }),
        skickadeIdIOrdning: poster.map((p) => p.id),
        rådata: JSON.stringify(svar.json).slice(0, 1500),
      };
    }

    // ── FRÅGA 3: hur ser ett LYCKAT svar ut? ──
    // ☠️ Felfallet ovan räcker inte. Parsern måste veta om en LYCKAD rad också
    // bär sitt id — annars är regeln "en rad Wix inte nämner är misslyckad"
    // byggd på en gissning, och den gissningen fäller varje skrivning om Wix
    // svarar tunnare vid framgång.
    //
    // Skrivningen är VÄRDENEUTRAL: samma kvantitet tillbaka som redan står
    // där. Revisionen bumpas, saldot rör sig inte. Kräver ?write=1 så rutten
    // inte kan skriva av misstag.
    let lyckatSvar: unknown = "hoppade över — kör med ?write=1 för att mäta";
    if (req.nextUrl.searchParams.get("write") === "1" && poster.length > 0) {
      const p0 = poster[0] as unknown as { id: string; revision: string; quantity?: number };
      const nuvarande = await raw("/stores/v3/inventory-items/query", {
        query: { filter: { productId: ids[0] } },
      });
      const färsk = ((nuvarande.json as { inventoryItems?: { id: string; revision: string; quantity?: number }[] })
        ?.inventoryItems ?? []).find((x) => x.id === p0.id);
      if (färsk) {
        const svar = await raw("/stores/v3/bulk/inventory-items/update", {
          inventoryItems: [{
            inventoryItem: { id: färsk.id, revision: färsk.revision, quantity: färsk.quantity ?? 0 },
          }],
        });
        const results = (svar.json as { results?: Record<string, unknown>[] })?.results ?? [];
        lyckatSvar = {
          status: svar.status,
          skrevTillbakaSammaSaldo: färsk.quantity ?? 0,
          antalResultat: results.length,
          nycklarPerRad: results.map((r) => Object.keys(r)),
          rådata: JSON.stringify(svar.json).slice(0, 1200),
        };
      }
    }

    const svarJson = (x: { json: unknown }) => (x.json as { inventoryItems?: unknown[] })?.inventoryItems?.length ?? null;

    return NextResponse.json({
      ok: true,
      produkterIProvet: ids.length,
      fraga1_flera_produktId: {
        enskild: { status: enskild.status, poster: svarJson(enskild) },
        med$in: { status: flera.status, poster: svarJson(flera), fel: flera.text || undefined },
        // Fler poster med $in än med ett enda id = filtret vidgades = det funkar.
        slutsats:
          flera.status !== 200
            ? "NEJ — $in avvisas, läsningarna måste stå kvar per produkt"
            : (svarJson(flera) ?? 0) > (svarJson(enskild) ?? 0)
              ? "JA — $in returnerar fler poster än ett enskilt id"
              : "OKLART — samma antal; produkterna kan ha en variant var",
      },
      fraga1c_sidtak: {
        limit200: { status: tak200.status, fel: tak200.text || undefined },
        limit100: { status: tak100.status, fel: tak100.text || undefined },
      },
      fraga2_bulksvarets_form_VID_FEL: bulkform,
      fraga3_bulksvarets_form_VID_FRAMGANG: lyckatSvar,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[wix-inventory-probe]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
