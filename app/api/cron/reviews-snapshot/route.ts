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
import { SNAPSHOT_TAG } from "@/lib/reviews/snapshot";

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

  // ☠️ TVÅ ARGUMENT. Enargsformen `revalidateTag(tag)` är DEPRECATED i den här
  // Next-versionen (16.2) — den kompilerar bara om typfelen tystas, och kan
  // försvinna helt. `"max"` ger stale-while-revalidate: bilden markeras
  // inaktuell, nästa läsare får den gamla direkt och en färsk byggs i
  // bakgrunden. Ingen kund väntar på en databasläsning.
  revalidateTag(SNAPSHOT_TAG, "max");
  return NextResponse.json({ ok: true, slappt: SNAPSHOT_TAG, at: new Date().toISOString() });
}
