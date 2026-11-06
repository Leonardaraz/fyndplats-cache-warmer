// /kassa/klar — dit kunden kommer tillbaka efter betalningen:
//   • från Klarna via Stripe (/api/kassa/stripe/retur, ?avsikt=pi_…): servern
//     gör ordern och kunden går till tacksidan;
//   • från Wix-sidorna på checkout.fyndplats.se (betalsidans logga, Wix tomma
//     startsida). Wix betalsida har ingen adress tillbaka till oss
//     (lib/kassa/flode.ts), så sidan avgör var kunden ska: tacksidan om
//     betalningen är klar, kassan om den väntar, annars butiken.
// Se Tillbaka.

import type { Metadata } from "next";
import { Tillbaka } from "./tillbaka";

export const metadata: Metadata = {
  title: "Ett ögonblick",
  robots: { index: false, follow: false },
};

export default function KassaKlar() {
  return <Tillbaka />;
}
