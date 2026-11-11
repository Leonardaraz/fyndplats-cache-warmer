// lib/medlem/ej-medlemspris.ts
//
// Flaggan "ej medlemspris" (medlemskapet E2): en produkt som Leonard undantar
// från medlemspriset, till exempel en vara som redan säljs med tunn marginal.
// Fältet `ejMedlemspris` på mappningen läses av golvrutten
// (lib/medlem/golv.ts): en flaggad produkt får inget golv, och butikens
// prismotor lämnar raden på listpriset.
//
// Sätts och tas bort på /admin/medlemmar med orsakskod och text, som skrivs
// till FyndplatsMedlemslogg (E1-11).
//
// ☠️ BARA FÄLTET ÄNDRAS. Raden skrivs aldrig om i sin helhet: Aosom-synken
// skriver samma rader (stämplar, lager), och en hel rad läst före synken och
// skriven efter hade tagit tillbaka synkens värden. `patcha` rör bara
// `ejMedlemspris`.
//
// ☠️ EN SAKNAD RAD SKAPAS ALDRIG. En produkt utan mappning har ingen kostnad
// och därmed inget medlemspris ändå.

import { allaRader, hamta, patcha, satt, taBortFalt } from "@/lib/db/wix-data-klient";
import type { ProductMappingRecord } from "@/lib/store";
import { storeBackend } from "@/lib/store/backend";
import { MAPPNINGAR_KOL } from "@/lib/store/wix-data";
import { logga, type Orsak } from "./admin";

const GUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/**
 * Wix-produktens id ur det admin klistrar in: id:t självt eller en adress som
 * bär det (produktsidan i Wix-panelen). Exakt ett id, annars null.
 */
export function lasProduktId(text: unknown): string | null {
  const traffar = [...new Set((String(text ?? "").match(GUID) ?? []).map((g) => g.toLowerCase()))];
  return traffar.length === 1 ? traffar[0] : null;
}

export interface FlaggadVara {
  wixProductId: string;
  /** Sidans titel när den är polerad, annars tom. */
  namn: string;
  leverantor: string;
}

/** Produkterna med flaggan: de med namn först i bokstavsordning, sedan de utan, på id. */
export async function varorUtanMedlemspris(): Promise<FlaggadVara[]> {
  const rader = await allaRader<ProductMappingRecord>(MAPPNINGAR_KOL, { filter: { ejMedlemspris: true }, sidstorlek: 500 });
  return rader
    .filter((r) => r.ejMedlemspris === true && typeof r.wixProductId === "string")
    .map((r) => ({ wixProductId: r.wixProductId, namn: r.seoTitle ?? "", leverantor: r.supplier ?? "" }))
    .sort((a, b) => Number(!a.namn) - Number(!b.namn) || (a.namn || a.wixProductId).localeCompare(b.namn || b.wixProductId, "sv"));
}

/** Sätter (`ej` true) eller tar bort flaggan på en produkt. "ok" eller ett besked till admin. */
export async function sattEjMedlemspris(produktId: string, ej: boolean, orsak: Orsak): Promise<string> {
  if (storeBackend() !== "wix-data") return "Mappningarna bor inte i Wix i den här miljön; flaggan går inte att sätta här.";
  const fore = await hamta<ProductMappingRecord>(MAPPNINGAR_KOL, produktId);
  if (!fore) return "Produkten har ingen mappning i motorn. Utan mappning finns ingen kostnad och inget medlemspris ändå.";
  if ((fore.ejMedlemspris === true) === ej) return ej ? "Produkten har redan flaggan." : "Produkten har inte flaggan.";
  const u = await patcha(MAPPNINGAR_KOL, produktId, [ej ? satt("ejMedlemspris", true) : taBortFalt("ejMedlemspris")]);
  if (u !== "applied") return "Ändringen gick inte igenom.";
  // Ett svar utan fel är inget kvitto: läs tillbaka innan loggen säger att det är gjort.
  const efter = await hamta<ProductMappingRecord>(MAPPNINGAR_KOL, produktId);
  if ((efter?.ejMedlemspris === true) !== ej) return "Wix svarade utan fel, men raden bär inte ändringen vid återläsning. Försök igen.";
  await logga({
    omrade: "admin",
    typ: ej ? "ej-medlemspris" : "medlemspris-igen",
    produktId,
    fore: { ejMedlemspris: fore.ejMedlemspris === true },
    efter: { ejMedlemspris: ej },
    orsakKod: orsak.kod,
    orsakText: orsak.text,
  });
  return "ok";
}
