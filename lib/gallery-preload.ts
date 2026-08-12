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
