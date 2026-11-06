// /kassa/klar — dit Wix-sidorna på checkout.fyndplats.se skickar kunden när
// hen lämnar dem (betalsidans logga, Wix tomma startsida). Wix betalsida har
// ingen adress tillbaka till oss (lib/kassa/flode.ts), så sidan avgör var
// kunden ska: tacksidan om betalningen är klar, kassan om den väntar, annars
// butiken. Se Tillbaka.

import type { Metadata } from "next";
import { Tillbaka } from "./tillbaka";

export const metadata: Metadata = {
  title: "Ett ögonblick",
  robots: { index: false, follow: false },
};

export default function KassaKlar() {
  return <Tillbaka />;
}
