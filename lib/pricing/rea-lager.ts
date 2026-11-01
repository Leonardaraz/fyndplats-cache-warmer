// Rea-jobbets lagring i Wix CMS (`FyndplatsPrisforlopp`): prisförloppet per
// produkt och variant, jobbets tillstånd och lås. Reglerna bor i rea.ts,
// körningen i rea-kor.ts.
//
// EN RAD PER PRODUKT, med `_id` = Wix-produktens id och en lista varianter med
// var sin historik. Bara produkter som någon gång gått att köpa får en rad: ett
// utkast som aldrig visats har ingen historik att föra, och när det publiceras
// börjar historiken där (och då är varan ny, utan rea, i 30 dagar).
//
// Tillståndet och låset ligger i samma kollektion, på raderna `tillstand` och
// `las`. De bär inget `productId` och sorteras bort när förloppen läses.
//
// Butikens dagliga prisavläsning (`FyndplatsPrishistorik`) läses en gång, när
// historiken fylls bakåt (`seed`). Den ägs av butiken (headless-site
// lib/price-snapshot.ts) och skrivs aldrig härifrån.

import { allaRader, hamta, sparaManga, taBortManga } from "../db/wix-data-klient";
import { slappLasIKollektion, tagLasIKollektion, uppdateraRadIKollektion } from "../db/kontrollrader";
import { PRIS_KOL } from "../db/wix-kollektioner";
import type { Lucka, Prispunkt } from "./rea";

/** Butikens dagliga avläsning, en rad per produkt och dag (headless-site lib/wix-lager.ts). */
export const BUTIKENS_PRISHISTORIK = "FyndplatsPrishistorik";

const TILLSTAND = "tillstand";
const LAS = "las";

export interface Variantforlopp {
  id: string;
  punkter: Prispunkt[];
}

export interface Prisforlopp {
  productId: string;
  varianter: Variantforlopp[];
}

export interface ReaTillstand {
  /**
   * Strömbrytaren. Av: historiken förs, men inga jämförpriser skrivs. Slås på och av
   * med workflowen ("Rea — automatisk reaskylt", lägena `pa` och `av`).
   */
  skriv: boolean;
  /** Historiken är fylld bakåt ur butikens dagliga avläsning. Före det skrivs inga jämförpriser. */
  seedKlar: boolean;
  seedAt?: string;
  /** När en körning senast sparade historiken (ISO). */
  senast?: string;
  /** Tider utan avläsning (rea.ts, `Lucka`). */
  luckor: Lucka[];
}

export const TOMT_TILLSTAND: ReaTillstand = { skriv: false, seedKlar: false, luckor: [] };

export interface Dagsavlasning {
  productId: string;
  /** "2026-10-31" */
  datum: string;
  prisOre: number;
}

export interface ReaLager {
  lasTillstand(): Promise<ReaTillstand>;
  /** Bara de angivna fälten, aldrig hela raden (lib/db/kontrollrader.ts). */
  uppdateraTillstand(andring: Partial<ReaTillstand>): Promise<void>;
  /** Låset. Sant om vi fick det: ingen annan körning håller ett som inte gått ut. */
  tagLas(agare: string, nu: number, ttlMs: number): Promise<boolean>;
  slappLas(agare: string): Promise<void>;
  allaForlopp(): Promise<Prisforlopp[]>;
  /** Sparar förloppen. Svarar med produkt-id för dem Wix inte bekräftade. */
  sparaForlopp(rader: Prisforlopp[]): Promise<string[]>;
  /** Tar bort förloppen. Svarar med produkt-id för dem som inte gick att ta bort. */
  taBortForlopp(productIds: string[]): Promise<string[]>;
  /** Butikens dagliga avläsning, alla rader. */
  butikensHistorik(): Promise<Dagsavlasning[]>;
}

/** En rad ur kollektionen som förlopp, eller null för tillståndet, låset och trasiga rader. */
export function tillForlopp(rad: Record<string, unknown>): Prisforlopp | null {
  const productId = typeof rad.productId === "string" ? rad.productId : "";
  if (!productId || !Array.isArray(rad.varianter)) return null;
  const varianter: Variantforlopp[] = [];
  for (const v of rad.varianter as unknown[]) {
    if (!v || typeof v !== "object") continue;
    const o = v as Record<string, unknown>;
    if (typeof o.id !== "string" || !o.id || !Array.isArray(o.punkter)) continue;
    const punkter: Prispunkt[] = [];
    for (const x of o.punkter as unknown[]) {
      if (!x || typeof x !== "object") continue;
      const q = x as Record<string, unknown>;
      if (typeof q.t !== "string") continue;
      if (q.p !== null && !(typeof q.p === "number" && Number.isInteger(q.p) && q.p > 0)) continue;
      punkter.push({ t: q.t, p: q.p as number | null });
    }
    varianter.push({ id: o.id, punkter });
  }
  return { productId, varianter };
}

export class WixReaLager implements ReaLager {
  async lasTillstand(): Promise<ReaTillstand> {
    const rad = await hamta<Partial<ReaTillstand>>(PRIS_KOL.forlopp, TILLSTAND);
    return { ...TOMT_TILLSTAND, ...(rad ?? {}), luckor: Array.isArray(rad?.luckor) ? rad!.luckor : [] };
  }

  async uppdateraTillstand(andring: Partial<ReaTillstand>): Promise<void> {
    await uppdateraRadIKollektion(PRIS_KOL.forlopp, TILLSTAND, TOMT_TILLSTAND, andring);
  }

  async tagLas(agare: string, nu: number, ttlMs: number): Promise<boolean> {
    return tagLasIKollektion(PRIS_KOL.forlopp, LAS, agare, nu, ttlMs);
  }

  async slappLas(agare: string): Promise<void> {
    await slappLasIKollektion(PRIS_KOL.forlopp, LAS, agare);
  }

  async allaForlopp(): Promise<Prisforlopp[]> {
    const rader = await allaRader<Record<string, unknown>>(PRIS_KOL.forlopp, {});
    const ut: Prisforlopp[] = [];
    for (const r of rader) {
      const f = tillForlopp(r);
      if (f) ut.push(f);
    }
    return ut;
  }

  async sparaForlopp(rader: Prisforlopp[]): Promise<string[]> {
    if (rader.length === 0) return [];
    const u = await sparaManga(
      PRIS_KOL.forlopp,
      rader.map((r) => ({ id: r.productId, data: { productId: r.productId, varianter: r.varianter } })),
    );
    return u.fel.map((f) => f.id);
  }

  async taBortForlopp(productIds: string[]): Promise<string[]> {
    if (productIds.length === 0) return [];
    const u = await taBortManga(PRIS_KOL.forlopp, productIds);
    return u.fel.map((f) => String(f).slice(0, 80));
  }

  async butikensHistorik(): Promise<Dagsavlasning[]> {
    const rader = await allaRader<Record<string, unknown>>(BUTIKENS_PRISHISTORIK, {
      falt: ["productId", "observedOn", "priceMinor"],
    });
    const ut: Dagsavlasning[] = [];
    for (const r of rader) {
      const productId = typeof r.productId === "string" ? r.productId : "";
      const datum = typeof r.observedOn === "string" ? r.observedOn.slice(0, 10) : "";
      const prisOre = typeof r.priceMinor === "number" ? r.priceMinor : Number(r.priceMinor);
      if (!productId || !/^\d{4}-\d{2}-\d{2}$/.test(datum) || !Number.isInteger(prisOre) || prisOre <= 0) continue;
      ut.push({ productId, datum, prisOre });
    }
    return ut;
  }
}
