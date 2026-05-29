// Slår ihop kategoriresultat från flera sidor till en sajt-övergripande bild.
// Fynd med samma id summeras (fler förekomster = sämre), exempel slås ihop (max 3),
// sidorna där felet finns samlas (pages), och poäng/betyg räknas om per kategori.
// Ren funktion — testbar offline.

import { buildCategory, type Category, type CategoryResult, type Finding } from "./types";

export interface ScannedPage {
  url: string;
  categories: CategoryResult[];
}

export function mergeCategoryPages(pages: ScannedPage[]): CategoryResult[] {
  const order: Category[] = [];
  const byCat = new Map<
    Category,
    { label: string; checksRun: number; findings: Map<string, Finding> }
  >();

  for (const { url, categories } of pages) {
    for (const cat of categories) {
      let entry = byCat.get(cat.category);
      if (!entry) {
        entry = { label: cat.label, checksRun: cat.checksRun, findings: new Map() };
        byCat.set(cat.category, entry);
        order.push(cat.category);
      }
      for (const f of cat.findings) {
        const existing = entry.findings.get(f.id);
        if (!existing) {
          entry.findings.set(f.id, { ...f, examples: f.examples.slice(0, 3), pages: [url] });
        } else {
          existing.count += f.count;
          if (existing.examples.length < 3) {
            existing.examples = [...existing.examples, ...f.examples].slice(0, 3);
          }
          if (!existing.pages!.includes(url)) existing.pages!.push(url);
        }
      }
    }
  }

  return order.map((cat) => {
    const e = byCat.get(cat)!;
    return buildCategory(cat, e.label, [...e.findings.values()], e.checksRun);
  });
}
