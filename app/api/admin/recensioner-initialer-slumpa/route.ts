// POST /api/admin/recensioner-initialer-slumpa — slumpar om initialer som bryter
// mot reglerna: bokstäverna Q, W, X, Y och Z, och två bokstäver i bokstavsordning
// ("A.B.", "L.M."). Se lib/reviews/initialer.ts (reglerna) och
// lib/reviews/slumpa-initialer.ts (vilka rader som ändras).
//
//   (ingen parameter)   torrt: räknar och visar exempel, skriver ingenting
//   ?skarp=ja&bekrafta=N  skriver, men bara om N är exakt det antal rader
//                         planen skulle skriva (högst `hogst`)
//   ?kundomdomen=ja     tar med kundomdömen (rörs inte som standard)
//   ?hogst=N            högst så många rader per körning (standard 500)
//
// ☠️ En skarp körning SÄGER OCKSÅ TILL BUTIKEN (`butiken` i svaret). Butiken
// cachar varje produkts recensioner i sex timmar, och dess egen bevakning
// (review-andringar) svarar 501 så länge recensionerna ligger i Wix Data. Utan det
// anropet byttes initialerna i lagret men produktsidan visade de gamla i timmar,
// och 2026-10-29 rapporterades det som klart. Se lib/reviews/meddela-butiken.ts.
//
// ☠️ Loggen är publik. Svaret bär räknare och några exempel på initialer före
// och efter (de syns redan på produktsidan), aldrig namn, land eller id:n.
import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getReviewStore } from "@/lib/store/reviews";
import { meddelaButikenOmRecensioner } from "@/lib/reviews/meddela-butiken";
import { planeraSlumpa, skrivSlumpa } from "@/lib/reviews/slumpa-initialer";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Långt över lagrets storlek (≈15 000 rader i oktober 2026). */
const LASTAK = 100_000;
const PRODUKTTAK = 5_000;
const STANDARD_HOGST = 500;
const MAX_HOGST = 2_000;
/** Skrivningarna stannar här; resten av ruttens 300 sekunder går till butiken. */
const TIDSBUDGET_MS = 200_000;
/**
 * Efter den här tiden ber vi butiken inte om fler produkter. Ett anrop tar högst
 * 15 sekunder och kan göras om en gång, så sista anropet slutar före 300.
 */
const BUTIKSBUDGET_MS = 255_000;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!auktoriserad(req)) {
    return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });
  }
  const p = req.nextUrl.searchParams;
  const skarp = p.get("skarp") === "ja";
  const medKundomdomen = p.get("kundomdomen") === "ja";
  const hogst = Math.min(Math.max(1, Number(p.get("hogst")) || STANDARD_HOGST), MAX_HOGST);
  const start = Date.now();

  const store = getReviewStore();
  let rader;
  try {
    rader = await store.listAll(LASTAK);
  } catch (err) {
    console.error(`[initialer-slumpa] kunde inte läsa lagret: ${String(err).slice(0, 200)}`);
    return NextResponse.json({ ok: false, error: "Kunde inte läsa recensionslagret" }, { status: 500 });
  }
  if (rader.length >= LASTAK) {
    return NextResponse.json({ ok: false, error: "Lagret är större än rutten läser" }, { status: 500 });
  }

  const plan = planeraSlumpa(rader, { medKundomdomen, hogst });
  const attSkriva = plan.attAndra.length;
  const exempel = plan.attAndra.slice(0, 10).map(({ r, nya }) => `${r.initials} → ${nya}`);

  let skrivet = null;
  let butiken = null;
  let stopp: string | null = null;
  if (skarp) {
    const bekrafta = p.get("bekrafta");
    if (attSkriva === 0) stopp = "inget att ändra";
    else if (bekrafta === null || Number(bekrafta) !== attSkriva) {
      stopp = `bekrafta måste vara ${attSkriva} (planens antal), fick ${bekrafta ?? "ingenting"}`;
    }
    if (!stopp) {
      const { skrivnaProdukter, ...resultat } = await skrivSlumpa(
        {
          rader,
          upsert: (r) => store.upsert(r),
          lasOm: async (pid, rid) => (await store.listByProduct(pid, PRODUKTTAK)).find((r) => r.reviewIdAE === rid) ?? null,
          slut: () => Date.now() - start > TIDSBUDGET_MS,
        },
        plan,
      );
      skrivet = resultat;
      // ☠️ Produkt-id:n stannar här: de går till butiken och aldrig ut i svaret.
      butiken = await meddelaButikenOmRecensioner(skrivnaProdukter, "initialer-slumpa", {
        slutTid: start + BUTIKSBUDGET_MS,
      });
      await audit(
        "reviews",
        "initialer-slumpa",
        `${skrivet.andrade} recensioner fick nya initialer (Q/W/X/Y/Z och bokstavsordning bytta), `
          + `${skrivet.fel} fel, ${skrivet.andratUnderTiden} ändrade under tiden, ${skrivet.kvar} kvar; `
          + `butiken: ${butiken.uppdaterade}/${butiken.anrop} anrop ok, ${butiken.misslyckade} misslyckade, `
          + `${butiken.hoppade} produkter hoppade${butiken.utanNyckel ? ", ADMIN_SECRET saknas" : ""}`,
      );
    }
  }
  console.log(
    `[initialer-slumpa] ${skarp ? "skarp" : "torr"}: ${rader.length} rader, ${plan.totalt} att ändra `
      + `(${plan.perOrsak.bokstavsordning} bokstavsordning, ${plan.perOrsak.barForbjuden} bara förbjuden bokstav), `
      + `${plan.kundomdomenHoppade} kundomdömen hoppade, ${plan.annanForm} annan form, `
      + `${skrivet ? `${skrivet.andrade} ändrade, ${skrivet.fel} fel, ${skrivet.andratUnderTiden} ändrade under tiden` : "inget skrivet"}`
      + `${butiken ? `, butiken ${butiken.uppdaterade}/${butiken.anrop} ok` : ""}`,
  );

  return NextResponse.json({
    ok: true,
    skarp,
    stopp,
    granskade: rader.length,
    totalt: plan.totalt,
    attSkrivaDennaKorning: attSkriva,
    kundomdomenHoppade: plan.kundomdomenHoppade,
    annanForm: plan.annanForm,
    perBokstav: plan.perBokstav,
    perOrsak: plan.perOrsak,
    perKalla: plan.perKalla,
    nyaMedAringEllerOumlaut: plan.nyaMedAringEllerOumlaut,
    exempel,
    skrivet,
    butiken,
  });
}
