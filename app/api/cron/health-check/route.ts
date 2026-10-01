// GET /api/cron/health-check
//
// Proaktiv hälsokoll av Wix Stores-API:t — beroendet HELA sajten vilar på.
// Körs var 5:e minut via Vercel Cron (vercel.json). Bakgrund: 2026-06-10 låg
// Wix API:t nere (503) i ~40 min; fyndplats.se föll tyst tillbaka på sin
// lokala fallback-katalog och Leonard upptäckte det själv på sajten ("kod
// röd"). Den här cronen gör nästa avbrott HÖGLJUTT i stället:
//
//   - 2 raka misslyckade pingar (≈10 min, filtrerar enstaka blippar) →
//     larmmejl till Leonard + audit-post.
//   - Max 1 larmmejl/timme medan avbrottet pågår (ingen mejlstorm).
//   - När API:t svarar friskt igen efter ett öppet larm → "friskt igen"-mejl
//     + audit, så incidentens slut syns utan att någon behöver kolla.
//
// State (raka fel, öppet larm, senaste mejl) sparas best-effort i Wix Data —
// men under själva incidenten är Wix Data sannolikt OCKSÅ nere, så en
// in-memory-spegel per instans är primär källa mellan körningar (cron träffar
// oftast samma varma instans inom 5 min). Blir instansen kall mitt i ett
// avbrott räknas felen om från noll → larmet dröjer max en extra körning.
// Mejl utan RESEND_API_KEY → skipped (audit-posten skrivs ändå).

import { NextResponse, type NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { sendEmail } from "@/lib/email/resend";
import { llmGet, llmSave, LLM_COLLECTIONS } from "@/lib/llm/storage";
import { sql } from "@/lib/db/client";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALERT_TO = process.env.HEALTH_ALERT_EMAIL ?? "info@fyndplats.com";
const STATE_COL = LLM_COLLECTIONS.spend; // befintlig kv-kollektion (audit N3)
const STATE_ID = "health-check-state";

/** Audit S1: all Wix Data-/audit-I/O i den här routen MÅSTE vara tids-bunden.
 *  Pingen är 10 s-cappad, men ett HÄNGANDE wixapis (uppkoppling accepterad,
 *  inget svar) skulle annars äta hela maxDuration innan larmmejlet hinner gå —
 *  ironiskt nog precis under de incidenter routen finns för. 5 s räcker gott
 *  för en kv-läsning/skrivning; vid timeout faller vi på fallback-värdet. */
function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    p.catch(() => fallback),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}
const FAILS_BEFORE_ALERT = 2;
const ALERT_THROTTLE_MS = 60 * 60 * 1000;

interface HealthState {
  consecutiveFails: number;
  alertOpen: boolean;
  lastAlertAt: number; // epoch ms, 0 = aldrig
  lastError: string;
}

const EMPTY_STATE: HealthState = { consecutiveFails: 0, alertOpen: false, lastAlertAt: 0, lastError: "" };

// In-memory-spegel — primär mellan körningar på samma varma instans (Wix Data
// är otillgängligt under just de incidenter vi finns till för att upptäcka).
let memState: HealthState | null = null;

function isAuthorizedCron(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true;
  const extToken = process.env.EXTENSION_API_TOKEN;
  if (extToken && req.headers.get("x-fyndplats-token") === extToken) return true;
  return false;
}

/**
 * Svarar Postgres?
 *
 * ☠️ VARFÖR RUTTEN MÅSTE KOLLA DET HÄR. Fram till 2026-09-18 pingade
 * health-check bara Wix Stores-API:t. Dess EGNA databasskrivningar var
 * `withTimeout(..., fallback)` — best-effort, sväljda. En död Neon-databas
 * hade alltså inte gett ett enda larm: rutten hade fortsatt rapportera
 * "friskt" medan `order-backfill` föll med 500 varje timme och ordrar slutade
 * säkerhetskopieras. Kommentaren i den rutten säger själv vad det betyder:
 * "Misslyckas den skrivningen är ordern borta för oss medan kunden har
 * betalat."
 *
 * Det blev akut när recensionsbilden (PR #634) lät computen sova igen. Så
 * länge databasen aldrig somnade kunde den heller aldrig nekas ett
 * uppvaknande; med bilden inne sker det uppvaknandet varje timme, och om
 * månadspotten är slut kan det nekas.
 *
 * Frågan är avsiktligt den billigaste som finns. Den kostar inget extra
 * uppvaknande heller — rutten skriver redan till kv:n i samma körning.
 */
async function pingDatabas(): Promise<{ ok: boolean; detail: string }> {
  try {
    await sql()`select 1`;
    return { ok: true, detail: "ok" };
  } catch (err) {
    return { ok: false, detail: String((err as Error)?.message ?? err).slice(0, 300) };
  }
}

/**
 * Har vi redan larmat om databasen under den här instansens livstid?
 *
 * ☠️ STRYPNINGEN ÄR MEDVETET SVAG, OCH SKÄLET ÄR OBEKVÄMT. Wix-larmet räknar
 * fel i följd och stryper på en timme — men den räknaren bor i `llm_kv`, alltså
 * i DATABASEN. Är databasen nere går den inte att läsa, varje körning börjar om
 * från noll, och en tröskel på två fel i följd hade därför ALDRIG nåtts. Larmet
 * som finns till för databasen hade tystnat av just det den skulle larma om.
 *
 * Därför larmar vi på FÖRSTA felet, och stryper bara med det som faktiskt
 * överlever: den här modulvariabeln, på en varm instans. Ett långvarigt avbrott
 * kan alltså ge ungefär ett mejl i timmen. Det är med flit — en motor som inte
 * kan spara ordrar är inte ett tillstånd att vara tyst om.
 */
let dbLarmatAt = 0;

/** Lätt autentiserad ping mot exakt den API-klass som dog 2026-06-10. */
async function pingWixStores(): Promise<{ ok: boolean; detail: string }> {
  const token = process.env.WIX_API_TOKEN;
  const siteId = process.env.WIX_SITE_ID;
  if (!token || !siteId) return { ok: false, detail: "WIX_API_TOKEN/WIX_SITE_ID saknas i env" };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch("https://www.wixapis.com/stores/v3/products/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: token, "wix-site-id": siteId },
      body: JSON.stringify({ search: { cursorPaging: { limit: 1 } } }),
      signal: ctrl.signal,
    });
    if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` };
    return { ok: true, detail: "ok" };
  } catch (err) {
    return { ok: false, detail: ctrl.signal.aborted ? "timeout (10 s)" : String((err as Error).message ?? err) };
  } finally {
    clearTimeout(timer);
  }
}

async function loadState(): Promise<HealthState> {
  if (memState) return memState;
  const stored = await withTimeout(llmGet<HealthState>(STATE_COL, STATE_ID), 5000, null);
  return stored ?? { ...EMPTY_STATE };
}

async function saveState(s: HealthState): Promise<void> {
  memState = s;
  // Best-effort + tids-bunden: under ett Wix-avbrott hänger/misslyckas
  // skrivningen — in-memory bär då (audit S1).
  await withTimeout(
    llmSave(STATE_COL, STATE_ID, s as unknown as Record<string, unknown>),
    5000,
    undefined,
  );
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  const ping = await pingWixStores();
  const db = await pingDatabas();
  const state = await loadState();
  const now = Date.now();

  // Databasen först: den är oberoende av Wix-läget, och ett tyst databasstopp
  // är det dyraste av de två.
  if (!db.ok) {
    console.error(`[health-check] POSTGRES SVARAR INTE: ${db.detail}`);
    if (now - dbLarmatAt > ALERT_THROTTLE_MS) {
      dbLarmatAt = now;
      try {
        await sendEmail({
          to: ALERT_TO,
          subject: "🚨 Motorns databas svarar inte — ordrar säkerhetskopieras inte",
          bodyHtml:
            `<p><strong>Neon-databasen (fyndplats-cache-db) svarar inte.</strong></p>`
            + `<p>Fel: <code>${db.detail}</code></p>`
            + `<p>Följd: <code>order-backfill</code> kan inte spara ordrar, recensionsbilden kan inte byggas om, `
            + `och importerna står. Butiken fortsätter sälja — produktdatan kommer från Wix.</p>`
            + `<p>Vanligaste orsaken: månadspotten slut, eller computen avstängd. Kolla Neon-konsolen.</p>`,
          bodyText:
            `Neon-databasen (fyndplats-cache-db) svarar inte.\nFel: ${db.detail}\n\n`
            + `order-backfill kan inte spara ordrar, recensionsbilden kan inte byggas om, importerna står. `
            + `Butiken fortsätter sälja. Kolla Neon-konsolen — vanligaste orsaken är slut månadspott.`,
        });
      } catch (err) {
        console.warn("[health-check] databaslarmet gick inte att mejla:", (err as Error).message);
      }
    }
  }

  if (ping.ok) {
    const wasOpen = state.alertOpen;
    if (wasOpen || state.consecutiveFails > 0) {
      await saveState({ ...EMPTY_STATE });
    }
    if (wasOpen) {
      await withTimeout(
        audit("health-check", "wix-stores", "FRISKT IGEN — Wix Stores-API svarar normalt"),
        5000,
        undefined,
      );
      try {
        await sendEmail({
          to: ALERT_TO,
          subject: "✅ Wix API friskt igen — fyndplats.se åter på live-katalogen",
          bodyHtml:
            `<p>Wix Stores-API:t svarar normalt igen.</p>` +
            `<p>Sajtens sidor återgår automatiskt till live-katalogen inom ~5 minuter per sida. Ingen åtgärd behövs.</p>`,
          bodyText:
            "Wix Stores-API:t svarar normalt igen. Sajten återgår automatiskt till live-katalogen inom ~5 min per sida. Ingen åtgärd behövs.",
        });
      } catch (err) {
        console.warn("[health-check] avlarm-mejl misslyckades:", (err as Error).message);
      }
    }
    return NextResponse.json({ ok: true, recovered: wasOpen });
  }

  // Misslyckad ping.
  const fails = state.consecutiveFails + 1;
  let alertOpen = state.alertOpen;
  let lastAlertAt = state.lastAlertAt;
  const shouldAlert =
    fails >= FAILS_BEFORE_ALERT && now - state.lastAlertAt >= ALERT_THROTTLE_MS;

  console.warn(`[health-check] Wix Stores-ping misslyckades (${fails} i rad): ${ping.detail}`);

  if (shouldAlert) {
    alertOpen = true;
    lastAlertAt = now;
    // MEJLET FÖRST (audit S1): larmet är hela poängen — audit-posten skrivs
    // efteråt, tids-bunden, så den aldrig kan stå i vägen för mejlet.
    try {
      await sendEmail({
        to: ALERT_TO,
        subject: "🔴 Wix API nere — fyndplats.se kör fallback-katalog",
        bodyHtml:
          `<p><strong>Wix Stores-API:t svarar inte</strong> (${fails} raka kontroller, senaste felet: <code>${ping.detail}</code>).</p>` +
          `<p>Sajten visar nu sin inbyggda fallback-katalog — kunder kan se färre/äldre produkter tills Wix är uppe igen. ` +
          `Inget är raderat och inget behöver göras: sidorna återhämtar sig själva inom ~5 min efter att Wix svarar igen.</p>` +
          `<p>Status: <a href="https://status.wix.com">status.wix.com</a>. Du får ett "friskt igen"-mejl när det är över.</p>`,
        bodyText:
          `Wix Stores-API:t svarar inte (${fails} raka kontroller, senaste fel: ${ping.detail}). ` +
          "Sajten visar fallback-katalogen tills Wix är uppe igen — inget är raderat, sidorna självläker inom ~5 min efter återhämtning. " +
          "Status: https://status.wix.com. Du får ett friskt-igen-mejl när det är över.",
      });
    } catch (err) {
      console.warn("[health-check] larm-mejl misslyckades:", (err as Error).message);
    }
    await withTimeout(
      audit("health-check", "wix-stores", `LARM — Wix Stores-API nere (${fails} raka fel: ${ping.detail})`),
      5000,
      undefined,
    );
  }

  await saveState({ consecutiveFails: fails, alertOpen, lastAlertAt, lastError: ping.detail });
  return NextResponse.json({ ok: false, fails, alerted: shouldAlert, detail: ping.detail });
}
