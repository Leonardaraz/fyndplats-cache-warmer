// Vilka fakturor och kvitton som har skickats, en rad per order och typ.
//
// ☠️ RADEN TAS FÖRE UTSKICKET, inte efter. Webhooken och timcronen kan se samma
// order samtidigt (Wix skickar dessutom `approved` två gånger med en minuts
// mellanrum, uppmätt på order 10079). Den som får in raden skickar, den andra
// hoppar. Faller utskicket släpps raden igen, så nästa körning försöker på nytt.
//
// I Postgres skapas tabellen vid första användningen, som färgbildstabellen
// (lib/db/schema.ts). I Wix är det kollektionen FyndplatsFakturaUtskick.

import { sql } from "@/lib/db/client";
import { hamta, infoga, patcha, satt, taBort, taBortFalt } from "@/lib/db/wix-data-klient";
import { NYA } from "@/lib/db/wix-kollektioner";
import { storeBackend } from "@/lib/store/backend";

export type Utskickstyp = "faktura" | "kvitto";

export const FAKTURA_DDL: string[] = [
  `create table if not exists faktura_utskick (
     order_id    text not null,
     typ         text not null,
     ordernummer text not null,
     tagen_at    timestamptz not null default now(),
     skickad_at  timestamptz,
     resend_id   text,
     primary key (order_id, typ)
   )`,
];

export interface Utskickslogg {
  /** Sant om raden togs nu. Falskt om någon redan har den. */
  ta(orderId: string, typ: Utskickstyp, ordernummer: string): Promise<boolean>;
  /** Utskicket gick igenom. */
  bekrafta(orderId: string, typ: Utskickstyp, resendId: string | undefined): Promise<void>;
  /** Utskicket föll. Raden släpps så att nästa körning försöker igen. */
  slapp(orderId: string, typ: Utskickstyp): Promise<void>;
  /** Har typen skickats (eller tagits) för ordern? */
  finns(orderId: string, typ: Utskickstyp): Promise<boolean>;
  /** När typen skickades, eller null. Kvittot visar fakturans datum härifrån. */
  skickad(orderId: string, typ: Utskickstyp): Promise<Date | null>;
}

let skapad = false;

async function q() {
  const s = sql();
  if (!skapad) {
    for (const ddl of FAKTURA_DDL) await s.query(ddl);
    skapad = true;
  }
  return s;
}

export const postgresUtskickslogg: Utskickslogg = {
  async ta(orderId, typ, ordernummer) {
    const s = await q();
    const rader = await s`insert into faktura_utskick (order_id, typ, ordernummer)
      values (${orderId}, ${typ}, ${ordernummer})
      on conflict (order_id, typ) do nothing
      returning order_id`;
    return rader.length > 0;
  },
  async bekrafta(orderId, typ, resendId) {
    const s = await q();
    await s`update faktura_utskick set skickad_at = now(), resend_id = ${resendId ?? null}
      where order_id = ${orderId} and typ = ${typ}`;
  },
  async slapp(orderId, typ) {
    const s = await q();
    await s`delete from faktura_utskick where order_id = ${orderId} and typ = ${typ} and skickad_at is null`;
  },
  async finns(orderId, typ) {
    const s = await q();
    const rader = await s`select 1 from faktura_utskick where order_id = ${orderId} and typ = ${typ} limit 1`;
    return rader.length > 0;
  },
  async skickad(orderId, typ) {
    const s = await q();
    const rader = (await s`select skickad_at from faktura_utskick
      where order_id = ${orderId} and typ = ${typ} and skickad_at is not null limit 1`) as { skickad_at: string | Date }[];
    return rader.length ? new Date(rader[0].skickad_at) : null;
  },
};

/** Radens id i Wix: en per order och typ, samma nyckel som Postgres primärnyckel. */
export function utskicksId(orderId: string, typ: Utskickstyp): string {
  return `${orderId}__${typ}`;
}

/**
 * Samma regler i Wix. Raden tas med ett ANSPRÅK (insert): Wix vägrar ett id
 * som finns (WDE0074), och den som får in raden skickar. Ett tvetydigt svar
 * avgörs av klientens återläsning (lib/db/wix-data-klient.ts#infoga), så ett
 * nätverksfel kan inte få två körningar att båda tro att de äger raden.
 */
export const wixUtskickslogg: Utskickslogg = {
  async ta(orderId, typ, ordernummer) {
    return (
      (await infoga(NYA.fakturaUtskick, utskicksId(orderId, typ), {
        orderId,
        typ,
        ordernummer,
        tagenAt: new Date().toISOString(),
      })) === "skapad"
    );
  },
  async bekrafta(orderId, typ, resendId) {
    await patcha(NYA.fakturaUtskick, utskicksId(orderId, typ), [
      satt("skickadAt", new Date().toISOString()),
      resendId ? satt("resendId", resendId) : taBortFalt("resendId"),
    ]);
  },
  async slapp(orderId, typ) {
    // Bara en rad som INTE är skickad släpps — samma villkor som Postgres.
    await taBort(NYA.fakturaUtskick, utskicksId(orderId, typ), { skickadAt: { $exists: false } });
  },
  async finns(orderId, typ) {
    return (await hamta(NYA.fakturaUtskick, utskicksId(orderId, typ))) !== null;
  },
  async skickad(orderId, typ) {
    const rad = await hamta<{ skickadAt?: string }>(NYA.fakturaUtskick, utskicksId(orderId, typ));
    return rad?.skickadAt ? new Date(rad.skickadAt) : null;
  },
};

let minneslogg: ReturnType<typeof minnesUtskickslogg> | null = null;

/** Loggen i drift: Wix eller Postgres (lib/store/backend.ts), minnet när STORE_BACKEND=memory. */
export function getUtskickslogg(): Utskickslogg {
  switch (storeBackend()) {
    case "memory":
      return (minneslogg ??= minnesUtskickslogg());
    case "wix-data":
      return wixUtskickslogg;
    case "postgres":
      return postgresUtskickslogg;
  }
}

/** För tester: samma regler i minnet. */
export function minnesUtskickslogg(
  nu: () => Date = () => new Date(),
): Utskickslogg & { rader: Map<string, { skickad: boolean; resendId?: string; at?: Date }> } {
  const rader = new Map<string, { skickad: boolean; resendId?: string; at?: Date }>();
  const nyckel = (o: string, t: Utskickstyp) => `${o}:${t}`;
  return {
    rader,
    async ta(o, t) {
      if (rader.has(nyckel(o, t))) return false;
      rader.set(nyckel(o, t), { skickad: false });
      return true;
    },
    async bekrafta(o, t, id) {
      rader.set(nyckel(o, t), { skickad: true, resendId: id, at: nu() });
    },
    async slapp(o, t) {
      if (rader.get(nyckel(o, t))?.skickad === false) rader.delete(nyckel(o, t));
    },
    async finns(o, t) {
      return rader.has(nyckel(o, t));
    },
    async skickad(o, t) {
      const r = rader.get(nyckel(o, t));
      return r?.skickad && r.at ? r.at : null;
    },
  };
}
