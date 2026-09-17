// GET /api/cron/reviews-snapshot
// Vercel Cron: "25 * * * *" (se vercel.json)
//
// Släpper cachen på recensionsbilden så att nästa läsare bygger en färsk.
//
// ☠️ VARFÖR MINUT :25, OCH VARFÖR DET ÄR HELA POÄNGEN.
// Neon debiterar den tid databasen är vaken och somnar efter fem minuters
// tystnad. `order-backfill` och `health-check` väcker den redan :25 varje
// timme. Lägger vi recensionsläsningen i SAMMA fönster kostar den noll extra
// väckningar; lägger vi den på en egen minut betalar vi för ett andra fönster
// i timmen, varje timme, för all framtid.
//
// Det är också därför rutten finns i stället för att låta cachen gå ut av sig
// själv: en TTL löper ut när den råkar löpa ut, och trafiken avgör minuten.
// Den här gör det på en minut vi valt.
//
// ☠️ RUTTEN BYGGER INTE BILDEN SJÄLV. Den släpper bara taggen. Butiken
// renderar produktsidor konstant (uppmätt ~200 i timmen dygnet runt), så
// första läsaren efter :25 bygger om den inom sekunder — i samma
// väckningsfönster. Ett eget bygge här hade varit ett extra lambda-anrop för
// ingenting.
import { NextResponse, type NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { isAuthorized } from "@/lib/auth";
import { arTrovardig, byggSnapshot, SNAPSHOT_TAG } from "@/lib/reviews/snapshot";
import { blobKonfigurerad, skrivSnapshotTillBlob } from "@/lib/reviews/snapshot-blob";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Samma form som `order-backfill` och grannarna, och den FAILAR STÄNGT.
 *
 * ☠️ SAKNAS HEMLIGHETEN SLÄPPER VI INTE IGENOM. Motorn har en egen regel om
 * det (`lib/cron-auth.test.ts`), skriven efter 2026-08-22 då `review-queue`
 * och `review-translate` släppte igenom alla anrop när nyckeln var osatt —
 * öppna endpoints på just de rutter som kan publicera text till kundsidor.
 * Den här rutten skrevs först med samma fail-open, kopierad från butikens
 * svagare konvention; auditen fällde den.
 *
 * ⚠️ Auditen läser RÅ källkod, kommentarer inräknade. Skriv därför aldrig ut
 * anti-mönstret ordagrant här — den fälls på texten, inte på koden.
 *
 * Det spelar roll även för kostnaden: rutten släpper cachen, och nästa läsare
 * bygger då om bilden ur Postgres. Öppen är den en knapp som väcker databasen
 * på begäran, hur ofta som helst — exakt den kostnad hela den här
 * konstruktionen finns för att ta bort.
 */
function isCronAuthorized(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  // ☠️ CRONEN ÄR DEN ENDA SOM LÄSER POSTGRES — när en Blob-store är kopplad.
  // Läsarna tar filen. Därför byggs bilden HÄR, i det väckningsfönster vi valt,
  // i stället för av första läsaren efter :25.
  let bild = null;
  if (blobKonfigurerad()) {
    try {
      bild = await byggSnapshot();
    } catch (err) {
      console.error("[cron/reviews-snapshot] bygget föll:", err instanceof Error ? err.message : err);
    }

    // ☠️ EN OTROVÄRDIG BILD SKRIVS ALDRIG ÖVER EN BRA. Är databasen avstängd
    // eller läser vi fel lager blir bygget tomt — och då är den GAMLA filen det
    // bästa vi har. Att skriva tomheten över den vore att kasta bort exakt det
    // vi byggde varaktigheten för. Vi rör då varken filen eller cachen.
    if (!bild || !arTrovardig(bild)) {
      console.error(
        "[cron/reviews-snapshot] ingen trovärdig bild att skriva — behåller den förra. "
          + "Kolla REVIEWS_BACKEND, DATABASE_URL och om Neon är avstängd.",
      );
      return NextResponse.json(
        { ok: false, error: "ingen trovärdig bild", behöllFörra: true },
        { status: 503 },
      );
    }
    await skrivSnapshotTillBlob(bild);
  }

  // ☠️ TVÅ ARGUMENT. Enargsformen `revalidateTag(tag)` är DEPRECATED i den här
  // Next-versionen (16.2) — den kompilerar bara om typfelen tystas, och kan
  // försvinna helt. `"max"` ger stale-while-revalidate: bilden markeras
  // inaktuell, nästa läsare får den gamla direkt och en färsk hämtas i
  // bakgrunden. Ingen kund väntar på en databasläsning.
  revalidateTag(SNAPSHOT_TAG, "max");
  return NextResponse.json({
    ok: true,
    slappt: SNAPSHOT_TAG,
    skrevFil: blobKonfigurerad(),
    antal: bild?.antal ?? null,
    at: new Date().toISOString(),
  });
}
