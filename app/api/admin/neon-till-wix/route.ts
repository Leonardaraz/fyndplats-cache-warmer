// GET/POST /api/admin/neon-till-wix
//
// Flytten tillbaka till Wix CMS (lib/migration/neon-till-wix.ts). Körs HÄR och
// inte från en terminal av samma skäl som kopieringen till Postgres: produktionen
// har Wix-nyckeln OCH `DATABASE_URL`, GitHub Actions har `CRON_SECRET`, och de
// möts i workflowen "Migrering — flytta drift-datan tillbaka till Wix".
//
// Query:
//   ?lage=plan|kopiera|verifiera|delta     (default plan)
//   ?dryRun=false                          skriv på riktigt (kopiera, delta)
//   ?after=tabell:fas:id                   fortsätt från markören i förra svaret
//   ?tabeller=mappings,audit               bara dessa
//   ?vaxling=<ISO>                         delta: när växlings-PR:en mergades
//   ?kopieradSedan=<ISO>                   delta: när den sista kopieringen startade
//   ?limitMs=200000                        egen tidsbudget
//
// ☠️ SVARET BÄR ALDRIG RADERNAS INNEHÅLL. Id, antal och fältnamn — inget mer.
// Loggen är publik, och raderna bär ordrar, adresser och inköpspriser.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { auctionsBackend, DRIFTEN_I_WIX, reviewsBackend, storeBackend } from "@/lib/store/backend";
import { godkand, synka, type Lage, type Markor } from "@/lib/migration/neon-till-wix";
import { neonKallor, tabellerINeon, wixSida } from "@/lib/migration/neon-till-wix-kallor";
import { PostgresStore } from "@/lib/store/postgres";
import { ALIEXPRESS_TOKEN_ID, WixDataStore } from "@/lib/store/wix-data";
import { hamta } from "@/lib/db/wix-data-klient";
import { createHash } from "node:crypto";
import { forseglaMarkor, oppnaMarkor } from "@/lib/aosom/markor";

export const runtime = "nodejs";
export const maxDuration = 300;

const LAGEN = ["plan", "kopiera", "verifiera", "delta"] as const;
type Rutlage = (typeof LAGEN)[number];
const TOKENS_KOLLEKTION = process.env.WIX_DATA_COL_TOKENS ?? "FyndplatsAliExpressTokens";

function isCronAuthorized(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

/**
 * Tabeller vars id går att skriva ut: Wix egna produkt-, order-, fil- och
 * auktions-id. Alla andra (audit, synklogg, larm, LLM-nycklar, händelser)
 * kan bära fritext eller ett artikelnummer i id:t, och skrivs som en kort
 * hash. Hashen räcker för att se att två körningar pekar på samma rad.
 */
const ID_SKRIVS_UT = new Set(["mappings", "tasks", "reviews", "auctions", "sync_state", "product_hashes", "import_costs", "fargbilder", "bildstadning_karens", "faktura_utskick"]);

function visatId(tabell: string, id: string): string {
  return ID_SKRIVS_UT.has(tabell) ? id : `#${createHash("sha256").update(id).digest("hex").slice(0, 10)}`;
}

/** Ett fel i svaret: status och WDE-kod, aldrig Wix felkropp (den kan eka radens fält). */
function visatFel(fel: string): string {
  const kod = /WDE\d{4}/.exec(fel)?.[0];
  const status = /\((\d{3}|nätverk)/.exec(fel)?.[1];
  return [status ? `status ${status}` : "", kod ?? "", /inte bekräftad|oadresserbart/.exec(fel)?.[0] ?? ""].filter(Boolean).join(" ") || "fel";
}

function tolkaMarkor(ra: string | null): Markor | null {
  if (!ra) return null;
  const [tabell, fas, ...rest] = ra.split(":");
  const efter = rest.join(":");
  if (!tabell || (fas !== "fram" && fas !== "bak")) throw new Error(`Ogiltig markör "${ra}" — vänta dig "tabell:fas:id".`);
  return { tabell, fas, efter: efter || null };
}

/**
 * AliExpress-nycklarna jämförs och kopieras särskilt: en rad, och värdena får
 * aldrig nå ett svar eller en logg. Svaret säger bara om de är lika.
 *
 * ☠️ Efter växlingen förnyar token-cronen nycklarna i Wix. Då ska Neon aldrig
 * skriva över dem: `refreshAndPersist` roterar refresh-token, och en gammal
 * kopia hade varit en död nyckel — vägen tillbaka är ny OAuth för hand.
 */
async function nycklarna(lage: Lage, dryRun: boolean, vaxling: string | null) {
  const neon = await new PostgresStore().getAliExpressTokens();
  const wixRad = await hamta<{ accessToken?: string; refreshToken?: string; expiresAt?: string; updatedAt?: string }>(
    TOKENS_KOLLEKTION,
    ALIEXPRESS_TOKEN_ID,
  );
  if (!neon) return { neon: false, wix: Boolean(wixRad), lika: false, skrivna: 0 };
  const lika =
    Boolean(wixRad) &&
    wixRad!.accessToken === neon.accessToken &&
    wixRad!.refreshToken === neon.refreshToken &&
    Date.parse(String(wixRad!.expiresAt)) === neon.expiresAt.getTime();
  if (lika || lage === "verifiera" || dryRun) return { neon: true, wix: Boolean(wixRad), lika, skrivna: 0 };
  if (lage === "delta" && vaxling && wixRad?.updatedAt && Date.parse(wixRad.updatedAt) >= Date.parse(vaxling)) {
    return { neon: true, wix: true, lika, skrivna: 0, wixNyare: true };
  }
  await new WixDataStore().saveAliExpressTokens(neon);
  return { neon: true, wix: true, lika, skrivna: 1 };
}

async function handle(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }
  const p = req.nextUrl.searchParams;
  const lage = (p.get("lage") ?? "plan") as Rutlage;
  if (!LAGEN.includes(lage)) {
    return NextResponse.json({ ok: false, error: `Okänt läge "${lage}". Tillåtna: ${LAGEN.join(", ")}.` }, { status: 400 });
  }
  const dryRun = p.get("dryRun") !== "false";
  const tabeller = (p.get("tabeller") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const limitMs = Number(p.get("limitMs"));
  const vaxling = p.get("vaxling");
  const kopieradSedan = p.get("kopieradSedan");
  const lager = { drift: storeBackend(), recensioner: reviewsBackend(), auktioner: auctionsBackend(), driftenIWix: DRIFTEN_I_WIX };

  // ☠️ KOPIERA SKRIVER ÖVER. Efter växlingen är Wix den levande sidan, och en
  // kopiering hade skrivit gårdagens Neon-rader över dagens drift. Då gäller
  // bara delta, som låter Wix vinna varje rad drift har rört.
  if (lage === "kopiera" && !dryRun && DRIFTEN_I_WIX) {
    return NextResponse.json(
      {
        ok: false,
        error: "Driften går redan i Wix (DRIFTEN_I_WIX). En kopiering hade skrivit Neon över levande rader — använd lage=delta med vaxling och kopieradSedan.",
      },
      { status: 409 },
    );
  }

  try {
    const kallor = neonKallor();
    if (lage === "plan") {
      const tabellerUt = [];
      for (const k of kallor) {
        if (tabeller.length && !tabeller.includes(k.namn)) continue;
        // En kollektion som ännu inte skapats ska synas i planen, inte fälla den.
        const [neon, wix] = await Promise.all([
          k.raknaNeon(),
          wixSida()
            .rakna(k.kollektion)
            .catch((e: unknown) => `fel: ${visatFel(e instanceof Error ? e.message : String(e))}`),
        ]);
        tabellerUt.push({ tabell: k.namn, kollektion: k.kollektion, neon, wix });
      }
      const neonTabeller = await tabellerINeon();
      const kanda = new Set(["mappings", "tasks", "webhook_events", "audit", "aliexpress_tokens", "sync_log", "sync_state", "sync_alerts", "product_hashes", "import_costs", "llm_kv", "reviews", "auctions", "fargbilder", "sync_markor", "bildstadning_karens", "faktura_utskick"]);
      return NextResponse.json({
        ok: true,
        lage,
        lager,
        tabeller: tabellerUt,
        neonTabeller,
        // Tabeller i Neon som motorn inte äger: butikens, om databasen är delad.
        andraTabeller: neonTabeller.filter((t) => !kanda.has(t.tabell)),
      });
    }

    const summering = await synka(kallor, wixSida(), {
      lage,
      dryRun,
      vaxling,
      kopieradSedan,
      // ☠️ Markören är ett rad-id, och ett id kan bära fritext eller ett
      // artikelnummer. Den går till en publik logg och förseglas därför med
      // CRON_SECRET, som Aosom-svepets markör (lib/aosom/markor.ts).
      efter: tolkaMarkor(oppnaMarkor(p.get("after"), process.env.CRON_SECRET ?? "") ?? null),
      baraTabeller: tabeller.length ? tabeller : undefined,
      tidsbudgetMs: Number.isFinite(limitMs) && limitMs > 0 ? limitMs : undefined,
    });

    // Nycklarna ligger utanför sidkopieringen (egen form) men är en del av
    // samma jobb, och tas i sista varvet så de aldrig glöms.
    const nyckelVarv = summering.stoppadAv === "klart" && (!tabeller.length || tabeller.includes("aliexpress_tokens"));
    const tokens = nyckelVarv ? await nycklarna(lage, summering.dryRun, vaxling) : null;

    // Svaret går till en publik logg: id som kan bära fritext hashas, och
    // felen kortas till status och kod.
    for (const t of summering.tabeller) {
      t.exempel = {
        saknas: t.exempel.saknas.map((id) => visatId(t.tabell, id)),
        olika: t.exempel.olika.map((id) => visatId(t.tabell, id)),
        extra: t.exempel.extra.map((id) => visatId(t.tabell, id)),
      };
      t.fel = t.fel.map((f) => {
        const m = /^(spara|bulk-remove)\s+(\S+):\s*(.*)$/.exec(f);
        return m ? `${m[1]} ${visatId(t.tabell, m[2])}: ${visatFel(m[3])}` : visatFel(f);
      });
    }
    const markor = summering.markor
      ? forseglaMarkor(`${summering.markor.tabell}:${summering.markor.fas}:${summering.markor.efter ?? ""}`, process.env.CRON_SECRET ?? "")
      : null;
    const markorTabell = summering.markor?.tabell ?? null;
    summering.markor = null;

    for (const t of summering.tabeller) {
      const delar = [
        `granskade ${t.granskade}`,
        `lika ${t.lika}`,
        `saknas ${t.saknas}`,
        `olika ${t.olika}`,
        t.wixNyare ? `wixNyare ${t.wixNyare}` : "",
        t.extra ? `extra ${t.extra}` : "",
        t.nyaIWix ? `nyaIWix ${t.nyaIWix}` : "",
        t.borttagenIWix ? `borttagenIWix ${t.borttagenIWix}` : "",
        `skrivna ${t.skrivna}`,
        t.borttagna ? `borttagna ${t.borttagna}` : "",
        t.fel.length ? `fel ${t.fel.length}` : "",
      ].filter(Boolean);
      console.log(`[neon-till-wix] ${lage}${summering.dryRun ? " (torr)" : ""} ${t.tabell}: ${delar.join(", ")}`);
    }

    return NextResponse.json({
      ok: true,
      lage,
      lager,
      summering,
      markor,
      markorTabell,
      tokens,
      godkand: lage === "verifiera" ? godkand(summering) && (!tokens || tokens.lika) : undefined,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Hela felet till Vercels logg (inte publik), bara status och kod i svaret.
    console.error(`[neon-till-wix] ${msg}`);
    return NextResponse.json({ ok: false, error: msg.startsWith("Wix Data") ? visatFel(msg) : msg.slice(0, 300) }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
