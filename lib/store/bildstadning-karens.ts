// Bildstädningens karenstid: när varje oanvänd fil först sågs oanvänd.
//
// ☠️ VARFÖR (granskningen 2026-10-14)
//
// En fil som ingen läsare använder kan ändå visas en stund till. Googles
// produktflöde serveras upp till ett dygn gammalt, påminnelsemejlen om en
// övergiven varukorg bär bilden från när varan lades i korgen och skickas upp
// till 72 timmar senare, och kategorisidorna cachas en timme. En fil som togs
// bort ur ett galleri i dag och raderades i natt hade varit en död bild i
// alla tre.
//
// Därför raderas en fil först när den varit oanvänd i KARENS_DYGN, sett av två
// körningar med minst så lång tids mellanrum. Det skyddar också mot ett
// glapp i nattens läge: en import laddar upp bilderna sekunder innan
// produkten skapas.
//
// En rad tas bort så fort filen ses i bruk igen, och när den raderats. Varje
// körning jämför HELA tabellen med det läsarna använder, inte bara fönstrets
// filer: en gammal fil ligger utanför nattens fönster och ses annars bara vid
// en full genomgång, så en fil som tagits i bruk och släppts igen däremellan
// hade behållit sin gamla tid. Wix eller Postgres i drift (lib/store/backend.ts),
// en lista i minnet när STORE_BACKEND=memory (dev och test).

import { sql } from "@/lib/db/client";
import { KARENS_DDL } from "@/lib/db/schema";
import { storeBackend } from "./backend";
import { allaRader, sparaManga, taBortManga } from "@/lib/db/wix-data-klient";
import { NYA } from "@/lib/db/wix-kollektioner";

/** Så länge en fil måste ha varit oanvänd innan den raderas. */
export const KARENS_DYGN = 3;
export const KARENS_MS = KARENS_DYGN * 86_400_000;

export interface KarensLager {
  /**
   * Antecknar filerna som oanvända `nu` och svarar med när var och en FÖRST
   * sågs oanvänd (ms sedan epoken). En fil som redan står där behåller sin tid.
   */
  registrera(filIdn: ReadonlyArray<string>, nu: number): Promise<Map<string, number>>;
  /** Varje antecknad fil. Körningen glömmer dem som någon läsare använder. */
  lasAlla(): Promise<string[]>;
  /** Glömmer filerna: de används igen, eller är raderade. */
  glom(filIdn: ReadonlyArray<string>): Promise<void>;
}

class MinnesKarens implements KarensLager {
  private forst = new Map<string, number>();

  async registrera(filIdn: ReadonlyArray<string>, nu: number): Promise<Map<string, number>> {
    const ut = new Map<string, number>();
    for (const id of filIdn) {
      if (!this.forst.has(id)) this.forst.set(id, nu);
      ut.set(id, this.forst.get(id)!);
    }
    return ut;
  }

  async lasAlla(): Promise<string[]> {
    return [...this.forst.keys()];
  }

  async glom(filIdn: ReadonlyArray<string>): Promise<void> {
    for (const id of filIdn) this.forst.delete(id);
  }
}

let tabellenFinns: Promise<void> | null = null;

async function sakerstall(): Promise<void> {
  tabellenFinns ??= (async () => {
    const q = sql();
    for (const ddl of KARENS_DDL) await q.query(ddl);
  })().catch((e) => {
    tabellenFinns = null;
    throw e;
  });
  return tabellenFinns;
}

export class PostgresKarens implements KarensLager {
  // En sats: en fil som redan står där behåller forst_sedd, och RETURNING ger
  // den tiden för både nya och gamla rader.
  async registrera(filIdn: ReadonlyArray<string>, nu: number): Promise<Map<string, number>> {
    const ut = new Map<string, number>();
    if (filIdn.length === 0) return ut;
    await sakerstall();
    const rows = (await sql().query(
      `insert into bildstadning_karens (fil_id, forst_sedd, senast_sedd)
         select fil_id, $2::timestamptz, $2::timestamptz from unnest($1::text[]) as t(fil_id)
       on conflict (fil_id) do update set senast_sedd = excluded.senast_sedd
       returning fil_id, floor(extract(epoch from forst_sedd) * 1000)::float8 as forst_ms`,
      [[...new Set(filIdn)], new Date(nu).toISOString()],
    )) as { fil_id: string; forst_ms: number | string }[];
    for (const r of rows) ut.set(r.fil_id, Number(r.forst_ms));
    // ☠️ Varje fil måste ha fått en tid. En fil utan tid hade annars kunnat
    // tolkas som "ingen karens" av en framtida ändring här.
    for (const id of filIdn) {
      if (!Number.isFinite(ut.get(id))) throw new Error(`karenstabellen svarade utan tid för en fil`);
    }
    return ut;
  }

  async lasAlla(): Promise<string[]> {
    await sakerstall();
    const rows = (await sql().query(`select fil_id from bildstadning_karens`, [])) as { fil_id: string }[];
    return rows.map((r) => r.fil_id);
  }

  async glom(filIdn: ReadonlyArray<string>): Promise<void> {
    if (filIdn.length === 0) return;
    await sakerstall();
    await sql().query(`delete from bildstadning_karens where fil_id = any($1::text[])`, [[...new Set(filIdn)]]);
  }
}

/**
 * En rad per fil i Wix, `_id` = fil-id, med `forstSedd` och `senastSedd`.
 *
 * Postgres gjorde registreringen i EN sats. Här läses de befintliga raderna
 * först och skrivs sedan i omgångar: en fil som redan står där behåller sin
 * `forstSedd`. Bara städningens egen körning skriver, en åt gången, så det
 * finns ingen samtidig skrivare att tävla med.
 */
export class WixKarens implements KarensLager {
  async registrera(filIdn: ReadonlyArray<string>, nu: number): Promise<Map<string, number>> {
    const ut = new Map<string, number>();
    const unika = [...new Set(filIdn)];
    if (unika.length === 0) return ut;
    const befintliga = new Map<string, string>();
    for (let i = 0; i < unika.length; i += 500) {
      const rader = await allaRader<{ _id: string; forstSedd?: string }>(NYA.karens, {
        filter: { _id: { $in: unika.slice(i, i + 500) } },
      });
      for (const r of rader) if (r.forstSedd) befintliga.set(r._id, r.forstSedd);
    }
    const nuIso = new Date(nu).toISOString();
    const u = await sparaManga(
      NYA.karens,
      unika.map((id) => ({ id, data: { forstSedd: befintliga.get(id) ?? nuIso, senastSedd: nuIso } })),
    );
    if (u.fel.length) throw new Error(`karenstabellen: ${u.fel.length} rader gick inte att skriva (${u.fel[0].fel})`);
    for (const id of unika) ut.set(id, Date.parse(befintliga.get(id) ?? nuIso));
    // ☠️ Varje fil måste ha fått en tid, som i Postgres-vägen.
    for (const id of filIdn) {
      if (!Number.isFinite(ut.get(id))) throw new Error(`karenstabellen svarade utan tid för en fil`);
    }
    return ut;
  }

  async lasAlla(): Promise<string[]> {
    const rader = await allaRader<{ _id: string }>(NYA.karens);
    return rader.map((r) => r._id);
  }

  async glom(filIdn: ReadonlyArray<string>): Promise<void> {
    if (filIdn.length === 0) return;
    const u = await taBortManga(NYA.karens, [...new Set(filIdn)]);
    if (u.fel.length) throw new Error(`karenstabellen: ${u.fel.length} rader gick inte att glömma (${u.fel[0]})`);
  }
}

let minne: MinnesKarens | null = null;

export function getKarensLager(): KarensLager {
  switch (storeBackend()) {
    case "memory":
      return (minne ??= new MinnesKarens());
    case "wix-data":
      return new WixKarens();
    case "postgres":
      return new PostgresKarens();
  }
}

/** Endast för tester: ett nytt, tomt lager i minnet. */
export function nyttMinnesKarens(): KarensLager {
  return new MinnesKarens();
}
