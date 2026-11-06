// lib/medlem/golv.ts
//
// Golvpriset G per variant för butikens prismotor (medlemskapet E2 och E3).
// Butiken skickar de Wix-produkter och varianter som ligger i en varukorg eller
// visas på en produktsida, och får tillbaka golvet för varje rad.
//
// Regeln ur specifikationen: G = C × golvfaktorn × (1 + moms), där C är den
// landade kostnaden exkl. moms (inköpspris plus frakt). Golvfaktorn är 1,10
// [P6], och momsen är 25 % på hela sortimentet. Radpriset går aldrig under G.
//
// ☠️ KOSTNADEN ÄR HEMLIG. Därför:
//   - G avrundas UPPÅT till hela kronor. Ett medlemspris som stannar på golvet
//     visar då inte C på öret för den som läser formeln i det publika repot.
//     Avrundningen höjer bara golvet, så marginalen skyddas mer, aldrig mindre.
//   - C går bara till butikens server, för prisbeslutsloggen (E2-9). Den får
//     aldrig nå webbläsaren eller en loggrad.
//
// En rad får inget golv, och därmed inget medlemspris, när:
//   - produkten saknar mappning eller variantens kostnad är okänd;
//   - leverantören är AliExpress: kostnaden fryser vid importen och följer
//     inte leverantörens pris (docs/claude/14-prissattningen.md);
//   - produkten är i en levande fyndauktion: auktionen äger priset;
//   - produkten är flaggad "ej medlemspris" i admin.
//
// Varianten matchas på Wix-variantens id. Saknas en träff används den HÖGSTA
// kostnaden bland produktens varianter, så att golvet aldrig hamnar under den
// dyraste varianten. Saknar någon variant kostnad blir det inget golv alls.

import { createHash, timingSafeEqual } from "node:crypto";
import { assertNever } from "@/lib/assert-never";
import type { ProductMappingRecord } from "@/lib/store";
import { mappingSupplier } from "@/lib/store/supplier";

/**
 * Bara butikens hemlighet, `Authorization: Bearer REVIEW_INGEST_SECRET`, som de
 * två projekten redan delar. Inte CRON_SECRET, som finns i GitHub Actions:
 * svaret bär kostnaden. Samma jämförelse som Prisjakt-rutten.
 */
export function golvAuktoriserad(
  authorization: string | null,
  hemlighet: string | undefined = process.env.REVIEW_INGEST_SECRET,
): "ok" | "nej" | "osatt" {
  if (!hemlighet) return "osatt";
  const summa = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(summa(authorization ?? ""), summa(`Bearer ${hemlighet}`)) ? "ok" : "nej";
}

/** Golvfaktorn i promille: 1,10 × C [P6]. */
export const GOLVFAKTOR_PROMILLE = 1100;
/** Momsen på sortimentet i procent. */
export const MOMS_PROCENT = 25;
/** Så många rader tar ett anrop. En varukorg eller en produktsida räcker långt. */
export const MAX_RADER = 200;

export type Utanskal =
  | "saknar-mappning"
  | "saknar-kostnad"
  | "aliexpress"
  | "okand-leverantor"
  | "auktion"
  | "flaggad";

export interface Golvfraga {
  produktId: string;
  variantId?: string | null;
}

export interface Golvrad {
  produktId: string;
  variantId: string | null;
  /** G per styck inkl. moms, i öre, uppåt till hela kronor. null: ingen rabatt. */
  golvOre: number | null;
  /** C per styck exkl. moms, i öre. Bara när golvet finns. Aldrig till webbläsaren. */
  kostnadOre: number | null;
  /** Varför raden saknar golv. */
  utan?: Utanskal;
  /** Varianten saknade träff, och den högsta kostnaden användes. */
  hogstaVariant?: true;
}

/** G ur C, båda i öre: C × 1,10 × 1,25 uppåt till öre, sedan uppåt till kronor. */
export function golvAvKostnad(kostnadOre: number): number {
  if (!Number.isSafeInteger(kostnadOre) || kostnadOre <= 0) throw new Error(`kostnaden måste vara ett positivt heltal, fick ${kostnadOre}`);
  const namnare = 1000 * 100;
  const exakt = Math.ceil((kostnadOre * GOLVFAKTOR_PROMILLE * (100 + MOMS_PROCENT)) / namnare);
  return Math.ceil(exakt / 100) * 100;
}

function kostnadIOre(v: { landedCostSek?: number } | undefined): number | null {
  const kr = v?.landedCostSek;
  if (typeof kr !== "number" || !Number.isFinite(kr) || kr <= 0) return null;
  return Math.round(kr * 100);
}

/** Wix ger en produkt utan val den här varianten. */
const STANDARDVARIANT = "00000000-0000-0000-0000-000000000000";

function variantensKostnad(
  m: ProductMappingRecord,
  variantId: string | null,
): { kostnadOre: number; hogstaVariant: boolean } | null {
  const varianter = Array.isArray(m.variants) ? m.variants : [];
  if (varianter.length === 0) return null;
  if (variantId && variantId !== STANDARDVARIANT) {
    const traff = varianter.find((v) => v.wixVariantId === variantId);
    if (traff) {
      const c = kostnadIOre(traff);
      return c === null ? null : { kostnadOre: c, hogstaVariant: false };
    }
  }
  if (varianter.length === 1) {
    const c = kostnadIOre(varianter[0]);
    return c === null ? null : { kostnadOre: c, hogstaVariant: false };
  }
  // Ingen träff bland flera varianter: den dyraste, och bara om alla har en kostnad.
  const alla = varianter.map(kostnadIOre);
  if (alla.some((c) => c === null)) return null;
  return { kostnadOre: Math.max(...(alla as number[])), hogstaVariant: true };
}

/** Leverantörens besked: får raden ett golv, eller varför inte. */
function leverantorensBesked(m: ProductMappingRecord): Utanskal | null {
  const lev = mappingSupplier(m);
  switch (lev) {
    case "aosom":
    case "vevor":
      return null;
    case "aliexpress":
      return "aliexpress";
    case "okand":
      return "okand-leverantor";
    default:
      return assertNever(lev, "leverantör");
  }
}

/** Golvet för varje fråga, i samma ordning. */
export function golvFor(
  fragor: readonly Golvfraga[],
  mappningar: ReadonlyMap<string, ProductMappingRecord>,
  levandeAuktioner: ReadonlySet<string>,
): Golvrad[] {
  return fragor.map((f) => {
    const variantId = f.variantId ?? null;
    const utan = (skal: Utanskal): Golvrad => ({ produktId: f.produktId, variantId, golvOre: null, kostnadOre: null, utan: skal });
    const m = mappningar.get(f.produktId);
    if (!m) return utan("saknar-mappning");
    if (levandeAuktioner.has(f.produktId)) return utan("auktion");
    if (m.ejMedlemspris === true) return utan("flaggad");
    const besked = leverantorensBesked(m);
    if (besked) return utan(besked);
    const k = variantensKostnad(m, variantId);
    if (!k) return utan("saknar-kostnad");
    return {
      produktId: f.produktId,
      variantId,
      golvOre: golvAvKostnad(k.kostnadOre),
      kostnadOre: k.kostnadOre,
      ...(k.hogstaVariant ? { hogstaVariant: true as const } : {}),
    };
  });
}

/** Butikens fråga, prövad. null: fel form. */
export function lasFragor(v: unknown): Golvfraga[] | null {
  const rader = (v as { rader?: unknown } | null)?.rader;
  if (!Array.isArray(rader) || rader.length === 0 || rader.length > MAX_RADER) return null;
  const id = (x: unknown) => typeof x === "string" && /^[A-Za-z0-9-]{1,64}$/.test(x);
  const ut: Golvfraga[] = [];
  for (const r of rader) {
    const p = r as { produktId?: unknown; variantId?: unknown } | null;
    if (!p || !id(p.produktId)) return null;
    if (p.variantId != null && !id(p.variantId)) return null;
    ut.push({ produktId: p.produktId as string, variantId: (p.variantId as string | undefined) ?? null });
  }
  return ut;
}
