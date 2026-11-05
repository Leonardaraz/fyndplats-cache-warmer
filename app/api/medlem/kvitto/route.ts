// POST /api/medlem/kvitto  { ordernummer, epost }
//
// Kvittot som PDF för en order på Mina sidor (medlemskapet E3: "underlag";
// konkurrentgenomgången i specen: "fakturaarkiv och köp igen är kärnan").
// Butiken frågar åt den inloggade medlemmen och skickar kontots e-post; PDF:en
// ritas på nytt ur ordern med samma mall som mejlen (lib/orders/faktura.ts,
// `kvittoForArkiv`).
//
// ☠️ SVARET BÄR KUNDENS NAMN OCH ADRESS. Därför:
//   - bara butikens hemlighet, `Authorization: Bearer REVIEW_INGEST_SECRET`;
//   - ordern måste vara köparens: e-posten på ordern ska vara kontots, annars
//     "inte-din" och ingen PDF;
//   - `Cache-Control: no-store`, och ingen loggrad bär e-post, namn eller
//     ordernummer.

import { type NextRequest, NextResponse } from "next/server";
import { golvAuktoriserad } from "@/lib/medlem/golv";
import { fetchWixOrderByNumber } from "@/lib/wix/orders";
import { KVITTO_BETALD, kvittoForArkiv, STANDARD_DAGAR, type FakturaOrder, type Foretagsuppgifter } from "@/lib/orders/faktura";
import { fakturaPdf } from "@/lib/orders/faktura-pdf";
import { fakturaDeps } from "@/lib/orders/faktura-deps";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const INGEN_CACHE = { "Cache-Control": "no-store" };
const svar = (data: Record<string, unknown>, status: number) => NextResponse.json(data, { status, headers: INGEN_CACHE });

export async function POST(req: NextRequest) {
  const auth = golvAuktoriserad(req.headers.get("authorization"));
  if (auth === "osatt") return svar({ ok: false, skal: "avstangd" }, 503);
  if (auth === "nej") return svar({ ok: false, skal: "otillaten" }, 401);

  let ordernummer = "";
  let epost = "";
  try {
    const k = (await req.json()) as { ordernummer?: unknown; epost?: unknown } | null;
    ordernummer = typeof k?.ordernummer === "string" ? k.ordernummer.trim() : "";
    epost = typeof k?.epost === "string" ? k.epost.trim() : "";
  } catch {
    // Fel form; svaras nedan.
  }
  if (!/^\d{1,12}$/.test(ordernummer) || !epost.includes("@")) return svar({ ok: false, skal: "fel-form" }, 400);

  try {
    const o = (await fetchWixOrderByNumber(ordernummer)) as unknown as FakturaOrder | null;
    if (!o) return svar({ ok: false, skal: "saknas" }, 404);
    const deps = fakturaDeps();
    // Prisbeslutet läses bara för köparens egen betalda order ur kassan.
    const egen = (o.buyerInfo?.email ?? "").trim().toLowerCase() === epost.toLowerCase();
    const flode =
      egen && o.channelInfo?.type !== "BACKOFFICE_MERCHANT" && KVITTO_BETALD.has(o.paymentStatus ?? "") ? o.purchaseFlowId : undefined;
    const [betalning, foretag, faktura, kvitto] = await Promise.all([
      deps.betalning(),
      flode && deps.foretagskop
        ? deps.foretagskop([flode]).then((m): Foretagsuppgifter | null => m.get(flode) ?? null)
        : Promise.resolve(null),
      deps.logg.skickad(o.id, "faktura"),
      deps.logg.skickad(o.id, "kvitto"),
    ]);
    const r = kvittoForArkiv(o, epost, foretag, { faktura, kvitto }, new Date(), betalning ?? { betalaTill: "", fSkatt: false, dagar: STANDARD_DAGAR });
    if (!r.ok) {
      if (r.skal === "fel") console.error("[medlem/kvitto] kvittot gick inte att räkna fram");
      return svar({ ok: false, skal: r.skal }, r.skal === "inte-din" ? 404 : r.skal === "fel" ? 500 : 409);
    }
    let logo: Uint8Array | undefined;
    try {
      logo = await deps.logo();
    } catch {
      logo = undefined;
    }
    const pdf = await fakturaPdf(r.faktura, { typ: "kvitto", betaldDatum: r.betaldDatum, logoPng: logo });
    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: { ...INGEN_CACHE, "Content-Type": "application/pdf" },
    });
  } catch (e) {
    console.error("[medlem/kvitto] gick inte:", e instanceof Error ? e.message.slice(0, 120) : "okänt");
    return svar({ ok: false, skal: "tillfalligt" }, 503);
  }
}
