// POST /api/admin/leverantorslankar — produktsidan hos leverantören för en hel
// lista produkter.
//
//   { "produkter": ["<wix-id>", "<slug>", "https://www.fyndplats.se/produkt/<slug>", …] }
//
// Svarar per produkt med leverantör, artikelnummer och länk, samma länk som
// "Öppna hos Aosom" i /admin/source-lookup. En sammanslagen Aosom-sida får en
// länk per färg ur flödet. Logiken bor i lib/import/leverantorslankar.ts.
//
// ☠️ SVARET BÄR ARTIKELNUMMER. Rutten kräver samma nyckel som resten av
// /api/admin, och den enda anroparen är leverantorslankar.yml, som krypterar
// svaret mot anroparens engångsnyckel innan något når den publika loggen.
// Rutten själv loggar bara räknare.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import type { ProductMappingRecord } from "@/lib/store";
import { getStore } from "@/lib/store/factory";
import { getV3ProductIdsBySlugs } from "@/lib/wix/v3-products";
import { fetchAosomFeed } from "@/lib/aosom/feed";
import { feedLankar } from "@/lib/aosom/variant-lank";
import {
  MAX_PRODUKTER,
  behoverFlodet,
  byggLeverantorslankar,
  tolkaProduktlista,
} from "@/lib/import/leverantorslankar";

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

  let kropp: { produkter?: unknown };
  try {
    kropp = (await req.json()) as { produkter?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "Kroppen är inte JSON" }, { status: 400 });
  }
  const indata = kropp?.produkter;
  if (typeof indata !== "string" && !(Array.isArray(indata) && indata.every((s) => typeof s === "string"))) {
    return NextResponse.json(
      { ok: false, error: "produkter: en lista med Wix-produkt-id, slugs eller butiksadresser" },
      { status: 400 },
    );
  }
  const { mal, ogiltiga } = tolkaProduktlista(indata as string | string[]);
  if (mal.length === 0) {
    return NextResponse.json({ ok: false, error: "Listan har inga produkter", ogiltiga }, { status: 400 });
  }
  if (mal.length > MAX_PRODUKTER) {
    return NextResponse.json(
      { ok: false, error: `Högst ${MAX_PRODUKTER} produkter per anrop (listan har ${mal.length})` },
      { status: 400 },
    );
  }

  try {
    const slugs = mal.flatMap((m) => (m.kind === "slug" ? [m.slug] : []));
    const [perSlug, alla] = await Promise.all([
      slugs.length ? getV3ProductIdsBySlugs(slugs) : Promise.resolve(new Map<string, { id: string }>()),
      getStore().listMappings(),
    ]);

    const utanProdukt: string[] = [];
    const losta: Array<{ wixProductId: string; fran: string }> = [];
    for (const m of mal) {
      if (m.kind === "id") {
        losta.push({ wixProductId: m.id, fran: m.fran });
        continue;
      }
      const traff = perSlug.get(m.slug);
      if (traff) losta.push({ wixProductId: traff.id, fran: m.fran });
      else utanProdukt.push(m.fran);
    }

    const mappningar = new Map<string, ProductMappingRecord>(alla.map((r) => [r.wixProductId, r]));
    const berorda = losta.flatMap((l) => {
      const r = mappningar.get(l.wixProductId);
      return r ? [r] : [];
    });

    // Flödet hämtas bara när en sammanslagen sida eller en rad utan egen
    // adress behöver det. Faller hämtningen får de raderna huvudsidans länk
    // (eller ingen), och felet syns som en flagga. Felmeddelandet följer
    // aldrig med: flödets adress är hemlig.
    let flode: Record<string, string> | null = null;
    let flodetFel = false;
    const flodetBehovs = behoverFlodet(berorda);
    if (flodetBehovs) {
      try {
        flode = feedLankar(await fetchAosomFeed());
      } catch {
        flodetFel = true;
      }
    }

    const { lankar, utanMappning } = byggLeverantorslankar(losta, mappningar, flode);
    const aosom = lankar.filter((l) => l.leverantor === "aosom").length;
    const aliexpress = lankar.filter((l) => l.leverantor === "aliexpress").length;
    const sammanslagna = lankar.filter((l) => l.varianter?.length).length;
    const utanLank = lankar.filter((l) => !l.url).length;

    console.log(
      `[leverantorslankar] ${lankar.length} av ${mal.length} produkter med mappning `
        + `(${aosom} Aosom, ${aliexpress} AliExpress, ${sammanslagna} sammanslagna, ${utanLank} utan länk), `
        + `${utanMappning.length} utan mappning, ${utanProdukt.length} finns inte, ${ogiltiga.length} ogiltiga`
        + (flodetBehovs ? (flodetFel ? ", flödet FÖLL" : ", flödet hämtat") : ""),
    );

    return NextResponse.json({
      ok: true,
      antal: mal.length,
      hittade: lankar.length,
      aosom,
      aliexpress,
      sammanslagna,
      utanLank,
      flodetHamtat: flode !== null,
      flodetFel,
      utanMappning,
      utanProdukt,
      ogiltiga,
      lankar,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[leverantorslankar] misslyckades: ${msg.slice(0, 200)}`);
    return NextResponse.json({ ok: false, error: msg.slice(0, 200) }, { status: 502 });
  }
}
