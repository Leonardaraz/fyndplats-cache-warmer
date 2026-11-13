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
//   ?rotation=lager|pris  fortsätt där förra schemalagda körningen med samma
//                        namn slutade, och spara var den här slutar
//                        (lib/aosom/sync-markor.ts). Bara skarpa körningar
//                        flyttar markören. `after` och `sku` vinner över den.
//                        `pris` går ETT HELT VARV: efter markören till slutet,
//                        sedan från början fram till markören.
//   ?budget=660          sekunder körningen får börja på nya tuggor (default
//                        240, högst 660). Den schemalagda priskörningen har
//                        660; workflowens anrop väntar bara 310 sekunder och
//                        står kvar på 240.
//   ?fortsatt=1          bara tillsammans med `rotation`: kör BARA om förra
//                        körningen inte hann klart (en sparad markör finns).
//                        Annars svarar rutten direkt utan att läsa något.
//   ?samtidiga=3         så många produkters priser skrivs samtidigt (1–6,
//                        default `PRIS_SAMTIDIGA`, en i taget). Finns för att
//                        takten ska gå att mäta och höja utan ett nytt bygge.
//
// ☠️ EN PRISKÖRNING OM DAGEN, OCH DEN SKA HINNA HELA KATALOGEN (Leonard
// 2026-11-11: "den borde köras 1 gång om dagen och fungera också"). Körningen
// 03:13 UTC går ett helt varv. De tre fortsättningarna (09:13, 15:13 och 21:13,
// `fortsatt=1`) gör något bara den dag Aosom flyttat så många priser att
// varvet inte hanns med. Se docs/claude/05-aosom-synken/41-en-priskorning-om-dagen.md.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { forseglaMarkor, MarkorFel, oppnaMarkor } from "@/lib/aosom/markor";
import { audit } from "@/lib/audit";
import { runAosomSync, liveDeps } from "@/lib/aosom/sync";
import { arRotation, getSyncMarkorLager, nastaMarkor } from "@/lib/aosom/sync-markor";
import { beskrivUtskick } from "@/lib/restock/notify";

export const runtime = "nodejs";
export const maxDuration = 800;

/**
 * Default för hur länge körningen får börja på nya tuggor. Workflowens anrop
 * väntar 310 sekunder på svaret, så en körning utan `?budget=` ska vara klar
 * långt före det.
 */
const TIME_BUDGET_MS = 240_000;

/** Högsta `?budget=`, i sekunder. Med `PRIS_SLUT_MARGINAL_MS` och sista tuggans stämplar ryms det i maxDuration. */
const MAX_BUDGET_SEK = 660;

/**
 * Så länge efter budgeten får en påbörjad tugga fortsätta skriva priser
 * (`prisSlutMs` i lib/aosom/sync.ts). Efter det skjuts resten av tuggans
 * priser upp till nästa körning, i stället för att Vercel dödar körningen
 * mitt i tuggan utan stämplar, markör och loggrad (uppmätt 2026-11-11).
 */
const PRIS_SLUT_MARGINAL_MS = 45_000;

/**
 * Högsta `?samtidiga=`. Wix stryper på tempo (edge-spärren, se
 * docs/claude/05-aosom-synken/02-lagerskrivningen-och-edge-sparren.md), och
 * varje prisskrivning är minst två anrop. Tre samtidiga ströps i drift
 * 2026-11-11, så sex räcker gott för att mäta var gränsen går.
 */
const MAX_SAMTIDIGA = 6;

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
  const budgetMs = Math.min(intParam(req, "budget", TIME_BUDGET_MS / 1000), MAX_BUDGET_SEK) * 1000;
  const fortsatt = req.nextUrl.searchParams.get("fortsatt") === "1";
  // Utan parametern (eller med ett värde som inte är ett positivt heltal) gäller
  // synkens egen default, `PRIS_SAMTIDIGA`.
  const samtidiga = intParam(req, "samtidiga", 0);
  const prisSamtidiga = samtidiga > 0 ? Math.min(samtidiga, MAX_SAMTIDIGA) : undefined;
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

  // ☠️ ETT OKÄNT ROTATIONSNAMN VÄGRAS. En felstavning i vercel.json hade annars
  // tyst gett en körning utan markör — alltså exakt felet markören lagar.
  const rotationParam = req.nextUrl.searchParams.get("rotation");
  if (rotationParam !== null && !arRotation(rotationParam)) {
    return NextResponse.json({ ok: false, error: `okänd rotation: ${rotationParam}` }, { status: 400 });
  }
  // En körning för hand med `after` eller `sku` rör inte den schemalagda
  // markören — den vet redan var den ska börja.
  const rotation = rotationParam !== null && !after && onlySkus.length === 0 ? rotationParam : null;
  const markorLager = rotation ? getSyncMarkorLager() : null;
  // ☠️ En markör som inte går att läsa stoppar inte synken — lagret är det
  // brådskande. Körningen börjar då från början, och loggraden säger det.
  let sparadMarkor: string | null = null;
  let markorLasFel: string | null = null;
  if (rotation && markorLager) {
    try {
      sparadMarkor = await markorLager.las(rotation);
    } catch (err) {
      markorLasFel = err instanceof Error ? err.message.slice(0, 160) : String(err);
    }
  }

  // ── FORTSÄTTNINGEN (`fortsatt=1`) ─────────────────────────────────────
  // Kör bara när förra körningen med samma rotation inte hann klart. Blev den
  // klar finns ingen markör, och då finns inget att fortsätta på: rutten
  // svarar utan att läsa feeden eller butiken.
  //
  // ☠️ GÅR MARKÖREN INTE ATT LÄSA KÖR FORTSÄTTNINGEN ÄNDÅ. Att hoppa över på
  // ett läsfel hade kunnat lämna ett halvt varv liggande ett dygn till, och en
  // körning för mycket kostar bara en genomläsning.
  if (fortsatt && rotation && !sparadMarkor && !markorLasFel) {
    console.log(
      `[aosom-sync] rotation ${rotation}: fortsättningen hoppas över, förra körningen hann hela varvet`,
    );
    return NextResponse.json({ ok: true, hoppad: true, rotation }, { status: 200 });
  }

  try {
    const summary = await runAosomSync(await liveDeps(), {
      dryRun,
      limit,
      after: after ?? sparadMarkor ?? undefined,
      skipPrices,
      onlySkus: onlySkus.length ? onlySkus : undefined,
      godkannPrisandring: godkannPris.length ? new Set(godkannPris) : undefined,
      timeBudgetMs: budgetMs,
      prisSlutMs: budgetMs + PRIS_SLUT_MARGINAL_MS,
      prisSamtidiga,
      // Priskörningen går ett helt varv, så att hela katalogen granskas också
      // den dag körningen börjar mitt i den. Lagerkörningen går som förut.
      varv: rotation === "pris",
    });

    // Markören för nästa schemalagda körning. Ett fel här stoppar ingenting:
    // nästa körning börjar då från den gamla markören och gör om en bit.
    let rotationRad = "";
    if (rotation && markorLager) {
      const nasta = nastaMarkor(summary, sparadMarkor);
      rotationRad = `, rotation ${rotation}: ${sparadMarkor ? "fortsatte från sparad markör" : "började från början"}`
        + (markorLasFel ? ` (MARKÖREN GICK INTE ATT LÄSA: ${markorLasFel})` : "")
        + `, nästa ${nasta ? "fortsätter" : "börjar om"}`;
      if (!dryRun) {
        try {
          await markorLager.spara(rotation, nasta);
        } catch (err) {
          const fel = err instanceof Error ? err.message.slice(0, 160) : String(err);
          rotationRad += ` (MARKÖREN GICK INTE ATT SPARA: ${fel})`;
        }
      } else {
        rotationRad += " (torrkörning, markören flyttades inte)";
      }
    }

    // `utanWixPris` fäller också raden: produkter vars pris vi inte kunde
    // jämföra är tyst överhoppade, och tyst överhoppat är precis hur de tjugo
    // drivande raderna kunde ligga osedda i en månad.
    // ☠️ `misslyckade` fäller också raden. Utan det skrevs ingen audit-rad alls
    // för en körning som bara misslyckades — och en körning som inte kunde
    // skriva någonting såg då ut exakt som en körning där allt redan stämde.
    if (!dryRun && (summary.lagerUppdaterade > 0 || summary.prisUppdaterade > 0
      || summary.utanWixPris > 0 || summary.utanLagerrader > 0 || summary.misslyckade > 0
      || summary.okandaVarianter > 0 || summary.tvetydiga > 0 || summary.stampelHoppade > 0
      || summary.okantBesked > 0
      || summary.restockMejl > 0 || summary.restockEjSkickade > 0 || summary.restockFel
      || summary.prisUppskjutna > 0 || summary.varningar.length > 0
      || summary.prislistaFel)) {
      await audit(
        "aosom-sync",
        "batch",
        `${summary.lagerUppdaterade} lagersaldon och ${summary.prisUppdaterade} priser uppdaterade, `
          + `${summary.urFeeden} ur feeden, ${summary.slutsalda} slutsålda, `
          + `${summary.ejSkeppbara} EJ SKEPPBARA, `
          + `${summary.varningar.length} blockerade prishopp`
          // ☠️ MED PRODUKT OCH BELOPP (2026-11-11). Raden bar bara antalet, så
          // ingen såg vilka varor taket höll kvar: fem synliga varor i lager stod
          // 40–54 % från regelpriset, en av dem sedan oktober. Wix-id, aldrig
          // artikelnummer.
          + (summary.varningar.length
            ? ` (${summary.varningar.slice(0, 20).map((v) => `${v.wixProductId ?? "okänd"} ${v.fran}→${v.till}`).join(", ")})`
            : "")
          + ", "
          + `${summary.prisUppskjutna} priser uppskjutna (tiden tog slut), `
          + (summary.godkandaHopp.length
            ? `${summary.godkandaHopp.length} godkända prishopp (`
              + summary.godkandaHopp.map((h) => `${h.wixProductId} ${h.fran}→${h.till}`).join(", ") + "), "
            : "")
          + `${summary.utanWixPris} utan butikspris, ${summary.prisLasta} prislåsta, `
          + `${summary.iAuktion} i fyndauktion (pris orört), `
          + `konkurrentregel ${summary.konkurrentMal} mål/${summary.konkurrentTak} tak/`
          + `${summary.konkurrentGolv} golv/${summary.konkurrentFrysta} FRYSTA, `
          + `${summary.utanLagerrader} utan lagerrader, `
          + `${summary.lagerDrift} lagerdrift (${summary.lagerDriftRattade} rättade bara för driften), `
          + `${summary.stampelHoppade} stämplar väntar (raden ändrades under körningen), `
          + `${summary.saldaAvdragna} sålda enheter avdragna (flödet visar dem inte än), `
          + `${summary.misslyckade} MISSLYCKADE, `
          + `${summary.flerartikelrader} sammanslagna sidor, `
          + `${summary.okandaVarianter} OKÄNDA VARIANTER, ${summary.tvetydiga} TVETYDIGA, `
          + (summary.okantBesked
            ? `${summary.okantBesked} med OKÄNT BESKED, rördes inte (`
              + summary.okantBeskedProdukter.slice(0, 20).join(", ") + "), "
            : "")
          + `${summary.aterILager} tillbaka i lager, ${summary.restockMejl} restock-mejl, `
          + `${summary.restockEjSkickade} RESTOCK-MEJL EJ SKICKADE, `
          + `${summary.kvar} kvar`
          + (summary.restockFel ? ` — BEVAKARNA GICK INTE ATT LÄSA: ${summary.restockFel}` : "")
          + (summary.errors[0] ? ` — första felet: ${summary.errors[0].error.slice(0, 160)}` : "")
          + (summary.prislistaFel ? ` — PRISDELEN FÖLL: ${summary.prislistaFel}` : ""),
      );
    }

    // ☠️ En rad i loggen, alltid. Vercel visar annars bara `GET … 200` för en
    // schemalagd körning, och "ett svar utan fel är inget kvitto" — utan den
    // här raden går det inte att se vad nattens synk faktiskt gjorde utan att
    // ha CRON_SECRET för handen.
    console.log(
      `[aosom-sync] ${summary.granskade} granskade, ${summary.lagerUppdaterade} lager, `
        + `${summary.prisUppdaterade} priser, `
        // Priser som inte hanns med före `prisSlutMs`. Ska vara 0 en vanlig natt.
        + (summary.prisUppskjutna ? `${summary.prisUppskjutna} priser UPPSKJUTNA (tiden tog slut), ` : "")
        + `${summary.utanWixPris} utan butikspris, `
        + `${summary.prisLasta} prislåsta, `
        // En levande fyndauktion äger priset (2026-10-13) — se lasAuktionsprodukter.
        + `${summary.iAuktion} i fyndauktion, `
        // Konkurrentregeln (2026-09-15): FRYSTA är larmet — går det upp har
        // dealproffsen-jämförelsen slutat köras och testraderna står still.
        + `konkurrentregel ${summary.konkurrentMal} mål/${summary.konkurrentTak} tak/`
        + `${summary.konkurrentGolv} golv/${summary.konkurrentFrysta} frysta, `
        + `${summary.urFeeden} ur feeden, ${summary.slutsalda} slutsålda, `
        + `${summary.ejSkeppbara} ej skeppbara, `
        // Okänt besked rörs inte (steg 3, 2026-10-21). Alltid 0 för Aosom.
        + (summary.okantBesked ? `${summary.okantBesked} med OKÄNT BESKED (rördes inte), ` : "")
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
        + rotationRad
        + (summary.prislistaFel ? ` — PRISDELEN FÖLL: ${summary.prislistaFel}` : "")
        + (summary.restockFel ? ` — BEVAKARNA GICK INTE ATT LÄSA: ${summary.restockFel}` : ""),
    );
    // Prishoppen som taket stoppade, med Wix-id och belopp. De skrivs aldrig
    // utan en människas godkännande (`godkannPris`), så de ska gå att se.
    for (const v of summary.varningar.slice(0, 20)) {
      console.warn(
        `[aosom-sync] prishopp stoppat${dryRun ? " (torrkörning)" : ""}: ${v.wixProductId ?? "okänd produkt"} `
          + `${v.fran} → ${v.till} kr (${v.andringPct} %)`,
      );
    }
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
