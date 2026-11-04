// lib/auction/trettio-dagar.ts
//
// FYNDAUKTIONENS 30-DAGARSSPÄRR. Ren logik, inga sidoeffekter.
//
// Leonard 2026-11-04: spärren gäller alltid, inte bara under Black Week.
//
// VARFÖR. Under auktionen står produktens ordinarie pris överstruket
// (compareAtPrice = listpriset, lib/auction/store.ts). Det är ett påstående om
// en prissänkning, och 7 a § prisinformationslagen kräver att det överstrukna
// priset är det LÄGSTA vi tagit de 30 dagarna före sänkningen. Har priset
// höjts inom 30 dagar, eller varit lägre av något annat skäl, är det
// överstrukna ordinarie priset för högt. Med tio fynd om dagen, och 50–100
// under Black Week, blir det annars allt fler varor där det inte håller.
//
// NÄR. Auktionens första sänkning kommer ett steg efter start (08:00 när
// starten är 07:00). Fönstret är de 30 dygnen före den, plus ett dygn
// (`MARGINAL_MS`), samma som rea-jobbet: historiken ser en prisändring upp
// till ett dygn sent.
//
// TVÅ SKÄL ATT STOPPA ETT FYND:
//
//   prishistorik     historiken (FyndplatsPrisforlopp, som rea-jobbet för) visar
//                    ett lägre pris i fönstret, eller kan inte belägga hela
//                    fönstret: varianten saknas, historiken börjar för sent,
//                    varianten gick inte att köpa när fönstret började, eller
//                    en lucka i avläsningen ligger i fönstret.
//   nyssAuktionerad  produktens förra auktion slutade inom fönstret. Historiken
//                    ser inte auktionens priser (lib/pricing/rea.ts), så
//                    auktionsraden är beviset.
//
// Varje osäkerhet stoppar fyndet. Ett fynd som inte blir av kostar ingenting;
// ett överstruket pris som lagen inte tillåter är just det spärren finns för.

import { FONSTER_MS, MARGINAL_MS, luckaIFonstret, trappa, type Lucka, type Prispunkt } from "../pricing/rea";
import type { Prisforlopp } from "../pricing/rea-lager";
import type { AuctionDoc } from "./engine";

/** Varför en variant inte klarar fönstret. */
export type Historikdetalj = "lagre_pris" | "ofullstandig" | "ny" | "lucka" | "saknar_variant";

export type TrettioUtfall =
  | { ok: true }
  | { ok: false; skal: "prishistorik"; detalj: Historikdetalj }
  | { ok: false; skal: "nyssAuktionerad" };

/** Tidpunkten för auktionens första sänkning: ett steg efter start. */
export function forstaSankning(startAt: string, stepMinutes = 60): number {
  return Date.parse(startAt) + stepMinutes * 60_000;
}

/** Var fönstret börjar för en första sänkning vid `tSankning` (ms). */
export function fonsterFran(tSankning: number): number {
  return tSankning - FONSTER_MS - MARGINAL_MS;
}

/** Slutade produktens förra auktion inom fönstret före `tSankning`? */
export function slutadeInomFonstret(
  forra: Pick<AuctionDoc, "status" | "endedAt"> | undefined,
  tSankning: number,
): boolean {
  if (!forra || (forra.status !== "sold" && forra.status !== "expired")) return false;
  // En avslutad rad utan slut går inte att placera i tiden: den stoppar.
  if (!forra.endedAt) return true;
  const slut = Date.parse(forra.endedAt);
  return !Number.isFinite(slut) || slut > fonsterFran(tSankning);
}

/**
 * En variants historik mot dess startpris.
 *
 * @param punkter    variantens historik (öre), i valfri ordning
 * @param listOre    startpriset i öre, det som står överstruket under auktionen
 * @param tSankning  auktionens första sänkning (ms)
 * @param nuMs       nu: priset `listOre` gäller härifrån om historiken inte redan säger det
 */
export function variantKlarar(
  punkter: readonly Prispunkt[],
  listOre: number,
  tSankning: number,
  nuMs: number,
): "ok" | Exclude<Historikdetalj, "lucka" | "saknar_variant"> {
  const seg = trappa(punkter, Math.min(nuMs, tSankning));
  if (seg.length === 0) return "ofullstandig";
  // Startpriset gäller från nu fram till sänkningen. Det kan inte sänka det
  // lägsta priset under startpriset, så jämförelsen nedan blir densamma; det
  // gör bara att "gick inte att köpa" på slutet inte räknas som tomt fönster.
  const sista = seg[seg.length - 1];
  if (sista.p !== listOre && nuMs < tSankning) seg.push({ start: nuMs, p: listOre });

  const fran = fonsterFran(tSankning);
  if (seg[0].start > fran) return "ofullstandig";
  let vidStart: number | null = null;
  for (const s of seg) if (s.start <= fran) vidStart = s.p;
  // Gick varianten inte att köpa när fönstret började är den ny i butiken
  // (samma hållning som rea.ts): ett lägsta pris kan inte beläggas.
  if (vidStart === null) return "ny";

  let lagsta = Infinity;
  for (let j = 0; j < seg.length; j++) {
    const p = seg[j].p;
    if (p === null) continue;
    const slut = j + 1 < seg.length ? seg[j + 1].start : Infinity;
    if (slut > fran && seg[j].start < tSankning && p < lagsta) lagsta = p;
  }
  if (!Number.isFinite(lagsta)) return "ny";
  return lagsta < listOre ? "lagre_pris" : "ok";
}

/**
 * Klarar produkten spärren för en auktion vars första sänkning är `tSankning`?
 *
 * @param varianter  auktionens varianter: Wix-variant-id och startpris i öre
 * @param forlopp    produktens historik ur FyndplatsPrisforlopp (saknas = ingen historik)
 * @param luckor     tider utan avläsning (rea-jobbets tillstånd)
 * @param forra      produktens auktionsrad, om den finns (en rad per produkt)
 */
export function trettioDagar(args: {
  varianter: ReadonlyArray<{ id: string; listOre: number }>;
  forlopp: Prisforlopp | undefined;
  luckor: readonly Lucka[];
  forra: Pick<AuctionDoc, "status" | "endedAt"> | undefined;
  tSankning: number;
  nuMs: number;
}): TrettioUtfall {
  const { varianter, forlopp, luckor, forra, tSankning, nuMs } = args;
  if (slutadeInomFonstret(forra, tSankning)) return { ok: false, skal: "nyssAuktionerad" };
  if (varianter.length === 0) return { ok: false, skal: "prishistorik", detalj: "saknar_variant" };
  if (luckaIFonstret(luckor, new Date(fonsterFran(tSankning)).toISOString(), tSankning)) {
    return { ok: false, skal: "prishistorik", detalj: "lucka" };
  }
  const perId = new Map((forlopp?.varianter ?? []).map((v) => [v.id, v.punkter]));
  for (const v of varianter) {
    let punkter = perId.get(v.id);
    // En produkt utan val har en enda variant. Mappningens variant-id och
    // historikens (Read-Only Variants API) kan skrivas olika för den, så en
    // mot en räcker där.
    if (!punkter && varianter.length === 1 && forlopp?.varianter.length === 1) punkter = forlopp.varianter[0].punkter;
    if (!punkter) return { ok: false, skal: "prishistorik", detalj: "saknar_variant" };
    const utfall = variantKlarar(punkter, v.listOre, tSankning, nuMs);
    if (utfall !== "ok") return { ok: false, skal: "prishistorik", detalj: utfall };
  }
  return { ok: true };
}
