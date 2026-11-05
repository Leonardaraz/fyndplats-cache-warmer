// Vilka fakturor och kvitton som har skickats, en rad per order och typ.
//
// ☠️ RADEN TAS FÖRE UTSKICKET, inte efter. Webhooken och timcronen kan se samma
// order samtidigt (Wix skickar dessutom `approved` två gånger med en minuts
// mellanrum, uppmätt på order 10079). Den som får in raden skickar, den andra
// hoppar. Faller utskicket släpps raden igen, så nästa körning försöker på nytt.
//
// Raderna bor i Wix, kollektionen FyndplatsFakturaUtskick. De bodde i Postgres
// till 2026-10-29; den vägen togs bort 2026-11-05.

import { hamta, infoga, patcha, satt, taBort, taBortFalt } from "@/lib/db/wix-data-klient";
import { NYA } from "@/lib/db/wix-kollektioner";
import { storeBackend } from "@/lib/store/backend";

export type Utskickstyp = "faktura" | "kvitto";

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

/** Radens id i Wix: en per order och typ. */
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
    // Bara en rad som INTE är skickad släpps.
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

/** Loggen i drift: Wix, eller minnet när STORE_BACKEND=memory (lib/store/backend.ts). */
export function getUtskickslogg(): Utskickslogg {
  switch (storeBackend()) {
    case "memory":
      return (minneslogg ??= minnesUtskickslogg());
    case "wix-data":
      return wixUtskickslogg;
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
