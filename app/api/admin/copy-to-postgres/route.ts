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
import { ensureSchema } from "@/lib/db/schema";
import { sql } from "@/lib/db/client";
import { runCopy, SidFel } from "@/lib/migration/copy-to-postgres";
import { ATT_KOPIERA, LLM_SAMLINGAR, type TabellSpec } from "@/lib/db/tabeller";

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
    stämmer: boolean;
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
        if (JSON.stringify(k) !== JSON.stringify(v)) {
          avvikande.push(`${id}.${fält}`);
          break;
        }
      }
    }

    ut.push({
      tabell: post.namn,
      wix,
      postgres,
      stämmer: wix === postgres,
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
