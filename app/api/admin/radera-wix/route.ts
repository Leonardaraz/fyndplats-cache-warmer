// GET/POST /api/admin/radera-wix
//
// Steg 6 i POSTGRES-MIGRATION.md: radera drift-datan ur Wix Data. Det är först
// den här körningen som frigör 4 000-taket — kopieringen och växlingen gjorde
// datan säker, men Wix-raderna ligger kvar och binder kvoten.
//
// ☠️ ENDA OÅTERKALLELIGA STEGET I MIGRATIONEN. Wix egen dokumentation är
// entydig: "Once an item has been removed from a collection, it can't be
// restored." Spärrarna bor i lib/migration/radera-wix.ts och är testade där.
//
//   ?dryRun=false            radera på riktigt (default: läs och verifiera bara)
//   ?kollektioner=a,b        bara dessa (namn, kommaseparerat)
//   ?limitMs=200000          egen tidsbudget
//
// Rutten är IDEMPOTENT och kan köras om hur många gånger som helst: en tom
// kollektion är en no-op. Den behöver ingen markör, se kommentaren vid
// läsFrån nedan.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { storeBackend } from "@/lib/store/backend";
import { sql } from "@/lib/db/client";
import { ATT_KOPIERA, LLM_SAMLINGAR } from "@/lib/db/tabeller";
import { beslutaSida, fårRaderas, retentionFör, tidsfältFör } from "@/lib/migration/radera-wix";

export const runtime = "nodejs";
export const maxDuration = 300;

const WIX_BASE = "https://www.wixapis.com";

/** Wix takar paging.limit på 100 oavsett vad dokumentationen påstår — uppmätt
 *  2026-08-28 på både Search Files och Query File Descriptors. Samma tal här,
 *  och samma tal för raderingsbatchen. */
const SID = 100;

/** Marginal mot maxDuration, så ett svar hinner tillbaka. Utan den kan lambdan
 *  dödas mitt i en skopa: raderna ÄR borta men ingen rapport kommer tillbaka. */
const TIDSBUDGET_MS = 240_000;

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

async function medBackoff<T>(gör: () => Promise<Response>, tolka: (r: Response) => Promise<T>): Promise<T> {
  const pauser = [1_000, 3_000, 8_000];
  for (let försök = 0; ; försök++) {
    const res = await gör();
    if (res.ok) return tolka(res);
    if (res.status === 404) return tolka(res);
    const kanFörsökaIgen = res.status === 429 || res.status >= 500;
    if (!kanFörsökaIgen || försök >= pauser.length) {
      throw new Error(`Wix svarade ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }
    const retryAfter = Number(res.headers.get("retry-after"));
    await new Promise((r) =>
      setTimeout(r, Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : pauser[försök]),
    );
  }
}

/**
 * ☠️ VI LÄSER ALLTID FRÅN OFFSET 0 I SKARPT LÄGE. Radering KRYMPER
 * kollektionen, så en offset-markör hoppar över exakt så många rader som nyss
 * raderades — precis den fällan media-cleanup gick i (CLAUDE.md: "markören är
 * en OFFSET"). Nästa sida flyttar sig till offset 0 av sig själv.
 *
 * I TORRLÄGE gäller det omvända: ingenting raderas, så offset 0 hade gett samma
 * sida i all evighet. Där stegar vi i stället framåt.
 */
async function läsFrån(kollektion: string, offset: number): Promise<Record<string, unknown>[]> {
  return medBackoff(
    () =>
      fetch(`${WIX_BASE}/data/v2/items/query`, {
        method: "POST",
        headers: wixHeaders(),
        body: JSON.stringify({
          dataCollectionId: kollektion,
          query: { filter: {}, paging: { limit: SID, offset } },
        }),
      }),
    async (res) => {
      if (res.status === 404) return []; // kollektionen finns inte — inget att radera
      const body = (await res.json()) as { dataItems?: { data?: Record<string, unknown> }[] };
      return (body.dataItems ?? [])
        .map((d) => d.data)
        .filter((d): d is Record<string, unknown> => Boolean(d));
    },
  );
}

/** Radering på EXPLICIT id-lista. Aldrig på filter, aldrig truncate — ett
 *  filter som matchar bredare än avsett är det fel som inte går att ta
 *  tillbaka. */
async function raderaIds(kollektion: string, ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  return medBackoff(
    () =>
      fetch(`${WIX_BASE}/wix-data/v2/bulk/items/remove`, {
        method: "POST",
        headers: wixHeaders(),
        body: JSON.stringify({ dataCollectionId: kollektion, dataItemIds: ids }),
      }),
    async (res) => {
      const body = (await res.json()) as {
        bulkActionMetadata?: { totalSuccesses?: number; totalFailures?: number };
      };
      const ok = body.bulkActionMetadata?.totalSuccesses ?? 0;
      const fel = body.bulkActionMetadata?.totalFailures ?? 0;
      // ☠️ Läs räknaren, inte statuskoden. Sjunde gången huset lär sig det:
      // prissynken rapporterade "2 priser uppdaterade" utan att skriva något.
      if (fel > 0) throw new Error(`${fel} av ${ids.length} rader gick inte att radera`);
      return ok;
    },
  );
}

type Post = { namn: string; kollektion: string; spec: (typeof ATT_KOPIERA)[number] | null };

/** Vilka id:n ur den här sidan som FAKTISKT finns i Postgres. Uppslagna, inte
 *  antagna — det är den här funktionen som gör raderingen försvarbar. */
async function finnsIKopian(post: Post, rader: Record<string, unknown>[]): Promise<Set<string>> {
  const q = sql();
  const nycklar = rader
    .map((rad) => nyckelFör(post, rad))
    .filter((n): n is string => typeof n === "string" && n.length > 0);
  if (nycklar.length === 0) return new Set();

  const rows = post.spec
    ? await q.query(
        `select ${post.spec.kolumner[post.spec.idFält]} as k from ${post.spec.tabell} where ${post.spec.kolumner[post.spec.idFält]} = any($1)`,
        [nycklar],
      )
    : await q.query(`select key as k from llm_kv where collection = $1 and key = any($2)`, [
        post.kollektion,
        nycklar,
      ]);

  return new Set((rows as { k: string }[]).map((r) => r.k));
}

/** Nyckeln raden lagras under i Postgres. Samma härledning som kopieringen och
 *  verifieringen använder — en tvilling här hade kunnat radera fel rader. */
function nyckelFör(post: Post, rad: Record<string, unknown>): string | undefined {
  const wixId = rad._id;
  if (!post.spec) return typeof wixId === "string" ? wixId : undefined;
  if (post.spec.idFält === "_id") return typeof wixId === "string" ? wixId : undefined;
  const v = rad[post.spec.idFält];
  return typeof v === "string" ? v : typeof wixId === "string" ? wixId : undefined;
}

async function handle(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });
  }

  const p = req.nextUrl.searchParams;
  const dryRun = p.get("dryRun") !== "false";
  const budget = Math.min(Number(p.get("limitMs")) || TIDSBUDGET_MS, TIDSBUDGET_MS);
  const start = Date.now();

  // ☠️ SPEGELBILDEN AV KOPIERINGENS 409. Kopieringen vägrar köra EFTER
  // växlingen; raderingen vägrar köra FÖRE den. Raderas källan medan
  // produktionen fortfarande läser den är det inte en migrering, det är en
  // utplåning av levande data.
  const backend = storeBackend();
  if (backend !== "postgres") {
    return NextResponse.json(
      {
        ok: false,
        error:
          `STORE_BACKEND=${backend} — produktionen läser fortfarande Wix. `
          + "Raderingen förutsätter att växlingen är gjord och har stått en dygnscykel. "
          + "Växla till postgres först.",
      },
      { status: 409 },
    );
  }

  const valda = p.get("kollektioner")?.split(",").map((s) => s.trim()).filter(Boolean);

  const poster: Post[] = [
    ...ATT_KOPIERA.map((s) => ({ namn: s.tabell, kollektion: s.kollektion, spec: s })),
    ...LLM_SAMLINGAR.map((k) => ({ namn: `llm_kv:${k}`, kollektion: k, spec: null })),
  ];

  const ut: {
    tabell: string;
    kollektion: string;
    granskade: number;
    raderade: number;
    /** Rader som saknas i kopian MEN är äldre än retention-fönstret — utgångna
     *  med flit, inte förlorade. Ska inte vara noll för audit och sync_log. */
    utgångna: number;
    klar: boolean;
    fel: string[];
  }[] = [];
  let stoppadAv: "klart" | "tid" = "klart";

  for (const post of poster) {
    if (valda && !valda.includes(post.kollektion) && !valda.includes(post.namn)) continue;

    // Andra låset. Spärrlistan är egen och vinner över kopielistan.
    if (!fårRaderas(post.kollektion)) {
      ut.push({
        tabell: post.namn,
        kollektion: post.kollektion,
        granskade: 0,
        raderade: 0,
        utgångna: 0,
        klar: false,
        fel: ["fredad kollektion — spärrad i ALDRIG_RADERA"],
      });
      continue;
    }

    const rad = { tabell: post.namn, kollektion: post.kollektion, granskade: 0, raderade: 0, utgångna: 0, klar: false, fel: [] as string[] };
    let offset = 0;

    for (;;) {
      if (Date.now() - start > budget) {
        stoppadAv = "tid";
        break;
      }

      const sida = await läsFrån(post.kollektion, offset);
      if (sida.length === 0) {
        rad.klar = true;
        break;
      }
      rad.granskade += sida.length;

      const wixIds = sida
        .map((r) => r._id)
        .filter((id): id is string => typeof id === "string" && id.length > 0);

      // ☠️ EN RAD UTAN _id GÅR INTE ATT RADERA PÅ ID. I skarpt läge läser vi
      // alltid om från offset 0, så en sådan rad hade kommit tillbaka först i
      // varje varv och snurrat tills tidsbudgeten tog slut — utan att någonsin
      // säga varför. Bättre att stanna och namnge problemet.
      if (wixIds.length !== sida.length) {
        rad.fel.push(
          `${sida.length - wixIds.length} av ${sida.length} rader saknar _id och kan inte `
          + "raderas på id — INGET raderat i den här kollektionen.",
        );
        break;
      }

      const iKopian = await finnsIKopian(post, sida);
      // Beslutet fattas på NYCKLARNA (som kopian känner), men raderingen sker
      // på Wix _id. Paret måste hållas ihop, annars raderas fel rad.
      const tidsfält = tidsfältFör(post.kollektion);
      const rader = sida.map((r) => ({
        nyckel: nyckelFör(post, r) ?? "",
        tid: tidsfält ? r[tidsfält] : undefined,
      }));
      const beslut = beslutaSida(rader, iKopian, retentionFör(post.kollektion), Date.now());

      if (beslut.sort === "avbryt") {
        rad.fel.push(
          `${beslut.saknade.length} av ${beslut.av} rader saknas i kopian och ligger INNANFÖR `
          + `retention-fönstret — INGET raderat. Exempel: ${beslut.saknade.slice(0, 5).join(", ")}`,
        );
        break; // vidare till nästa kollektion; den här behöver en människa
      }
      rad.utgångna += beslut.utgångna;

      if (dryRun) {
        offset += sida.length; // inget krymper i torrläge
        if (sida.length < SID) {
          rad.klar = true;
          break;
        }
        continue;
      }

      const antal = await raderaIds(post.kollektion, wixIds);
      rad.raderade += antal;
      // offset stannar på 0 med flit — se läsFrån. Men om ett varv inte tog
      // bort något är kollektionen inte tom OCH går inte framåt: stanna hellre
      // än att snurra tyst tills tidsbudgeten är slut.
      if (antal === 0) {
        rad.fel.push("ett varv raderade 0 rader trots att sidan inte var tom — avbryter");
        break;
      }
    }

    ut.push(rad);
    if (stoppadAv === "tid") break;
  }

  const totaltGranskade = ut.reduce((s, r) => s + r.granskade, 0);
  const totaltRaderade = ut.reduce((s, r) => s + r.raderade, 0);
  const totaltUtgångna = ut.reduce((s, r) => s + r.utgångna, 0);

  console.log(
    `[radera-wix] ${dryRun ? "TORR" : "SKARP"}: granskade ${totaltGranskade}, `
      + `raderade ${totaltRaderade}, utgångna ${totaltUtgångna}, stoppad av ${stoppadAv}`,
  );

  return NextResponse.json({
    ok: true,
    dryRun,
    summary: { totaltGranskade, totaltRaderade, totaltUtgångna, stoppadAv, tabeller: ut },
  });
}

export const GET = handle;
export const POST = handle;
