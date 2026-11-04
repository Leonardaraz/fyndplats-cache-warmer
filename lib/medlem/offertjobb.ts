// lib/medlem/offertjobb.ts
//
// Timjobbets skötsel av offerterna (E3-10), i den här ordningen:
//   1. Betald: en accepterad offert vars kassa blev en order (samma köpflöde)
//      blir betald. Det görs först, så att ett köp i sista stund inte märks
//      som utgånget.
//   2. Utgången: en prissatt eller accepterad offert efter sin sista dag.
//      Kassans länk dör senast när timjobbet tar bort den låsta korgen.
//   3. Mejlet "Offerten är klar" till kunden, exakt en gång (märket först,
//      tillbaka om mejlet inte gick iväg).
//
// Ett fel i en offert räknas och hoppas över; nästa körning försöker igen.
// Ren modul utan imports: Wix och Resend anropas genom beroendena.

export const OFFERTER_PER_KORNING = 10;

export interface Offertjobbsberoenden {
  iKassan(limit: number): Promise<{ id: string }[]>;
  kopfloden(offertId: string): Promise<string[]>;
  orderFinns(purchaseFlowId: string): Promise<boolean>;
  attLoptaUt(nuIso: string, limit: number): Promise<{ id: string; status: "prissatt" | "accepterad" | string }[]>;
  byt(id: string, fran: "prissatt" | "accepterad", till: "betald" | "utgangen"): Promise<boolean>;
  attMejla(limit: number): Promise<{ id: string; medlemsId: string; foretagNamn: string; giltigTill?: string }[]>;
  marka(id: string): Promise<boolean>;
  avmarka(id: string): Promise<void>;
  epost(medlemsId: string): Promise<string | null>;
  skicka(till: string, o: { id: string; foretagNamn: string; giltigTill?: string }): Promise<boolean>;
}

export interface Offertjobbsutfall {
  betalda: number;
  utgangna: number;
  mejlade: number;
  fel: number;
}

export async function skotOfferter(nuMs: number, b: Offertjobbsberoenden): Promise<Offertjobbsutfall> {
  const ut: Offertjobbsutfall = { betalda: 0, utgangna: 0, mejlade: 0, fel: 0 };

  for (const { id } of (await b.iKassan(OFFERTER_PER_KORNING)).slice(0, OFFERTER_PER_KORNING)) {
    try {
      for (const pf of await b.kopfloden(id)) {
        if (await b.orderFinns(pf)) {
          if (await b.byt(id, "accepterad", "betald")) ut.betalda++;
          break;
        }
      }
    } catch {
      ut.fel++;
    }
  }

  for (const o of (await b.attLoptaUt(new Date(nuMs).toISOString(), OFFERTER_PER_KORNING)).slice(0, OFFERTER_PER_KORNING)) {
    if (o.status !== "prissatt" && o.status !== "accepterad") continue;
    try {
      // En accepterad offert kan ha betalats sedan steg 1 läste: kolla en gång till.
      if (o.status === "accepterad") {
        let betald = false;
        for (const pf of await b.kopfloden(o.id)) if (await b.orderFinns(pf)) betald = true;
        if (betald) {
          if (await b.byt(o.id, "accepterad", "betald")) ut.betalda++;
          continue;
        }
      }
      if (await b.byt(o.id, o.status, "utgangen")) ut.utgangna++;
    } catch {
      ut.fel++;
    }
  }

  for (const o of (await b.attMejla(OFFERTER_PER_KORNING)).slice(0, OFFERTER_PER_KORNING)) {
    try {
      if (!(await b.marka(o.id))) continue;
      const till = await b.epost(o.medlemsId);
      if (!till) continue;
      if (await b.skicka(till, o)) {
        ut.mejlade++;
      } else {
        await b.avmarka(o.id);
        ut.fel++;
      }
    } catch {
      ut.fel++;
    }
  }
  return ut;
}
