// POST /api/auctions/avsluta   { "productIds": ["…", …] }
//
// Butikens DIREKTAVSLUT: butikens webhook (order_created) skickar orderns
// produkt-id:n hit, och varje live-auktion bland dem avslutas på stället —
// priset tillbaka till ordinarie, sedan status=sold. Fram till 2026-09-29
// gjorde butiken det själv mot Wix Data med en egen port av prisåterställningen.
//
// Ordningen är timcronens: priset först (nästa kund får aldrig ett sålt fynd
// till auktionspris), sedan sold. En produkt som raderats efter köpet har inget
// pris att återställa, men affären är verklig och sparas ändå. Timcronens
// sold-detektering ligger kvar som backup inom timmen.
//
// Idempotent: bara status=live träffas, så Wix dubbelfyrningar gör ingenting
// andra gången. Svaret bär avslutade sluggar OCH fel per rad — ett fel i en
// rad får inte tysta de andra, och butiken loggar båda.

import { type NextRequest, NextResponse } from "next/server";
import {
  auktionslager,
  isProductGone,
  queryAuctions,
  restoreListPrice,
  saveAuction,
} from "@/lib/auction/store";
import { butikAuktoriserad } from "@/lib/auction/butiksvy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** En order har sällan fler rader; fler id:n än så är inte en order. */
const MAX_ID = 100;

export async function POST(req: NextRequest) {
  const auth = butikAuktoriserad(req.headers.get("authorization"));
  if (auth === "osatt") {
    return NextResponse.json({ ok: false, error: "REVIEW_INGEST_SECRET saknas — rutten är avstängd" }, { status: 503 });
  }
  if (auth === "nej") return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "kroppen är inte JSON" }, { status: 400 });
  }
  const ids = (body as { productIds?: unknown })?.productIds;
  if (
    !Array.isArray(ids)
    || ids.length > MAX_ID
    || !ids.every((x) => typeof x === "string" && x.length > 0 && x.length <= 100)
  ) {
    return NextResponse.json(
      { ok: false, error: `productIds måste vara en lista med högst ${MAX_ID} id-strängar` },
      { status: 400 },
    );
  }
  if (ids.length === 0) return NextResponse.json({ ok: true, lager: auktionslager(), avslutade: [], fel: [] });

  try {
    const sökta = new Set(ids as string[]);
    const träffar = (await queryAuctions(["live"])).filter((a) => sökta.has(a.productId));

    const avslutade: string[] = [];
    const fel: string[] = [];
    for (const a of träffar) {
      try {
        try {
          await restoreListPrice(a);
        } catch (e) {
          // Raderad efter köpet: inget pris att återställa, affären står sig.
          if (!isProductGone(e)) throw e;
        }
        await saveAuction({
          ...a,
          status: "sold",
          endedAt: new Date().toISOString(),
          soldPrice: a.lastPatchedPrice ?? a.listPrice,
        });
        avslutade.push(a.slug || a.productId);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        fel.push(`${a.slug || a.productId}: ${msg.slice(0, 200)}`);
        console.error(`[auctions/avsluta] kunde inte avsluta ${a.slug || a.productId} (timcronen tar det): ${msg}`);
      }
    }
    return NextResponse.json({ ok: fel.length === 0, lager: auktionslager(), avslutade, fel });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[auctions/avsluta] ${msg}`);
    return NextResponse.json({ ok: false, error: msg.slice(0, 200) }, { status: 500 });
  }
}
