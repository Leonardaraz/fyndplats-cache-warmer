// Bildplanen: en runda som bara skriver bildlistan på redan polerade sidor.
//
// Testerna låser att planen inte kan bära text (den skrivs aldrig), att
// valideringen vägrar artikelnummerform och dubbletter utan att citera träffen,
// att skrivningen är skrivplanens eget mediesteg och att återläsningen bevisar
// att fältet fanns innan en skillnad räknas.

import { describe, expect, it } from "vitest";
import { korBildsteg, valideraBildplan, verifieraBilder, type Bildplan } from "./bildplan";
import type { WixAnrop } from "./skrivplan";

const BILD_A = `b379ce_${"a".repeat(32)}~mv2.jpg`;
const BILD_B = `b379ce_${"b".repeat(32)}~mv2.jpg`;
const BILD_C = `b379ce_${"c".repeat(32)}~mv2.jpg`;

function plan(over: Partial<Bildplan["produkter"][number]> = {}): Bildplan {
  return {
    runda: "runda-bilder-t1",
    produkter: [{
      kort: "1a2b3c4d",
      pid: "1a2b3c4d-0000-4000-8000-000000000001",
      media: [
        { id: BILD_A, altText: "Skåpet framifrån på vit bakgrund" },
        { id: BILD_B, altText: "Skåpet i ett kök" },
        { id: BILD_C, altText: "Närbild på lådans handtag" },
      ],
      ...over,
    }],
  };
}

interface Anrop { metod: string; sokvag: string; kropp?: unknown }

function fakeWix(svara: (a: Anrop) => unknown): { wix: WixAnrop; anrop: Anrop[] } {
  const anrop: Anrop[] = [];
  const wix: WixAnrop = async (metod, sokvag, kropp) => {
    const a = { metod, sokvag, kropp };
    anrop.push(a);
    const s = svara(a);
    if (s instanceof Error) throw s;
    return s;
  };
  return { wix, anrop };
}

describe("valideraBildplan", () => {
  it("godtar en plan med kort, pid och bilder", () => {
    expect("plan" in valideraBildplan(plan())).toBe(true);
  });

  it("vägrar tomma och för långa bildlistor", () => {
    expect("fel" in valideraBildplan(plan({ media: [] }))).toBe(true);
    const sexton = Array.from({ length: 16 }, (_, i) => ({
      id: `b379ce_${i.toString(16).padStart(32, "0")}~mv2.jpg`, altText: `Bild ${i + 1}`,
    }));
    expect("fel" in valideraBildplan(plan({ media: sexton }))).toBe(true);
  });

  it("☠️ vägrar samma bild två gånger — en kundsida ska aldrig visa en dubblett", () => {
    const v = valideraBildplan(plan({ media: [{ id: BILD_A, altText: "Ett" }, { id: BILD_A, altText: "Två" }] }));
    expect("fel" in v && v.fel.join(" ")).toContain("samma bild två gånger");
  });

  it("vägrar en tom alt-text, för listan ersätter den befintliga", () => {
    expect("fel" in valideraBildplan(plan({ media: [{ id: BILD_A, altText: "  " }] }))).toBe(true);
  });

  it("☠️ vägrar artikelnummerform i en alt-text och citerar aldrig träffen", () => {
    const nr = "845-001AB";
    const v = valideraBildplan(plan({ media: [{ id: BILD_A, altText: `Skåpet ${nr}` }] }));
    expect("fel" in v).toBe(true);
    expect(JSON.stringify(v)).not.toContain(nr);
  });

  it("vägrar ett pid som inte börjar med kortet, och samma produkt två gånger", () => {
    expect("fel" in valideraBildplan(plan({ pid: "9f9f9f9f-0000-4000-8000-000000000001" }))).toBe(true);
    const p = plan();
    p.produkter.push({ ...p.produkter[0] });
    expect("fel" in valideraBildplan(p)).toBe(true);
  });
});

describe("korBildsteg", () => {
  it("skriver bildlistan ensam med revisionen ur en färsk GET", async () => {
    const { wix, anrop } = fakeWix((a) => (a.metod === "GET" ? { product: { revision: "7" } } : { product: { revision: "8" } }));
    const u = await korBildsteg("media", plan(), wix, false);
    expect(u.ok).toBe(true);
    const patch = anrop.find((a) => a.metod === "PATCH");
    expect(patch?.kropp).toEqual({
      product: { revision: "7", media: { itemsInfo: { items: plan().produkter[0].media } } },
      fieldMask: { paths: ["media"] },
    });
  });

  it("torrt läser men skriver ingenting", async () => {
    const { wix, anrop } = fakeWix(() => ({ product: { revision: "7" } }));
    await korBildsteg("media", plan(), wix, true);
    expect(anrop.every((a) => a.metod === "GET")).toBe(true);
  });

  it("☠️ skriver ingenting när listan tappar en bild ett färgval pekar på", async () => {
    const val = { choicesSettings: { choices: [{ name: "Vit", linkedMedia: [{ id: "fil-vit" }] }] } };
    const { wix, anrop } = fakeWix(() => ({ product: { revision: "7", options: [val] } }));
    const u = await korBildsteg("media", plan(), wix, false);
    expect(u.ok).toBe(false);
    expect(anrop.some((a) => a.metod === "PATCH")).toBe(false);
  });
});

describe("verifieraBilder", () => {
  const items = plan().produkter[0].media.map((m) => ({ ...m }));

  it("godkänner samma bilder i samma ordning med samma alt-text", async () => {
    const { wix, anrop } = fakeWix(() => ({ product: { revision: "8", visible: true, media: { itemsInfo: { items } } } }));
    const u = await verifieraBilder(plan(), wix);
    expect(u.ok).toBe(true);
    expect(anrop[0].sokvag).toContain("fields=MEDIA_ITEMS_INFO");
  });

  it("fäller en annan ordning och en ändrad alt-text", async () => {
    const omvand = [...items].reverse();
    const a = await verifieraBilder(plan(), fakeWix(() => ({ product: { media: { itemsInfo: { items: omvand } } } })).wix);
    expect(a.ok).toBe(false);
    const andrad = items.map((m, i) => (i === 1 ? { ...m, altText: "Annan" } : m));
    const b = await verifieraBilder(plan(), fakeWix(() => ({ product: { media: { itemsInfo: { items: andrad } } } })).wix);
    expect(b.ok).toBe(false);
  });

  it("☠️ ett fält som saknas i projektionen är inte en tom lista", async () => {
    const u = await verifieraBilder(plan(), fakeWix(() => ({ product: { revision: "8", media: { main: {} } } })).wix);
    expect(u.ok).toBe(false);
    expect(String(u.rader[0].fel)).toContain("saknas i projektionen");
  });
});
