// /kassa — vår egen kassa (Leonards val 2026-11-05). Formuläret och
// summeringen är våra; Wix räknar och skapar ordern. Varukorgen skickar hit
// bara när växeln (lib/kassa/lage.ts) säger det.
//
// Medlemskorgen (E2/E3): pekar kakan fp_kassa_korg ut en låst korg som hör till
// den inloggade medlemmen betalas den i stället för besökarens vanliga korg.
//
// Betalningen: Stripe på sidan när båda nycklarna finns (STRIPE_SECRET_KEY och
// NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, Leonards val 2026-11-06), annars Wix
// betalsida som förut (lib/kassa/flode.ts). Nycklarna läses när sidan byggs.

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { preload } from "react-dom";
import { harStripe } from "@/lib/kassa/stripe";
import { STRIPE_JS } from "@/lib/kassa/stripe-klient";
import { LAST_KORG_KAKA } from "@/lib/kassa/lastkorg";
import { getSocialProof } from "@/lib/social-proof-live";
import { lastKorgForKassan } from "@/lib/kassa/medlemskassa";
import { Kassa } from "./kassa";

export const metadata: Metadata = {
  title: "Kassa",
  robots: { index: false, follow: false },
};

export default async function KassaSida() {
  const nyckel = harStripe() ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || null : null;
  const stripeNyckel = nyckel && /^pk_(test|live)_[A-Za-z0-9]+$/.test(nyckel) ? nyckel : null;
  // Stripe.js börjar hämtas med sidan när det finns en varukorg (kakan fp_cart
  // eller medlemskorgens), inte först i kassans effekt efter sidans egen kod
  // (useStripeBetalning): snabbkassans knapp och betalfältet väntar på filen.
  // Förladdningen står i sidans HTML (<link rel="preload"> i <head>) och följer
  // vid ett mjukt sidbyte med som en ledtråd i sidans data, alltså redan när
  // varukorgen förhämtar kassan (components/cart.tsx). Bara hämtning: skriptet
  // körs först när kassan anropar loadStripe, som förut. Samma adress som
  // loadStripe lägger in (STRIPE_JS), annars hämtas filen två gånger.
  const kakor = await cookies();
  if (stripeNyckel && (kakor.has("fp_cart") || kakor.has(LAST_KORG_KAKA))) preload(STRIPE_JS, { as: "script" });
  // Samtidigt, inte efter varandra:
  // - Google-betyget i summeringen: samma hämtning som sidfoten gör på varje
  //   sida (cachad i 6 h), så det kostar inget extra anrop.
  // - Medlemskorgen med låsta priser, när kakan pekar ut en som hör till den
  //   inloggade medlemmen (lib/kassa/medlemskassa.ts). Bara med Stripe.
  const [socialt, last] = await Promise.all([getSocialProof(), stripeNyckel ? lastKorgForKassan() : null]);
  return <Kassa stripeNyckel={stripeNyckel} betyg={socialt.rating} last={last} />;
}
