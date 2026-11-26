// lib/feed/byggare.ts
//
// Vem som bygger vilket komprimerat flöde: den vanliga ruttens GET, anropad
// utan anrop utifrån, så att det finns en enda byggare per flöde.
// /feed/gz/<fil> bygger med kartan när ingen sparad kopia duger, och
// /api/cron/farska-floden bygger flödena i LAGRADE_FLODEN med den och sparar dem
// (lib/feed/flodeslager.ts).
//
// lib/feed/prisjakt-svar.test.ts håller nycklarna lika med KOMPRIMERADE_FLODEN.

import { GET as google } from "@/app/feed/google.xml/route";
import { GET as produkter } from "@/app/feed/products.xml/route";
import { GET as pricerunner } from "@/app/feed/pricerunner.xml/route";
import { GET as pinterest } from "@/app/feed/pinterest.xml/route";
import type { KOMPRIMERADE_FLODEN } from "@/lib/feed/prisjakt-svar";

export type KomprimeratFlode = (typeof KOMPRIMERADE_FLODEN)[number];

export const BYGGARE: Record<KomprimeratFlode, () => Promise<Response>> = {
  "google.xml": () => google(),
  "products.xml": () => produkter(),
  "pricerunner.xml": () => pricerunner(),
  "pinterest.xml": () => pinterest(),
};

export function arKomprimeratFlode(fil: string): fil is KomprimeratFlode {
  return Object.hasOwn(BYGGARE, fil);
}
