// GET/POST /api/admin/copy-to-postgres
//
// Steg 3 i POSTGRES-MIGRATION.md: kopierar drift-datan ur Wix Data till Neon.
//
// Körs HÄR och inte från en terminal av samma skäl som prisreparationen och
// aosom-svepet: produktionen har Wix-nycklarna OCH `DATABASE_URL`, GitHub
// Actions har `CRON_SECRET`, och de möts i workflowen. Ingen hemlighet passerar
// en chatt eller en laptop — och hela jobbet går att starta från en telefon.
//
// TORRKÖRNING ÄR DEFAULT. Utan `?dryRun=false` läses och räknas allt, men
// ingenting skrivs. Tvärtemot order-backfillen, som är skarp som default: den
// ÅTERSTÄLLER något kunden betalat för, den här flyttar data som redan finns.
//
// Query:
//   ?dryRun=false            skriv på riktigt
//   ?after=mappings:1200     fortsätt från markören i föregående svar
//   ?tabeller=mappings,audit bara dessa
//   ?limitMs=200000          egen tidsbudget
//   ?verify=1                jämför källa och kopia i stället för att kopiera

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { storeBackend } from "@/lib/store/backend";
import { ensureSchema } from "@/lib/db/schema";
import { sql } from "@/lib/db/client";
import { runCopy, SidFel } from "@/lib/migration/copy-to-postgres";
import { ATT_KOPIERA, LLM_SAMLINGAR, type TabellSpec } from "@/lib/db/tabeller";
import { kanonisk } from "@/lib/migration/kanonisk";
import { PostgresStore } from "@/lib/store/postgres";

const TOKENS_KOLLEKTION = process.env.WIX_DATA_COL_TOKENS ?? "FyndplatsAliExpressTokens";

export const runtime = "nodejs";
export const maxDuration = 300;

const WIX_BASE = "https://www.wixapis.com";

function isCronAuthorized(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

function wixHeaders(): Record<string, string> {
  const token = process.env.WIX_API_TOKEN;
  if (!token) throw new Error("WIX_API_TOKEN saknas — kan inte läsa källan.");
  const h: Record<string, string> = { "Content-Type": "application/json", Authorization: token };
  const siteId = process.env.WIX_SITE_ID;
  if (siteId) h["wix-site-id"] = siteId;
  return h;
}

/**
 * En sida ur Wix, med backoff.
 *
 * ☠️ BACKOFFEN ÄR INTE PYNT. Hela svepet är ~154 sidor i rad och Wix har strypt
 * oss vid ~40–50 tidigare (mediabiblioteket, 2026-08-28). Utan återförsök hade
 * en strypning mitt i sett ut som "kollektionen tog slut" — en tyst
 * halvmigrering, vilket är exakt det farligaste utfallet här.
 */
async function läsSida(
  kollektion: string,
  offset: number,
  limit: number,
): Promise<Record<string, unknown>[]> {
  const pauser = [1_000, 3_000, 8_000];
  for (let försök = 0; ; försök++) {
    const res = await fetch(`${WIX_BASE}/data/v2/items/query`, {
      method: "POST",
      headers: wixHeaders(),
      body: JSON.stringify({
        dataCollectionId: kollektion,
        query: { filter: {}, paging: { limit, offset } },
      }),
    });
    if (res.ok) {
      const body = (await res.json()) as { dataItems?: { data?: Record<string, unknown> }[] };
      return (body.dataItems ?? [])
        .map((d) => d.data)
        .filter((d): d is Record<string, unknown> => Boolean(d));
    }
    // Saknad kollektion är inget fel — några av dem har aldrig skapats.
    if (res.status === 404) return [];
    const text = await res.text();
    if (res.status === 400 && /not found|does not exist|unknown collection/i.test(text)) return [];

    const kanFörsökaIgen = res.status === 429 || res.status >= 500;
    if (!kanFörsökaIgen || försök >= pauser.length) {
      throw new Error(`Wix query ${kollektion}@${offset} (${res.status}): ${text.slice(0, 200)}`);
    }
    const retryAfter = Number(res.headers.get("retry-after"));
    const paus = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : pauser[försök];
    await new Promise((r) => setTimeout(r, paus));
  }
}

/**
 * ☠️ WIX RETURNERAR DATUM SOM `{"$date": "..."}`, INTE SOM STRÄNGAR.
 *
 * Uppmätt i första skarpa kopieringen 2026-08-31: en importkostnadsrad föll med
 * `invalid input syntax for type timestamp with time zone:
 * "{"$date":"2026-05-31T00:43:00Z"}"`. De flesta fält är rena ISO-strängar, så
 * felet dyker bara upp på de rader där Wix råkat lagra ett riktigt Date —
 * alltså precis den sortens fel som inte syns förrän man kör skarpt mot hela
 * beståndet.
 *
 * Bara PROJEKTIONERNA normaliseras. `data` lämnas ordagrant som källan skrev
 * den, annars hade kopian inte gått att jämföra mot originalet.
 */
function kolumnvärde(v: unknown): unknown {
  if (v === undefined || v === "") return null;
  if (v && typeof v === "object" && "$date" in (v as Record<string, unknown>)) {
    const d = (v as { $date?: unknown }).$date;
    return typeof d === "string" ? d : null;
  }
  return v;
}

/** Upsertar en sida. `data` bär hela posten; kolumnerna är projektioner. */
async function skrivSida(spec: TabellSpec, rader: Record<string, unknown>[]): Promise<number> {
  const q = sql();
  const idKol = spec.kolumner[spec.idFält];
  if (!idKol) throw new Error(`Specen för ${spec.tabell} saknar kolumn för id-fältet.`);

  const namn = [...Object.values(spec.kolumner), "data"];
  const uppdatera = namn.filter((n) => n !== idKol).map((n) => `${n} = excluded.${n}`);

  const fält = Object.keys(spec.kolumner);
  let skrivna = 0;
  const radfel: string[] = [];

  for (const rad of rader) {
    // Wix interna fält följer med i `data` — de läses av ingenting (verifierat
    // i auditen) och rensas vid läsning i PostgresStore. Att strippa dem här
    // hade gjort kopian icke-identisk med källan, vilket försvårar jämförelsen.
    const värden = fält.map((f) => kolumnvärde(rad[f]));
    if (värden[fält.indexOf(spec.idFält)] == null) continue; // rad utan id
    try {
      await q.query(
        `insert into ${spec.tabell} (${namn.join(", ")})
         values (${namn.map((_, i) => `$${i + 1}`).join(", ")})
         on conflict (${idKol}) do update set ${uppdatera.join(", ")}`,
        [...värden, JSON.stringify(rad)],
      );
      skrivna++;
    } catch (err) {
      // ☠️ PER RAD, INTE PER SIDA. Första skarpa körningen tappade 200
      // mappningar på TVÅ trasiga rader: felet kastades ur sidan och tog med
      // sig upp till 99 oskyldiga grannar per gång. Ett fel ska kosta sin egen
      // rad och ingen annans — och raden måste NAMNGES, annars går den inte
      // att köra om riktat.
      const id = String(rad[spec.idFält] ?? rad._id ?? "?");
      radfel.push(`${id}: ${err instanceof Error ? err.message.slice(0, 140) : String(err)}`);
    }
  }

  if (radfel.length > 0) {
    throw new SidFel(skrivna, radfel);
  }
  return skrivna;
}

/**
 * ☠️ TOKENRADEN KOPIERAS SÄRSKILT — OCH DEN ÄR DEN FARLIGASTE ATT MISSA.
 *
 * Den låg inte i ATT_KOPIERA alls i första omgången, och verifieringen kunde
 * inte se det: den granskar bara tabellerna i listan, så en kollektion som
 * saknas där är osynlig för BÅDA. Ett grönt kvitto på en ofullständig lista.
 *
 * Priset hade varit högt. `refreshAndPersist` ROTERAR refresh-token vid varje
 * förnyelse, så en tom tokenrad efter växlingen betyder inte bara "synken
 * stannar" — den betyder att den enda giltiga refresh-token ligger kvar i Wix
 * medan produktionen läser Postgres. Vägen tillbaka är ny OAuth för hand
 * (se CLAUDE.md om de 30 dygnen utan förnyelse).
 *
 * Skrivs genom PostgresStore, inte genom den generiska sidkopieringen: tabellen
 * har en helt egen form (en enda rad låst till id=1, snake_case-kolumner) och
 * `saveAliExpressTokens` äger redan den formen. En andra definition här hade
 * varit exakt den tvilling resten av modulen finns för att undvika.
 */
async function kopieraTokens(): Promise<{ kopierade: number; fel: string[] }> {
  const rader = await läsSida(TOKENS_KOLLEKTION, 0, 5);
  const rad = rader[0] as
    | { accessToken?: string; refreshToken?: string; expiresAt?: string }
    | undefined;
  if (!rad) return { kopierade: 0, fel: [] };

  if (!rad.accessToken || !rad.refreshToken || !rad.expiresAt) {
    return { kopierade: 0, fel: ["tokenraden är partiell — kopieras inte"] };
  }
  const expiresAt = new Date(rad.expiresAt);
  if (Number.isNaN(expiresAt.getTime())) {
    return { kopierade: 0, fel: [`ogiltig expiresAt="${rad.expiresAt}"`] };
  }

  await new PostgresStore().saveAliExpressTokens({
    accessToken: rad.accessToken,
    refreshToken: rad.refreshToken,
    expiresAt,
  });
  return { kopierade: 1, fel: [] };
}

async function skrivLlmSida(kollektion: string, rader: Record<string, unknown>[]): Promise<number> {
  const q = sql();
  let skrivna = 0;
  for (const rad of rader) {
    const key = rad._id;
    if (typeof key !== "string") continue;
    const at = typeof rad.at === "string" ? rad.at : null;
    await q`insert into llm_kv (collection, key, data, at)
            values (${kollektion}, ${key}, ${JSON.stringify(rad)}, ${at})
            on conflict (collection, key) do update set data = excluded.data, at = excluded.at`;
    skrivna++;
  }
  return skrivna;
}

/** Antal rader i en Wix-kollektion. */
async function wixAntal(kollektion: string): Promise<number> {
  const res = await fetch(`${WIX_BASE}/wix-data/v2/items/count`, {
    method: "POST",
    headers: wixHeaders(),
    body: JSON.stringify({ dataCollectionId: kollektion }),
  });
  if (res.status === 404) return 0;
  if (!res.ok) throw new Error(`Wix count ${kollektion} (${res.status})`);
  return ((await res.json()) as { totalCount?: number }).totalCount ?? 0;
}

/**
 * Jämför källa och kopia.
 *
 * ☠️ RADANTAL RÄCKER INTE SOM KVITTO. Det är sjunde gången i det här projektet
 * ett svar utan fel visar sig vara tomt — bildreparationen rapporterade "524 av
 * 524 lagade" medan 214 produkter fortfarande saknade bilder. Därför jämförs
 * också ett STICKPROV fält för fält: samma id ska ge samma JSON på båda sidor.
 */
async function verifiera(): Promise<{
  fullständig: boolean;
  tabeller: {
    tabell: string;
    wix: number;
    postgres: number;
    /** Sant när kopian har minst lika många rader som källan. */
    stämmer: boolean;
    /** Rader kopian har som källan inte längre har — källan städas medan vi kör. */
    överskott: number;
    stickprov: number;
    avvikande: string[];
  }[];
}> {
  const q = sql();
  const ut: Awaited<ReturnType<typeof verifiera>>["tabeller"] = [];

  const poster = [
    ...ATT_KOPIERA.map((s) => ({ namn: s.tabell, kollektion: s.kollektion, spec: s })),
    ...LLM_SAMLINGAR.map((k) => ({ namn: `llm_kv:${k}`, kollektion: k, spec: null })),
  ];

  for (const post of poster) {
    const wix = await wixAntal(post.kollektion);
    const rader = post.spec
      ? await q.query(`select count(*)::int as n from ${post.spec.tabell}`, [])
      : await q`select count(*)::int as n from llm_kv where collection = ${post.kollektion}`;
    const postgres = (rader[0] as { n: number }).n;

    // Stickprov: tio rader ur källan, jämförda fält för fält mot kopian.
    const avvikande: string[] = [];
    const prov = await läsSida(post.kollektion, 0, 10);
    for (const rad of prov) {
      const id = rad._id;
      if (typeof id !== "string") continue;
      const träff = post.spec
        ? await q.query(
            `select data from ${post.spec.tabell} where ${post.spec.kolumner[post.spec.idFält]} = $1`,
            [post.spec.idFält === "_id" ? id : (rad[post.spec.idFält] as string) ?? id],
          )
        : await q`select data from llm_kv where collection = ${post.kollektion} and key = ${id}`;
      const kopia = (träff[0] as { data?: unknown } | undefined)?.data;
      if (!kopia) {
        avvikande.push(`${id}: saknas i kopian`);
        continue;
      }
      for (const [fält, v] of Object.entries(rad)) {
        const k = (kopia as Record<string, unknown>)[fält];
        if (kanonisk(k) !== kanonisk(v)) {
          avvikande.push(`${id}.${fält}`);
          break;
        }
      }
    }

    // ☠️ ASYMMETRISKT MED FLIT. Färre rader i kopian är DATAFÖRLUST och ska
    // fälla. Fler rader är något helt annat: källan är levande, och synk-loggens
    // retention raderar gamla rader i Wix medan kopian behåller dem. Uppmätt
    // 2026-08-31: sync_log wix=3441, pg=3472 — 31 rader som Wix hunnit städa
    // bort sedan kopieringen. De försvinner av sig själva vid nästa
    // retention-körning efter växlingen.
    //
    // Att fälla på det hade betytt att verifieringen aldrig kan gå igenom mot
    // en tabell som städas, alltså aldrig alls.
    ut.push({
      tabell: post.namn,
      wix,
      postgres,
      stämmer: postgres >= wix,
      överskott: Math.max(0, postgres - wix),
      stickprov: prov.length,
      avvikande,
    });
  }

  return {
    fullständig: ut.every((t) => t.stämmer && t.avvikande.length === 0),
    tabeller: ut,
  };
}

async function handle(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  const p = req.nextUrl.searchParams;
  const dryRun = p.get("dryRun") !== "false";
  const tabeller = (p.get("tabeller") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const limitMs = Number(p.get("limitMs"));

  const rå = p.get("after");
  let after: { tabell: string; offset: number } | null = null;
  if (rå) {
    const [t, o] = rå.split(":");
    const n = Number(o);
    if (!t || !Number.isFinite(n)) {
      return NextResponse.json({ ok: false, error: `Ogiltig markör "${rå}" — vänta dig "tabell:offset".` }, { status: 400 });
    }
    after = { tabell: t, offset: n };
  }

  // ☠️ EFTER VÄXLINGEN ÄR WIX INAKTUELLT, OCH EN KOPIERING SKRIVER TILLBAKA DET.
  //
  // Kopieringen är en upsert från Wix till Postgres. Det är rätt så länge Wix är
  // sanningen. I samma sekund som STORE_BACKEND=postgres slår igenom vänder
  // riktningen: produktionen skriver till Postgres, Wix fryser — och en körning
  // härifrån hade då TYST RULLAT TILLBAKA levande data till gårdagens värden.
  //
  // Ingen rutt i huset är farligare åt det hållet, och felet hade inte synts:
  // svaret säger "15 310 skrivna" och ser identiskt lyckat ut. Därför vägrar
  // den, i stället för att lita på att den som kör kommer ihåg ordningen.
  //
  // Verifieringen är däremot ofarlig och tillåten — den läser bara, och att
  // kunna jämföra kopian mot källan EFTER växlingen är precis vad man vill
  // kunna göra under det dygn Wix-raderna ligger kvar som väg tillbaka.
  const backend = storeBackend();
  if (backend === "postgres" && p.get("verify") !== "1" && dryRun === false) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "STORE_BACKEND=postgres — växlingen är redan gjord, och Wix är därmed inaktuellt. "
          + "En kopiering härifrån hade skrivit tillbaka gammal data över levande. "
          + "Behöver du verkligen köra om: växla tillbaka till wix-data först.",
      },
      { status: 409 },
    );
  }

  try {
    // Idempotent. Körs även i torrläge så schemafel upptäcks INNAN någon
    // skarp körning startas — inte halvvägs in i den.
    await ensureSchema();

    if (p.get("verify") === "1") {
      const rapport = await verifiera();
      if (!rapport.fullständig) {
        console.error(
          `[copy-to-postgres] VERIFIERING FÄLLDE: `
            + rapport.tabeller
                .filter((t) => !t.stämmer || t.avvikande.length)
                .map((t) => `${t.tabell} wix=${t.wix} pg=${t.postgres} avvik=${t.avvikande.length}`)
                .join(" | "),
        );
      }
      return NextResponse.json({ ok: true, verifiering: rapport });
    }

    const summary = await runCopy(
      {
        dryRun,
        after,
        baraTabeller: tabeller.length ? tabeller : undefined,
        timeBudgetMs: Number.isFinite(limitMs) && limitMs > 0 ? limitMs : undefined,
      },
      { läsSida, skrivSida, skrivLlmSida },
    );

    // Tokenraden ligger utanför sidkopieringen (egen form) men är en del av
    // samma jobb — den ska aldrig kunna glömmas för att den är ett specialfall.
    if (!dryRun && !tabeller.length) {
      const t = await kopieraTokens();
      summary.tabeller.push({
        tabell: "aliexpress_tokens",
        läst: t.kopierade + (t.fel.length ? 1 : 0),
        skrivet: t.kopierade,
        fel: t.fel,
      });
      summary.totaltSkrivet += t.kopierade;
    }

    // Konsolen kräver ingen databas — samma skäl som i order-backfillen.
    const fel = summary.tabeller.flatMap((t) => t.fel.map((f) => `${t.tabell} ${f}`));
    if (fel.length > 0) console.error(`[copy-to-postgres] ${fel.length} fel: ${fel.join(" | ")}`);

    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[copy-to-postgres] ${msg}`);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
