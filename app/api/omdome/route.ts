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
//
// BILDER (valfria, högst MAX_IMAGES). Klienten laddar upp dem först, en i
// taget mot `/api/omdome/bild`, och skickar sedan hit ADRESSERNA som
// `imageUrls: string[]`. Skälet står i den ruttens filhuvud: allt i en kropp
// sprängde plattformens 4,5 MB-tak så fort kunden bifogade mer än ett foto.
//
// Adresserna kontrolleras med isOwnReviewImageUrl — bara bilder i vår egen Wix
// Media accepteras. Utan den kontrollen hade en giltig token kunnat peka ett
// omdöme mot vilken bild som helst på internet och få den renderad på
// produktsidan som ett kundfoto.
//
// DE GAMLA FORMERNA LEVER KVAR: `images: [{data, type}]` och enkelbilden
// (`image` + `imageType`), båda base64. En cachad sida ska inte sluta fungera
// för att formuläret bytt väg, och för EN liten bild ryms de fortfarande.
// Bearbetningen (nedskalning, EXIF bort, XMP kvar) är densamma. Misslyckas
// något av det sparas omdömet ÄNDÅ utan bild: texten och betyget är
// huvudsaken, och en trasig uppladdning får inte kosta kunden hela omdömet
// efter att hen skrivit det.
//
// Moderationen är samma som för texten — raden är `pending` tills den godkänts
// i /admin/reviews, så ingen bild kan nå produktsidan utan att ha setts.

import { NextResponse } from "next/server";
import { verifyReviewToken } from "@/lib/review-token";
import { validateCustomerReview, buildCustomerReviewRow, FELTEXT } from "@/lib/customer-review";
import { IMAGE_FELTEXT, MAX_IMAGES, validateUpload } from "@/lib/review-image";
import { isOwnReviewImageUrl, reviewImageFields } from "@/lib/review-images";
import { processReviewImage } from "@/lib/review-image-process";
import { uploadReviewImage } from "@/lib/review-image-upload";
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

  // Färdiga adresser från /api/omdome/bild — den normala vägen sedan bilderna
  // laddas upp var för sig. Allt som inte är en bild i vår egen Wix Media
  // faller bort tyst: en manipulerad adress ska inte kunna fälla ett omdöme
  // som kunden faktiskt skrivit, den ska bara inte visas.
  const franUppladdning = Array.isArray(body.imageUrls)
    ? body.imageUrls.filter(isOwnReviewImageUrl).map(String)
    : [];
  if (franUppladdning.length > MAX_IMAGES) {
    return NextResponse.json({ error: IMAGE_FELTEXT.for_manga }, { status: 400 });
  }

  // Valfria kundbilder, upp till MAX_IMAGES. Grindas FÖRE avkodning (antal,
  // storlek, typ) så en stor eller felaktig fil aldrig når bildbehandlingen.
  const inskickade = Array.isArray(body.images)
    ? body.images
    : typeof body.image === "string"
      ? // Enkelbild-formen behålls: en äldre klient (cachad sida, någon som
        // postar direkt) ska inte sluta fungera för att formuläret bytt form.
        [{ data: body.image, type: body.imageType }]
      : [];

  if (inskickade.length > MAX_IMAGES) {
    return NextResponse.json({ error: IMAGE_FELTEXT.for_manga }, { status: 400 });
  }

  // Redan uppladdade adresser först, sedan ev. base64 från en äldre klient.
  // reviewImageFields dedupar och kapar vid taket, så de två vägarna kan
  // samsas utan att någon räknar fel.
  const uppladdade: string[] = [...franUppladdning];
  for (const [n, post] of inskickade.entries()) {
    const p = post as { data?: unknown; type?: unknown };
    const base64 = typeof p.data === "string" ? p.data : "";
    if (!base64) continue;
    const raa = Buffer.from(base64, "base64");
    const felkod = validateUpload(raa.byteLength, String(p.type || ""));
    if (felkod) {
      return NextResponse.json({ error: IMAGE_FELTEXT[felkod] }, { status: 400 });
    }
    try {
      const bearbetad = await processReviewImage(raa);
      // Sekventiellt, inte parallellt: tre samtidiga uppladdningar mot Wix
      // media per omdöme ger ingen märkbar tidsvinst för kunden och tre gånger
      // så många samtidiga anrop när flera skriver samtidigt.
      // Index förskjuts förbi de redan uppladdade så filnamnen i
      // mediabiblioteket inte krockar om båda vägarna används samtidigt.
      const url = await uploadReviewImage(bearbetad, productId, rad.reviewIdAE, franUppladdning.length + n);
      if (url) uppladdade.push(url);
    } catch (err) {
      // sharp kastar på det som inte är en bild trots rätt MIME-typ. Här är det
      // ett ÄKTA fel i indatan, så kunden ska få veta — till skillnad från en
      // misslyckad uppladdning, som tyst sparar omdömet utan just den bilden.
      console.warn("[omdome] bilden gick inte att läsa", err);
      return NextResponse.json({ error: IMAGE_FELTEXT.inte_en_bild }, { status: 400 });
    }
  }
  // Antalet som FAKTISKT sparas, efter dedup och tak. Skickas tillbaka så
  // klienten kan säga till om någon bild inte kom med — annars är den enda
  // signalen att kunden själv upptäcker det på produktsidan veckor senare.
  // Fångar båda vägarna en bild kan tappas: en uppladdning som föll, och en
  // adress som inte klarade isOwnReviewImageUrl.
  const bildfalt = reviewImageFields(uppladdade);
  Object.assign(rad, bildfalt);

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

  return NextResponse.json({ ok: true, bilder: bildfalt.imageUrls?.length ?? 0 });
}
