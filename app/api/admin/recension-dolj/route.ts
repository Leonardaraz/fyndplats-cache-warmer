// Dölj EN utpekad recension (status rejected). Se lib/reviews/dolj-enskild.ts.
//
// POST med JSON { text, initialer?, datum?, produkt?, max? }. Torrt som
// default: svarar med träffarna. ?skarp=ja döljer, men bara när planen tillåter
// det (1..max träffar). Körs från workflowen recension-dolj.yml.
import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getReviewStore } from "@/lib/store/reviews";
import { planeraDolj, type DoljSokning } from "@/lib/reviews/dolj-enskild";

export const runtime = "nodejs";
export const maxDuration = 120;

/** Långt över lagrets storlek (≈8 000 rader i september 2026). */
const LASTAK = 100_000;
const MAX_TAK = 10;

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
  const skarp = req.nextUrl.searchParams.get("skarp") === "ja";
  let body: Partial<DoljSokning> & { max?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Ogiltig JSON" }, { status: 400 });
  }
  const sokning: DoljSokning = {
    text: String(body.text ?? ""),
    initialer: body.initialer ? String(body.initialer) : undefined,
    datum: body.datum ? String(body.datum) : undefined,
    produkt: body.produkt ? String(body.produkt) : undefined,
  };
  const max = Math.min(Math.max(1, Number(body.max) || 1), MAX_TAK);

  const store = getReviewStore();
  let rader;
  try {
    rader = await store.listAll(LASTAK);
  } catch (err) {
    console.error(`[recension-dolj] kunde inte läsa lagret: ${String(err).slice(0, 200)}`);
    return NextResponse.json({ ok: false, error: "Kunde inte läsa recensionslagret" }, { status: 500 });
  }
  if (rader.length >= LASTAK) {
    return NextResponse.json({ ok: false, error: "Lagret är större än rutten läser" }, { status: 500 });
  }

  const plan = planeraDolj(rader, sokning, max);
  const dolda: string[] = [];
  if (skarp && !plan.stopp) {
    for (const r of plan.attDolja) {
      await store.setStatus(r.productId, r.reviewIdAE, "rejected");
      dolda.push(`${r.productId}/${r.reviewIdAE}`);
    }
    await audit("reviews", "recension-dolj", `${dolda.length} dold(a): ${dolda.join(", ")}`);
  }

  return NextResponse.json({
    ok: true,
    skarp,
    granskade: rader.length,
    stopp: plan.stopp,
    // Bara det som redan syns på produktsidan (initialer, datum, text) plus id:n.
    // Kundens råa namn och land lämnar aldrig lagret.
    traffar: plan.traffar.map((r) => ({
      productId: r.productId,
      reviewIdAE: r.reviewIdAE,
      initialer: r.initials,
      datum: r.date ?? null,
      status: r.status,
      kalla: r.source ?? "import",
      text: (r.textSwedish || r.textOriginal || "").slice(0, 120),
    })),
    dolda,
  });
}
