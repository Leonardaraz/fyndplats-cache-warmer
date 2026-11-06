// /kassa — vår egen kassa (Leonards val 2026-11-05). Formuläret och
// summeringen är våra; Wix räknar och skapar ordern. Varukorgen skickar hit
// bara när växeln (lib/kassa/lage.ts) säger det.
//
// Betalningen: Stripe på sidan när båda nycklarna finns (STRIPE_SECRET_KEY och
// NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, Leonards val 2026-11-06), annars Wix
// betalsida som förut (lib/kassa/flode.ts). Nycklarna läses när sidan byggs.

import type { Metadata } from "next";
import { harStripe } from "@/lib/kassa/stripe";
import { Kassa } from "./kassa";

export const metadata: Metadata = {
  title: "Kassa",
  robots: { index: false, follow: false },
};

export default function KassaSida() {
  const nyckel = harStripe() ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || null : null;
  return <Kassa stripeNyckel={nyckel && /^pk_(test|live)_[A-Za-z0-9]+$/.test(nyckel) ? nyckel : null} />;
}
