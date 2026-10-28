// Var Aosom-synkens schemalagda körningar slutade, så att nästa fortsätter där.
//
// VARFÖR DEN FINNS (2026-10-13). Synken byggdes för att konvergera utan sparad
// markör: `limit` räknar skrivningar, en redan synkad produkt kostar noll, och
// nästa körning skulle gå gratis förbi huvudet och nå svansen. Det antagandet
// höll inte, i båda körningarna:
//
//   - Lagerkörningen (var sjätte timme) skrev 400 saldon i katalogens första
//     ~2 500 artiklar varje gång och stannade på `limit`. Aosoms saldon rör sig
//     hela tiden, så huvudet blev aldrig klart, och de sista ~2 400 artiklarna
//     synkades aldrig.
//   - Priskörningen (03:20) stannade på tidsbudgeten efter 550 av 4 938
//     artiklar. Bokhyllan bd664764 såldes för 749 kr mot regelpriset 819.
//
// Med en sparad markör går varje körning vidare från förra körningens slut,
// och hela katalogen nås på några körningar oavsett hur mycket huvudet rör sig.
//
// ☠️ MARKÖREN ÄR ETT ARTIKELNUMMER. Den bor bara här i databasen och skrivs
// aldrig ut. Loggraden säger bara om körningen fortsatte eller började om.
//
// ☠️ BARA SKARPA KÖRNINGAR FLYTTAR MARKÖREN. En torrkörning för hand får inte
// få nattens körning att hoppa över det torrkörningen bara tittade på.

import { sql } from "@/lib/db/client";
import { SYNC_MARKOR_DDL } from "@/lib/db/schema";
import { storeBackend } from "@/lib/store/backend";
import { hamta, spara } from "@/lib/db/wix-data-klient";
import { NYA } from "@/lib/db/wix-kollektioner";
import type { AosomSyncSummary } from "./sync";

/** Rotationernas namn. Okända namn vägras av rutten. */
export const ROTATIONER = ["lager", "pris"] as const;
export type Rotation = (typeof ROTATIONER)[number];

export function arRotation(v: string | null | undefined): v is Rotation {
  return !!v && (ROTATIONER as readonly string[]).includes(v);
}

/**
 * Markören nästa körning ska börja efter.
 *
 * - Körningen gick hela vägen till slutet: `null`, nästa börjar om från början.
 * - Den stannade på `limit` eller tidsbudget: där den stannade.
 * - Den stannade innan första tuggan (ingen markör alls): den gamla står kvar.
 *   ☠️ Att nollställa den hade skickat nästa körning tillbaka till början, och
 *   en körning som aldrig kommer igång hade då hållit svansen osynkad för
 *   alltid — samma fel som markören finns för att laga.
 */
export function nastaMarkor(
  s: Pick<AosomSyncSummary, "stoppedBy" | "cursor">,
  gammal: string | null,
): string | null {
  if (s.stoppedBy === "klart") return null;
  return s.cursor ?? gammal;
}

export interface SyncMarkorLager {
  las(rotation: Rotation): Promise<string | null>;
  spara(rotation: Rotation, markor: string | null): Promise<void>;
}

export class MinnesSyncMarkorLager implements SyncMarkorLager {
  markorer = new Map<Rotation, string | null>();
  async las(rotation: Rotation): Promise<string | null> {
    return this.markorer.get(rotation) ?? null;
  }
  async spara(rotation: Rotation, markor: string | null): Promise<void> {
    this.markorer.set(rotation, markor);
  }
}

let tabellenFinns: Promise<void> | null = null;

async function sakerstall(): Promise<void> {
  tabellenFinns ??= (async () => {
    const q = sql();
    for (const ddl of SYNC_MARKOR_DDL) await q.query(ddl);
  })().catch((e) => {
    tabellenFinns = null;
    throw e;
  });
  return tabellenFinns;
}

class PostgresSyncMarkorLager implements SyncMarkorLager {
  async las(rotation: Rotation): Promise<string | null> {
    await sakerstall();
    const rows = (await sql().query(`select markor from sync_markor where namn = $1`, [rotation])) as {
      markor: string | null;
    }[];
    return rows[0]?.markor ?? null;
  }

  async spara(rotation: Rotation, markor: string | null): Promise<void> {
    await sakerstall();
    await sql().query(
      `insert into sync_markor (namn, markor, at) values ($1, $2, now())
       on conflict (namn) do update set markor = excluded.markor, at = excluded.at`,
      [rotation, markor],
    );
  }
}

/** En rad per rotation i Wix, `_id` = rotationens namn. Läsbar bara för admin
 *  (markören är ett artikelnummer, se filens huvud). */
export class WixSyncMarkorLager implements SyncMarkorLager {
  async las(rotation: Rotation): Promise<string | null> {
    const rad = await hamta<{ markor?: string | null }>(NYA.syncMarkor, rotation);
    return rad?.markor ?? null;
  }

  async spara(rotation: Rotation, markor: string | null): Promise<void> {
    await spara(NYA.syncMarkor, rotation, { markor, at: new Date().toISOString() });
  }
}

let minne: MinnesSyncMarkorLager | null = null;

export function getSyncMarkorLager(): SyncMarkorLager {
  switch (storeBackend()) {
    case "memory":
      return (minne ??= new MinnesSyncMarkorLager());
    case "wix-data":
      return new WixSyncMarkorLager();
    case "postgres":
      return new PostgresSyncMarkorLager();
  }
}
