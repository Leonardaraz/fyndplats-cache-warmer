// lib/kassa/stripe-las.ts
//
// Stripe-kassans lås: en rad i Wix CMS (FyndplatsKassaBetalningar) per
// PaymentIntent, med betalningens id som radens id. Infogningen är ett anspråk
// (lib/wix-lager.ts `infoga`): bara den som skapar raden äger den. Raden bär
// steget och ordern, så att en avbruten körning fortsätter där den slutade
// (lib/kassa/flode.ts, slutforStripe).

import { andringar, hamta, infoga, K, patcha, spara } from "@/lib/wix-lager";
import type { StripeLas } from "./flode";

const STEG = new Set<StripeLas["steg"]>(["pagar", "order", "registrera", "klar", "fel"]);

function lasAv(rad: Record<string, unknown>, cartId: string): StripeLas {
  const steg = typeof rad.steg === "string" && STEG.has(rad.steg as StripeLas["steg"]) ? (rad.steg as StripeLas["steg"]) : "pagar";
  return {
    cartId: typeof rad.cartId === "string" ? rad.cartId : cartId,
    steg,
    ...(typeof rad.orderId === "string" && rad.orderId ? { orderId: rad.orderId } : {}),
    at: Number(rad.at) || 0,
  };
}

export async function tagLas(avsiktId: string, las: StripeLas): Promise<"tagen" | StripeLas> {
  if ((await infoga(K.kassaBetalningar, avsiktId, { ...las })) === "skapad") return "tagen";
  const rad = await hamta(K.kassaBetalningar, avsiktId);
  // Raden fanns men är borta nu: behandla den som övergiven, så att nästa
  // steg tar över den i stället för att vänta för evigt.
  return rad ? lasAv(rad, las.cartId) : { cartId: las.cartId, steg: "pagar", at: 0 };
}

export async function sparaLas(avsiktId: string, las: StripeLas): Promise<void> {
  await spara(K.kassaBetalningar, avsiktId, { ...las });
}

/**
 * Tar över ett övergivet lås, men bara om raden fortfarande är den som lästes
 * (samma steg och `at`): en villkorad skrivning (compare-and-set i Wix). Två
 * körningar som ser samma övergivna lås, till exempel webhookens omförsök och
 * nätet, kan annars båda ta över och lägga ordern på samma korg (auditen
 * 2026-11-06). En rad som försvunnit (`at` 0 från tagLas) skapas igen med ett
 * anspråk, så att bara en vinner också då. Sant bara för den som tog över.
 */
export async function taOverLas(avsiktId: string, forra: StripeLas, ny: StripeLas): Promise<boolean> {
  if (!forra.at) return (await infoga(K.kassaBetalningar, avsiktId, { ...ny })) === "skapad";
  const u = await patcha(K.kassaBetalningar, avsiktId, andringar({ ...ny }), { steg: forra.steg, at: forra.at });
  return u.utfall === "applied";
}
