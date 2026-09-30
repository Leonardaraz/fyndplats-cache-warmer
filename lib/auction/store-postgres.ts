// Fyndauktionens lager i Postgres. Samma kontrakt som Wix-vägen i ./store —
// vilket lager som används avgör `auctionsBackend()`, aldrig anroparen.
//
// ☠️ VARFÖR DEN FINNS. Kön är en rad per produkt i katalogen: 3 561 rader
// 2026-09-29, 89 % av Wix Datas globala tak på 4 000 rader. Taket stoppade
// både nya kö-rader och omdirigeringarna efter en sammanslagning, och kön
// växer med varje import. Samma flytt som recensionerna gjorde 2026-09-04.
//
// Tre skillnader mot Wix-vägen, alla medvetna:
//
// 1. INGET TAK PÅ LÄSNINGEN. Wix-frågan tar högst 1 000 rader, så med 3 308 i
//    kön såg ticken, seeden och pensioneringens auktionsspärr bara den första
//    tredjedelen. Här läses allt som matchar.
// 2. Bulkskrivningen är EN sats per tugga (jsonb_array_elements), inte en
//    fråga per rad: seeden sparar tusentals rader, och Neons HTTP-drivrutin
//    tar en rundresa per fråga.
// 3. Wix metafält (_owner, _createdDate, _updatedDate) följer med kopian och
//    rensas vid läsning. `_id` behålls: motorn sparar med den.

import { sql } from "@/lib/db/client";
import type { AuctionDoc } from "./engine";

/** Rader per bulksats. Neons HTTP-gräns ligger långt över; talet håller satsen kort. */
const TUGGA = 500;

function rensa(id: string, data: unknown): AuctionDoc {
  const d = { ...(data as Record<string, unknown>) };
  delete d._owner;
  delete d._createdDate;
  delete d._updatedDate;
  // Motorn och butiken gör Date.parse på datumen. I Wix är de strängar
  // (uppmätt 2026-09-29 på live- och avslutade rader), men kopian bär källans
  // form ordagrant, och Wix ger ibland `{"$date": …}` — då blir det en sträng här.
  for (const k of ["startAt", "endedAt"]) {
    const v = d[k];
    if (v && typeof v === "object") d[k] = tidEller(v) ?? undefined;
  }
  return { ...(d as unknown as AuctionDoc), _id: id };
}

/** Wix ger datum som ISO-sträng eller `{"$date": "..."}`. Skräp blir null, aldrig NaN. */
function tidEller(v: unknown): string | null {
  const s =
    typeof v === "string"
      ? v
      : v && typeof v === "object" && typeof (v as { $date?: unknown }).$date === "string"
        ? (v as { $date: string }).$date
        : null;
  return s && !Number.isNaN(Date.parse(s)) ? s : null;
}

function kolumner(d: AuctionDoc) {
  return {
    id: d._id,
    productId: d.productId,
    status: d.status,
    queueOrder: typeof d.queueOrder === "number" && Number.isFinite(d.queueOrder) ? d.queueOrder : null,
    endedAt: tidEller(d.endedAt),
    data: d,
  };
}

/**
 * Upsert av en tugga. Samma id två gånger i en sats fäller hela satsen i
 * Postgres ("cannot affect row a second time"), så den sista vinner redan här
 * — samma utfall som två saves i rad mot Wix.
 */
async function skriv(docs: AuctionDoc[]): Promise<void> {
  const unika = new Map<string, AuctionDoc>();
  for (const d of docs) {
    if (!d._id) throw new Error(`saveAuction: dokumentet ${d.slug ?? d.productId} saknar _id`);
    if (!d.productId || !d.status) throw new Error(`saveAuction(${d._id}): saknar productId eller status`);
    unika.set(d._id, d);
  }
  if (unika.size === 0) return;
  const q = sql();
  await q.query(
    `insert into auctions (id, product_id, status, queue_order, ended_at, data, updated_at)
     select r->>'id', r->>'productId', r->>'status',
            (r->>'queueOrder')::double precision, (r->>'endedAt')::timestamptz,
            r->'data', now()
       from jsonb_array_elements($1::jsonb) as r
     on conflict (id) do update set
       product_id  = excluded.product_id,
       status      = excluded.status,
       queue_order = excluded.queue_order,
       ended_at    = excluded.ended_at,
       data        = excluded.data,
       updated_at  = now()`,
    [JSON.stringify([...unika.values()].map(kolumner))],
  );
}

/**
 * Alla auktioner med status i `statuses`, i köordning. Inget tak.
 *
 * `köHuvud` begränsar BARA kön till de första N i köordning — övriga statusar
 * läses alltid hela. Ticken går var tionde minut och främjar högst fem åt
 * gången; att läsa hela kön (~3 300 rader, ~2,4 MB) 144 gånger per dygn för
 * att använda fem av dem hade varit ~10 GB i månaden ur databasen för ingenting.
 * Seeden, pensioneringens spärr och morgonmejlet behöver hela listan och
 * skickar ingen gräns.
 */
export async function pgQueryAuctions(statuses: string[], köHuvud?: number): Promise<AuctionDoc[]> {
  if (statuses.length === 0) return [];
  const q = sql();
  const begränsa = typeof köHuvud === "number" && köHuvud >= 0 && statuses.includes("queued");
  const rows = (
    begränsa
      ? await q.query(
          `(select id, data, queue_order from auctions where status = any($1))
           union all
           (select id, data, queue_order from auctions where status = 'queued'
             order by queue_order asc nulls last, id asc limit $2)
           order by queue_order asc nulls last, id asc`,
          [statuses.filter((st) => st !== "queued"), Math.floor(köHuvud)],
        )
      : await q.query(
          `select id, data from auctions
            where status = any($1)
            order by queue_order asc nulls last, id asc`,
          [statuses],
        )
  ) as Array<{ id: string; data: unknown }>;
  return rows.map((r) => rensa(r.id, r.data)).filter((d) => d.productId);
}

/** De senast avslutade med status `sold`, nyast först. */
export async function pgSenastSalda(limit: number): Promise<AuctionDoc[]> {
  const q = sql();
  const rows = (await q.query(
    `select id, data from auctions
      where status = 'sold'
      order by ended_at desc nulls last, id asc
      limit $1`,
    [limit],
  )) as Array<{ id: string; data: unknown }>;
  return rows.map((r) => rensa(r.id, r.data)).filter((d) => d.productId);
}

export async function pgSaveAuction(doc: AuctionDoc): Promise<void> {
  if (!doc._id) throw new Error("saveAuction: dokumentet saknar _id");
  await skriv([doc]);
}

/** Samma kontrakt som Wix-vägen: felbeskrivningar, tom lista = allt sparat. */
export async function pgSaveAuctionsBulk(docs: AuctionDoc[]): Promise<string[]> {
  const fel: string[] = [];
  for (let i = 0; i < docs.length; i += TUGGA) {
    const tugga = docs.slice(i, i + TUGGA);
    try {
      await skriv(tugga);
    } catch (e) {
      fel.push(`bulkSave[${i}–${i + tugga.length - 1}]: ${(e as Error).message.slice(0, 200)}`);
    }
  }
  return fel;
}

/** Samma kontrakt som Wix-vägen: felbeskrivningar, tom lista = allt borttaget. */
export async function pgRemoveAuctionsBulk(ids: string[]): Promise<string[]> {
  const fel: string[] = [];
  const q = sql();
  for (let i = 0; i < ids.length; i += TUGGA) {
    const tugga = ids.slice(i, i + TUGGA);
    try {
      await q.query(`delete from auctions where id = any($1)`, [tugga]);
    } catch (e) {
      fel.push(`bulkRemove[${i}–${i + tugga.length - 1}]: ${(e as Error).message.slice(0, 200)}`);
    }
  }
  return fel;
}

export async function pgRemoveAuction(id: string): Promise<void> {
  const q = sql();
  await q.query(`delete from auctions where id = $1`, [id]);
}
