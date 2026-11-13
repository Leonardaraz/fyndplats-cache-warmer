// GET /api/medlem/priser?p=<produkt-id>[&v=<variant-id>,<variant-id>…]
//
// Medlemspriset för varje variant av en produkt, för den inloggade medlemmen
// (E2-2). Produktsidans HTML är densamma för alla och cachas; priset hämtas
// här i webbläsaren, med `Cache-Control: private, no-store`.
//
// Svaret bär radpriset, procenten och skälet till en begränsning, aldrig
// golvet eller kostnaden. Utan medlemspris svarar rutten `medlemspris: false`
// med skälet, så att sidan helt enkelt visar listpriset.
//
// SAMTIDIGT, INTE I RAD (Leonard 2026-11-13: rutan kom efter nästan en
// sekund). Med en giltig session startar produkten, golvet för sidans
// variant-id (`v`, lib/medlem/tidig.ts) och prishistoriken innan profilen är
// läst; profilens egna läsningar går också samtidigt (medlemsprofil). Utan
// session startar ingenting. `Server-Timing` visar profilen, priset och
// helheten i millisekunder, inga belopp.

import { NextResponse } from "next/server";
import { inloggad, PRIVAT } from "@/lib/medlem/inloggad";
import { forhamtaProdukt, medlemsprisForProdukt, medlemsprofil } from "@/lib/medlem/medlemspris";
import { ORDERTRAPPA } from "@/lib/medlem/pris";
import { ledtradUrFraga } from "@/lib/medlem/tidig";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const start = Date.now();
  const fraga = new URL(req.url).searchParams;
  const produktId = fraga.get("p") ?? "";
  if (!/^[A-Za-z0-9-]{1,64}$/.test(produktId)) {
    return NextResponse.json({ medlemspris: false, skal: "fel-form" }, { status: 400, headers: PRIVAT });
  }
  const session = await inloggad();
  const forhand = session ? forhamtaProdukt(produktId, ledtradUrFraga(fraga.get("v")), session.profil !== "foretag") : undefined;
  const mp = await medlemsprofil();
  const profilMs = Date.now() - start;
  const tider = (prisMs?: number) => ({
    ...PRIVAT,
    "Server-Timing": [`profil;dur=${profilMs}`, ...(prisMs !== undefined ? [`pris;dur=${prisMs}`] : []), `total;dur=${Date.now() - start}`].join(", "),
  });
  if ("utan" in mp) return NextResponse.json({ medlemspris: false, skal: mp.utan }, { headers: tider() });
  const varianter = await medlemsprisForProdukt(produktId, mp.profil, forhand);
  const prisMs = Date.now() - start - profilMs;
  if (!varianter) return NextResponse.json({ medlemspris: false, skal: "fel" }, { headers: tider(prisMs) });
  return NextResponse.json(
    {
      medlemspris: true,
      niva: mp.profil.niva,
      procent: mp.profil.nivaProcent,
      // E3: företaget, priserna exkl. moms och ordertrappan till tabellen.
      profil: mp.profil.typ,
      ...(mp.foretag
        ? { foretag: mp.foretag.namn, trappa: ORDERTRAPPA.filter((s) => s.procent > 0).map((s) => ({ franOreExMoms: s.franOreExMoms, procent: s.procent })) }
        : {}),
      varianter: varianter.map((v) => ({
        variantId: v.variantId,
        aOre: v.aOre,
        pOre: v.pOre,
        procent: v.procent,
        begransning: v.begransning,
        ...(v.hogstaProcent !== undefined ? { hogstaProcent: v.hogstaProcent } : {}),
        ...(v.orsak ? { orsak: v.orsak } : {}),
        // Det belagda tidigare priset och om procenten får stå (lib/medlem/jamforelse.ts).
        ...(v.tidigareOre !== undefined ? { tidigareOre: v.tidigareOre } : {}),
        ...(v.visaProcent !== undefined ? { visaProcent: v.visaProcent } : {}),
        ...(v.aOreExMoms !== undefined && v.pOreExMoms !== undefined ? { aOreExMoms: v.aOreExMoms, pOreExMoms: v.pOreExMoms } : {}),
      })),
    },
    { headers: tider(prisMs) },
  );
}
