// POST /api/admin/recensioner-initialer-slumpa — byter Y, X, Z och W i
// recensionernas initialer mot andra bokstäver. Se lib/reviews/slumpa-initialer.ts.
//
//   (ingen parameter)   torrt: räknar och visar exempel, skriver ingenting
//   ?skarp=ja&bekrafta=N  skriver, men bara om N är exakt det antal rader
//                         planen skulle skriva (högst `hogst`)
//   ?kundomdomen=ja     tar med kundomdömen (rörs inte som standard)
//   ?hogst=N            högst så många rader per körning (standard 500)
//
// ☠️ Loggen är publik. Svaret bär räknare och några exempel på initialer före
// och efter (de syns redan på produktsidan), aldrig namn, land eller id:n.
import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getReviewStore } from "@/lib/store/reviews";
import { planeraSlumpa, skrivSlumpa } from "@/lib/reviews/slumpa-initialer";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Långt över lagrets storlek (≈8 000 rader i september 2026). */
const LASTAK = 100_000;
const PRODUKTTAK = 5_000;
const STANDARD_HOGST = 500;
const MAX_HOGST = 2_000;
/** Lämnar marginal till ruttens 300 sekunder. */
const TIDSBUDGET_MS = 240_000;

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
  let stopp: string | null = null;
  if (skarp) {
    const bekrafta = p.get("bekrafta");
    if (attSkriva === 0) stopp = "inget att ändra";
    else if (bekrafta === null || Number(bekrafta) !== attSkriva) {
      stopp = `bekrafta måste vara ${attSkriva} (planens antal), fick ${bekrafta ?? "ingenting"}`;
    }
    if (!stopp) {
      skrivet = await skrivSlumpa(
        {
          rader,
          upsert: (r) => store.upsert(r),
          lasOm: async (pid, rid) => (await store.listByProduct(pid, PRODUKTTAK)).find((r) => r.reviewIdAE === rid) ?? null,
          slut: () => Date.now() - start > TIDSBUDGET_MS,
        },
        plan,
      );
      await audit(
        "reviews",
        "initialer-slumpa",
        `${skrivet.andrade} recensioner fick nya initialer (Y/X/Z/W bytta), ${skrivet.fel} fel, ${skrivet.kvar} kvar`,
      );
    }
  }
  console.log(
    `[initialer-slumpa] ${skarp ? "skarp" : "torr"}: ${rader.length} rader, ${plan.totalt} att ändra, `
      + `${plan.kundomdomenHoppade} kundomdömen hoppade, ${plan.annanForm} annan form, `
      + `${skrivet ? `${skrivet.andrade} ändrade, ${skrivet.fel} fel` : "inget skrivet"}`,
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
    exempel,
    skrivet,
  });
}
