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
// hade behållit sin gamla tid. Wix i drift (lib/store/backend.ts), en lista i
// minnet när STORE_BACKEND=memory (dev och test).

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

/**
 * En rad per fil i Wix, `_id` = fil-id, med `forstSedd` och `senastSedd`.
 *
 * De befintliga raderna läses först och skrivs sedan i omgångar: en fil som
 * redan står där behåller sin
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
    // ☠️ Varje fil måste ha fått en tid. En fil utan tid hade annars kunnat
    // tolkas som "ingen karens" av en framtida ändring här.
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
  }
}

/** Endast för tester: ett nytt, tomt lager i minnet. */
export function nyttMinnesKarens(): KarensLager {
  return new MinnesKarens();
}
