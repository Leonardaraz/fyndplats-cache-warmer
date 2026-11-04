// GET /api/medlem/priser?p=<produkt-id>
//
// Medlemspriset för varje variant av en produkt, för den inloggade medlemmen
// (E2-2). Produktsidans HTML är densamma för alla och cachas; priset hämtas
// här i webbläsaren, med `Cache-Control: private, no-store`.
//
// Svaret bär radpriset, procenten och skälet till en begränsning, aldrig
// golvet eller kostnaden. Utan medlemspris svarar rutten `medlemspris: false`
// med skälet, så att sidan helt enkelt visar listpriset.

import { NextResponse } from "next/server";
import { PRIVAT } from "@/lib/medlem/inloggad";
import { medlemsprisForProdukt, medlemsprofil } from "@/lib/medlem/medlemspris";
import { ORDERTRAPPA } from "@/lib/medlem/pris";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const produktId = new URL(req.url).searchParams.get("p") ?? "";
  if (!/^[A-Za-z0-9-]{1,64}$/.test(produktId)) {
    return NextResponse.json({ medlemspris: false, skal: "fel-form" }, { status: 400, headers: PRIVAT });
  }
  const mp = await medlemsprofil();
  if ("utan" in mp) return NextResponse.json({ medlemspris: false, skal: mp.utan }, { headers: PRIVAT });
  const varianter = await medlemsprisForProdukt(produktId, mp.profil);
  if (!varianter) return NextResponse.json({ medlemspris: false, skal: "fel" }, { headers: PRIVAT });
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
    { headers: PRIVAT },
  );
}
