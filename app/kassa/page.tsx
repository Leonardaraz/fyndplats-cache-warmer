// /kassa — vår egen kassa (Leonards val 2026-11-05). Formuläret och
// summeringen är våra; Wix räknar och skapar ordern, och kunden betalar på Wix
// betalsida (lib/kassa/flode.ts). Varukorgen skickar hit bara när växeln
// (lib/kassa/lage.ts) säger det.

import type { Metadata } from "next";
import { Kassa } from "./kassa";

export const metadata: Metadata = {
  title: "Kassa",
  robots: { index: false, follow: false },
};

export default function KassaSida() {
  return <Kassa />;
}
