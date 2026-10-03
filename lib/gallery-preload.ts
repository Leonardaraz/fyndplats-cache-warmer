// Ren hjälplogik för galleriets grann-förladdning (Fas 1 i components/gallery.tsx).
// Ingen "use client" och inga DOM-beroenden — modulen ska kunna köras i
// `node --test` (npm test täcker bara lib/, inte komponenter, så det här är den
// enda regressionsspärr som går att få för svep-förladdningen).

// Grann-fönstret runt aktiv bild: 2 framåt, 1 bakåt (folk sveper mest framåt),
// med wrap-around i båda ändar. Resultatet innehåller ALDRIG `active` självt och
// aldrig dubbletter — viktigt när galleriet är litet och fönstret wrappar runt
// hela varvet (t.ex. 2 bilder: framåt+bakåt är samma granne).
export function nearWindow(active: number, len: number): number[] {
  if (len <= 1) return [];
  const out: number[] = [];
  for (const d of [1, 2, -1]) {
    const i = (((active + d) % len) + len) % len;
    if (i !== active && !out.includes(i)) out.push(i);
  }
  return out;
}

// Data Saver / mycket långsam lina → noll spekulativ förladdning (svep faller då
// tillbaka på on-demand-mount med spinner, dvs beteendet före förladdningen).
// Tar connection-objektet som argument i stället för att läsa navigator själv,
// så grinden kan testas utan DOM.
export function prefersDataSaving(conn?: { saveData?: boolean; effectiveType?: string }): boolean {
  if (!conn) return false;
  if (conn.saveData) return true;
  const t = conn.effectiveType || "";
  return t === "2g" || t === "slow-2g";
}

// Bredden på srcset-kandidaten webbläsaren valde ("640w"), 0 om okänd. Används
// av förstoringen för att avgöra om hjältens bild räcker för scenen.
// naturalWidth duger inte: med w-deskriptorer är den densitetskorrigerad och
// blir sizes-bredden (544 på dator) oavsett hur många pixlar bilden har. Wix-
// adresserna innehåller kommatecken (w_640,h_640), så kandidaterna delas på
// "URL bredd w", inte på komma.
export function kandidatBredd(im: { currentSrc: string; srcset: string }): number {
  if (!im.currentSrc) return 0;
  for (const [, url, w] of (im.srcset || "").matchAll(/(\S+)\s+(\d+)w/g)) {
    if (url === im.currentSrc) return Number(w);
  }
  return 0;
}
