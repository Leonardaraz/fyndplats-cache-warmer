"use client";
// Söksidan när servern inte har katalogen i minnet (app/sok/page.tsx).
//
// ☠️ VARFÖR (2026-11-19). En ny serverinstans läser hela katalogen innan den
// kan svara: 7 617 varor, 25–28 sekunder (Vercels logg samma dag, minst 30
// gånger på en och en halv timme). Kategorisidorna ligger färdiga i CDN:t, men
// söksidan räknas per sökning, så kunden fick vänta. Två av 125 provsökningar
// tog 14 och 29 sekunder.
//
// Listsidorna hämtar redan hela varulistan som EN CDN-cachad fil
// (/api/lista?k=alla, app/api/lista/route.ts). Samma fil räcker för att söka:
// rankningen (lib/search.ts) är ren kod och körs lika gärna här. Träffarna blir
// de samma som servern ger, i samma ordning (lib/sok-ordning.ts), utom reserven
// som letar i beskrivningarna: den texten finns inte i listan.
//
// ☠️ Varulistan har bara det som går att köpa, och söksidan visar också det
// slutsålda. De varorna läggs till ur sökindexet (lib/sok-kall.ts), annars ger
// de två vägarna olika antal och olika besked.
//
// Korten långt ner i listan saknar foto i filen. Fotot tas ur sökindexet
// (lib/sok-kall.ts, kandidater), så att korten inte väntar på bildkartan
// (/api/kort-bilder, 406 kB). Kortets andra bild finns bara i kartan:
// ShopBrowser hämtar den i bakgrunden (andraBilderUrKartan).
import { useEffect, useState } from "react";
import type { ListProduct } from "../lib/products";
import { matchaKategorier, rankaMedForslag, type Kategoridata } from "../lib/search";
import { laddaSokIndex, sokKategorierHamtade, type SokTraff } from "../lib/sok-index";
import { kandidater, medForsok } from "../lib/sok-kall";
import { kopbaraForst } from "../lib/sok-ordning";
import { harPris, tolkaPris } from "../lib/sok-pris";
import { populartNu } from "../lib/sok-tom";
import { registreradeKategorier, type SokKategori } from "../lib/sok-kategorier";
import { SokVy, type SokData } from "./sok-vy";

/** Så länge väntar vi på listan, per försök. Den är ~0,5 MB över nätet; se lib/sok-index.ts för mätningen bakom 20 s. */
const TIDSGRANS_MS = 20_000;
/**
 * Så många gånger hämtas listan innan felrutan visas, och pausen emellan.
 * Direkt efter en deploy tar första svaret 25–28 sekunder (servern läser
 * katalogen), längre än ett försök väntar: se medForsok i lib/sok-kall.ts.
 */
const FORSOK = 3;
const PAUS_MS = 1_500;
/** Så länge väntar vi på indexet EFTER att listan kommit. Sedan visas det som går att köpa. */
const INDEX_VANTAN_MS = 5_000;

// Varornas kategorier står i sökindexet (radens `k`), slagna upp på slug.
// Sparade per index, så att de inte räknas om för varje sökning.
const kategorierPerSlug = new WeakMap<object, Map<string, number[]>>();

/**
 * Kategorierna för sökningen, ur sökindexet: samma tillhörighet som sökrutan
 * och servern räknar med (lib/sok-begrepp.ts). Undefined utan index eller utan
 * kategoritabell, och sökningen söker då i namnen.
 */
function kategoridata(index: SokTraff[] | null): Kategoridata<ListProduct> | undefined {
  const kat = sokKategorierHamtade();
  if (!index || kat.length === 0) return undefined;
  let perSlug = kategorierPerSlug.get(index);
  if (!perSlug) {
    perSlug = new Map();
    for (const h of index) if (h.k) perSlug.set(h.s, h.k);
    kategorierPerSlug.set(index, perSlug);
  }
  const uppslag = perSlug;
  return { kat, av: (p) => uppslag.get(p.slug) };
}

export function SokKall({ q, kategorier, popularaKategorier }: { q: string; kategorier: SokKategori[]; popularaKategorier: SokKategori[] }) {
  const [svar, setSvar] = useState<{ q: string; data: SokData | "fel" } | null>(null);

  useEffect(() => {
    let avbruten = false;
    let styr: AbortController | null = null;
    let klocka: ReturnType<typeof setTimeout> | undefined;
    // Indexet hämtas samtidigt (sökrutan delar hämtningen), men det är listan
    // som krävs: faller indexet visas det som går att köpa.
    const index = laddaSokIndex().catch(() => null);
    // Ett försök: en egen tidsgräns, så att ett som hänger inte äter nästa.
    const hamtaLista = async (): Promise<ListProduct[]> => {
      const denna = new AbortController();
      styr = denna;
      klocka = setTimeout(() => denna.abort(), TIDSGRANS_MS);
      try {
        const r = await fetch("/api/lista?k=alla", { signal: denna.signal });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const lista = (await r.json()) as ListProduct[];
        if (!Array.isArray(lista) || lista.length === 0) throw new Error("tom lista");
        return lista;
      } finally {
        clearTimeout(klocka);
      }
    };
    medForsok(hamtaLista, FORSOK, () => new Promise((klar) => setTimeout(klar, PAUS_MS)), () => avbruten)
      .then(async (lista) => {
        const slutsalda = await Promise.race([index, new Promise<null>((klar) => setTimeout(() => klar(null), INDEX_VANTAN_MS))]);
        if (avbruten) return;
        // Priset i sökningen läses som på servern (app/sok/page.tsx).
        const prisfraga = tolkaPris(q.trim());
        // Två bokstäver visar varorna för ordet kunden var på väg att skriva (lib/search.ts).
        const { utfall: u, visar } = rankaMedForslag(kandidater(lista, slutsalda), (p) => p.name, prisfraga.fraga, kategoridata(slutsalda));
        // De köpbara först, relevansordningen kvar inom varje grupp: samma regel
        // som servern och sökrutan (lib/sok-ordning.ts).
        const traffar = kopbaraForst(u.traffar, (p) => !p.inStock);
        setSvar({
          q,
          data: {
            traffar, strukna: u.strukna, utan: u.utan, hela: u.hela, visar, liknande: u.liknande === true,
            // Kategorierna gäller ordet som visas; sidhuvudet har registrerat menyns.
            kategorier: visar ? matchaKategorier(visar, registreradeKategorier(), 3) : kategorier,
            pris: harPris(prisfraga) ? { max: prisfraga.max, min: prisfraga.min } : undefined,
            populart: traffar.length === 0 ? populartNu(lista, 4) : [],
            popularaKategorier,
            kall: true,
          },
        });
      })
      .catch(() => {
        if (!avbruten) setSvar({ q, data: "fel" });
      });
    return () => {
      avbruten = true;
      clearTimeout(klocka);
      styr?.abort();
    };
  }, [q, kategorier, popularaKategorier]);

  // Ett svar för en äldre sökning visas inte för den nya.
  return <SokVy q={q} data={svar && svar.q === q ? svar.data : "laddar"} />;
}
