// Rökprov mot en SKARP feed-fil. Hoppas över om ingen fixtur pekats ut.
//
//   AOSOM_FEED_FIXTURE=/sökväg/till/feed.csv npx vitest run lib/aosom/feed-live.test.ts
//
// Hämta filen med: curl -sL "$AOSOM_FEED_URL" -o feed.csv (adressen står i
// lib/aosom/feed.ts). Provet finns för att enhetstesterna kör på handskrivna
// rader — den här kör på alla 6 057 och fäller om Aosom ändrar formatet.
// Ingenting skrivs: importOne/saveMapping kastar om de mot förmodan anropas.

import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { parseAosomFeed, isShippableToSe, freightShare } from "./feed";
import { toImportProduct } from "./to-product";
import { runAosomImport } from "./import-run";

const FIXTURE = process.env.AOSOM_FEED_FIXTURE ?? "";
const finns = !!FIXTURE && existsSync(FIXTURE);
const FX = { eurToSek: 11.1, usdToSek: 10.5 };

const nekaSkrivning = {
  importOne: async () => {
    throw new Error("torrkörningen försökte skriva");
  },
  saveMapping: async () => {
    throw new Error("torrkörningen försökte skriva");
  },
};

describe.skipIf(!finns)("skarp feed", () => {
  const rows = finns ? parseAosomFeed(readFileSync(FIXTURE, "utf8")) : [];
  const live = rows.filter(isShippableToSe);

  it("varje fraktbar rad blir en giltig produkt", () => {
    let utanTitel = 0;
    let utanBild = 0;
    let ogiltigKostnad = 0;
    let kvarBrand = 0;
    for (const r of live) {
      const p = toImportProduct(r, FX);
      if (!p.rawTitle) utanTitel++;
      if (!p.imageUrls.length) utanBild++;
      if (!(p.variants[0].costUsd > 0)) ogiltigKostnad++;
      const text = p.rawTitle + (p.descriptionHtml ?? "") + (p.features ?? []).join(" ");
      if (/BRAND NAME/.test(text)) kvarBrand++;
    }
    console.log(
      `[skarp feed] ${rows.length} rader, ${live.length} fraktbara, `
        + `${live.reduce((s, r) => s + r.imageUrls.length, 0)} bilder, `
        + `${live.filter((r) => freightShare(r) > 0.5).length} med frakt dyrare än varan`,
    );
    expect({ utanTitel, utanBild, ogiltigKostnad, kvarBrand })
      .toEqual({ utanTitel: 0, utanBild: 0, ogiltigKostnad: 0, kvarBrand: 0 });
  });

  it("markören går igenom hela sortimentet utan att tappa eller upprepa en rad", async () => {
    const deps = { fetchFeed: async () => rows, listMappings: async () => [], fx: FX, ...nekaSkrivning };
    let after: string | undefined;
    let summa = 0;
    let varv = 0;
    for (;;) {
      const s = await runAosomImport(deps, { limit: 500, after, timeBudgetMs: 600_000 });
      summa += s.imported;
      if (!s.cursor) break;
      after = s.cursor;
      if (++varv > 100) throw new Error("markören konvergerar inte");
    }
    expect(summa).toBe(live.length);
  }, 120_000);
});
