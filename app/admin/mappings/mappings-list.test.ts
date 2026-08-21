import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// mappings-list.tsx är en klientkomponent utan DOM-testuppsättning i det här
// repot. Det som testas här är därför källan — men just de beslut som är lätta
// att råka backa vid nästa ändring, inte formatteringen.

const KÄLLA = readFileSync(
  join(process.cwd(), "app/admin/mappings/mappings-list.tsx"),
  "utf8",
);
const KORT = readFileSync(join(process.cwd(), "app/admin/mappings/mapping-card.tsx"), "utf8");

describe("mappnings-sidans förstahandsval", () => {
  // Leonard 2026-08-21: katalogen är genommappad ("Kvar att mappa: 0"), så
  // omappade-fliken var en tom vy man alltid klickade sig förbi.
  it('öppnar på "Mappade", inte på "Att mappa"', () => {
    expect(KÄLLA).toMatch(/useState<Tab>\("mapped"\)/);
    expect(KÄLLA).not.toMatch(/useState<Tab>\("unmapped"\)/);
  });
});

describe("deeplänkarna per produkt", () => {
  it("baserna kommer som props — de kan inte byggas i webbläsaren", () => {
    // site-id och bas-URL är env-styrda och finns bara på servern.
    expect(KÄLLA).toMatch(/storeBase\?: string/);
    expect(KÄLLA).toMatch(/wixEditBase\?: string/);
  });

  it("BÅDA flikarna får länkarna, inte bara mappade", () => {
    // Att kunna hoppa till butiken/Wix är lika användbart för en omappad rad.
    const träffar = KÄLLA.match(/storeUrl=\{storeUrlFor\(p\.slug\)\}/g) ?? [];
    expect(träffar).toHaveLength(2);
    expect(KÄLLA.match(/wixEditUrl=\{wixUrlFor\(p\.id\)\}/g) ?? []).toHaveLength(2);
  });

  it("kortet renderar båda länkarna", () => {
    expect(KORT).toMatch(/Se på Fyndplats/);
    expect(KORT).toMatch(/Redigera i Wix/);
  });

  // Hellre ingen länk än en som går till /produkt/undefined.
  it("saknad slug ger ingen butikslänk", () => {
    expect(KÄLLA).toMatch(/storeBase && slug \? /);
  });
});
