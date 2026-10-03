// GET/POST /api/cron/variantbild
//
// Den dagliga kollen av variantbilderna: varje variant ska visa sitt vals
// första kopplade bild i varukorgen, kassan och ordern. Logiken och bakgrunden
// står i lib/wix/variant-media.ts och lib/wix/variantbild-koll.ts.
//
// TORRKÖRNING ÄR DEFAULT, och den nattliga cronen i vercel.json kör torrt.
// Den läser och listar, den skriver aldrig. Listan går till svaret och loggen.
//
// Query:
//   ?dryRun=false    skarp rättning — först efter Leonards ja
//   ?utkast=1        skriv även utkast — först efter ett prov på ett utkast
//   ?ids=a,b         bara de här produkterna (provet), utan katalogsvep
//   ?start=N         fortsätt listan där förra körningen slutade (`nasta`)
//   ?limit=N         högst N produkter den här körningen
//   ?maxSeconds=240  tidsbudget (ruttens maxDuration är 300 s)

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { skapaWixAnrop } from "@/lib/polish/skrivplan-wix";
import { korVariantbildKoll } from "@/lib/wix/variantbild-koll";

export const runtime = "nodejs";
export const maxDuration = 300;

function isCronAuthorized(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

function heltal(v: string | null): number | undefined {
  const n = Number(v);
  return v !== null && Number.isFinite(n) && n >= 0 ? Math.trunc(n) : undefined;
}

async function handle(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }
  const q = req.nextUrl.searchParams;
  const torr = q.get("dryRun") !== "false";
  const utkast = q.get("utkast") === "1";
  const ids = (q.get("ids") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const maxSeconds = Math.min(heltal(q.get("maxSeconds")) || 240, 270);

  try {
    const rapport = await korVariantbildKoll(skapaWixAnrop(), {
      torr,
      utkast,
      ids,
      start: heltal(q.get("start")),
      limit: heltal(q.get("limit")),
      deadline: Date.now() + maxSeconds * 1000,
    });

    const { publicerade, utkast: iUtkast, varianter } = rapport.medFelBild;
    console.log(
      `[variantbild] ${torr ? "torrt" : "skarpt"}: ${rapport.kontrollerade} av ${rapport.flervariant} `
        + `flervariantsprodukter kontrollerade, fel bild på ${publicerade} publicerade och ${iUtkast} utkast `
        + `(${varianter} varianter), summa ${JSON.stringify(rapport.summa)}`,
    );
    for (const p of rapport.produkter) {
      console.log(`[variantbild] ${p.id} ${p.visible ? "publicerad" : "utkast"} ${p.status} fel=${p.fel} ${p.exempel.join(", ")}`);
    }
    // ☠️ Ett avkortat svep får inte se friskt ut (CLAUDE.md: ett tak ska
    // logga ett fel, aldrig kapa tyst).
    if (!rapport.fullstandig) {
      console.error(
        `[variantbild] OFULLSTÄNDIG: ${rapport.stoppad ? "stoppad av en avvikelse" : "tidsbudgeten tog slut"}, `
          + `fortsätt med ?start=${rapport.nasta ?? "?"}`,
      );
    }
    if (!torr && (rapport.summa.rattad ?? 0) + (rapport.summa.avvikelse ?? 0) > 0) {
      await audit(
        "variantbild",
        "batch",
        `${rapport.summa.rattad ?? 0} produkter rättade, ${rapport.summa.avvikelse ?? 0} avvikelser`
          + (rapport.stoppad ? " — STOPPAD" : ""),
      );
    }

    return NextResponse.json({ ok: !rapport.stoppad, ...rapport }, { status: rapport.stoppad ? 500 : 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Okänt fel";
    console.error(`[variantbild] kollen föll: ${message}`);
    return NextResponse.json({ ok: false, error: "Variantbildskollen föll", message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return handle(req);
}

export async function GET(req: NextRequest) {
  return handle(req);
}
