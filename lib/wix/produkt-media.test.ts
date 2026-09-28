import { describe, expect, it } from "vitest";
import { mediaNyckel, produktensMedianycklar } from "./produkt-media";

const url = (id: string) => `https://static.wixstatic.com/media/${id}`;

describe("produktensMedianycklar — vilka filer en produkt använder", () => {
  it("huvudbild, galleri och valens kopplade bilder, utan dubbletter", () => {
    const nycklar = produktensMedianycklar({
      media: {
        main: { id: "a~mv2.jpg", image: { url: url("a~mv2.jpg") } },
        itemsInfo: {
          items: [
            { id: "a~mv2.jpg", image: { url: url("a~mv2.jpg") } },
            { id: "b~mv2.jpg", url: url("b~mv2.jpg") },
          ],
        },
      },
      options: [
        { choicesSettings: { choices: [{ linkedMedia: [{ id: "c~mv2.jpg" }] }, {}] } },
      ],
    });
    expect(nycklar.sort()).toEqual(["a~mv2.jpg", "b~mv2.jpg", "c~mv2.jpg"]);
  });

  it("☠️ en kopplad bild utanför galleriet räknas ändå — skyddet hänger inte på Wix invariant", () => {
    const nycklar = produktensMedianycklar({
      media: { itemsInfo: { items: [{ id: "a~mv2.jpg" }] } },
      options: [{ choicesSettings: { choices: [{ linkedMedia: [{ image: { url: url("farg~mv2.jpg") } }] }] } }],
    });
    expect(nycklar).toContain("farg~mv2.jpg");
  });

  it("id och URL som skiljer sig ger båda nycklarna — hellre en för mycket", () => {
    const nycklar = produktensMedianycklar({
      media: { itemsInfo: { items: [{ id: "x~mv2.jpg", image: { url: url("y~mv2.jpg") } }] } },
    });
    expect(nycklar.sort()).toEqual(["x~mv2.jpg", "y~mv2.jpg"]);
  });

  it("en produkt utan media ger en tom lista", () => {
    expect(produktensMedianycklar({})).toEqual([]);
  });

  it("mediaNyckel tar bort query-parametrar", () => {
    expect(mediaNyckel(`${url("a~mv2.jpg")}?w=500`)).toBe("a~mv2.jpg");
  });
});
