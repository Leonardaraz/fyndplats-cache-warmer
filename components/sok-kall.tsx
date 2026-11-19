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
// Korten långt ner i listan saknar foto i filen. ShopBrowser fyller i dem ur
// bildkartan (/api/kort-bilder), som den gör på listsidorna.
import { useEffect, useState } from "react";
import type { ListProduct } from "../lib/products";
import { rankaMedInfo } from "../lib/search";
import { populartNu } from "../lib/sok-tom";
import type { SokKategori } from "../lib/sok-kategorier";
import { SokVy, type SokData } from "./sok-vy";

/** Så länge väntar vi på listan. Den är ~0,5 MB över nätet; se lib/sok-index.ts för mätningen bakom 20 s. */
const TIDSGRANS_MS = 20_000;

export function SokKall({ q, kategorier, popularaKategorier }: { q: string; kategorier: SokKategori[]; popularaKategorier: SokKategori[] }) {
  const [svar, setSvar] = useState<{ q: string; data: SokData | "fel" } | null>(null);

  useEffect(() => {
    let avbruten = false;
    const styr = new AbortController();
    const klocka = setTimeout(() => styr.abort(), TIDSGRANS_MS);
    fetch("/api/lista?k=alla", { signal: styr.signal })
      .then((r) => (r.ok ? (r.json() as Promise<ListProduct[]>) : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((lista) => {
        if (avbruten) return;
        if (!Array.isArray(lista) || lista.length === 0) throw new Error("tom lista");
        const u = rankaMedInfo(lista, (p) => p.name, q.trim());
        // De köpbara först, relevansordningen kvar inom varje grupp (som på servern).
        const traffar = [...u.traffar.filter((p) => p.inStock), ...u.traffar.filter((p) => !p.inStock)];
        setSvar({
          q,
          data: {
            traffar, strukna: u.strukna, utan: u.utan, hela: u.hela, kategorier,
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
