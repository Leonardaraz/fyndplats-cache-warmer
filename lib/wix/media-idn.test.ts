import { describe, it, expect } from "vitest";
import { raderbartId, wixMediaIdn } from "./media-idn";
import { BUTIKENS_GOLV, lasButikensMediaIdn, tolkaButikensLista } from "./butikens-media";

// Samma exempel som butikens lib/media-referenser.test.ts (grenen
// headless-site). Mönstret där och här måste fånga samma id.
const ID = "b379ce_0e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg";

describe("wixMediaIdn", () => {
  it("hittar id i adresser, wix:image-URI:er, nakna id och transformer", () => {
    const text = [
      `https://static.wixstatic.com/media/${ID}`,
      "[![a](https://static.wixstatic.com/media/b379ce_1111111111111111111111111111111a~mv2.png/v1/fill/w_640,h_640/file.webp)](/produkt/a)",
      "wix:image://v1/b379ce_2222222222222222222222222222222b~mv2.jpeg/namn.jpeg#originWidth=800",
      '"img": "b379ce_3333333333333333333333333333333c~mv2.webp"',
    ].join("\n");
    expect(wixMediaIdn(text).sort()).toEqual([
      ID,
      "b379ce_1111111111111111111111111111111a~mv2.png",
      "b379ce_2222222222222222222222222222222b~mv2.jpeg",
      "b379ce_3333333333333333333333333333333c~mv2.webp",
    ].sort());
  });

  it("URL-kodad tilde och versaler blir samma id som i biblioteket", () => {
    const kodad = "/_next/image?url=https%3A%2F%2Fstatic.wixstatic.com%2Fmedia%2Fb379ce_0e6a6260c9f243b3afd79cbaf147b67b%7Emv2.jpg&w=640";
    expect(wixMediaIdn(kodad)).toEqual([ID]);
    expect(wixMediaIdn(ID.toUpperCase())).toEqual([ID]);
  });

  it("gamla id-former fångas hela", () => {
    const gammal = "b379ce_4444444444444444444444444444444d~mv2_d_1920_1080_s_2.jpg";
    expect(wixMediaIdn(`url(${gammal})`)).toEqual([gammal]);
  });

  it("ordrarnas form: bilden som wix:image-URI inuti JSON", () => {
    const order = { lineItems: [{ image: `wix:image://v1/${ID}/stol.jpg#originWidth=1000&originHeight=1000` }] };
    expect(wixMediaIdn(JSON.stringify(order))).toEqual([ID]);
  });
});

describe("raderbartId", () => {
  it("bara den vanliga formen", () => {
    expect(raderbartId(ID)).toBe(true);
    expect(raderbartId(ID.toUpperCase())).toBe(true);
    expect(raderbartId("b379ce_4444444444444444444444444444444d~mv2_d_1920_1080_s_2.jpg")).toBe(false);
    expect(raderbartId("a1~mv2.jpg")).toBe(false);
  });

  it("☠️ varje raderbart id fångas av det breda mönstret", () => {
    // Det strikta mönstret får aldrig släppa igenom ett id som butikens lista
    // inte kan hitta i en text — då raderas en bloggbild.
    for (const id of [ID, "b379ce_5555555555555555555555555555555e~mv2.png", "b379ce_6666666666666666666666666666666f~mv2.webp"]) {
      expect(raderbartId(id)).toBe(true);
      expect(wixMediaIdn(`![x](https://static.wixstatic.com/media/${id}/v1/fill/w_10,h_10/a.jpg)`)).toEqual([id]);
    }
  });
});

describe("butikens lista", () => {
  const manga = Array.from({ length: BUTIKENS_GOLV.totalt }, (_, i) => `b379ce_${i.toString(16).padStart(32, "0")}~mv2.jpg`);
  const perKalla = { blogg: 215, reservkatalog: 2399, data: 749, kod: 5 };
  const hel = { version: 1, perKalla, idn: manga };

  it("en hel lista tolkas till gemener", () => {
    expect(tolkaButikensLista({ ...hel, idn: [...manga.slice(1), ID.toUpperCase()] })).toContain(ID);
  });

  it("☠️ en lista under golvet är trasig, inte tom", () => {
    expect(() => tolkaButikensLista({ ...hel, idn: manga.slice(0, 10) })).toThrow(/golvet/);
    expect(() => tolkaButikensLista({ ...hel, perKalla: { ...perKalla, blogg: 3 } })).toThrow(/ur blogg/);
    expect(() => tolkaButikensLista({ ...hel, perKalla: {} })).toThrow(/ur blogg/);
  });

  it("☠️ en källa som fallit bort fäller listan, även när totalen räcker", () => {
    // Reservkatalogen ensam bär totalen. Utan golv per källa hade en lista
    // utan variantbilderna gått igenom.
    expect(() => tolkaButikensLista({ ...hel, perKalla: { ...perKalla, data: 0 } })).toThrow(/ur data/);
    expect(() => tolkaButikensLista({ ...hel, perKalla: { ...perKalla, reservkatalog: 0 } })).toThrow(/ur reservkatalog/);
    expect(() => tolkaButikensLista({ ...hel, perKalla: { ...perKalla, kod: 0 } })).toThrow(/ur kod/);
  });

  it("☠️ okänd form kastar i stället för att tolkas som tom", () => {
    expect(() => tolkaButikensLista(null)).toThrow(/okänd form/);
    expect(() => tolkaButikensLista({ version: 2, idn: manga })).toThrow(/okänd form/);
    expect(() => tolkaButikensLista({ ...hel, idn: [...manga, 42] })).toThrow(/felaktiga rader/);
  });

  it("ett felsvar från butiken kastar", async () => {
    const hamta = (async () => new Response("{}", { status: 503 })) as unknown as typeof fetch;
    await expect(lasButikensMediaIdn(hamta)).rejects.toThrow(/503/);
  });

  it("läser och tolkar svaret", async () => {
    const hamta = (async () => new Response(JSON.stringify(hel), { status: 200 })) as unknown as typeof fetch;
    expect(await lasButikensMediaIdn(hamta)).toHaveLength(BUTIKENS_GOLV.totalt);
  });
});
