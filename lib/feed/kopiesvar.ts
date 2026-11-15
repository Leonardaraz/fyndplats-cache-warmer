// lib/feed/kopiesvar.ts
//
// Det flödesrutterna gör med den sparade kopian (lib/feed/flodeslager.ts):
// läser den när den duger, och sparar det de själva byggt efter svaret.
//
// ☠️ `namn` står i loggen. Det hemliga Prisjakt-flödet skickar ett namn, aldrig
// sin adress.

import { after } from "next/server";
import { alderText, anvandbar, lasHuvud, lasKopia, sparaKopia, type Huvud, type Kopia } from "@/lib/feed/flodeslager";
import { gzipFlode, lasare } from "@/lib/feed/prisjakt-svar";

/** Kopian när den finns och är yngre än tre timmar, med en rad i loggen. Annars null: bygg. */
export async function anvandbarKopia(fil: string, request: Request, namn: string): Promise<Kopia | null> {
  const kopia = await lasKopia(fil);
  if (!kopia || !anvandbar(kopia.byggd)) return null;
  console.log(`[flode] ${namn} ur kopian, ${alderText(kopia.byggd)} gammal (${lasare(request)})`);
  return kopia;
}

/** Kopians pekare för HEAD, när kopian duger. */
export async function anvandbartHuvud(fil: string): Promise<Huvud | null> {
  const huvud = await lasHuvud(fil);
  return huvud && anvandbar(huvud.byggd) ? huvud : null;
}

/**
 * Sparar det som just byggdes, efter svaret: läsaren väntar inte på lagret.
 * `byggd` är när bygget började. `gz` skickas med när rutten redan gzippat.
 */
export function sparaEfterSvaret(fil: string, namn: string, byggd: number, xml: string, gz?: Uint8Array): void {
  after(async () => {
    const sparad = await sparaKopia(fil, gz ?? gzipFlode(xml), { byggd, xmlByte: Buffer.byteLength(xml) });
    if (!sparad) console.warn(`[flode] ${namn}: kopian sparades inte`);
  });
}
