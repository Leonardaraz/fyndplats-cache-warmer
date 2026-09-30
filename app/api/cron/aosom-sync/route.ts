// GET/POST /api/cron/aosom-sync
//
// Speglar Aosoms lagersaldon och priser till Wix.
//
// VARFÖR DEN FINNS
//
// Aosom-sortimentet hade ingen synk alls fram till 2026-08-28, och det var det
// enda som hindrade publicering: en butik som visar saldon ingen uppdaterar
// säljer varor som inte finns.
//
// SKILLNADEN MOT ALIEXPRESS-SYNKEN
//
// AE ringer sitt API en gång per produkt och roterar genom katalogen under en
// anropsbudget. Aosom är ett enda anrop som ger hela sortimentet, så varje
// körning ser allt samtidigt. Priset för det är att en trasig feed kan slå mot
// hela katalogen på en gång — därför kastar `runAosomSync` när feeden ser
// trunkerad ut, i stället för att tolka den som att lagret tagit slut.
//
// VAD DEN INTE RÖR
//
// Synlighet, texter, bilder, kategorier. Bara lagersaldo, pris och mappningens
// kostnadsfält. Prisskrivningen går via `updateV3VariantPrices`, som sedan
// 2026-08-28 skickar tillbaka `visible` oförändrad — utan det publicerar en
// variantsInfo-PATCH utkastet den rör.
//
// RESTOCK-MEJL (sedan 2026-09-30)
//
// En produkt som går från noll till lager i butiken mejlar sina bevakare, i
// skarpt läge (lib/restock/notify.ts). Innan mejlet går töms butikens cache för
// produktsidan, så att länken inte visar en gammal "Slutsåld".
//
// ☠️ FACIT FÖR PRISET ÄR BUTIKEN, INTE MAPPNINGEN (sedan 2026-09-02).
// Butikens priser läses i bulk före loopen (~54 anrop för hela katalogen).
// Jämfördes de mot mappningens `grossSek` kunde en rad som drivit isär aldrig
// självläka — se `jamforelsePris` i lib/aosom/sync.ts. `skipPrices=1` hoppar
// över den läsningen helt.
//
// Query:
//   ?dryRun=false        skarpt läge (default: torrkörning, skriver ingenting)
//   ?limit=400           produkter denna körning
//   ?after=<markör>     fortsätt efter förra svarets `cursor` — förseglad, se
//                        lib/aosom/markor.ts (klartext tas emot vid en körning för hand)
//   ?sku=<artikel>,…   kör bara dessa (riktad omkörning)
//   ?skipPrices=1        synka bara lager
//   ?godkannPris=<wix-id>,…  släpp 40 %-taket för just dessa produkter i den
//                        här körningen (en människas godkännande, se
//                        `godkannPrisandring` i lib/aosom/sync.ts)

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { forseglaMarkor, MarkorFel, oppnaMarkor } from "@/lib/aosom/markor";
import { audit } from "@/lib/audit";
import { runAosomSync, liveDeps } from "@/lib/aosom/sync";
import { beskrivUtskick } from "@/lib/restock/notify";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Under maxDuration med marginal — feeden tar ~5 s att hämta och tolka. */
const TIME_BUDGET_MS = 240_000;

/** Wix-produkt-id: en uuid. */
const WIX_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isCronAuthorized(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

function intParam(req: NextRequest, name: string, fallback: number): number {
  const n = Number(req.nextUrl.searchParams.get(name));
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : fallback;
}

async function handle(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  const dryRun = req.nextUrl.searchParams.get("dryRun") !== "false";
  const limit = intParam(req, "limit", 400);
  // ☠️ Markören är ett artikelnummer. Den går ut FÖRSEGLAD och kommer tillbaka
  // förseglad — se lib/aosom/markor.ts. En handskriven markör i klartext tas
  // fortfarande emot; en förseglad som inte går att öppna är 400, aldrig
  // "börja om från början".
  const hemlighet = process.env.CRON_SECRET ?? "";
  let after: string | undefined;
  try {
    after = oppnaMarkor(req.nextUrl.searchParams.get("after"), hemlighet);
  } catch (err) {
    if (err instanceof MarkorFel) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
    }
    throw err;
  }
  const skipPrices = req.nextUrl.searchParams.get("skipPrices") === "1";
  const onlySkus = (req.nextUrl.searchParams.get("sku") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  // ☠️ ETT ID SOM INTE SER UT SOM ETT WIX-ID VÄGRAS. Ett skrivfel hade annars
  // tyst betytt "ingenting godkänt", och körningen hade sett lyckad ut medan
  // priset stod kvar.
  const godkannPris = (req.nextUrl.searchParams.get("godkannPris") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const ogiltiga = godkannPris.filter((id) => !WIX_ID.test(id));
  if (ogiltiga.length > 0) {
    return NextResponse.json(
      { ok: false, error: `godkannPris tar Wix-produkt-id: ${ogiltiga.join(", ")}` },
      { status: 400 },
    );
  }

  try {
    const summary = await runAosomSync(await liveDeps(), {
      dryRun,
      limit,
      after,
      skipPrices,
      onlySkus: onlySkus.length ? onlySkus : undefined,
      godkannPrisandring: godkannPris.length ? new Set(godkannPris) : undefined,
      timeBudgetMs: TIME_BUDGET_MS,
    });

    // `utanWixPris` fäller också raden: produkter vars pris vi inte kunde
    // jämföra är tyst överhoppade, och tyst överhoppat är precis hur de tjugo
    // drivande raderna kunde ligga osedda i en månad.
    // ☠️ `misslyckade` fäller också raden. Utan det skrevs ingen audit-rad alls
    // för en körning som bara misslyckades — och en körning som inte kunde
    // skriva någonting såg då ut exakt som en körning där allt redan stämde.
    if (!dryRun && (summary.lagerUppdaterade > 0 || summary.prisUppdaterade > 0
      || summary.utanWixPris > 0 || summary.utanLagerrader > 0 || summary.misslyckade > 0
      || summary.okandaVarianter > 0 || summary.tvetydiga > 0 || summary.stampelHoppade > 0
      || summary.restockMejl > 0 || summary.restockEjSkickade > 0 || summary.restockFel
      || summary.prislistaFel)) {
      await audit(
        "aosom-sync",
        "batch",
        `${summary.lagerUppdaterade} lagersaldon och ${summary.prisUppdaterade} priser uppdaterade, `
          + `${summary.urFeeden} ur feeden, ${summary.slutsalda} slutsålda, `
          + `${summary.ejSkeppbara} EJ SKEPPBARA, `
          + `${summary.varningar.length} blockerade prishopp, `
          + (summary.godkandaHopp.length
            ? `${summary.godkandaHopp.length} godkända prishopp (`
              + summary.godkandaHopp.map((h) => `${h.wixProductId} ${h.fran}→${h.till}`).join(", ") + "), "
            : "")
          + `${summary.utanWixPris} utan butikspris, ${summary.prisLasta} prislåsta, `
          + `konkurrentregel ${summary.konkurrentMal} mål/${summary.konkurrentTak} tak/`
          + `${summary.konkurrentGolv} golv/${summary.konkurrentFrysta} FRYSTA, `
          + `${summary.utanLagerrader} utan lagerrader, `
          + `${summary.lagerDrift} lagerdrift (${summary.lagerDriftRattade} rättade bara för driften), `
          + `${summary.stampelHoppade} stämplar väntar (raden ändrades under körningen), `
          + `${summary.saldaAvdragna} sålda enheter avdragna (flödet visar dem inte än), `
          + `${summary.misslyckade} MISSLYCKADE, `
          + `${summary.flerartikelrader} sammanslagna sidor, `
          + `${summary.okandaVarianter} OKÄNDA VARIANTER, ${summary.tvetydiga} TVETYDIGA, `
          + `${summary.aterILager} tillbaka i lager, ${summary.restockMejl} restock-mejl, `
          + `${summary.restockEjSkickade} RESTOCK-MEJL EJ SKICKADE, `
          + `${summary.kvar} kvar`
          + (summary.restockFel ? ` — BEVAKARNA GICK INTE ATT LÄSA: ${summary.restockFel}` : "")
          + (summary.errors[0] ? ` — första felet: ${summary.errors[0].error.slice(0, 160)}` : "")
          + (summary.prislistaFel ? ` — PRISLISTAN GICK INTE ATT LÄSA: ${summary.prislistaFel}` : ""),
      );
    }

    // ☠️ En rad i loggen, alltid. Vercel visar annars bara `GET … 200` för en
    // schemalagd körning, och "ett svar utan fel är inget kvitto" — utan den
    // här raden går det inte att se vad nattens synk faktiskt gjorde utan att
    // ha CRON_SECRET för handen.
    console.log(
      `[aosom-sync] ${summary.granskade} granskade, ${summary.lagerUppdaterade} lager, `
        + `${summary.prisUppdaterade} priser, ${summary.utanWixPris} utan butikspris, `
        + `${summary.prisLasta} prislåsta, `
        // Konkurrentregeln (2026-09-15): FRYSTA är larmet — går det upp har
        // dealproffsen-jämförelsen slutat köras och testraderna står still.
        + `konkurrentregel ${summary.konkurrentMal} mål/${summary.konkurrentTak} tak/`
        + `${summary.konkurrentGolv} golv/${summary.konkurrentFrysta} frysta, `
        + `${summary.urFeeden} ur feeden, ${summary.slutsalda} slutsålda, `
        + `${summary.ejSkeppbara} ej skeppbara, `
        + `${summary.varningar.length} varningar, ${summary.godkandaHopp.length} godkända prishopp, `
        + `${summary.utanLagerrader} utan lagerrader, `
        // Lagerdrift (2026-09-30): butikens saldo mot stämpeln. "rättade" är
        // skrivningar som kom till BARA för driften — se motButikensSaldo.
        + `${summary.lagerDrift} lagerdrift, ${summary.lagerDriftRattade} rättade, `
        // Raden ändrades under körningen (sammanslagning, ommappning,
        // radering): Wix skrevs, stämpeln väntar — se stampelPaFarskRad.
        + `${summary.stampelHoppade} stämplar väntar, `
        // Sålt men inte synligt i Aosoms flöde än (2026-10-01): dras av från
        // flödets saldo så att ett sålt exemplar inte säljs igen — se
        // medSaldaAvdragna och vantarPaFlodet.
        + `${summary.saldaAvdragna} sålda avdragna, `
        + `${summary.misslyckade} misslyckade, `
        // Färgsammanslagna sidor (2026-09-27): okända varianter och tvetydiga
        // rader nollar lagret — talen ska vara noll, se lib/aosom/artiklar.ts.
        + `${summary.flerartikelrader} sammanslagna, ${summary.okandaVarianter} okända varianter, `
        + `${summary.tvetydiga} tvetydiga, `
        // Restock-mejlen (2026-09-30): en produkt som går från noll till lager
        // i butiken mejlar sina bevakare. "ej skickade" ska vara noll — de
        // får inget nytt försök, se `restockEjSkickade`.
        + `${summary.aterILager} tillbaka i lager, ${summary.restockMejl} restock-mejl, `
        + `${summary.restockEjSkickade} restock-mejl ej skickade, `
        // ☠️ `stoppedBy` SKA STÅ I LOGGEN (2026-09-10). Fältet har funnits i
        // summaryn sedan loopen byggdes om, men skrevs varken här eller i
        // workflowen — så en körning som slog i `limit` och en som blev klar
        // såg likadana ut. Det gick alltså inte att svara på den enda fråga
        // som avgör om taket ska höjas: tog budgeten slut, eller tiden?
        // Uppmätt samma dag: priscronen stannade på `limit` fyra nätter i rad
        // och lämnade 2 607 rader ogranskade, utan att någon kunde se det.
        + `stoppade på ${summary.stoppedBy}, `
        + `${summary.kvar} kvar${dryRun ? " (TORRKÖRNING — inget skrevs)" : ""}`
        + (summary.prislistaFel ? ` — PRISLISTAN GICK INTE ATT LÄSA: ${summary.prislistaFel}` : "")
        + (summary.restockFel ? ` — BEVAKARNA GICK INTE ATT LÄSA: ${summary.restockFel}` : ""),
    );
    // Produkterna som skrevs bara för att butiken drivit från stämpeln. Wix-id
    // är publika, så de får stå i loggen — artikelnumren gör det aldrig.
    if (summary.lagerDriftProdukter.length > 0) {
      const idn = summary.lagerDriftProdukter;
      console.log(
        `[aosom-sync] lagerdrift rättad${dryRun ? " (torrkörning)" : ""}: ${idn.slice(0, 20).join(", ")}`
          + (idn.length > 20 ? ` … ${idn.length} st totalt` : ""),
      );
    }
    // Produkterna där sålda enheter drogs av. Samma form.
    if (summary.saldaAvdragnaProdukter.length > 0) {
      const idn = summary.saldaAvdragnaProdukter;
      console.log(
        `[aosom-sync] sålda avdragna: ${idn.slice(0, 20).join(", ")}`
          + (idn.length > 20 ? ` … ${idn.length} st totalt` : ""),
      );
    }
    // En rad per produkt vars bevakare inte fick allt: bara Wix-id och räknare.
    for (const u of summary.restockUtskick) {
      if (u.stopp || u.ejSkickade > 0 || u.markeringsfel || (u.sidan && u.sidan !== "uppfriskad")) {
        console.warn(`[aosom-sync] restock ${u.wixProductId}: ${beskrivUtskick(u)}`);
      }
    }

    const cursor = forseglaMarkor(summary.cursor, hemlighet);

    return NextResponse.json(
      {
        ok: true,
        ...summary,
        // Förseglad — den når en publik logg, en jobbsummering och en fil i
        // grenen. Artikelnumret i klartext stannar här i rutten.
        cursor,
        next: cursor
          ? `/api/cron/aosom-sync?dryRun=${dryRun ? "true" : "false"}&limit=${limit}`
            + `&after=${encodeURIComponent(cursor)}`
          : null,
      },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Okänt fel";
    // En trunkerad feed landar här. 500 är rätt: körningen ska synas som misslyckad
    // i cron-loggen, inte som en lyckad körning som råkade inte göra något.
    return NextResponse.json({ error: "Aosom-synken misslyckades", message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return handle(req);
}

export async function GET(req: NextRequest) {
  return handle(req);
}
