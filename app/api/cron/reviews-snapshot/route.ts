// GET /api/cron/reviews-snapshot
// Vercel Cron: "25 * * * *" (se vercel.json)
//
// Släpper cachen på recensionsbilden så att nästa läsare hämtar en färsk.
//
// ☠️ VARFÖR MINUT :25, OCH VARFÖR DET ÄR HELA POÄNGEN.
// Neon debiterar den tid databasen är vaken och somnar efter fem minuters
// tystnad. `order-backfill` och `health-check` väcker den redan :25 varje
// timme. Lägger vi recensionsläsningen i SAMMA fönster kostar den noll extra
// väckningar; lägger vi den på en egen minut betalar vi för ett andra fönster
// i timmen, varje timme, för all framtid.
//
// Det är också därför den här rutten finns i stället för att bara låta
// Data Cache:n gå ut av sig själv: en TTL som löper ut gör det när den råkar
// löpa ut — trafiken avgör minuten. Den här gör det på en minut vi valt.
//
// ☠️ RUTTEN HÄMTAR INTE BILDEN SJÄLV. Den släpper bara taggen. Butiken
// renderar produktsidor konstant (uppmätt ~200 i timmen dygnet runt), så första
// läsaren efter :25 fyller cachen inom sekunder — och gör det i samma
// väckningsfönster. En egen hämtning här hade varit ett extra lambda-anrop för
// ingenting.
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { SNAPSHOT_TAG } from "@/lib/reviews/snapshot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  // ☠️ TVÅ ARGUMENT. Enargsformen `revalidateTag(tag)` är DEPRECATED i den här
  // Next-versionen (16.2) — den kompilerar bara om typfelen tystas, och kan
  // försvinna helt. `"max"` ger stale-while-revalidate: bilden markeras
  // inaktuell, nästa läsare får den gamla direkt och en färsk hämtas i
  // bakgrunden. Ingen kund väntar på en databasläsning.
  revalidateTag(SNAPSHOT_TAG, "max");
  return NextResponse.json({ ok: true, slappt: SNAPSHOT_TAG, at: new Date().toISOString() });
}
