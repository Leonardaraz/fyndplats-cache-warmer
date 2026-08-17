// app/api/omdome/route.ts
//
// Tar emot ett omdöme från kunden. POST { token, productId, rating, text, name }
//
// Token är signerad och bär orderns id (lib/review-token). Vi verifierar den
// på nytt HÄR — formuläret kan inte litas på, bara signaturen. Sedan
// kontrolleras att produkten faktiskt ingick i ordern, så att en giltig token
// inte kan användas för att recensera vad som helst i katalogen.
//
// Omdömet sparas som `pending` i FyndplatsImportedReviews med
// `source: "customer"`. Det visas alltså INTE förrän det godkänts i
// /admin/reviews — produktsidan renderar bara approved/edited.

import { NextResponse } from "next/server";
import { verifyReviewToken } from "@/lib/review-token";
import { validateCustomerReview, buildCustomerReviewRow, FELTEXT } from "@/lib/customer-review";
import { fetchWixOrder, buildOrderConfirmationProps } from "@/app/api/wix-webhook/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WIX_BASE = "https://www.wixapis.com";
const COL = process.env.WIX_DATA_COL_REVIEWS || "FyndplatsImportedReviews";

function wixHeaders(): Record<string, string> | null {
  const token = process.env.WIX_API_KEY;
  const siteId = process.env.WIX_SITE_ID;
  if (!token || !siteId) return null;
  return { "Content-Type": "application/json", Authorization: token, "wix-site-id": siteId };
}

export async function POST(req: Request) {
  const hemlighet = process.env.REVIEW_TOKEN_SECRET;
  if (!hemlighet) {
    // Fail-closed: utan hemlighet finns ingen väg att verifiera att skribenten
    // faktiskt handlat hos oss, och då ska funktionen vara helt avstängd.
    return NextResponse.json({ error: "Omdömen är inte aktiverade." }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Ogiltig förfrågan." }, { status: 400 });
  }

  const verifierad = verifyReviewToken(String(body.token || ""), hemlighet);
  if (!verifierad) {
    return NextResponse.json({ error: "Länken är ogiltig eller för gammal." }, { status: 403 });
  }

  const productId = String(body.productId || "").trim();
  if (!productId) return NextResponse.json({ error: "Produkt saknas." }, { status: 400 });

  const validerad = validateCustomerReview({ rating: body.rating, text: body.text, name: body.name });
  if (!validerad.ok) {
    return NextResponse.json({ error: FELTEXT[validerad.error] }, { status: 400 });
  }

  // Produkten måste ingå i ordern. Utan den kontrollen kan en giltig token
  // användas för att recensera vilken produkt som helst i katalogen.
  let orderNumber: string | undefined;
  try {
    const order = await fetchWixOrder(verifierad.orderId);
    const props = order ? buildOrderConfirmationProps(order) : null;
    const ids = new Set(
      ((order?.lineItems ?? []) as Record<string, unknown>[])
        .map((li) => String((li.catalogReference as Record<string, unknown> | undefined)?.catalogItemId ?? ""))
        .filter(Boolean),
    );
    if (!ids.has(productId)) {
      return NextResponse.json({ error: "Produkten ingår inte i din beställning." }, { status: 403 });
    }
    orderNumber = props?.orderNumber;
  } catch (err) {
    console.error("[omdome] kunde inte kontrollera ordern:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Kunde inte kontrollera din beställning just nu." }, { status: 503 });
  }

  const h = wixHeaders();
  if (!h) return NextResponse.json({ error: "Lagringen är inte konfigurerad." }, { status: 503 });

  const rad = buildCustomerReviewRow({
    orderId: verifierad.orderId,
    orderNumber,
    productId,
    review: validerad.value,
  });

  try {
    // /items/save är upsert. PUT /items/{id} vore FEL här: den uppdaterar bara
    // befintliga rader och svarar 404 för en ny — alltså hade varje FÖRSTA
    // omdöme fallerat. (Hittades i granskningen 2026-08-17.)
    //
    // Att id:t är härlett ur order + produkt gör dessutom att en kund som
    // skickar formuläret två gånger uppdaterar sitt omdöme i stället för att
    // skapa en dubblett.
    const res = await fetch(`${WIX_BASE}/data/v2/items/save`, {
      method: "POST",
      headers: h,
      body: JSON.stringify({ dataCollectionId: COL, dataItem: { id: rad._id, dataCollectionId: COL, data: rad } }),
      cache: "no-store",
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.error(`[omdome] Wix svarade ${res.status}: ${t.slice(0, 200)}`);
      return NextResponse.json({ error: "Kunde inte spara omdömet just nu." }, { status: 503 });
    }
  } catch (err) {
    console.error("[omdome] sparfel:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Kunde inte spara omdömet just nu." }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
