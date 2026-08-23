// app/api/omdome/bild/route.ts
//
// Tar emot EN kundbild och returnerar dess adress i Wix Media.
//
// VARFÖR EN EGEN RUTT. Bilderna låg tidigare med i sparningens JSON-kropp,
// base64-kodade. Plattformen avvisar en request över 4,5 MB, och base64 blåser
// upp med en tredjedel — taket blev alltså ~3,4 MB för ALLA bilder
// tillsammans. Ett vanligt mobilfoto är 2–5 MB. Ett kunde gå igenom; tre
// gjorde det aldrig, och kunden fick bara "Något gick fel. Försök igen."
// (Uppmätt mot deployen 2026-08-23: 4,0 MB passerar, 4,3 MB ger 413.)
//
// En bild per anrop ger varje bild sina egna 4,5 MB, och multipart slipper
// base64:s påslag helt. Alternativet — att krympa bilden i webbläsaren —
// avfärdades: en canvas kan inte bära XMP, och där ligger C2PA-märkningen som
// lib/review-image.ts säger aldrig får tvättas bort.
//
// SÄKERHET. Token verifieras här, men produkten kontrolleras INTE mot ordern.
// Den kontrollen sitter kvar i sparningen (app/api/omdome/route.ts), och det
// är där den betyder något: en uppladdad bild är osynlig tills en rad pekar på
// den, och raden skrivs bara om produkten ingår i ordern. Att slå upp ordern
// en gång per bild hade kostat tre Wix-anrop extra utan att flytta gränsen.

import { NextResponse } from "next/server";
import { verifyReviewToken } from "@/lib/review-token";
import { IMAGE_FELTEXT, validateUpload } from "@/lib/review-image";
import { processReviewImage } from "@/lib/review-image-process";
import { uploadReviewImage } from "@/lib/review-image-upload";
import { customerReviewId } from "@/lib/customer-review";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const hemlighet = process.env.REVIEW_TOKEN_SECRET;
  if (!hemlighet) {
    return NextResponse.json({ error: "Omdömen är inte aktiverade." }, { status: 404 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    // En kropp över plattformens tak kommer aldrig ens hit — den fälls med 413
    // innan rutten körs. Det här är alltså en trasig multipart, inte en för
    // stor fil.
    return NextResponse.json({ error: "Ogiltig förfrågan." }, { status: 400 });
  }

  const verifierad = verifyReviewToken(String(form.get("token") || ""), hemlighet);
  if (!verifierad) {
    return NextResponse.json({ error: "Länken är ogiltig eller för gammal." }, { status: 403 });
  }

  const productId = String(form.get("productId") || "").trim();
  if (!productId) return NextResponse.json({ error: "Produkt saknas." }, { status: 400 });

  const fil = form.get("fil");
  if (!(fil instanceof File)) {
    return NextResponse.json({ error: IMAGE_FELTEXT.tom }, { status: 400 });
  }

  const felkod = validateUpload(fil.size, fil.type);
  if (felkod) {
    return NextResponse.json({ error: IMAGE_FELTEXT[felkod] }, { status: 400 });
  }

  // Index bara för filnamnet i mediabiblioteket, så bild 2 inte skriver över
  // bild 1. Klienten räknar; värdet påverkar ingenting annat.
  const index = Math.max(0, Math.min(9, Number(form.get("index")) || 0));
  const reviewIdAE = customerReviewId(verifierad.orderId, productId);

  let url: string | null;
  try {
    const raa = Buffer.from(await fil.arrayBuffer());
    const bearbetad = await processReviewImage(raa);
    url = await uploadReviewImage(bearbetad, productId, reviewIdAE, index);
  } catch (err) {
    // sharp kastar på det som inte är en bild trots rätt MIME-typ. Det är ett
    // äkta fel i indatan, så kunden ska få veta.
    console.warn("[omdome/bild] bilden gick inte att läsa", err);
    return NextResponse.json({ error: IMAGE_FELTEXT.inte_en_bild }, { status: 400 });
  }

  if (!url) {
    // Uppladdningen mot Wix föll. Kunden ska kunna skicka omdömet ändå — texten
    // och betyget är huvudsaken — så det här är inte ett hinder, bara en bild
    // som inte kom med. Klienten hoppar över den och fortsätter.
    return NextResponse.json({ error: "Bilden kunde inte laddas upp just nu.", hoppaOver: true }, { status: 503 });
  }

  return NextResponse.json({ url });
}
