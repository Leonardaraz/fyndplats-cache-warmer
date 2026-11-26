// lib/feed/flodeslager.ts
//
// Den senaste komprimerade kopian av ett flöde, sparad i Vercels Runtime Cache,
// så att den som hämtar flödet aldrig väntar medan det byggs.
//
// VARFÖR (mätt 2026-11-15). CDN:en behåller inte ett flöde som hämtas en gång
// om dygnet. Varje körning av /api/cron/farska-floden fick MISS på Pinterest-,
// Google- och PriceRunner-flödet, fast förra körningen byggt kopian två timmar
// tidigare och den skulle ha gällt i tre. Vercel skriver själva att sällan
// hämtade svar kan försvinna ur regionens cache (vercel.com/docs/caching/
// cdn-cache, Limits). Läsarna (Google Merchant Center, PriceRunner, Pinterest,
// Prisjakt) fick därför nästan alltid vänta på ett bygge: 50–78 s, och
// Pinterest lika länge till för sin HEAD (se `huvudsvar` i
// lib/feed/prisjakt-svar.ts).
//
// HUR.
// - /api/cron/farska-floden bygger Google-flödet varannan timme, gör de andra
//   ur det och sparar gzip-filerna här. /feed/gz/<fil>, /feed/<fil> och den
//   hemliga Prisjakt-adressen svarar ur kopian när den är yngre än tre timmar
//   (LAGER_MAX_ALDER_S, samma gräns som FLODE_CACHE). Annars byggs flödet som
//   förut, och det som byggdes sparas efter svaret.
// - ☠️ En post får vara högst 2 MB (vercel.com/docs/runtime-cache, Limits), och
//   Pinterest-flödet är 2,9 MB som gzip. Filen sparas därför i bitar om 512 kB
//   (base64, eftersom värdet skickas som JSON) under en egen generation, och
//   pekas ut av en liten post med generationen, längden och kontrollsumman.
// - ☠️ Paketets `set` sväljer sina fel: det loggar och ger upp efter 500 ms.
//   Bitarna läses därför tillbaka INNAN pekaren skrivs, och pekaren läses
//   tillbaka efteråt. En halv sparning lämnar den förra kopian orörd.
// - En kopia som inte stämmer med sin kontrollsumma räknas som ingen kopia, och
//   flödet byggs. Lagret kan göra flödet snabbare, aldrig fel.
// - Nyckeln bär driftsättningen (VERCEL_DEPLOYMENT_ID): en ny deploy läser
//   aldrig en kopia som äldre kod byggde. Förhandsbyggen och produktionen har
//   var sin cache (Vercel håller isär miljöerna).
//
// Utanför Vercel (lokalt och i proven) blir lagret ett minne i processen, och
// paketet varnar en gång i loggen.
//
// Inga relativa importer, så att `node --test` kan ladda modulen.

import { createHash, randomUUID } from "node:crypto";
import { getCache } from "@vercel/functions";

/**
 * Flödena som sparas. Var och ett står också i KOMPRIMERADE_FLODEN
 * (lib/feed/prisjakt-svar.ts), utom GoWish-flödet, som sedan 2026-11-26 bara
 * har sin hemliga adress (lib/feed/hemlig-adress.ts); provet håller ihop
 * listorna. Alla tre byggs ur Google-flödet, så jobbet bygger Google en gång.
 * Det hemliga Prisjakt-flödet sparas också, under PRISJAKT_HEMLIG_KOPIA
 * (lib/feed/prisjakt-hemlig.ts). Produktflödet sparas inte: det hämtas ofta
 * nog för att CDN:en ska behålla det (HIT och STALE i varje körning).
 */
export const LAGRADE_FLODEN = ["google.xml", "pricerunner.xml", "pinterest.xml", "gowish.xml"] as const;

export type LagratFlode = (typeof LAGRADE_FLODEN)[number];

export function arLagratFlode(fil: string): fil is LagratFlode {
  return (LAGRADE_FLODEN as readonly string[]).includes(fil);
}

/** En kopia äldre än så här används inte: då byggs flödet som förut. */
export const LAGER_MAX_ALDER_S = 3 * 3600;
/** Hur länge Vercel håller posterna: längre än gränsen ovan, så att en sen körning hinner. */
export const LAGER_TTL_S = 4 * 3600;
/** Råa byte per bit. 512 kB blir 683 kB som base64, långt under postgränsen på 2 MB. */
export const LAGER_BIT_BYTE = 512 * 1024;
const VERSION = 1;

/** Det lilla av Runtime Cache som används här. Proven skickar in ett eget. */
export type Lager = {
  get(nyckel: string): Promise<unknown>;
  set(nyckel: string, varde: unknown, opts?: { ttl?: number; name?: string }): Promise<void>;
};

type Pekare = { v: number; gen: string; byggd: number; gzByte: number; xmlByte: number; delar: number; sha256: string };

/** En kopia ur lagret: gzip-filen, när bygget BÖRJADE och den okomprimerade storleken. */
export type Kopia = { gz: Buffer<ArrayBuffer>; byggd: number; xmlByte: number };
/** Pekaren utan filen: det HEAD behöver. */
export type Huvud = { byggd: number; gzByte: number; xmlByte: number };

type Val = { lager?: Lager; deploy?: string };

function vercelsLager(): Lager {
  return getCache({
    namespace: "fyndplats-flode",
    // Paketets egen nyckel-hash är 32 bitar. sha256 krockar inte.
    keyHashFunction: (nyckel) => createHash("sha256").update(nyckel).digest("hex"),
  });
}

/**
 * Sant när posterna hamnar i Vercels Runtime Cache, falskt när de bara lever i
 * processens minne (då hjälper kopian bara samma instans). Samma prov som
 * paketet gör.
 */
export function arVercelsLager(): boolean {
  const g = globalThis as unknown as Record<symbol, { get?: () => { cache?: unknown } } | undefined>;
  const ctx = g[Symbol.for("@vercel/request-context")]?.get?.();
  return Boolean(ctx?.cache) || Boolean(process.env.RUNTIME_CACHE_ENDPOINT && process.env.RUNTIME_CACHE_HEADERS);
}

function driftsattning(): string {
  return process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_GIT_COMMIT_SHA || "lokal";
}

function pekarnyckel(fil: string, deploy: string): string {
  return `flode:v${VERSION}:${deploy}:${fil}`;
}

function bitnyckel(fil: string, deploy: string, gen: string, i: number): string {
  return `${pekarnyckel(fil, deploy)}:${gen}:${i}`;
}

/** gzip-filen i bitar, som base64. */
export function delaIBitar(gz: Uint8Array, bitByte = LAGER_BIT_BYTE): string[] {
  const delar: string[] = [];
  for (let i = 0; i < gz.byteLength; i += bitByte) {
    delar.push(Buffer.from(gz.buffer, gz.byteOffset + i, Math.min(bitByte, gz.byteLength - i)).toString("base64"));
  }
  return delar;
}

/** Bitarna ihop igen, eller null när någon saknas eller inte är en sträng. */
export function sattIhop(delar: readonly unknown[]): Buffer<ArrayBuffer> | null {
  if (!delar.every((d) => typeof d === "string")) return null;
  return Buffer.concat((delar as string[]).map((d) => Buffer.from(d, "base64")));
}

function sha256(b: Uint8Array): string {
  return createHash("sha256").update(b).digest("hex");
}

const heltal = (x: unknown): x is number => typeof x === "number" && Number.isSafeInteger(x) && x >= 0;

function arPekare(x: unknown): x is Pekare {
  if (!x || typeof x !== "object") return false;
  const p = x as Record<string, unknown>;
  return (
    p.v === VERSION &&
    typeof p.gen === "string" &&
    p.gen.length > 0 &&
    heltal(p.byggd) &&
    heltal(p.gzByte) &&
    heltal(p.xmlByte) &&
    heltal(p.delar) &&
    p.delar === Math.ceil((p.gzByte as number) / LAGER_BIT_BYTE) &&
    typeof p.sha256 === "string" &&
    /^[0-9a-f]{64}$/.test(p.sha256)
  );
}

/** Sant när kopian får användas: yngre än LAGER_MAX_ALDER_S. */
export function anvandbar(byggd: number, nu = Date.now()): boolean {
  return nu - byggd < LAGER_MAX_ALDER_S * 1000;
}

/** Kopians ålder för loggen: "1,2 h" eller "14 min". */
export function alderText(byggd: number, nu = Date.now()): string {
  const min = Math.max(0, Math.round((nu - byggd) / 60_000));
  return min < 60 ? `${min} min` : `${(min / 60).toFixed(1).replace(".", ",")} h`;
}

async function lasPekare(fil: string, val: Val): Promise<Pekare | null> {
  const lager = val.lager ?? vercelsLager();
  const pekare = await lager.get(pekarnyckel(fil, val.deploy ?? driftsattning()));
  return arPekare(pekare) ? pekare : null;
}

/** Bara pekaren, utan att filen läses. Null när ingen kopia finns eller lagret inte svarar. */
export async function lasHuvud(fil: string, val: Val = {}): Promise<Huvud | null> {
  try {
    const p = await lasPekare(fil, val);
    return p && { byggd: p.byggd, gzByte: p.gzByte, xmlByte: p.xmlByte };
  } catch (e) {
    console.warn(`[flodeslager] ${fil}: lagret gick inte att läsa (${(e as Error).message})`);
    return null;
  }
}

/**
 * Hela kopian, kontrollerad mot pekarens längd och kontrollsumma. Null när
 * ingen kopia finns, när en bit saknas eller inte stämmer, och när lagret inte
 * svarar: då byggs flödet som förut.
 */
export async function lasKopia(fil: string, val: Val = {}): Promise<Kopia | null> {
  try {
    const lager = val.lager ?? vercelsLager();
    const deploy = val.deploy ?? driftsattning();
    const p = await lasPekare(fil, { lager, deploy });
    if (!p) return null;
    const delar = await Promise.all(Array.from({ length: p.delar }, (_, i) => lager.get(bitnyckel(fil, deploy, p.gen, i))));
    const gz = sattIhop(delar);
    if (!gz || gz.byteLength !== p.gzByte || sha256(gz) !== p.sha256) {
      console.warn(`[flodeslager] ${fil}: kopian i lagret är ofullständig och används inte. Flödet byggs.`);
      return null;
    }
    return { gz, byggd: p.byggd, xmlByte: p.xmlByte };
  } catch (e) {
    console.warn(`[flodeslager] ${fil}: lagret gick inte att läsa (${(e as Error).message})`);
    return null;
  }
}

/**
 * Sparar gzip-filen som flödets kopia. Sant först när både bitarna och pekaren
 * har lästs tillbaka och stämmer. Falskt betyder att den förra kopian (om det
 * fanns en) fortfarande gäller.
 *
 * `byggd` är när bygget BÖRJADE: det var då Wix lästes, och kopians ålder
 * räknas därifrån.
 */
export async function sparaKopia(
  fil: string,
  gz: Uint8Array,
  meta: { byggd: number; xmlByte: number },
  val: Val = {},
): Promise<boolean> {
  try {
    const lager = val.lager ?? vercelsLager();
    const deploy = val.deploy ?? driftsattning();
    const gen = randomUUID();
    const delar = delaIBitar(gz);
    // Bitarna: skriv, läs tillbaka, och skriv om de som inte kom tillbaka
    // lika. Två varv: en skrivning som gav upp efter 500 ms får ett försök till.
    let saknas = delar.map((_, i) => i);
    for (let varv = 0; varv < 2 && saknas.length > 0; varv++) {
      await Promise.all(
        saknas.map((i) => lager.set(bitnyckel(fil, deploy, gen, i), delar[i], { ttl: LAGER_TTL_S, name: `flode-${fil}-${i + 1}` })),
      );
      const lasta = await Promise.all(saknas.map((i) => lager.get(bitnyckel(fil, deploy, gen, i))));
      saknas = saknas.filter((i, j) => lasta[j] !== delar[i]);
    }
    if (saknas.length > 0) return false;
    const pekare: Pekare = {
      v: VERSION,
      gen,
      byggd: meta.byggd,
      gzByte: gz.byteLength,
      xmlByte: meta.xmlByte,
      delar: delar.length,
      sha256: sha256(gz),
    };
    // Pekaren sist, och läst tillbaka. Hann en samtidig sparning skriva en
    // minst lika ny kopia efter vår, räknas det som sparat.
    for (let varv = 0; varv < 2; varv++) {
      await lager.set(pekarnyckel(fil, deploy), pekare, { ttl: LAGER_TTL_S, name: `flode-${fil}` });
      const last = await lasPekare(fil, { lager, deploy });
      if (last && (last.gen === gen || last.byggd >= meta.byggd)) return true;
    }
    return false;
  } catch (e) {
    console.warn(`[flodeslager] ${fil}: kopian gick inte att spara (${(e as Error).message})`);
    return false;
  }
}
