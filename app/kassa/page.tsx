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
import { harStripe } from "@/lib/kassa/stripe";
import { getSocialProof } from "@/lib/social-proof-live";
import { lastKorgForKassan } from "@/lib/kassa/medlemskassa";
import { Kassa } from "./kassa";

export const metadata: Metadata = {
  title: "Kassa",
  robots: { index: false, follow: false },
};

export default async function KassaSida() {
  const nyckel = harStripe() ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || null : null;
  // Google-betyget i summeringen: samma hämtning som sidfoten gör på varje sida
  // (cachad i 6 h), så det kostar inget extra anrop.
  const betyg = (await getSocialProof()).rating;
  const stripeNyckel = nyckel && /^pk_(test|live)_[A-Za-z0-9]+$/.test(nyckel) ? nyckel : null;
  // Medlemskorgen med låsta priser, när kakan pekar ut en som hör till den
  // inloggade medlemmen (lib/kassa/medlemskassa.ts). Bara med Stripe.
  const last = stripeNyckel ? await lastKorgForKassan() : null;
  return <Kassa stripeNyckel={stripeNyckel} betyg={betyg} last={last} />;
}
