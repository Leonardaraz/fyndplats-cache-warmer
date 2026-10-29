// Ta bort ENSKILDA foton från recensioner, och visa en dold recension igen.
// Se lib/reviews/foto-bort.ts för reglerna.
//
// POST med JSON { rader: [{ productId, reviewIdAE, bilder: ["<exakt adress>", ...], visaIgen?: true }] }.
// Torrt som default: svarar med vad som SKULLE ändras. ?skarp=ja skriver, men bara när
// listan är felfri. Efter en skarp körning säger rutten till butiken att produkternas
// recensioner ändrats (vad = "recensioner"), så att sidorna förnyas direkt i stället
// för när sexttimmarscachen går ut. Körs från workflowen recension-foto-bort.yml.
//
// Svaret bär bara det som redan syns på produktsidan (initialer, datum) plus id:n och
// antal. Kundens riktiga namn, land och text lämnar aldrig lagret.
import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { uppdateraProduktsidor } from "@/lib/headless/produktsidor";
import { korFotoBort, tolkaMal } from "@/lib/reviews/foto-bort";
import { getReviewStore } from "@/lib/store/reviews";

export const runtime = "nodejs";
export const maxDuration = 120;

/** Så många recensioner läses per produkt. Långt över det en produkt har. */
const PER_PRODUKT = 500;

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
  let body: { rader?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Ogiltig JSON" }, { status: 400 });
  }

  const { mal, fel } = tolkaMal(body?.rader);
  if (mal.length === 0) {
    return NextResponse.json({ ok: false, error: "Inga giltiga rader", fel }, { status: 400 });
  }
  // En skarp körning kräver en felfri lista: hellre stopp än en halv rättelse
  // som ser lyckad ut. Torrkörningen visar felen och planen för resten.
  if (skarp && fel.length > 0) {
    return NextResponse.json({ ok: false, error: "Listan har fel, ingenting skrevs", fel }, { status: 400 });
  }

  const store = getReviewStore();
  const rapport = await korFotoBort(mal, skarp, {
    listByProduct: (productId) => store.listByProduct(productId, PER_PRODUKT),
    upsert: (review) => store.upsert(review),
    sagTillButiken: (produkter) => uppdateraProduktsidor(produkter, "recension-foto-bort"),
  });

  if (skarp && rapport.skrivna > 0) {
    const andrade = rapport.rader.filter((r) => r.utfall === "andras").map((r) => `${r.productId}/${r.reviewIdAE}`);
    await audit("reviews", "recension-foto-bort", `${andrade.length} ändrad(e): ${andrade.join(", ")}`);
  }
  if (rapport.misslyckade > 0) {
    console.error(`[recension-foto-bort] ${rapport.misslyckade} rad(er) kunde inte skrivas`);
  }

  return NextResponse.json({ ok: true, fel, ...rapport });
}
