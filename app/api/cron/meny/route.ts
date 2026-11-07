// app/api/cron/meny/route.ts
// Vercel Cron: GET /api/cron/meny, var 15:e minut (vercel.json).
//
// Bygger sidhuvudets meny och REA-knapp med samma kod som en varm instans och
// sparar dem i Wix (FyndplatsButikInstallningar, raden sidhuvud-meny-<miljö>).
// En kall instans läser sedan den färdiga menyn i stället för att vänta in hela
// katalogen, 21–34 s (lib/sidhuvud-data.ts, lib/sidhuvud-val.ts).
//
// En körning där menyn är densamma är tyst (docs/claude/03 i motorn: en tom
// cron-tugga ska vara tyst). Loggen säger till när menyn ändrats och när den
// inte kunde sparas.
//
// AUTH: Vercel Cron skickar "Authorization: Bearer $CRON_SECRET". Utan hemlighet
// (lokalt) körs rutten ändå, som grannarna; den bygger bara vår egen meny.
import { NextResponse } from "next/server";
import { byggOchSparaMeny } from "@/lib/sidhuvud-data";
import { bearerVarde, sammaHemlighet } from "@/lib/hemlig-jamforelse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// En ny instans hämtar hela katalogen först (21–34 s uppmätt).
export const maxDuration = 120;

function behorig(request: Request): boolean {
  const vantad = process.env.CRON_SECRET;
  if (!vantad) return true;
  return sammaHemlighet(bearerVarde(request.headers.get("authorization")), vantad);
}

export async function GET(request: Request) {
  if (!behorig(request)) return NextResponse.json({ ok: false, error: "unauthorised" }, { status: 401 });
  const start = Date.now();
  try {
    const utfall = await byggOchSparaMeny();
    const ms = Date.now() - start;
    if (!utfall.ok) {
      console.error(`[meny] den färdiga menyn sparades inte: ${utfall.orsak} (${ms} ms)`);
    } else if (utfall.andrad) {
      console.info(
        `[meny] ny färdig meny sparad: ${utfall.grupper} huvudkategorier, ${utfall.underkategorier} underkategorier, ` +
          `${utfall.byte} byte, REA ${utfall.hasSale ? "ja" : "nej"} (${ms} ms)`,
      );
    }
    return NextResponse.json({ ...utfall, ms }, { status: utfall.ok ? 200 : 500, headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const fel = e instanceof Error ? e.message.slice(0, 300) : String(e);
    console.error(`[meny] föll efter ${Date.now() - start} ms: ${fel}`);
    return NextResponse.json({ ok: false, orsak: fel }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
