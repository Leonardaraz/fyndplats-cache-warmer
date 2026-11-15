// Butikens svar om favoriterna: GET /api/favoriter, ETT anrop för hela
// listan. Delas av lådan och Mina sidor (components/favoriter-rader.tsx) och
// av hjärtknappen i sidhuvudet, som frågar i förväg när kunden siktar på den
// (components/wishlist.tsx). Svaret är färskt i en minut.
//
// Filen går med sidhuvudet till varje sida och ska vara liten: ingen React,
// bara hämtningen och det senaste svaret.

import { favoritFraga, type FavoritProdukt, type Favoritsvar } from "../lib/favoriter";

const FARSK_MS = 60_000;

let senaste: { svar: Favoritsvar; tid: number } | null = null;
let pagaende: { adress: string; lofte: Promise<Favoritsvar | "fel"> } | null = null;

/** Svaret säger något om varje favorit i listan: varan finns, eller den saknas. */
export const tacker = (svar: Favoritsvar, lista: readonly string[]) => lista.every((s) => svar.produkter[s] || svar.saknas.includes(s));

/** Det senaste svaret, också när det gäller en tidigare lista. */
export const senasteSvar = (): Favoritsvar | null => senaste?.svar ?? null;

/** Det senaste svaret täcker listan och är yngre än en minut: ingen fråga behövs. */
export const farsktSvar = (lista: readonly string[]): boolean => !!senaste && tacker(senaste.svar, lista) && Date.now() - senaste.tid < FARSK_MS;

/** En fråga per lista åt gången: den som frågar under tiden får samma svar. */
export function hamtaFavoriter(lista: readonly string[]): Promise<Favoritsvar | "fel"> {
  const adress = favoritFraga(lista);
  if (pagaende?.adress === adress) return pagaende.lofte;
  const lofte = fetch(adress, { signal: AbortSignal.timeout(15_000) })
    .then((r) => (r.ok ? r.json() : null))
    .then((j: { ok?: boolean; produkter?: Record<string, FavoritProdukt>; saknas?: string[] } | null): Favoritsvar | "fel" => {
      if (!j?.ok || !j.produkter || !Array.isArray(j.saknas)) return "fel";
      const svar = { produkter: j.produkter, saknas: j.saknas };
      senaste = { svar, tid: Date.now() };
      return svar;
    })
    .catch((): "fel" => "fel")
    .finally(() => {
      if (pagaende?.adress === adress) pagaende = null;
    });
  pagaende = { adress, lofte };
  return lofte;
}

/**
 * Frågar i förväg, när kunden siktar på hjärtknappen (musen över, fingret
 * ner, tangentbordets fokus). Svaret är då oftast framme när lådan glidit in.
 * Ingenting händer för en tom lista eller ett färskt svar.
 */
export function forvarmFavoriter(lista: readonly string[]): void {
  if (lista.length === 0 || farsktSvar(lista)) return;
  void hamtaFavoriter(lista);
}
