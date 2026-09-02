// POST /api/reviews/customer
//
// Tar emot ett FÄRDIGVALIDERAT kundomdöme från butiken och skriver det genom
// recensionslagret.
//
// ☠️ VARFÖR DEN FINNS — EN SKRIVARE SOM SKULLE BLI FÖRÄLDRALÖS.
//
// Butikens /api/omdome skrev omdömet DIREKT till Wix Data
// (`POST /data/v2/items/save` mot `FyndplatsImportedReviews`). Det var rätt så
// länge recensionerna bodde där. I samma sekund `REVIEWS_BACKEND=postgres`
// slår igenom läser ALLT ur Postgres — och kundens omdöme hade fortsatt skrivas
// till Wix, där ingenting läser. Raden hade aldrig synts i `/admin/reviews`,
// aldrig kunnat godkännas, aldrig renderats. Wix svarar 200, så varken kunden,
// loggen eller en felräknare hade märkt något.
//
// Det är spegelbilden av `/api/tracking-events` 2026-09-01: där blev en LÄSARE
// tom, här försvinner en SKRIVNING. Och det är dyrare, för kundomdömena är de
// enda förstahandsomdömena — de som bär "✓ Verifierat köp" och som ensamma
// någonsin får bli `aggregateRating` mot Google.
//
// ⚠️ Kodauditen i motorn kunde inte se den. `store-access-audit.test.ts` läser
// DET HÄR repot; skrivaren bor i butiksrepot (grenen headless-site). Regeln,
// nu tredje gången: en migrering är klar först när alla läsare OCH skrivare
// följt med — och gränsen mellan två repon är precis där en sådan glöms bort.
//
// VALIDERINGEN LIGGER KVAR I BUTIKEN, med flit. Den äger `REVIEW_TOKEN_SECRET`,
// verifierar tokenets signatur, kontrollerar att produkten ingick i ordern och
// att bildadresserna pekar på vår egen Wix Media. Att flytta hit hade betytt
// TVILLINGAR av `verifyReviewToken`, `validateCustomerReview` och
// `buildCustomerReviewRow` — samma fälla som `SHIP_AXIS_RE` och `EU_TULL_CODES`.
// Rutten är därför tunn: hemligheten är förtroendegränsen, lagret är målet.

import { NextRequest, NextResponse } from "next/server";
import { getReviewStore, type StoredReview } from "@/lib/store/reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Delad hemlighet mellan butiken och motorn. Utan den är rutten AVSTÄNGD
 * (503), aldrig öppen: en öppen skriv-endpoint mot recensionerna hade låtit
 * vem som helst lägga text på vilken produktsida som helst.
 */
function auktoriserad(req: NextRequest): boolean | "osatt" {
  const secret = process.env.REVIEW_INGEST_SECRET;
  if (!secret) return "osatt";
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

/** Fälten butiken skickar. Allt annat i kroppen ignoreras. */
function läsRad(body: Record<string, unknown>): StoredReview | string {
  const productId = String(body.productId ?? "").trim();
  const reviewIdAE = String(body.reviewIdAE ?? "").trim();
  if (!productId) return "productId saknas";
  if (!reviewIdAE) return "reviewIdAE saknas";

  const rating = Number(body.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) return "rating måste vara 1–5";

  const textSwedish = String(body.textSwedish ?? "").trim();
  if (!textSwedish) return "textSwedish saknas";

  const bilder = Array.isArray(body.imageUrls) ? body.imageUrls.map(String).filter(Boolean) : [];

  return {
    productId,
    reviewIdAE,
    rating: Math.round(rating),
    textOriginal: String(body.textOriginal ?? textSwedish),
    textSwedish,
    initials: String(body.initials ?? ""),
    customerNameRaw: body.customerNameRaw ? String(body.customerNameRaw) : undefined,
    date: body.date ? String(body.date) : new Date().toISOString(),
    hasImage: bilder.length > 0,
    imageUrl: bilder[0],
    imageUrls: bilder.length > 1 ? bilder : undefined,
    // ☠️ TVINGAT, inte hämtat ur kroppen. En anropare som kunde sätta
    // status: "approved" hade lagt text direkt på produktsidan förbi
    // modereringen i /admin/reviews — och "edited" hade dessutom sett ut som
    // en människa läst den. Kundomdömen är pending tills någon godkänt dem,
    // exakt som när butiken skrev raden själv.
    status: "pending",
    // ☠️ Också tvingat. Etiketten "✓ Verifierat köp" och UCPD-upplysningen
    // hänger på det här fältet; rutten är kundomdömenas ingång och inget
    // annat, så ursprunget bestäms här och inte av den som postar.
    source: "customer",
    importedAt: new Date().toISOString(),
    ...(body.orderId ? { orderId: String(body.orderId) } : {}),
    ...(body.orderNumber ? { orderNumber: String(body.orderNumber) } : {}),
  } as StoredReview;
}

export async function POST(req: NextRequest) {
  const auth = auktoriserad(req);
  if (auth === "osatt") {
    console.error("[reviews/customer] REVIEW_INGEST_SECRET saknas — rutten är avstängd");
    return NextResponse.json({ ok: false, error: "ingest är inte konfigurerad" }, { status: 503 });
  }
  if (!auth) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "ogiltig JSON" }, { status: 400 });
  }

  const rad = läsRad(body);
  if (typeof rad === "string") {
    return NextResponse.json({ ok: false, error: rad }, { status: 400 });
  }

  try {
    // Upsert på `${productId}__${reviewIdAE}`, samma id butiken redan härleder
    // ur order + produkt. En kund som skickar formuläret två gånger uppdaterar
    // sitt omdöme i stället för att skapa en dubblett — oförändrat beteende.
    await getReviewStore().upsert(rad);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[reviews/customer] skrivningen föll:", message);
    // 502, inte 200. Butiken svarar kunden 503 och ber hen försöka igen —
    // ett omdöme som tyst försvinner är hela felet den här rutten finns för.
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }

  return NextResponse.json({ ok: true, id: `${rad.productId}__${rad.reviewIdAE}` }, { status: 200 });
}
