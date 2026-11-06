// lib/kassa/stripe-las.ts
//
// Stripe-kassans lås: en rad i Wix CMS (FyndplatsKassaBetalningar) per
// PaymentIntent, med betalningens id som radens id. Infogningen är ett anspråk
// (lib/wix-lager.ts `infoga`): bara den som skapar raden äger den. Raden bär
// steget och ordern, så att en avbruten körning fortsätter där den slutade
// (lib/kassa/flode.ts, slutforStripe).

import { hamta, infoga, K, spara } from "@/lib/wix-lager";
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
