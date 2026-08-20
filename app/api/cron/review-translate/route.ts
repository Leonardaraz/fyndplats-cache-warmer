// app/api/cron/review-translate/route.ts
//
// Översättningskön UT och IN — så en chatt utan Wix-nycklar kan göra hela jobbet.
//
// BAKGRUND. Recensioner översätts i chatten (DeepL togs bort 2026-08-19). Det
// fungerar utmärkt när chatten kör på Leonards egen maskin, där .env finns och
// Wix-kollektionen går att läsa och skriva direkt. En Claude Code-session i
// molnet har ingen sådan åtkomst: färsk klon, inga hemligheter. Alternativet
// blev klipp-och-klistra fram och tillbaka, vilket är precis det Leonard bad
// att slippa ("jag ska inte behöva göra nåt").
//
// Den här rutten stänger gapet. Produktionen HAR nycklarna, och GitHub Actions
// har CRON_SECRET — alltså kan en workflow hämta kön hit ut och skicka
// översättningarna tillbaka in, utan att någon nyckel någonsin passerar
// chatten. Se .github/workflows/review-translate.yml.
//
//   GET  ?limit=25   → nästa omgång ur kön (bara AE-publik text)
//   POST {translations:{ "<reviewIdAE>": "<svensk text>" }}  → skriver in dem
//
// VAD SOM EXPORTERAS. Bara sådant som redan ligger öppet på AliExpress:
// recensionens id, betyg, land och text, plus produktens namn. ALDRIG
// customerNameRaw — repot är publikt och därmed även Actions-loggarna, och det
// råa kontonamnet är den enda uppgiften i raden som pekar mot en person.
//
// Granskningen sitter kvar i lib/reviews/translate.ts: en översättning som är
// identisk med källan, nämner marknadsplatsen, tappat innehåll eller lämnat
// engelska kvar skrivs ALDRIG in. Rutten kan alltså inte publicera skräp även
// om den anropas med skräp.

import { NextResponse } from "next/server";
import { getReviewStore } from "@/lib/store/reviews";
import { getStore } from "@/lib/store/factory";
import { isAwaitingTranslation } from "@/lib/reviews/queue";
import { applyTranslations, TRANSLATE_BATCH } from "@/lib/reviews/translate";
import { stripMarketplaceSuffix } from "@/lib/import/guard";
import { reviewImages } from "@/lib/reviews/images";
import { isExternalSupplierImage } from "@/lib/wix/media-import";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

async function namnPerProdukt(): Promise<Map<string, string>> {
  const karta = new Map<string, string>();
  try {
    for (const m of await getStore().listMappings()) {
      // Mappningens seoTitle är en INTERN anteckning och kan bära kvar
      // marknadsplatsens namn från råimporten ("… Black - AliEx" — 70-
      // teckenkapningen slår mitt i ordet). Wix-produktens namn tvättas sedan
      // 2026-08-19 av stripMarketplaceSuffix, men de sparade raderna städades
      // aldrig. Här skulle det annars hamna i översättningsprompten som
      // "Produkten omdömena gäller: … - AliEx", vilket är precis vad vi inte
      // vill mata in i en text som ska bli kundtext.
      if (m.wixProductId && m.seoTitle) {
        const rent = stripMarketplaceSuffix(m.seoTitle);
        if (rent) karta.set(m.wixProductId, rent);
      }
    }
  } catch {
    // Namnet är kontext, inte en förutsättning.
  }
  return karta;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get("limit") || TRANSLATE_BATCH)));

  const pending = await getReviewStore().listByStatus("pending");
  const kö = pending.filter(isAwaitingTranslation);
  const namn = await namnPerProdukt();

  // Grupperat per produkt: översättningen måste veta VAD varan är. En
  // italienare skrev "le palline" om en bollkastare 2026-08-17, och utan
  // produkten framför sig blir det fel ord.
  const grupper = new Map<string, { produkt: string; reviews: unknown[] }>();
  for (const r of kö.slice(0, limit)) {
    const g = grupper.get(r.productId) ?? {
      produkt: namn.get(r.productId) ?? r.productId,
      reviews: [],
    };
    g.reviews.push({
      id: r.reviewIdAE,
      betyg: r.rating,
      land: r.customerCountry || undefined,
      text: r.textOriginal,
    });
    grupper.set(r.productId, g);
  }

  return NextResponse.json({
    ok: true,
    iKön: kö.length,
    iOmgången: [...grupper.values()].reduce((n, g) => n + g.reviews.length, 0),
    kvarEfter: Math.max(0, kö.length - limit),
    grupper: [...grupper.entries()].map(([productId, g]) => ({ productId, ...g })),
  });
}

/** Skriver om synliga rader som fortfarande pekar på leverantörens bild-CDN. */
async function repairImages(limit: number): Promise<NextResponse> {
  const store = getReviewStore();
  const rader = [
    ...(await store.listByStatus("approved")),
    ...(await store.listByStatus("edited")),
  ];
  const trasiga = rader.filter((r) =>
    reviewImages(r).some((u) => isExternalSupplierImage(u)),
  );

  let lagade = 0;
  let kvar = 0;
  let fel = 0;
  for (const r of trasiga.slice(0, limit)) {
    try {
      // Oförändrad rad in — upsert kör withOwnImage eftersom statusen är synlig.
      await store.upsert(r);
      lagade++;
    } catch (err) {
      fel++;
      console.warn("[review-repair]", r.reviewIdAE, err instanceof Error ? err.message : err);
    }
  }

  // Läs om och räkna vad som FAKTISKT blev kvar — en hemflytt kan misslyckas
  // igen (borttagen källbild), och då ska siffran visa det, inte antalet försök.
  const efter = [
    ...(await store.listByStatus("approved")),
    ...(await store.listByStatus("edited")),
  ];
  kvar = efter.filter((r) => reviewImages(r).some((u) => isExternalSupplierImage(u))).length;

  return NextResponse.json({
    ok: true,
    hittade: trasiga.length,
    försökte: Math.min(trasiga.length, limit),
    skrivna: lagade,
    kvarMedLeverantörsbild: kvar,
    fel,
  });
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { translations?: Record<string, unknown> };
  try {
    body = (await req.json()) as { translations?: Record<string, unknown> };
  } catch {
    return NextResponse.json({ error: "ogiltig JSON" }, { status: 400 });
  }

  // BILDREPARATION. En publicerad rad kan bära kvar leverantörens bildadress:
  // hemflytten sker vid publicering (lib/store/reviews.ts → withOwnImage), och
  // misslyckas den behålls källadressen med flit — ett undefined hade raderat
  // bilden för gott, eftersom items/save är en helersättning. Följden är att
  // adressen står i klartext i produktsidans HTML för den som högerklickar.
  // Samma klass av fel som de 44 raderna 2026-08-18.
  //
  // Reparationen är att skriva om raden oförändrad: upsert kör withOwnImage på
  // nytt för synliga rader, och källbilderna finns kvar hos AE. Mätt 2026-08-20:
  // 4 rader av 148 på 13 produkter.
  if ((body as { repairImages?: unknown })?.repairImages === true) {
    return repairImages(Number((body as { limit?: unknown }).limit) || 500);
  }

  // AVVISNINGAR. Utan dem klibbar en rad som aldrig ska publiceras kvar i kön
  // och äter en plats i VARJE framtida omgång. Två sorter dyker upp i praktiken:
  // omdömen om leverantörens returer och logistik (som på vår produktsida läses
  // som ett omdöme om VÅR service) och omdömen AliExpress hängt på fel produkt.
  // Beslutet är reversibelt — status går att ändra tillbaka i /admin/reviews.
  const avvisa = Array.isArray((body as { reject?: unknown })?.reject)
    ? ((body as { reject: unknown[] }).reject.filter((x) => typeof x === "string" && x.trim()) as string[])
    : [];

  const rå = body?.translations;
  if (avvisa.length === 0 && (!rå || typeof rå !== "object" || Array.isArray(rå))) {
    return NextResponse.json({ error: "translations saknas" }, { status: 400 });
  }
  const översättningar: Record<string, string> = {};
  for (const [k, v] of Object.entries(rå ?? {})) {
    if (typeof v === "string" && v.trim()) översättningar[k.trim()] = v.trim();
  }
  if (Object.keys(översättningar).length === 0 && avvisa.length === 0) {
    return NextResponse.json({ error: "inga texter att skriva" }, { status: 400 });
  }

  const store = getReviewStore();
  const pending = await store.listByStatus("pending");

  let rejectedRows = 0;
  for (const id of avvisa) {
    const rad = pending.find((r) => r.reviewIdAE === id);
    if (!rad) continue;
    try {
      await store.setStatus(rad.productId, id, "rejected");
      rejectedRows++;
    } catch (err) {
      console.warn("[review-translate] kunde inte avvisa", id, err instanceof Error ? err.message : err);
    }
  }
  const r = await applyTranslations(pending, översättningar, (productId, reviewIdAE, svenska) =>
    store.editText(productId, reviewIdAE, svenska),
  );

  if (r.saved > 0 || rejectedRows > 0) {
    await audit(
      "review-translate",
      "",
      `${r.saved} översatta, ${rejectedRows} avvisade (chatt via workflow)`,
    );
  }

  const kvar = (await store.listByStatus("pending")).filter(isAwaitingTranslation).length;
  return NextResponse.json({ ok: true, ...r, avvisade: rejectedRows, kvarIKön: kvar });
}
