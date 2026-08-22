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

  // Alla tre på SAMMA rad (Leonard 2026-08-21). AliExpress-länken låg tidigare
  // på en egen rad under — de letas efter tillsammans.
  it("kortet renderar alla tre länkarna i samma rad", () => {
    const rad = KORT.slice(
      KORT.indexOf("{(storeUrl || wixEditUrl || aeUrl)"),
      KORT.indexOf("{alreadyMapped && !justMapped"),
    );
    expect(rad).toMatch(/Se på Fyndplats/);
    expect(rad).toMatch(/Redigera i Wix/);
    expect(rad).toMatch(/AliExpress \{mapping!\.supplierProductId\}/);
  });

  // Två länkar till samma listning i samma kort är brus — AE-länken ska ha
  // FLYTTAT, inte dubblerats.
  it("AliExpress-länken finns bara på ett ställe i kortet", () => {
    expect(KORT.match(/href=\{aeUrl\}/g) ?? []).toHaveLength(1);
  });

  // Hellre ingen länk än en som går till /produkt/undefined.
  it("saknad slug ger ingen butikslänk", () => {
    expect(KÄLLA).toMatch(/storeBase && slug \? /);
  });
});
