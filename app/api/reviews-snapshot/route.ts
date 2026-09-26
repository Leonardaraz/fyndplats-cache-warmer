// GET /api/reviews-snapshot
//
// Fönstret in i recensionsbilden — hela lagret i ETT svar.
//
// ☠️ RUTTEN ÄR DIAGNOSTIK, INTE LÄSVÄG. Läsrutterna hämtar inte hit över HTTP;
// de anropar `hamtaSnapshot()` direkt, som cachar i processen
// (lib/reviews/snapshot.ts). Första versionen lät dem `fetch`:a den här
// adressen på den egna deployen — det fungerade i produktion och gick sönder på
// varje preview, som ligger bakom Vercels inloggningsskydd. Anropet fick
// SSO-sidans HTML, fallbacken räddade svaret, och ingenting SÅG trasigt ut
// medan varenda förfrågan läste databasen.
//
// Det som är kvar av rutten är värdefullt ändå: den visar exakt vad läsarna ser,
// utan att kosta en databasläsning (samma cache, samma tagg), och den är det
// enda stället man kan mäta bildens storlek och färskhet skarpt.
//
// Ingen auth: svaret innehåller exakt de fält `/api/reviews/[productId]` redan
// lämnar ut publikt, för produkter som ändå visar sina omdömen på sajten.
// Rånamn, land, originaltext och väntande rader finns inte i bilden.
import { NextResponse } from "next/server";
import { hamtaSnapshot } from "@/lib/reviews/snapshot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Bygget läser ~5 000 rader när cachen är kall.
export const maxDuration = 60;

export async function GET() {
  const bild = await hamtaSnapshot();

  // ☠️ EN TOM ELLER UTEBLIVEN BILD SERVERAS ALDRIG, OCH CACHAS FRAMFÖR ALLT
  // ALDRIG. Uppmätt på preview 2026-09-17: miljön saknade
  // `REVIEWS_BACKEND=postgres`, läste ett annat lager och byggde en giltig bild
  // med noll rader. Hade den fått ligga i CDN:en en timme hade varje
  // produktsida svarat `count: 0` utan ett enda fel någonstans.
  //
  // 503 och `no-store`: läsarna faller tillbaka på lagret (dyrt men rätt), och
  // nästa anrop försöker igen i stället för att få tomheten serverad ur cachen.
  // Se `arTrovardig` i lib/reviews/snapshot.ts för hela resonemanget.
  if (!bild) {
    console.error(
      "[reviews-snapshot] ingen trovärdig bild att servera. "
        + "Kolla REVIEWS_BACKEND och DATABASE_URL i den här miljön.",
    );
    return NextResponse.json(
      { ok: false, error: "tom ögonblicksbild" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(bild, {
    status: 200,
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
