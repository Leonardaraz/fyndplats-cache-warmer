// GET/POST /api/cron/aosom-media-cleanup
//
// Raderar Aosom-bilder som ingen produkt använder.
//
// ☠️ VARFÖR DEN BEHÖVDES (2026-08-28)
//
// Wix-lagringen tog slut mitt under den fjärde bildfix-körningen. Orsaken är att
// `image-repair.ts` laddar upp alla fem bilderna på nytt för varje produkt den
// lagar och ersätter medialistan — de gamla filerna blir kvar och ingen städar
// dem. Fyra körningar mot en katalog som växte till 2 712 produkter blev
// tusentals föräldralösa filer à drygt en megabyte.
//
// SPÄRRAR
//
// Bara filer vars namn börjar med `aosom-`, och bara de som INTE sitter på någon
// produkt. Referenslistan byggs ur hela katalogen, inte bara Aosom-delen. Och
// `planeraStadning` KASTAR om referenslistan är misstänkt liten — en halvläst
// produktlistning gör varje fil föräldralös, och en körning hade då raderat hela
// butikens bildbank permanent.
//
// Raderingen är PERMANENT med flit: papperskorgen räknas fortfarande mot
// lagringen, så en vanlig radering frigör ingenting.
//
// Query:
//   ?dryRun=false     skarpt läge (default: torrkörning, raderar ingenting)
//   ?limit=500        tak på antal filer denna körning
//   ?after=<markör>   fortsätt listningen där förra körningen slutade
//   ?omfang=allt      även poleringens utsnitt och kort, se `Omfang` i
//                     lib/aosom/media-cleanup.ts (default: aosom, nattens läge)
//   ?minAlderDagar=14 läget allt: rör bara filer äldre än så (minst 7)
//   ?golv=recensioner:3400,butiken:3100 minsta antal referenser per läsare;
//                     under golvet avbryts körningen innan något raderas
//
// LÄSARNA (2026-10-14): produkterna, kategorierna, recensionerna,
// färgbildstabellen, butikens egen lista (bloggen, koden, reservkatalogen,
// variantbilderna), ordrarna och varje variants egen bild (varukorgen, kassan,
// ordern). Faller någon av dem avbryts körningen.
//
// KARENSTIDEN: en fil raderas först när den varit oanvänd i tre dygn, sett av
// två körningar. Varje körning antecknar, även en torrkörning, och svaret bär
// `mogna` (raderbara nu) och `iKarens`. Se lib/store/bildstadning-karens.ts.
//
// Svaret bär en `cursor`. Är den satt återstår filer att gå igenom — kör igen
// med `?after=<cursor>`. `null` betyder att hela Media Manager är genomgången.
//
// DEN NATTLIGA CRONEN KÖR MEDVETET UTAN MARKÖR, och det är inte ett förbiseende.
// Listningen sorteras `updatedDate DESC`, alltså nyast först, så ett fönster
// från början täcker exakt det som hunnit bli föräldralöst sedan i går. Det är
// vad en nattlig städning ska göra. Den historiska ryggsäcken tas i stället med
// workflow-läget `bildstadning`, som loopar markören genom hela beståndet.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { runMediaCleanup, liveDeps, LASARE, MIN_ALDER_ALLT_DAGAR, type Lasare, type Omfang } from "@/lib/aosom/media-cleanup";

export const runtime = "nodejs";
export const maxDuration = 300;

function isCronAuthorized(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

async function handle(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  const dryRun = req.nextUrl.searchParams.get("dryRun") !== "false";
  // ☠️ Ett tak som inte går att läsa är INGET tak (granskningen 2026-10-14):
  // `limit=0.5` blev förr 0, alltså obegränsat. Saknas parametern finns inget
  // tak; finns den måste den vara ett positivt heltal. Undantaget är 0 (eller
  // tomt) i en TORRKÖRNING, som import-workflowens `bildstadning-torr` skickar
  // för "hela biblioteket": en torrkörning raderar ingenting.
  const limitParam = req.nextUrl.searchParams.get("limit");
  let limit: number | undefined;
  if (limitParam !== null) {
    const n = Number(limitParam);
    if (dryRun && n === 0) {
      limit = undefined;
    } else if (!Number.isInteger(n) || n < 1) {
      return NextResponse.json({ error: `Ogiltigt limit: ${limitParam}` }, { status: 400 });
    } else {
      limit = n;
    }
  }
  const after = req.nextUrl.searchParams.get("after") || undefined;

  const omfangParam = req.nextUrl.searchParams.get("omfang") ?? "aosom";
  if (omfangParam !== "aosom" && omfangParam !== "allt") {
    return NextResponse.json({ error: `Okänt omfang: ${omfangParam}` }, { status: 400 });
  }
  const omfang: Omfang = omfangParam;
  const alderParam = req.nextUrl.searchParams.get("minAlderDagar");
  const minAlderDagar = alderParam === null ? undefined : Number(alderParam);
  if (omfang === "allt" && minAlderDagar !== undefined && !(minAlderDagar >= MIN_ALDER_ALLT_DAGAR)) {
    return NextResponse.json(
      { error: `minAlderDagar måste vara minst ${MIN_ALDER_ALLT_DAGAR} i läget allt` },
      { status: 400 },
    );
  }

  // ?golv=produkter:31000,recensioner:3400 — minsta antal referenser per
  // läsare. Kontrolleras före listningen och raderingen (runMediaCleanup).
  let golv: Partial<Record<Lasare, number>> | undefined;
  const golvParam = req.nextUrl.searchParams.get("golv");
  if (golvParam) {
    golv = {};
    for (const del of golvParam.split(",")) {
      const [nyckel, tal] = del.split(":");
      const n = Number(tal);
      if (!LASARE.includes(nyckel as Lasare) || !Number.isInteger(n) || n < 0) {
        return NextResponse.json({ error: `Ogiltigt golv: ${del}` }, { status: 400 });
      }
      golv[nyckel as Lasare] = n;
    }
  }

  try {
    // Tidsbudgeten ligger under ruttens maxDuration (300 s) så att en körning
    // hinner SVARA med sina siffror i stället för att dödas mitt i listningen.
    const summary = await runMediaCleanup(await liveDeps(), {
      dryRun, limit, after, timeBudgetMs: 240_000, omfang, minAlderDagar, golv,
    });

    if (!dryRun && summary.raderade > 0) {
      await audit(
        "aosom-media-cleanup",
        "batch",
        `${summary.raderade} föräldralösa bilder raderade permanent (${omfang}), `
          + `${summary.frigjordMb} MB frigjort, ${summary.misslyckade} misslyckade, `
          + `${summary.iKarens} väntar ut karenstiden`,
      );
    }

    return NextResponse.json({ ok: true, ...summary }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Okänt fel";
    // Massfel-spärren landar här. 500 är rätt — körningen SKA synas som
    // misslyckad, inte som en lyckad städning som råkade inte radera något.
    return NextResponse.json({ error: "Mediastädningen misslyckades", message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return handle(req);
}

export async function GET(req: NextRequest) {
  return handle(req);
}
