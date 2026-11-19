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
// de samma som servern ger, utom reserven som letar i beskrivningarna: den
// texten finns inte i listan.
//
// ☠️ Varulistan har bara det som går att köpa, och söksidan visar också det
// slutsålda. De varorna läggs till ur sökindexet (lib/sok-kall.ts), annars ger
// de två vägarna olika antal och olika besked.
//
// Korten långt ner i listan saknar foto i filen. ShopBrowser fyller i dem ur
// bildkartan (/api/kort-bilder), som den gör på listsidorna.
import { useEffect, useState } from "react";
import type { ListProduct } from "../lib/products";
import { rankaMedInfo } from "../lib/search";
import { laddaSokIndex } from "../lib/sok-index";
import { kandidater } from "../lib/sok-kall";
import { harPris, tolkaPris } from "../lib/sok-pris";
import { populartNu } from "../lib/sok-tom";
import type { SokKategori } from "../lib/sok-kategorier";
import { SokVy, type SokData } from "./sok-vy";

/** Så länge väntar vi på listan. Den är ~0,5 MB över nätet; se lib/sok-index.ts för mätningen bakom 20 s. */
const TIDSGRANS_MS = 20_000;
/** Så länge väntar vi på indexet EFTER att listan kommit. Sedan visas det som går att köpa. */
const INDEX_VANTAN_MS = 5_000;

export function SokKall({ q, kategorier, popularaKategorier }: { q: string; kategorier: SokKategori[]; popularaKategorier: SokKategori[] }) {
  const [svar, setSvar] = useState<{ q: string; data: SokData | "fel" } | null>(null);

  useEffect(() => {
    let avbruten = false;
    const styr = new AbortController();
    const klocka = setTimeout(() => styr.abort(), TIDSGRANS_MS);
    // Indexet hämtas samtidigt (sökrutan delar hämtningen), men det är listan
    // som krävs: faller indexet visas det som går att köpa.
    const index = laddaSokIndex().catch(() => null);
    fetch("/api/lista?k=alla", { signal: styr.signal })
      .then((r) => (r.ok ? (r.json() as Promise<ListProduct[]>) : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(async (lista) => {
        if (!Array.isArray(lista) || lista.length === 0) throw new Error("tom lista");
        const slutsalda = await Promise.race([index, new Promise<null>((klar) => setTimeout(() => klar(null), INDEX_VANTAN_MS))]);
        if (avbruten) return;
        // Priset i sökningen läses som på servern (app/sok/page.tsx).
        const prisfraga = tolkaPris(q.trim());
        const u = rankaMedInfo(kandidater(lista, slutsalda), (p) => p.name, prisfraga.fraga);
        // De köpbara först, relevansordningen kvar inom varje grupp (som på servern).
        const traffar = [...u.traffar.filter((p) => p.inStock), ...u.traffar.filter((p) => !p.inStock)];
        setSvar({
          q,
          data: {
            traffar, strukna: u.strukna, utan: u.utan, hela: u.hela, kategorier,
            pris: harPris(prisfraga) ? { max: prisfraga.max, min: prisfraga.min } : undefined,
            populart: traffar.length === 0 ? populartNu(lista, 4) : [],
            popularaKategorier,
          },
        });
      })
      .catch(() => {
        if (!avbruten) setSvar({ q, data: "fel" });
      })
      .finally(() => clearTimeout(klocka));
    return () => {
      avbruten = true;
      clearTimeout(klocka);
      styr.abort();
    };
  }, [q, kategorier, popularaKategorier]);

  // Ett svar för en äldre sökning visas inte för den nya.
  return <SokVy q={q} data={svar && svar.q === q ? svar.data : "laddar"} />;
}
