// GPSR-uppgifterna per VEVOR-artikel i Wix CMS (FyndplatsVevorGpsr).
//
// En rad per artikel, nyckel VEVOR:s artikelnummer, som avläsningarna
// (lib/vevor/lager.ts). Kollektionen har behörigheten ADMIN: raderna bär
// artikelnumret, och butiken läser uppgifterna via motorns /api/gpsr.
//
// Raden skrivs bara av /api/admin/vevor-gpsr. En rad som någon ändrat för hand
// i Wix CMS prövas igen vid läsningen (`tolkaRad` och `gpsrStatus`), så en
// halv eller felstavad part blir aldrig "komplett".

import { allaRader, fraga, spara, taBort } from "@/lib/db/wix-data-klient";
import { VEVOR_KOL } from "@/lib/db/wix-kollektioner";
import type { GpsrPart, VevorGpsr } from "./gpsr";

export interface VevorGpsrRad extends VevorGpsr {
  sku: string;
  /** När raden skrevs, ISO. */
  at: string;
}

export interface GpsrLager {
  las(skus: string[]): Promise<Map<string, VevorGpsrRad>>;
  /** Alla rader. Kollektionen har bara de artiklar som fått uppgifter. */
  alla(): Promise<VevorGpsrRad[]>;
  spara(rad: VevorGpsrRad): Promise<void>;
  taBort(sku: string): Promise<void>;
}

function part(v: unknown): GpsrPart | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.namn !== "string" || typeof o.adress !== "string" || typeof o.epost !== "string") return null;
  return { namn: o.namn, adress: o.adress, epost: o.epost };
}

/** En lagrad rad, eller null när den inte går att läsa som en GPSR-rad. */
export function tolkaRad(r: Record<string, unknown>): VevorGpsrRad | null {
  if (typeof r.sku !== "string" || !r.sku) return null;
  return {
    sku: r.sku,
    tillverkare: part(r.tillverkare),
    euAnsvarig: part(r.euAnsvarig),
    kalla: typeof r.kalla === "string" ? r.kalla : "",
    at: typeof r.at === "string" ? r.at : "",
  };
}

function iOmgangar<T>(lista: T[], n: number): T[][] {
  const ut: T[][] = [];
  for (let i = 0; i < lista.length; i += n) ut.push(lista.slice(i, i + n));
  return ut;
}

export const wixGpsrLager: GpsrLager = {
  async las(skus) {
    const ut = new Map<string, VevorGpsrRad>();
    for (const del of iOmgangar([...new Set(skus)], 100)) {
      const rader = await fraga<Record<string, unknown>>(VEVOR_KOL.gpsr, { filter: { _id: { $in: del } }, limit: 1000 });
      for (const r of rader) {
        const rad = tolkaRad(r);
        if (rad && del.includes(rad.sku)) ut.set(rad.sku, rad);
      }
    }
    return ut;
  },
  async alla() {
    const rader = await allaRader<Record<string, unknown>>(VEVOR_KOL.gpsr, { sidstorlek: 1000 });
    return rader.map(tolkaRad).filter((r): r is VevorGpsrRad => r !== null);
  },
  async spara(rad) {
    await spara(VEVOR_KOL.gpsr, rad.sku, { ...rad } as unknown as Record<string, unknown>);
  },
  async taBort(sku) {
    await taBort(VEVOR_KOL.gpsr, sku);
  },
};
