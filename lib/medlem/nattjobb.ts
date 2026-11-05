// lib/medlem/nattjobb.ts
//
// Medlemskapets dagliga jobb (specen, "Dagligen"): avstämning mot Orders-API:t,
// bakåtläsning tills liggaren är komplett, nivån per medlem, mejl vid ny nivå
// och varning 14 dagar före en sänkning, exakt en gång (E1-7, E1-9, E1-10).
//
// Körs 04:40 UTC, efter order-sync och utanför Aosoms synkfönster
// (:12–:29 var tredje timme). Allt räknas i svensk tid.
//
// Svaret och loggarna bär bara antal: aldrig e-post, belopp eller ordernummer.

import { lasBakat, stamAv } from "./liggare";
import {
  aktuellaRegler,
  allaMedlemmar,
  gallraInloggningar,
  liggarlage,
  liggarraderBetaldaSedan,
  loggaTyst,
  medlemsLage,
  sparaLiggarlage,
  sparaNivabyte,
  uppdateraMedlem,
} from "./lager";
import { dagTillDatum, medlemsbeslut, stockholmsDag } from "./niva";
import type { Liggarrad } from "./orderliggare";
import { lageFor } from "./konto";
import { skickaNivaSjunker, skickaNyNiva } from "./mejl";

export const BAKAT_DAGAR = 400;
export const AVSTAMNING_TIMMAR = 48;
/** Inloggningsförsök sparas i 30 dagar (integritetstexten). */
export const INLOGGNINGAR_DAGAR = 30;

export interface Nattutfall {
  avstamning: { lasta: number; nya: number; andrade: number; avvikelser: number; fel: number; summaStammerInte: number; klar: boolean };
  bakat: { lasta: number; nya: number; fel: number; klar: boolean } | null;
  medlemmar: { antal: number; andrade: number; nyNiva: number; varningar: number; mejlFel: number; fel: number } | null;
  gallrade: { borttagna: number; fel: number } | null;
  lage: string;
}

export async function korNattjobb(slutMs: number): Promise<Nattutfall> {
  const nuMs = Date.now();
  const nuIso = new Date(nuMs).toISOString();
  const status = await liggarlage();
  const startad = status.startad ?? nuIso;

  // 1. Avstämningen: 48 timmar bakåt.
  const sedan = new Date(nuMs - AVSTAMNING_TIMMAR * 3_600_000).toISOString();
  const a = await stamAv(sedan, slutMs, status.startad ? new Date(Date.parse(status.startad) + 10 * 60_000).toISOString() : undefined);

  // 2. Bakåtläsningen, tills den är klar.
  let bakat: Nattutfall["bakat"] = null;
  let position = status.bakatPosition;
  let bakatKlar = status.bakatKlar === true;
  if (!bakatKlar) {
    const fran = position ?? new Date(nuMs - BAKAT_DAGAR * 86_400_000).toISOString();
    const b = await lasBakat(fran, slutMs);
    bakat = { lasta: b.lasta, nya: b.nya, fel: b.fel, klar: b.klar && b.fel === 0 };
    // Positionen flyttas bara fram när varje order gick att läsa: annars hade
    // en order som felade i natt hamnat bakom positionen och aldrig lästs.
    if (b.position && b.fel === 0) position = b.position;
    bakatKlar = bakat.klar;
  }
  await sparaLiggarlage({ startad, bakatKlar, ...(position ? { bakatPosition: position } : {}), senastAvstamd: nuIso });

  // 3. Nivåerna. Bara när medlemskapet är på, och bara när liggaren är komplett:
  // en halv liggare hade sänkt nivåer som inte ska sänkas.
  const lage = await medlemsLage();
  let medlemmar: Nattutfall["medlemmar"] = null;
  if (lage !== "av" && bakatKlar) {
    const regler = await aktuellaRegler();
    const rader = await liggarraderBetaldaSedan(new Date(nuMs - BAKAT_DAGAR * 86_400_000).toISOString());
    const perEpost = new Map<string, Liggarrad[]>();
    for (const r of rader) if (r.epost) perEpost.set(r.epost, [...(perEpost.get(r.epost) ?? []), r]);
    const alla = await allaMedlemmar();
    medlemmar = { antal: alla.length, andrade: 0, nyNiva: 0, varningar: 0, mejlFel: 0, fel: 0 };
    const idag = dagTillDatum(stockholmsDag(nuMs));
    for (const m of alla) {
      if (m.status !== "aktiv") continue;
      if (Date.now() > slutMs) break;
      try {
        const l = lageFor(m, perEpost.get(m.epost) ?? [], regler, nuMs);
        const { falt, nyNiva, varning } = medlemsbeslut(m, l, regler, nuIso);
        if (nyNiva) {
          if (await skickaNyNiva(m.epost, l)) {
            falt.meddeladNiva = l.niva.namn;
            medlemmar.nyNiva++;
            await loggaTyst({ omrade: "mejl", typ: "ny-niva", medlemsId: m.id, efter: { niva: l.niva.namn }, aktor: "system" });
          } else medlemmar.mejlFel++;
        }
        if (varning) {
          if (await skickaNivaSjunker(m.epost, l)) {
            falt.varnadFor = varning;
            medlemmar.varningar++;
            await loggaTyst({ omrade: "mejl", typ: "niva-sjunker", medlemsId: m.id, efter: { ...varning }, aktor: "system" });
          } else medlemmar.mejlFel++;
        }
        if (falt.niva !== undefined) {
          await sparaNivabyte({ medlemsId: m.id, datum: idag, fran: m.niva ?? null, till: l.niva.namn, kOre: l.kOre });
        }
        if (Object.keys(falt).length) {
          await uppdateraMedlem(m.id, falt);
          medlemmar.andrade++;
        }
      } catch (e) {
        medlemmar.fel++;
        console.error("[medlem] nattjobbet: en medlem gick inte att räkna:", e instanceof Error ? e.message.slice(0, 120) : e);
      }
    }
  }

  // 4. Gallringen av inloggningsförsöken.
  let gallrade: Nattutfall["gallrade"] = null;
  try {
    gallrade = await gallraInloggningar(new Date(nuMs - INLOGGNINGAR_DAGAR * 86_400_000).toISOString());
  } catch (e) {
    gallrade = { borttagna: 0, fel: 1 };
    console.error("[medlem] gallringen gick inte:", e instanceof Error ? e.message.slice(0, 120) : e);
  }

  return {
    gallrade,
    avstamning: { lasta: a.lasta, nya: a.nya, andrade: a.andrade, avvikelser: a.avvikelser, fel: a.fel, summaStammerInte: a.summaStammerInte, klar: a.klar },
    bakat,
    medlemmar,
    lage,
  };
}
