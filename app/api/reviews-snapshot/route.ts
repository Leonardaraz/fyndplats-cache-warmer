// GET /api/reviews-snapshot
//
// Hela recensionslagret i ETT svar — underlaget både `/api/reviews/[productId]`
// och `/api/review-aggregates` numera läser.
//
// ☠️ DEN HÄR RUTTEN ÄR DEN ENDA SOM RÖR POSTGRES. Det är hela poängen. Se
// lib/reviews/snapshot.ts för mätningen bakom: 591 databasfrågor på tre timmar
// blir 1 i timmen, och Neon-computen får de fem minuters tystnad den behöver
// för att somna.
//
// `force-dynamic` med flit: rutten SKA fråga lagret varje gång den körs. Det
// som gör att den körs sällan är att läsarna cachar svaret (Data Cache, en
// timme, taggat) och att cronen på minut :25 är den som släpper cachen. Låg
// frekvens ska komma av vem som ringer, inte av att rutten ljuger om sin data.
//
// Ingen auth: svaret innehåller exakt de fält `/api/reviews/[productId]` redan
// lämnar ut publikt, för produkter som ändå visar sina omdömen på sajten.
// Rånamn, land, originaltext och väntande rader finns inte i bilden.
import { NextResponse } from "next/server";
import { byggSnapshot, SNAPSHOT_VARNING_BYTES } from "@/lib/reviews/snapshot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Katalogen växer; en läsning av ~5 000 rader tar sekunder, inte millisekunder.
export const maxDuration = 60;

export async function GET() {
  try {
    const bild = await byggSnapshot();
    const kropp = JSON.stringify(bild);

    // ☠️ Vercels svarsgräns är 4,5 MB. Varningen kommer i god tid före den, för
    // felet den förebygger (ett 500 som tar stjärnorna från hela katalogen) ser
    // inte ut som ett storleksfel när det väl inträffar. Se
    // SNAPSHOT_VARNING_BYTES för vad man gör åt det.
    if (kropp.length >= SNAPSHOT_VARNING_BYTES) {
      console.warn(
        `[reviews-snapshot] bilden är ${(kropp.length / 1e6).toFixed(2)} MB `
          + `(${bild.antal} recensioner, ${bild.produkter} produkter) — närmar sig Vercels 4,5 MB-tak`,
      );
    }

    return new NextResponse(kropp, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        // Andra nätet under Data Cache:n. Läsarna cachar redan en timme; den
        // här raden gör att även en kall lambda slipper väcka databasen.
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    // ☠️ 502, INTE en tom bild med 200. En tom `perProdukt` är en giltig form,
    // så en läsare som bara kollar `res.ok` hade tagit den för sanning och
    // renderat noll omdömen på hela katalogen. Samma fälla som
    // /api/reviews/aggregates gick i 2026-09-02. Läsarna faller i stället
    // tillbaka på lagret — dyrare, men aldrig fel.
    const message = err instanceof Error ? err.message : "Okänt fel";
    console.error("[reviews-snapshot] byggandet föll:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
