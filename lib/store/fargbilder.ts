// Färgbildstabellen: varje färgvals hela bildlista på en sammanslagen sida
// (lib/aosom/fargbilder.ts). Wix tar 50 bilder per produkt; tabellen tar resten.
//
// Tre läsare, och alla tre är skäl att den inte får tappa rader:
//   1. Butiken, via GET /api/fargbilder?pid= — hela listan per färg.
//   2. Bildstädningen (lib/aosom/media-cleanup.ts), som räknar varje fil-id
//      här som ANVÄND. Utan det raderas overflow-bilderna när givaren raderas.
//   3. Färgbildsverktyget självt, som bygger nästa plan ovanpå förra
//      skrivningens rader — när givaren är borta är tabellen enda källan.
//
// Wix eller Postgres i drift (lib/store/backend.ts). `STORE_BACKEND=memory`
// (dev och test) ger en lista i minnet. Tabellen skapas vid första användningen (FARGBILD_DDL), så den finns
// utan att någon behöver köra kopieringen först.
//
// ☠️ SKRIVNINGEN ÄR EN SATS. Neons HTTP-drivrutin har inga transaktioner, så
// "ta bort det som inte längre finns, skriv resten" är EN sats med en CTE.
// Två satser hade kunnat lämna en sida utan rader om den andra föll — och då
// hade städningen tagit filerna.

import { sql } from "@/lib/db/client";
import { FARGBILD_DDL } from "@/lib/db/schema";
import { storeBackend } from "./backend";
import { allaRader, hamta, spara, taBort } from "@/lib/db/wix-data-klient";
import { NYA } from "@/lib/db/wix-kollektioner";
import type { Plats, TabellRad } from "@/lib/aosom/fargbilder";

export interface FargbildLager {
  /** Sidans rader, i (val, ordning). */
  lasForProdukt(wixProductId: string): Promise<TabellRad[]>;
  /**
   * Alla (sida, val) som har rader, och om Wix är bekräftat för dem.
   * `bekraftad: false` = raderna skrevs före Wix och skrivningen föll
   * därefter. Verktygets urval räknar bara bekräftade som skrivna.
   */
  lasSkrivnaVal(): Promise<SkrivetVal[]>;
  /** Varje fil-id i tabellen, utan dubbletter. Bildstädningen läser dem. */
  lasAllaFilIdn(): Promise<string[]>;
  /** Ersätter sidans rader med `rader`, i en sats. */
  ersattForProdukt(wixProductId: string, rader: TabellRad[]): Promise<void>;
  /** Ersätter ETT vals rader (sammanslagningen rör bara den nya färgen). */
  ersattForVal(wixProductId: string, choiceId: string, rader: TabellRad[]): Promise<void>;
  /**
   * Markerar sidans rader (eller ett vals) som bekräftade i Wix. Anropas först
   * efter en lyckad återläsning. En ersättning nollställer markeringen.
   */
  bekraftaWix(wixProductId: string, choiceId?: string): Promise<void>;
}

export interface SkrivetVal {
  wixProductId: string;
  choiceId: string;
  bekraftad: boolean;
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
  /** Nycklar (sida, val, fil) vars rad är bekräftad i Wix. */
  bekraftade = new Set<string>();
  private nyckel = (r: TabellRad) => `${r.wixProductId}\u0000${r.choiceId}\u0000${r.filId}`;

  async lasForProdukt(wixProductId: string): Promise<TabellRad[]> {
    return this.rader
      .filter((r) => r.wixProductId === wixProductId)
      .sort((a, b) => a.choiceId.localeCompare(b.choiceId) || a.ordning - b.ordning)
      .map((r) => ({ ...r }));
  }

  async lasSkrivnaVal(): Promise<SkrivetVal[]> {
    const sedda = new Map<string, SkrivetVal>();
    for (const r of this.rader) {
      if (!r.choiceId) continue;
      const k = `${r.wixProductId}\u0000${r.choiceId}`;
      const bek = this.bekraftade.has(this.nyckel(r));
      const f = sedda.get(k);
      sedda.set(k, { wixProductId: r.wixProductId, choiceId: r.choiceId, bekraftad: f ? f.bekraftad && bek : bek });
    }
    return [...sedda.values()];
  }

  async bekraftaWix(wixProductId: string, choiceId?: string): Promise<void> {
    for (const r of this.rader) {
      if (r.wixProductId === wixProductId && (choiceId === undefined || r.choiceId === choiceId)) {
        this.bekraftade.add(this.nyckel(r));
      }
    }
  }

  async lasAllaFilIdn(): Promise<string[]> {
    return [...new Set(this.rader.map((r) => r.filId))];
  }

  async ersattForProdukt(wixProductId: string, rader: TabellRad[]): Promise<void> {
    kontrollera(wixProductId, rader);
    for (const r of this.rader) if (r.wixProductId === wixProductId) this.bekraftade.delete(this.nyckel(r));
    this.rader = [...this.rader.filter((r) => r.wixProductId !== wixProductId), ...rader.map((r) => ({ ...r }))];
  }

  async ersattForVal(wixProductId: string, choiceId: string, rader: TabellRad[]): Promise<void> {
    kontrollera(wixProductId, rader, choiceId);
    for (const r of this.rader) {
      if (r.wixProductId === wixProductId && r.choiceId === choiceId) this.bekraftade.delete(this.nyckel(r));
    }
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
    skriven_at  = now(),
    -- En ersättning är obekräftad tills Wix läst tillbaka som raderna.
    wix_bekraftad_at = null`;
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

  async lasSkrivnaVal(): Promise<SkrivetVal[]> {
    await sakerstall();
    const rows = (await sql().query(
      `select wix_product_id, choice_id, bool_and(wix_bekraftad_at is not null) as bekraftad
         from fargbilder where choice_id <> ''
        group by wix_product_id, choice_id`,
      [],
    )) as { wix_product_id: string; choice_id: string; bekraftad: boolean }[];
    return rows.map((r) => ({ wixProductId: r.wix_product_id, choiceId: r.choice_id, bekraftad: r.bekraftad === true }));
  }

  async bekraftaWix(wixProductId: string, choiceId?: string): Promise<void> {
    await sakerstall();
    if (choiceId === undefined) {
      await sql().query(`update fargbilder set wix_bekraftad_at = now() where wix_product_id = $1`, [wixProductId]);
    } else {
      await sql().query(
        `update fargbilder set wix_bekraftad_at = now() where wix_product_id = $1 and choice_id = $2`,
        [wixProductId, choiceId],
      );
    }
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

// ── Wix ──────────────────────────────────────────────────────────────────────

/** En rad i Wix-dokumentet. Samma fält som tabellraden, utan produkt-id, plus Postgres två tider. */
export interface WixFargbildRad {
  choiceId: string;
  choiceName: string;
  ordning: number;
  filId: string;
  plats: Plats;
  givareId: string | null;
  skrivenAt: string;
  wixBekraftadAt: string | null;
}

/** Ett Wix-dokument per sida: `_id` = produktens Wix-id. */
export interface WixFargbildDok {
  _id?: string;
  rader: WixFargbildRad[];
}

/** Dokumentets rader i (val, ordning, fil) — samma ordning som Postgres läser i, så jämförelser blir stabila. */
export function sorteraDokRader(rader: WixFargbildRad[]): WixFargbildRad[] {
  return [...rader].sort(
    (a, b) => a.choiceId.localeCompare(b.choiceId) || a.ordning - b.ordning || a.filId.localeCompare(b.filId),
  );
}

/**
 * ☠️ ETT DOKUMENT PER SIDA, INTE EN RAD PER BILD.
 *
 * Postgres ersatte en sidas rader i EN sats (filens huvud): två satser hade
 * kunnat lämna sidan utan rader, och då hade städningen tagit filerna. Wix har
 * inga transaktioner över flera rader, men en skrivning av ETT dokument är
 * atomisk. Därför bor hela sidans lista i ett dokument, och en ersättning är
 * en enda `save`. En sida har högst några hundra rader, långt under Wix tak
 * på 512 kB per dokument.
 *
 * Ersättningen av ett vals rader läser dokumentet först och skriver tillbaka
 * det med de andra valen orörda. Färgbildsverktyget och sammanslagningen kör
 * en sida åt gången, så två samtidiga skrivare på samma sida förekommer inte.
 */
export class WixFargbildLager implements FargbildLager {
  private async dok(wixProductId: string): Promise<WixFargbildRad[]> {
    const d = await hamta<WixFargbildDok>(NYA.fargbilder, wixProductId);
    return Array.isArray(d?.rader) ? d!.rader : [];
  }

  private async skriv(wixProductId: string, rader: WixFargbildRad[]): Promise<void> {
    if (rader.length === 0) {
      await taBort(NYA.fargbilder, wixProductId);
      return;
    }
    await spara(NYA.fargbilder, wixProductId, { rader: sorteraDokRader(rader) });
  }

  async lasForProdukt(wixProductId: string): Promise<TabellRad[]> {
    return sorteraDokRader(await this.dok(wixProductId)).map((r) => ({
      wixProductId,
      choiceId: r.choiceId,
      choiceName: r.choiceName,
      ordning: Number(r.ordning),
      filId: r.filId,
      plats: r.plats,
      givareId: r.givareId ?? null,
    }));
  }

  async lasSkrivnaVal(): Promise<SkrivetVal[]> {
    const ut: SkrivetVal[] = [];
    for (const d of await allaRader<WixFargbildDok & { _id: string }>(NYA.fargbilder, { sidstorlek: 200 })) {
      const perVal = new Map<string, boolean>();
      for (const r of d.rader ?? []) {
        if (!r.choiceId) continue;
        perVal.set(r.choiceId, (perVal.get(r.choiceId) ?? true) && r.wixBekraftadAt != null);
      }
      for (const [choiceId, bekraftad] of perVal) ut.push({ wixProductId: d._id, choiceId, bekraftad });
    }
    return ut;
  }

  async lasAllaFilIdn(): Promise<string[]> {
    const idn = new Set<string>();
    for (const d of await allaRader<WixFargbildDok>(NYA.fargbilder, { sidstorlek: 200 })) {
      for (const r of d.rader ?? []) idn.add(r.filId);
    }
    return [...idn];
  }

  async ersattForProdukt(wixProductId: string, rader: TabellRad[]): Promise<void> {
    kontrollera(wixProductId, rader);
    const nu = new Date().toISOString();
    await this.skriv(wixProductId, rader.map((r) => tillDokRad(r, nu)));
  }

  async ersattForVal(wixProductId: string, choiceId: string, rader: TabellRad[]): Promise<void> {
    kontrollera(wixProductId, rader, choiceId);
    const nu = new Date().toISOString();
    const ovriga = (await this.dok(wixProductId)).filter((r) => r.choiceId !== choiceId);
    await this.skriv(wixProductId, [...ovriga, ...rader.map((r) => tillDokRad(r, nu))]);
  }

  async bekraftaWix(wixProductId: string, choiceId?: string): Promise<void> {
    const nu = new Date().toISOString();
    const rader = await this.dok(wixProductId);
    if (rader.length === 0) return;
    await this.skriv(
      wixProductId,
      rader.map((r) => (choiceId === undefined || r.choiceId === choiceId ? { ...r, wixBekraftadAt: nu } : r)),
    );
  }
}

/** En ersättning är obekräftad tills Wix läst tillbaka som raderna — samma regel som Postgres. */
function tillDokRad(r: TabellRad, nu: string): WixFargbildRad {
  return {
    choiceId: r.choiceId,
    choiceName: r.choiceName,
    ordning: r.ordning,
    filId: r.filId,
    plats: r.plats,
    givareId: r.givareId ?? null,
    skrivenAt: nu,
    wixBekraftadAt: null,
  };
}

let minne: MinnesFargbildLager | null = null;

/** Lagret i drift: Wix eller Postgres (lib/store/backend.ts), eller en lista i minnet när STORE_BACKEND=memory. */
export function getFargbildLager(): FargbildLager {
  switch (storeBackend()) {
    case "memory":
      return (minne ??= new MinnesFargbildLager());
    case "wix-data":
      return new WixFargbildLager();
    case "postgres":
      return new PostgresFargbildLager();
  }
}
