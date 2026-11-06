// lib/medlem/foretagsmejl.ts
//
// Mejlet "Ditt företagskonto är godkänt" (E3-3). Godkännandet görs i motorns
// admin, som bara skriver profilen; butikens timjobb (/api/cron/medlemskorgar,
// varje timme kl :41) hittar godkända profiler utan mejl och skickar det.
// Så behöver motorn varken butikens mejlnyckel eller en hemlig rutt i butiken,
// och kunden får mejlet inom en timme.
//
// Exakt en gång: profilen märks först (villkoret: inte märkt), och mejlet går
// bara till den som fick märka. Går mejlet inte iväg tas märket bort, så att
// nästa körning försöker igen.
//
// Ren modul utan imports: Wix och Resend anropas genom beroendena.

/** Högst så många mejl per körning, så att en körning aldrig drar ut. */
export const MEJL_PER_KORNING = 10;

export interface Foretagsmejlberoenden {
  /** Godkända företag utan mejl, högst `limit`. */
  attMejla(limit: number): Promise<{ medlemsId: string; namn: string }[]>;
  /** Märker profilen. false: någon annan hann före, eller profilen finns inte. */
  marka(medlemsId: string): Promise<boolean>;
  /** Tar bort märket efter ett mejl som inte gick iväg. */
  avmarka(medlemsId: string): Promise<void>;
  /** Medlemmens e-post, eller null om kontot inte finns eller är spärrat. */
  epost(medlemsId: string): Promise<string | null>;
  skicka(till: string, namn: string): Promise<boolean>;
}

export interface Foretagsmejlutfall {
  provade: number;
  skickade: number;
  fel: number;
}

export async function mejlaGodkandaForetag(b: Foretagsmejlberoenden): Promise<Foretagsmejlutfall> {
  const ut: Foretagsmejlutfall = { provade: 0, skickade: 0, fel: 0 };
  for (const { medlemsId, namn } of (await b.attMejla(MEJL_PER_KORNING)).slice(0, MEJL_PER_KORNING)) {
    ut.provade++;
    try {
      if (!(await b.marka(medlemsId))) continue;
      const till = await b.epost(medlemsId);
      // Ett konto som inte finns eller är spärrat får inget mejl; märket står
      // kvar så att profilen inte provas varje timme.
      if (!till) continue;
      if (await b.skicka(till, namn)) {
        ut.skickade++;
      } else {
        await b.avmarka(medlemsId);
        ut.fel++;
      }
    } catch {
      ut.fel++;
    }
  }
  return ut;
}
