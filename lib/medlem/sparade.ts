// lib/medlem/sparade.ts
//
// Sparade varukorgar på Mina sidor (medlemskapet E3; specen: "sparade
// varukorgar och Köp igen", tabellen saved_cart med id, profil, namn och
// rader). En medlem sparar sin varukorg som den är under ett namn, och lägger
// den senare i varukorgen igen med ett tryck. Gäller alla medlemmar, inte bara
// företag.
//
// Raderna kommer ur besökarens Wix-korg, som servern läser själv
// (`lasWixVarukorg`): webbläsaren skickar bara korgens id och namnet. Bara
// varor ur Wix Stores sparas. Priset sparas inte: när korgen läggs i igen
// gäller dagens pris, och katalogen avgör som för "Köp igen" vad som går att
// köpa (lib/medlem/kop-igen.ts).
//
// Ren modul: inga lokala imports utom typer, så att `node --test` kan läsa den.

import type { Varukorgsrad } from "./varukorg";
import type { Orderrad } from "./kop-igen";

/** Högst så många sparade varukorgar per konto. */
export const MAX_KORGAR = 20;
/** Högst så många rader i en sparad varukorg. */
export const MAX_RADER = 100;
export const NAMN_MAX = 60;
/** Högsta antal av en vara på en rad, samma som "Köp igen". */
export const MAX_ANTAL = 99;

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface SparadRad {
  produktId: string;
  variantId?: string;
  antal: number;
  /** Varans namn när korgen sparades, för listan på Mina sidor. */
  namn: string;
}

export interface SparadKorg {
  id: string;
  medlemsId: string;
  namn: string;
  rader: SparadRad[];
  skapad: string;
}

/** Det Mina sidor visar om en sparad varukorg. */
export interface SparadKorgVy {
  id: string;
  namn: string;
  antalVaror: number;
  /** De första varornas namn, högst tre. */
  forsta: string[];
  skapad: string;
}

/**
 * Sektionen på Mina sidor. Att spara följer växeln för E2/E3 (`prisOppet`):
 * korgarna är uppgifter om kontot som integritetstexten för E1 inte nämner,
 * och E2/E3 slås på först när tillägget till texten är godkänt. Korgar som
 * redan finns visas ändå, så att de går att lägga i varukorgen och ta bort.
 */
export function sparadeSektion(antal: number, oppet: boolean): { visas: boolean; kanSpara: boolean } {
  return { visas: oppet || antal > 0, kanSpara: oppet };
}

/** Ett id som "sk_" och 16 hexsiffror. Bara sådana id:n läses ur en förfrågan. */
export const arKorgId = (v: unknown): v is string => typeof v === "string" && /^sk_[0-9a-f]{16}$/.test(v);

function rensa(v: unknown, max: number): string {
  return String(v ?? "")
    .replace(/[\u0000-\u001f\u007f<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** Namnet kunden skrev, rensat; ett tomt namn blir "Varukorg <dag>". */
export function korgnamn(text: unknown, dag: string): string {
  return rensa(text, NAMN_MAX) || `Varukorg ${dag}`;
}

/** Besökarens Wix-korg → raderna som sparas. Bara Wix Stores; samma vara blir en rad. */
export function raderAttSpara(rader: readonly Varukorgsrad[], storesAppId: string): SparadRad[] {
  const ut = new Map<string, SparadRad>();
  for (const r of rader) {
    if (r.appId !== storesAppId || !GUID.test(r.produktId)) continue;
    const variantId = r.variantId && GUID.test(r.variantId) ? r.variantId : undefined;
    const antal = Math.max(1, Math.min(MAX_ANTAL, Math.floor(Number.isFinite(r.antal) ? r.antal : 1)));
    const nyckel = `${r.produktId}|${variantId ?? ""}`;
    const fanns = ut.get(nyckel);
    if (fanns) fanns.antal = Math.min(MAX_ANTAL, fanns.antal + antal);
    else if (ut.size < MAX_RADER) {
      ut.set(nyckel, { produktId: r.produktId, ...(variantId ? { variantId } : {}), antal, namn: rensa(r.namn, 120) || "Vara" });
    }
  }
  return [...ut.values()];
}

/** En rad i `FyndplatsSparadeKorgar` → korgen, eller null om raden är trasig. */
export function sparadKorgUrRad(d: Record<string, unknown>): SparadKorg | null {
  const id = typeof d._id === "string" ? d._id : typeof d.id === "string" ? d.id : "";
  const medlemsId = typeof d.medlemsId === "string" ? d.medlemsId : "";
  if (!arKorgId(id) || !medlemsId || !Array.isArray(d.rader)) return null;
  const rader: SparadRad[] = [];
  for (const x of d.rader as unknown[]) {
    const r = (x ?? {}) as Record<string, unknown>;
    if (typeof r.produktId !== "string" || !GUID.test(r.produktId)) continue;
    const antal = Number(r.antal);
    rader.push({
      produktId: r.produktId,
      ...(typeof r.variantId === "string" && GUID.test(r.variantId) ? { variantId: r.variantId } : {}),
      antal: Number.isFinite(antal) && antal >= 1 ? Math.min(MAX_ANTAL, Math.floor(antal)) : 1,
      namn: typeof r.namn === "string" && r.namn ? r.namn : "Vara",
    });
  }
  return {
    id,
    medlemsId,
    namn: typeof d.namn === "string" && d.namn ? d.namn : "Varukorg",
    rader,
    skapad: typeof d.skapad === "string" ? d.skapad : "",
  };
}

export function sparadKorgVy(k: SparadKorg): SparadKorgVy {
  return {
    id: k.id,
    namn: k.namn,
    antalVaror: k.rader.reduce((s, r) => s + r.antal, 0),
    forsta: k.rader.slice(0, 3).map((r) => r.namn),
    skapad: k.skapad,
  };
}

/** Raderna som "Köp igen" prövar mot katalogen (`kopIgen`): alla är varor. */
export function somOrderrader(k: SparadKorg): Orderrad[] {
  return k.rader.map((r) => ({ produktId: r.produktId, ...(r.variantId ? { variantId: r.variantId } : {}), antal: r.antal, raknas: true }));
}

/** Beskedet när en varukorg inte kunde sparas, per skäl. */
export function sparaFelText(skal: string | undefined): string {
  switch (skal) {
    case "tom":
      return "Varukorgen är tom, eller har bara varor som inte går att spara här.";
    case "for-manga":
      return `Du har redan ${MAX_KORGAR} sparade varukorgar. Ta bort en först.`;
    case "utloggad":
      return "Du har loggats ut. Logga in igen.";
    default:
      return "Varukorgen kunde inte sparas just nu. Försök igen om en stund.";
  }
}
