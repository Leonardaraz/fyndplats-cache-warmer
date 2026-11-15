// GET och HEAD /feed/gz/<fil>
//
// Samma flöde som /feed/<fil>, ALLTID gzip-komprimerat. Det är den här adressen
// CDN:en håller en kopia av: en enda, lika för alla läsare.
//
// Ingen läsare har adressen. next.config.ts skriver om /feed/google.xml,
// /feed/products.xml, /feed/pricerunner.xml och /feed/pinterest.xml hit för den
// som tar emot gzip,
// och /api/cron/farska-floden hämtar dem varannan timme så att kopian finns.
// Varför det är två adresser i stället för Vary: Accept-Encoding står i
// lib/feed/prisjakt-svar.ts (mätt 2026-11-11: en kopia per rubriksträng).
//
// Flödet byggs av den vanliga ruttens GET utan anrop (lib/feed/byggare.ts), som
// Prisjakt- och PriceRunner-rutterna gör, så det finns en enda byggare per flöde.
//
// ☠️ Flödena i LAGRADE_FLODEN (Google, PriceRunner, Pinterest) svarar ur den
// sparade kopian i Vercels Runtime Cache när den är yngre än tre timmar, och
// byggs bara när den saknas (lib/feed/flodeslager.ts). CDN:en behåller inte ett
// flöde som hämtas en gång om dygnet (mätt 2026-11-15), så utan kopian väntade
// läsaren 50–78 s.
//
// HEAD bygger aldrig: CDN:en nycklar på metoden, och utan en egen HEAD körde
// Next GET och byggde hela flödet för ett svar utan kropp (52 s, mätt
// 2026-11-15). Se `huvudsvar` i lib/feed/prisjakt-svar.ts.

import { BYGGARE, arKomprimeratFlode } from "@/lib/feed/byggare";
import { arLagratFlode } from "@/lib/feed/flodeslager";
import { anvandbarKopia, anvandbartHuvud, sparaEfterSvaret } from "@/lib/feed/kopiesvar";
import {
  arTomtFlode,
  gzipFlode,
  huvudsvar,
  komprimeratSvar,
  komprimeratSvarUrKopia,
  lasare,
  tomtFlodeSvar,
} from "@/lib/feed/prisjakt-svar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Kontext = { params: Promise<{ fil: string }> };

function finnsInte(): Response {
  return new Response("Not found", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function GET(request: Request, { params }: Kontext) {
  const { fil } = await params;
  if (!arKomprimeratFlode(fil)) return finnsInte();
  const sparas = arLagratFlode(fil);
  if (sparas) {
    const kopia = await anvandbarKopia(fil, request, `/feed/gz/${fil}`);
    if (kopia) return komprimeratSvarUrKopia(kopia);
  }
  const byggd = Date.now();
  const xml = await (await BYGGARE[fil]()).text();
  if (arTomtFlode(xml)) return tomtFlodeSvar(`/feed/${fil}`);
  const gz = gzipFlode(xml);
  if (sparas) {
    console.log(`[flode] /feed/gz/${fil} byggdes på ${((Date.now() - byggd) / 1000).toFixed(1)} s, ingen kopia dög (${lasare(request)})`);
    sparaEfterSvaret(fil, `/feed/gz/${fil}`, byggd, xml, gz);
  }
  return komprimeratSvar(gz);
}

export async function HEAD(request: Request, { params }: Kontext) {
  const { fil } = await params;
  if (!arKomprimeratFlode(fil)) return finnsInte();
  console.log(`[flode] HEAD /feed/gz/${fil} (${lasare(request)})`);
  return huvudsvar({ komprimerat: true, kopia: arLagratFlode(fil) ? await anvandbartHuvud(fil) : null });
}
