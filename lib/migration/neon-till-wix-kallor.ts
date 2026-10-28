// Källorna för flytten tillbaka: varje Neon-tabell läst i Wix form.
//
// ☠️ FORMEN MÅSTE VARA EXAKT DEN SOM WIX-LAGREN SJÄLVA SKRIVER. Kopian är
// facit efter växlingen, och ett fält som heter något annat här än i
// WixDataStore, sync-loggen eller auktionslagret hade varit ett fält koden
// aldrig hittar. Varje källa nedan namnger den funktion vars form den följer,
// och kopierings-testerna jämför formen mot lagrens egna skrivningar.

import { sql } from "../db/client";
import {
  AUDIT,
  AUKTIONER,
  IMPORT_COSTS,
  LLM_SAMLINGAR,
  MAPPNINGAR,
  PRODUCT_HASHES,
  RECENSIONER,
  SYNC_ALERTS,
  SYNC_LOG,
  SYNC_STATE,
  TASKS,
  WEBHOOK_EVENTS,
  type TabellSpec,
} from "../db/tabeller";
import { NYA } from "../db/wix-kollektioner";
import { allaRader, fraga, rakna, sparaManga, taBortManga } from "../db/wix-data-klient";
import { sorteraDokRader, type WixFargbildRad } from "../store/fargbilder";
import type { Kalla, KallRad, WixPost, WixSida } from "./neon-till-wix";

type Rad = Record<string, unknown>;

/**
 * Wix interna fält följde med när datan kopierades TILL Neon 2026-08-31. Kopian tillbaka ska inte bära dem.
 *
 * ☠️ `utanNull` STRYKER FÄLT SOM ÄR `null` PÅ ÖVERSTA NIVÅN. Uppmätt mot Wix
 * 2026-10-29: `{ f: { $exists: false } }` matchar INTE en rad där `f` är
 * `null`, bara en rad där fältet saknas. Dubbel-order-låset (`FRI_TASK` i
 * lib/store/wix-data.ts) kräver att `aliexpressOrderId` och `claimToken`
 * saknas eller är tomma, så en task som kom över med `claimToken: null` hade
 * aldrig gått att claima, och en betald order hade inte kunnat läggas.
 *
 * Bara för tasks, där ett Wix-filter läser fältet. Övriga tabeller kommer över
 * exakt som i Neon, null och allt: koden läser dem i dag ur samma JSON, och en
 * `=== null`-kontroll någonstans hade annars bytt svar efter växlingen.
 * Jämförelsen (`jamforbar`) räknar null som saknat, så verifieringen påverkas inte.
 */
export function utanWixFalt(data: unknown, opts: { utanNull?: boolean } = {}): Rad {
  const d = { ...((data ?? {}) as Rad) };
  delete d._id;
  delete d._owner;
  delete d._createdDate;
  delete d._updatedDate;
  if (opts.utanNull) for (const k of Object.keys(d)) if (d[k] === null) delete d[k];
  return d;
}

function iso(v: unknown): string | null {
  if (v == null) return null;
  const d = v instanceof Date ? v : new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function ms(v: unknown): number | undefined {
  const s = iso(v);
  return s ? Date.parse(s) : undefined;
}

/** Saknad tabell (42P01) är noll rader: en tabell som skapas vid första användningen kan saknas. */
async function fragaNeon(text: string, varden: unknown[]): Promise<Rad[]> {
  try {
    return (await sql().query(text, varden)) as Rad[];
  } catch (e) {
    if ((e as { code?: string })?.code === "42P01") return [];
    throw e;
  }
}

/** En källa ur en tabell med id-kolumn: läser i id-ordning med markör (keyset, ingen offset). */
function kalla(
  namn: string,
  kollektion: string,
  tabell: string,
  idKol: string,
  kolumner: string,
  tillWix: (r: Rad) => KallRad,
  where = "true",
  extraVarden: unknown[] = [],
): Kalla {
  const p = extraVarden.length;
  return {
    namn,
    kollektion,
    async lasNeon(efter, antal) {
      const rader = await fragaNeon(
        `select ${idKol} as id, ${kolumner} from ${tabell}
          where ${where} and ($${p + 1}::text is null or ${idKol} > $${p + 1})
          order by ${idKol} limit $${p + 2}`,
        [...extraVarden, efter, antal],
      );
      return rader.map(tillWix);
    },
    async raknaNeon() {
      const r = await fragaNeon(`select count(*)::int as n from ${tabell} where ${where}`, extraVarden);
      return Number((r[0] as { n?: number } | undefined)?.n ?? 0);
    },
    async finnsINeon(idn) {
      if (idn.length === 0) return new Set();
      const r = await fragaNeon(
        `select ${idKol} as id from ${tabell} where ${where} and ${idKol} = any($${p + 1}::text[])`,
        [...extraVarden, idn],
      );
      return new Set(r.map((x) => String(x.id)));
    },
  };
}

/** Tabeller där `data` bär hela posten (PostgresStore, sync-loggen, recensioner, auktioner …). */
function specKalla(
  spec: TabellSpec,
  andradKol: string | null,
  andradIData?: (d: Rad) => unknown,
  opts: { utanNull?: boolean } = {},
): Kalla {
  const idKol = spec.kolumner[spec.idFält];
  return kalla(
    spec.tabell,
    spec.kollektion,
    spec.tabell,
    idKol,
    `data${andradKol ? `, ${andradKol} as andrad` : ""}`,
    (r) => {
      const data = utanWixFalt(r.data, opts);
      return {
        id: String(r.id),
        data,
        andrad: andradKol ? ms(r.andrad) : andradIData ? ms(andradIData(data)) : undefined,
      };
    },
  );
}

export function neonKallor(): Kalla[] {
  return [
    // WixDataStore.saveMapping: { ...record }
    specKalla(MAPPNINGAR, "updated_at"),
    // WixDataStore.upsertTask: { ...task }, utan null (se utanWixFalt)
    specKalla(TASKS, "updated_at", undefined, { utanNull: true }),
    // WixDataStore.markEventSeen: { seenAt }
    kalla(WEBHOOK_EVENTS.tabell, WEBHOOK_EVENTS.kollektion, "webhook_events", "event_id", "seen_at, data", (r) => {
      const seenAt = (r.data as Rad | null)?.seenAt ?? iso(r.seen_at);
      return { id: String(r.id), data: { seenAt }, andrad: ms(r.seen_at) };
    }),
    // WixDataStore.appendAudit: { ...entry } = { at, kind, ref?, detail? }
    kalla(AUDIT.tabell, AUDIT.kollektion, "audit", "id", "at, kind, ref, detail", (r) => ({
      id: String(r.id),
      data: {
        at: iso(r.at),
        kind: r.kind,
        ...(r.ref != null ? { ref: r.ref } : {}),
        ...(r.detail != null ? { detail: r.detail } : {}),
      },
      andrad: ms(r.at),
    })),
    // sync-loggen save(): { ...entry } (id i _id)
    specKalla(SYNC_LOG, "checked_at"),
    specKalla(SYNC_STATE, null, (d) => d.lastCheckedAt),
    specKalla(SYNC_ALERTS, null, (d) => [d.resolvedAt, d.createdAt].find((v) => typeof v === "string")),
    specKalla(PRODUCT_HASHES, null, (d) => d.updatedAt),
    specKalla(IMPORT_COSTS, "at"),
    // ReviewStore.upsert: { ...skickas }
    specKalla(RECENSIONER, "updated_at"),
    // auktionslagret: { ...doc } (doc._id följer med i Wix men jämförs inte)
    specKalla(AUKTIONER, "updated_at"),
    // llmSave: data som den är, en Wix-kollektion per samling
    ...LLM_SAMLINGAR.map((k) =>
      kalla(`llm_kv:${k}`, k, "llm_kv", "key", "data, at", (r) => ({
        id: String(r.id),
        data: utanWixFalt(r.data),
        andrad: ms(r.at),
      }), "collection = $1", [k]),
    ),
    // WixSyncMarkorLager.spara: { markor, at }
    kalla("sync_markor", NYA.syncMarkor, "sync_markor", "namn", "markor, at", (r) => ({
      id: String(r.id),
      data: { markor: r.markor ?? null, at: iso(r.at) },
      andrad: ms(r.at),
    })),
    // WixKarens.registrera: { forstSedd, senastSedd }
    kalla("bildstadning_karens", NYA.karens, "bildstadning_karens", "fil_id", "forst_sedd, senast_sedd", (r) => ({
      id: String(r.id),
      data: { forstSedd: iso(r.forst_sedd), senastSedd: iso(r.senast_sedd) },
      andrad: ms(r.senast_sedd),
    })),
    // WixFargbildLager: ett dokument per sida, { rader: [...] } i (val, ordning, fil)
    fargbildKalla(),
    // wixUtskickslogg: { orderId, typ, ordernummer, tagenAt, skickadAt?, resendId? }
    kalla(
      "faktura_utskick",
      NYA.fakturaUtskick,
      "faktura_utskick",
      "(order_id || '__' || typ)",
      "order_id, typ, ordernummer, tagen_at, skickad_at, resend_id",
      (r) => ({
        id: String(r.id),
        data: {
          orderId: r.order_id,
          typ: r.typ,
          ordernummer: r.ordernummer,
          tagenAt: iso(r.tagen_at),
          ...(r.skickad_at != null ? { skickadAt: iso(r.skickad_at) } : {}),
          ...(r.resend_id != null ? { resendId: r.resend_id } : {}),
        },
        andrad: Math.max(ms(r.tagen_at) ?? 0, ms(r.skickad_at) ?? 0) || undefined,
      }),
    ),
  ];
}

/** Färgbilderna: en Neon-rad per (sida, val, fil) blir ett Wix-dokument per sida. */
function fargbildKalla(): Kalla {
  return {
    namn: "fargbilder",
    kollektion: NYA.fargbilder,
    async lasNeon(efter, antal) {
      const sidor = await fragaNeon(
        `select distinct wix_product_id as id from fargbilder
          where ($1::text is null or wix_product_id > $1)
          order by wix_product_id limit $2`,
        [efter, antal],
      );
      if (sidor.length === 0) return [];
      const idn = sidor.map((s) => String(s.id));
      const rader = await fragaNeon(
        `select wix_product_id, choice_id, choice_name, ordning, fil_id, plats, givare_id, skriven_at, wix_bekraftad_at
           from fargbilder where wix_product_id = any($1::text[])`,
        [idn],
      );
      const perSida = new Map<string, { rader: WixFargbildRad[]; andrad: number }>();
      for (const id of idn) perSida.set(id, { rader: [], andrad: 0 });
      for (const r of rader) {
        const p = perSida.get(String(r.wix_product_id))!;
        p.rader.push({
          choiceId: String(r.choice_id ?? ""),
          choiceName: String(r.choice_name ?? ""),
          ordning: Number(r.ordning),
          filId: String(r.fil_id),
          plats: r.plats as WixFargbildRad["plats"],
          givareId: (r.givare_id as string | null) ?? null,
          skrivenAt: iso(r.skriven_at) ?? "",
          wixBekraftadAt: iso(r.wix_bekraftad_at),
        });
        p.andrad = Math.max(p.andrad, ms(r.skriven_at) ?? 0, ms(r.wix_bekraftad_at) ?? 0);
      }
      return idn.map((id) => {
        const p = perSida.get(id)!;
        return { id, data: { rader: sorteraDokRader(p.rader) }, andrad: p.andrad || undefined };
      });
    },
    async raknaNeon() {
      const r = await fragaNeon(`select count(distinct wix_product_id)::int as n from fargbilder`, []);
      return Number((r[0] as { n?: number } | undefined)?.n ?? 0);
    },
    async finnsINeon(idn) {
      if (idn.length === 0) return new Set();
      const r = await fragaNeon(`select distinct wix_product_id as id from fargbilder where wix_product_id = any($1::text[])`, [idn]);
      return new Set(r.map((x) => String(x.id)));
    },
  };
}

/** Wix-sidan av flytten, med klienten. Systemfälten följer med: delta-regeln läser dem. */
export function wixSida(): WixSida {
  return {
    async hamtaIdn(kollektion, idn) {
      const ut: WixPost[] = [];
      for (let i = 0; i < idn.length; i += 250) {
        ut.push(
          ...(await allaRader<WixPost>(
            kollektion,
            { filter: { _id: { $in: idn.slice(i, i + 250) } } },
            { medSystemfalt: true },
          )),
        );
      }
      return ut;
    },
    async sidaEfter(kollektion, efter, antal) {
      return fraga<WixPost>(
        kollektion,
        {
          filter: efter ? { _id: { $gt: efter } } : {},
          sort: [{ fieldName: "_id", order: "ASC" }],
          limit: antal,
        },
        { medSystemfalt: true },
      );
    },
    rakna: (kollektion) => rakna(kollektion),
    spara: (kollektion, rader) => sparaManga(kollektion, rader.map((r) => ({ id: r.id, data: r.data }))),
    taBort: (kollektion, idn) => taBortManga(kollektion, idn),
  };
}

/** Alla tabeller i Neon-databasen med radantal: visar om butikens tabeller bor i samma databas. */
export async function tabellerINeon(): Promise<{ tabell: string; rader: number }[]> {
  const namn = (await sql().query(
    `select table_name from information_schema.tables
      where table_schema = 'public' and table_type = 'BASE TABLE' order by table_name`,
    [],
  )) as { table_name: string }[];
  const ut: { tabell: string; rader: number }[] = [];
  for (const { table_name } of namn) {
    // Namnet kommer ur katalogen, inte ur en förfrågan, och citeras ändå.
    const r = (await sql().query(`select count(*)::int as n from "${table_name.replace(/"/g, '""')}"`, [])) as {
      n: number;
    }[];
    ut.push({ tabell: table_name, rader: Number(r[0]?.n ?? 0) });
  }
  return ut;
}
