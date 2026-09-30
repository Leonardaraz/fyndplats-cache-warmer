// Färgbildstabellen: varje färgvals hela bildlista på en sammanslagen sida
// (lib/aosom/fargbilder.ts). Wix tar 15 bilder per produkt; tabellen tar resten.
//
// Tre läsare, och alla tre är skäl att den inte får tappa rader:
//   1. Butiken, via GET /api/fargbilder?pid= — hela listan per färg.
//   2. Bildstädningen (lib/aosom/media-cleanup.ts), som räknar varje fil-id
//      här som ANVÄND. Utan det raderas overflow-bilderna när givaren raderas.
//   3. Färgbildsverktyget självt, som bygger nästa plan ovanpå förra
//      skrivningens rader — när givaren är borta är tabellen enda källan.
//
// Postgres i drift. `STORE_BACKEND=memory` (dev och test) ger en lista i
// minnet. Tabellen skapas vid första användningen (FARGBILD_DDL), så den finns
// utan att någon behöver köra kopieringen först.
//
// ☠️ SKRIVNINGEN ÄR EN SATS. Neons HTTP-drivrutin har inga transaktioner, så
// "ta bort det som inte längre finns, skriv resten" är EN sats med en CTE.
// Två satser hade kunnat lämna en sida utan rader om den andra föll — och då
// hade städningen tagit filerna.

import { sql } from "@/lib/db/client";
import { FARGBILD_DDL } from "@/lib/db/schema";
import { storeBackend } from "./backend";
import type { Plats, TabellRad } from "@/lib/aosom/fargbilder";

export interface FargbildLager {
  /** Sidans rader, i (val, ordning). */
  lasForProdukt(wixProductId: string): Promise<TabellRad[]>;
  /** Alla (sida, val) som har rader — verktygets urval läser dem. */
  lasSkrivnaVal(): Promise<{ wixProductId: string; choiceId: string }[]>;
  /** Varje fil-id i tabellen, utan dubbletter. Bildstädningen läser dem. */
  lasAllaFilIdn(): Promise<string[]>;
  /** Ersätter sidans rader med `rader`, i en sats. */
  ersattForProdukt(wixProductId: string, rader: TabellRad[]): Promise<void>;
  /** Ersätter ETT vals rader (sammanslagningen rör bara den nya färgen). */
  ersattForVal(wixProductId: string, choiceId: string, rader: TabellRad[]): Promise<void>;
}

const PLATSER: readonly Plats[] = ["galleri", "overflow", "granskas", "gemensam"];

function kontrollera(wixProductId: string, rader: TabellRad[], choiceId?: string): void {
  for (const r of rader) {
    if (r.wixProductId !== wixProductId) throw new Error("fargbilder: en rad hör till en annan produkt");
    if (choiceId !== undefined && r.choiceId !== choiceId) throw new Error("fargbilder: en rad hör till ett annat val");
    if (!r.filId) throw new Error("fargbilder: en rad saknar fil-id");
    if (!PLATSER.includes(r.plats)) throw new Error(`fargbilder: okänd plats ${r.plats}`);
  }
  const nycklar = new Set(rader.map((r) => `${r.choiceId}\u0000${r.filId}`));
  if (nycklar.size !== rader.length) throw new Error("fargbilder: samma fil två gånger på samma val");
}

// ── i minnet ─────────────────────────────────────────────────────────────────

export class MinnesFargbildLager implements FargbildLager {
  rader: TabellRad[] = [];

  async lasForProdukt(wixProductId: string): Promise<TabellRad[]> {
    return this.rader
      .filter((r) => r.wixProductId === wixProductId)
      .sort((a, b) => a.choiceId.localeCompare(b.choiceId) || a.ordning - b.ordning)
      .map((r) => ({ ...r }));
  }

  async lasSkrivnaVal(): Promise<{ wixProductId: string; choiceId: string }[]> {
    const sedda = new Map<string, { wixProductId: string; choiceId: string }>();
    for (const r of this.rader) {
      if (r.choiceId) sedda.set(`${r.wixProductId}\u0000${r.choiceId}`, { wixProductId: r.wixProductId, choiceId: r.choiceId });
    }
    return [...sedda.values()];
  }

  async lasAllaFilIdn(): Promise<string[]> {
    return [...new Set(this.rader.map((r) => r.filId))];
  }

  async ersattForProdukt(wixProductId: string, rader: TabellRad[]): Promise<void> {
    kontrollera(wixProductId, rader);
    this.rader = [...this.rader.filter((r) => r.wixProductId !== wixProductId), ...rader.map((r) => ({ ...r }))];
  }

  async ersattForVal(wixProductId: string, choiceId: string, rader: TabellRad[]): Promise<void> {
    kontrollera(wixProductId, rader, choiceId);
    this.rader = [
      ...this.rader.filter((r) => !(r.wixProductId === wixProductId && r.choiceId === choiceId)),
      ...rader.map((r) => ({ ...r })),
    ];
  }
}

// ── Postgres ─────────────────────────────────────────────────────────────────

let tabellenFinns: Promise<void> | null = null;

async function sakerstall(): Promise<void> {
  tabellenFinns ??= (async () => {
    const q = sql();
    for (const ddl of FARGBILD_DDL) await q.query(ddl);
  })().catch((e) => {
    tabellenFinns = null;
    throw e;
  });
  return tabellenFinns;
}

interface PgRad {
  wix_product_id: string;
  choice_id: string;
  choice_name: string;
  ordning: number;
  fil_id: string;
  plats: Plats;
  givare_id: string | null;
}

const tillRad = (r: PgRad): TabellRad => ({
  wixProductId: r.wix_product_id,
  choiceId: r.choice_id,
  choiceName: r.choice_name,
  ordning: Number(r.ordning),
  filId: r.fil_id,
  plats: r.plats,
  givareId: r.givare_id,
});

const somJson = (rader: TabellRad[]) =>
  JSON.stringify(rader.map((r) => ({
    p: r.wixProductId, c: r.choiceId, n: r.choiceName, o: r.ordning, f: r.filId, pl: r.plats, g: r.givareId,
  })));

/**
 * Ersätt i EN sats: raderna som inte längre finns tas bort, resten skrivs med
 * upsert. Borttagningen och upserten rör skilda rader (samma rad två gånger i
 * en sats vägrar Postgres), och `villkor` avgör vilka av produktens rader
 * som ersätts — alla, eller ett vals.
 */
function ersattSats(villkor: string): string {
  return `
  with ny as (
    select r->>'p' as p, r->>'c' as c, r->>'n' as n, (r->>'o')::integer as o,
           r->>'f' as f, r->>'pl' as pl, nullif(r->>'g', '') as g
      from jsonb_array_elements($1::jsonb) as r
  ), bort as (
    delete from fargbilder t
     where t.wix_product_id = $2 and ${villkor}
       and not exists (select 1 from ny where ny.c = t.choice_id and ny.f = t.fil_id)
  )
  insert into fargbilder (wix_product_id, choice_id, choice_name, ordning, fil_id, plats, givare_id, skriven_at)
  select p, c, n, o, f, pl, g, now() from ny
  on conflict (wix_product_id, choice_id, fil_id) do update set
    choice_name = excluded.choice_name,
    ordning     = excluded.ordning,
    plats       = excluded.plats,
    givare_id   = excluded.givare_id,
    skriven_at  = now()`;
}

export class PostgresFargbildLager implements FargbildLager {
  async lasForProdukt(wixProductId: string): Promise<TabellRad[]> {
    await sakerstall();
    const rows = (await sql().query(
      `select wix_product_id, choice_id, choice_name, ordning, fil_id, plats, givare_id
         from fargbilder where wix_product_id = $1
        order by choice_id, ordning`,
      [wixProductId],
    )) as PgRad[];
    return rows.map(tillRad);
  }

  async lasSkrivnaVal(): Promise<{ wixProductId: string; choiceId: string }[]> {
    await sakerstall();
    const rows = (await sql().query(
      `select distinct wix_product_id, choice_id from fargbilder where choice_id <> ''`,
      [],
    )) as { wix_product_id: string; choice_id: string }[];
    return rows.map((r) => ({ wixProductId: r.wix_product_id, choiceId: r.choice_id }));
  }

  async lasAllaFilIdn(): Promise<string[]> {
    await sakerstall();
    const rows = (await sql().query(`select distinct fil_id from fargbilder`, [])) as { fil_id: string }[];
    return rows.map((r) => r.fil_id);
  }

  async ersattForProdukt(wixProductId: string, rader: TabellRad[]): Promise<void> {
    kontrollera(wixProductId, rader);
    await sakerstall();
    await sql().query(ersattSats("true"), [somJson(rader), wixProductId]);
  }

  async ersattForVal(wixProductId: string, choiceId: string, rader: TabellRad[]): Promise<void> {
    kontrollera(wixProductId, rader, choiceId);
    await sakerstall();
    await sql().query(ersattSats("t.choice_id = $3"), [somJson(rader), wixProductId, choiceId]);
  }
}

let minne: MinnesFargbildLager | null = null;

/** Lagret i drift: Postgres, eller en lista i minnet när STORE_BACKEND=memory. */
export function getFargbildLager(): FargbildLager {
  if (storeBackend() === "memory") return (minne ??= new MinnesFargbildLager());
  return new PostgresFargbildLager();
}
