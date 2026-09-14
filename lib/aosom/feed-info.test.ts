import { describe, expect, it } from "vitest";
import { feedKolumner } from "./feed-info";

const CSV = [
  'SKU,Product Name,EAN,Wholesale Price,SE Ship Fee,Color',
  '845-030CG,Redskapsbod,4251774948586,123.01,84.02,Kolgrå',
  '921-471LG,Kontorsstol,,88.50,26.40,Ljusgrå',
].join("\n");

describe("feedKolumner", () => {
  it("läser rubrikraden och räknar hur full varje kolumn är", () => {
    const i = feedKolumner(CSV);
    expect(i.rader).toBe(2);
    expect(i.kolumner.map((k) => k.namn)).toEqual([
      "SKU", "Product Name", "EAN", "Wholesale Price", "SE Ship Fee", "Color",
    ]);
    expect(i.kolumner.find((k) => k.namn === "SKU")?.ifyllda).toBe(2);
    expect(i.kolumner.find((k) => k.namn === "EAN")?.ifyllda).toBe(1);
  });

  it("☠️ priskolumnernas VÄRDEN lämnar aldrig servern — men räknas ändå", () => {
    // Svaret går till en PUBLIK Actions-logg. Wholesale Price är vårt
    // inköpspris på 6 057 artiklar. Vi vill veta ATT kolumnen är ifylld,
    // aldrig VAD som står i den.
    const i = feedKolumner(CSV);
    const gross = i.kolumner.find((k) => k.namn === "Wholesale Price")!;
    expect(gross.ifyllda).toBe(2);
    expect(gross.exempel).toBeNull();
    expect(JSON.stringify(i)).not.toContain("123.01");
    expect(JSON.stringify(i)).not.toContain("84.02");
  });

  it("ofarliga kolumner får ett exempelvärde — det är det som gör svaret läsbart", () => {
    const i = feedKolumner(CSV);
    expect(i.kolumner.find((k) => k.namn === "Color")?.exempel).toBe("Kolgrå");
  });

  it("hittar EAN-kolumnen och säger hur många rader som har den ifylld", () => {
    const i = feedKolumner(CSV);
    expect(i.harEanKolumn).toBe(true);
    expect(i.eanIfyllda).toBe(1);
  });

  it("☠️ 'kolumnen finns men är tom' skiljs från 'kolumnen finns inte'", () => {
    // Skillnaden avgör vad vi gör: en tom kolumn är ett mejl till Aosom,
    // en saknad kolumn är en annan källa. Att slå ihop dem hade gett fel råd.
    const tom = feedKolumner("SKU,EAN\n845-030CG,\n921-471LG,");
    expect(tom.harEanKolumn).toBe(true);
    expect(tom.eanIfyllda).toBe(0);

    const saknas = feedKolumner("SKU,Color\n845-030CG,Grå");
    expect(saknas.harEanKolumn).toBe(false);
    expect(saknas.eanIfyllda).toBe(0);
  });

  it("citerade celler med komma i förstör inte kolumnräkningen", () => {
    const i = feedKolumner('SKU,Name,Color\n845-030CG,"Bod, stor",Grå');
    expect(i.kolumner).toHaveLength(3);
    expect(i.kolumner[1].exempel).toBe("Bod, stor");
  });

  it("en tom feed ger ett tomt svar, inte ett undantag", () => {
    expect(feedKolumner("").rader).toBe(0);
    expect(feedKolumner("").harEanKolumn).toBe(false);
  });
});
