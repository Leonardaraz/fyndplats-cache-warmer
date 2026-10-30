// Ändra initialerna på EN utpekad recension. Se lib/reviews/andra-initialer.ts.
//
// POST med JSON { text, initialer?, datum?, produkt?, nya, max? }. Torrt som
// default: svarar med träffarna och vad de skulle få. ?skarp=ja skriver, men
// bara när planen tillåter det (1..max träffar). Varje rad läses tillbaka, och
// räknas som ändrad först när den bär de nya initialerna med oförändrad status
// och text. Körs från workflowen recension-initialer.yml.
//
// ☠️ En skarp körning SÄGER OCKSÅ TILL BUTIKEN (`butiken` i svaret): butiken cachar
// produktens recensioner i sex timmar och dess egen bevakning svarar 501 så länge
// recensionerna ligger i Wix Data. Se lib/reviews/meddela-butiken.ts.
//
// ☠️ Loggen är publik. Svaret bär bara det som redan syns på produktsidan
// (initialer, datum, textbit) plus id:n; kundens råa namn och land lämnar aldrig
// lagret.
import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getReviewStore } from "@/lib/store/reviews";
import type { DoljSokning } from "@/lib/reviews/dolj-enskild";
import { planeraAndraInitialer } from "@/lib/reviews/andra-initialer";
import { meddelaButikenOmRecensioner, type ButikSammanfattning } from "@/lib/reviews/meddela-butiken";

export const runtime = "nodejs";
export const maxDuration = 120;

/** Långt över lagrets storlek (≈8 000 rader i september 2026). */
const LASTAK = 100_000;
/** En produkts alla omdömen, för återläsningen. */
const PRODUKTTAK = 5_000;
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
  let body: Partial<DoljSokning> & { nya?: string; max?: number };
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
    console.error(`[recension-initialer] kunde inte läsa lagret: ${String(err).slice(0, 200)}`);
    return NextResponse.json({ ok: false, error: "Kunde inte läsa recensionslagret" }, { status: 500 });
  }
  if (rader.length >= LASTAK) {
    return NextResponse.json({ ok: false, error: "Lagret är större än rutten läser" }, { status: 500 });
  }

  const plan = planeraAndraInitialer(rader, sokning, String(body.nya ?? ""), max);
  const andrade: string[] = [];
  const fel: string[] = [];
  let butiken: ButikSammanfattning | null = null;
  if (skarp && !plan.stopp && plan.nya) {
    for (const r of plan.attAndra) {
      const id = `${r.productId}/${r.reviewIdAE}`;
      try {
        await store.upsert({ ...r, initials: plan.nya });
        const efter = (await store.listByProduct(r.productId, PRODUKTTAK)).find((x) => x.reviewIdAE === r.reviewIdAE);
        if (
          efter
          && efter.initials === plan.nya
          && efter.status === r.status
          && efter.textSwedish === r.textSwedish
        ) {
          andrade.push(id);
        } else {
          fel.push(id);
        }
      } catch {
        fel.push(id);
      }
    }
    // Också en rad vars skrivning inte läste tillbaka: skrivningen kan ha tagit, och butiken
    // ska hellre hämta om än visa en gammal kopia.
    butiken = await meddelaButikenOmRecensioner(
      plan.attAndra.map((r) => r.productId),
      "recension-initialer",
    );
    await audit(
      "reviews",
      "recension-initialer",
      `${andrade.length} ändrade, ${fel.length} fel: ${andrade.join(", ")}; `
        + `butiken: ${butiken.uppdaterade}/${butiken.anrop} anrop ok, ${butiken.misslyckade} misslyckade`
        + `${butiken.utanNyckel ? ", ADMIN_SECRET saknas" : ""}`,
    );
  }

  return NextResponse.json({
    ok: true,
    skarp,
    granskade: rader.length,
    stopp: plan.stopp,
    nya: plan.nya,
    traffar: plan.traffar.map((r) => ({
      productId: r.productId,
      reviewIdAE: r.reviewIdAE,
      initialer: r.initials,
      datum: r.date ?? null,
      status: r.status,
      kalla: r.source ?? "import",
      text: (r.textSwedish || r.textOriginal || "").slice(0, 120),
    })),
    andrade,
    fel,
    butiken,
  });
}
