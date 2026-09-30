import { describe, expect, it } from "vitest";
import { beskrivUtskick, mejlaBevakare, restockStopp, type RestockDeps } from "./notify";
import type { RestockSubscriber } from "./store";
import type { SendEmailInput } from "../email/resend";
import type { V3ProduktKort } from "../wix/v3-products";

const KORT: V3ProduktKort = {
  id: "wix-1",
  namn: "3D-träpussel raket – mekanisk rymdfärja med raketramp",
  slug: "3d-trapussel-raket-rymdfarja",
  visible: true,
  bildUrl: "https://static.wixstatic.com/media/b379ce_abc~mv2.jpg",
  pris: { min: 1139, max: 1139 },
  varianter: [{ id: "v1", visible: true, namn: "", pris: 1139 }],
  harSynligVariant: true,
};

/** Ett tvåfärgat sängbord, som det såg ut 2026-09-30: ekdekor i lager, vit slut. */
const SANGBORD: V3ProduktKort = {
  id: "wix-2",
  namn: "Vägghängt sängbord 2-pack – svävande nattduksbord med RGB-LED",
  slug: "vagghangt-sangbord-rgb-led-2-pack",
  visible: true,
  bildUrl: "https://static.wixstatic.com/media/b379ce_ek~mv2.jpg",
  pris: { min: 1099, max: 1099 },
  varianter: [
    { id: "v-ek", visible: true, namn: "Ekdekor", bildUrl: "https://static.wixstatic.com/media/b379ce_ek~mv2.jpg", pris: 1099 },
    { id: "v-vit", visible: true, namn: "Vit", bildUrl: "https://static.wixstatic.com/media/b379ce_vit~mv2.jpg", pris: 1149 },
  ],
  harSynligVariant: true,
};

function bevakare(n: number): RestockSubscriber[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `wix-1:hash${i}`,
    productId: "wix-1",
    email: `kund${i}@example.com`,
    subscribedAt: "2026-09-01T10:00:00.000Z",
    notifiedAt: null,
  }));
}

function fejk(over: Partial<RestockDeps> = {}, antal = 2) {
  const skickat: SendEmailInput[] = [];
  const markerade: string[][] = [];
  let lasningar = 0;
  const uppfriskade: string[] = [];
  const d: RestockDeps = {
    listaVantande: async () => bevakare(antal),
    markeraMejlade: async (ids) => {
      markerade.push(ids);
    },
    lasProdukt: async () => {
      lasningar++;
      return KORT;
    },
    skicka: async (input) => {
      skickat.push(input);
      return { id: `mejl-${skickat.length}` };
    },
    uppfriskaSida: async (slug) => {
      uppfriskade.push(slug);
      return "uppfriskad";
    },
    produktUrl: (slug) => `https://www.fyndplats.se/produkt/${slug}`,
    ...over,
  };
  return { d, skickat, markerade, uppfriskade, lasningar: () => lasningar };
}

describe("mejlaBevakare", () => {
  it("☠️ mejlet bär butikens namn, bild, pris och adress — inget från leverantören", async () => {
    const { d, skickat } = fejk();
    const u = await mejlaBevakare("wix-1", {}, d);
    expect(u).toMatchObject({ bevakare: 2, skickade: 2, ejSkickade: 0, sidan: "uppfriskad" });
    expect(skickat).toHaveLength(2);
    const [forsta] = skickat;
    expect(forsta.mottagare).toBe("kund");
    expect(forsta.subject).toBe("Tillbaka i lager: 3D-träpussel raket");
    expect(forsta.bodyHtml).toContain("3D-träpussel raket – mekanisk rymdfärja med raketramp");
    expect(forsta.bodyHtml).toContain("https://www.fyndplats.se/produkt/3d-trapussel-raket-rymdfarja");
    expect(forsta.bodyHtml).toContain("https://static.wixstatic.com/media/b379ce_abc~mv2.jpg/v1/fill/");
    // Tusentalsavgränsaren är ett hårt mellanslag, så priset aldrig bryts.
    expect(forsta.bodyHtml).toContain("1\u00a0139 kr");
    expect(forsta.forhandstext).toBeTruthy();
    expect(skickat.map((s) => s.to)).toEqual(["kund0@example.com", "kund1@example.com"]);
  });

  it("utan väntande bevakare läses ingen produkt och inget skickas", async () => {
    const { d, skickat, lasningar } = fejk({}, 0);
    const u = await mejlaBevakare("wix-1", {}, d);
    expect(u).toEqual({ bevakare: 0, skickade: 0, ejSkickade: 0 });
    expect(lasningar()).toBe(0);
    expect(skickat).toHaveLength(0);
  });

  it("☠️ bara bevakare vars mejl Resend tog emot stämplas", async () => {
    let n = 0;
    const { d, markerade } = fejk({
      skicka: async () => {
        n++;
        if (n === 2) throw new Error("Resend 500");
        if (n === 3) return { skipped: "no_api_key" };
        return { id: `mejl-${n}` };
      },
    }, 3);
    const u = await mejlaBevakare("wix-1", {}, d);
    expect(u.skickade).toBe(1);
    expect(u.ejSkickade).toBe(2);
    expect(markerade).toEqual([["wix-1:hash0"]]);
  });

  it("☠️ torrläge i sändaren förbrukar ingen bevakning", async () => {
    // Den gamla vägen stämplade alla, också när inget mejl gick.
    const { d, markerade } = fejk({ skicka: async () => ({ skipped: "dry_run" }) });
    const u = await mejlaBevakare("wix-1", {}, d);
    expect(u).toMatchObject({ skickade: 0, ejSkickade: 2 });
    expect(markerade).toEqual([]);
  });

  it("en dold produkt, en utan adress eller utan synlig variant får inget mejl", async () => {
    for (const [andring, stopp] of [
      [{ visible: false }, "dold"],
      [{ slug: "" }, "saknar_adress"],
      [{ namn: "" }, "saknar_namn"],
      [{ harSynligVariant: false }, "ingen_synlig_variant"],
    ] as const) {
      const { d, skickat, uppfriskade } = fejk({ lasProdukt: async () => ({ ...KORT, ...andring }) });
      const u = await mejlaBevakare("wix-1", {}, d);
      expect(u).toMatchObject({ bevakare: 2, skickade: 0, ejSkickade: 2, stopp });
      expect(skickat).toHaveLength(0);
      expect(uppfriskade).toHaveLength(0);
    }
  });

  it("en produkt som inte finns eller inte går att läsa får inget mejl, och det syns", async () => {
    const saknas = fejk({ lasProdukt: async () => null });
    expect(await mejlaBevakare("wix-1", {}, saknas.d)).toMatchObject({ stopp: "saknas_i_butiken", ejSkickade: 2 });

    const lasfel = fejk({
      lasProdukt: async () => {
        throw new Error("Wix 503");
      },
    });
    expect(await mejlaBevakare("wix-1", {}, lasfel.d)).toMatchObject({ stopp: "lasfel", ejSkickade: 2 });
  });

  it("visaPris: false tar bort priset ur mejlet", async () => {
    const { d, skickat } = fejk();
    await mejlaBevakare("wix-1", { visaPris: false }, d);
    expect(skickat[0].bodyHtml).not.toMatch(/\d kr/);
    expect(skickat[0].bodyText).not.toMatch(/\d kr/);
  });

  it("butikens cache töms en gång per produkt, före utskicket", async () => {
    const ordning: string[] = [];
    const { d } = fejk({
      uppfriskaSida: async () => {
        ordning.push("sidan");
        return "ingen_nyckel";
      },
      skicka: async () => {
        ordning.push("mejl");
        return { id: "x" };
      },
    });
    const u = await mejlaBevakare("wix-1", {}, d);
    expect(ordning).toEqual(["sidan", "mejl", "mejl"]);
    expect(u.sidan).toBe("ingen_nyckel");
  });

  it("☠️ en stämpel som faller syns — annars kan kunden få mejlet igen utan att någon vet varför", async () => {
    const { d } = fejk({
      markeraMejlade: async () => {
        throw new Error("Wix Data 500");
      },
    });
    const u = await mejlaBevakare("wix-1", {}, d);
    expect(u.skickade).toBe(2);
    expect(u.markeringsfel).toMatch(/500/);
  });
});

describe("mejlaBevakare — en färg som kom tillbaka", () => {
  it("☠️ mejlet namnger färgen och visar dess bild och pris", async () => {
    const { d, skickat } = fejk({ lasProdukt: async () => SANGBORD }, 1);
    const u = await mejlaBevakare("wix-2", { varianter: ["v-vit"] }, d);
    expect(u.skickade).toBe(1);
    const [m] = skickat;
    expect(m.subject).toBe("Tillbaka i lager: Vägghängt sängbord 2-pack – Vit");
    expect(m.bodyHtml).toContain("Nu finns den i utförandet Vit igen.");
    expect(m.bodyHtml).toContain("b379ce_vit~mv2.jpg/v1/fill/");
    expect(m.bodyHtml).not.toContain("b379ce_ek~mv2.jpg");
    expect(m.bodyHtml).toContain("1\u00a0149 kr");
  });

  it("kom alla synliga färger tillbaka gäller mejlet hela produkten", async () => {
    const { d, skickat } = fejk({ lasProdukt: async () => SANGBORD }, 1);
    await mejlaBevakare("wix-2", { varianter: ["v-ek", "v-vit"] }, d);
    expect(skickat[0].subject).toBe("Tillbaka i lager: Vägghängt sängbord 2-pack");
    expect(skickat[0].bodyHtml).toContain("Nu finns den i lager hos oss igen.");
  });

  it("☠️ kom bara en dold färg tillbaka syns ingenting nytt — inget mejl", async () => {
    const dold = { ...SANGBORD, varianter: SANGBORD.varianter.map((v) => (v.id === "v-vit" ? { ...v, visible: false } : v)) };
    const { d, skickat } = fejk({ lasProdukt: async () => dold }, 1);
    const u = await mejlaBevakare("wix-2", { varianter: ["v-vit"] }, d);
    expect(u).toMatchObject({ skickade: 0, ejSkickade: 1, stopp: "varianten_dold" });
    expect(skickat).toHaveLength(0);
  });

  it("okända variant-id ger ett mejl om hela produkten", async () => {
    const { d, skickat } = fejk({ lasProdukt: async () => SANGBORD }, 1);
    await mejlaBevakare("wix-2", { varianter: ["v-okand"] }, d);
    expect(skickat[0].subject).toBe("Tillbaka i lager: Vägghängt sängbord 2-pack");
  });
});

describe("restockStopp", () => {
  it("en synlig produkt med adress, namn och synlig variant går att mejla om", () => {
    expect(restockStopp(KORT)).toBeNull();
  });
});

describe("beskrivUtskick", () => {
  it("☠️ loggraden bär räknare och utfall, aldrig en adress", () => {
    const rad = beskrivUtskick({
      bevakare: 2,
      skickade: 1,
      ejSkickade: 1,
      stopp: undefined,
      sidan: "ingen_nyckel",
      markeringsfel: "Wix Data 500",
      butiksnamn: KORT.namn,
    });
    expect(rad).toBe("2 bevakare, 1 mejlade, 1 EJ SKICKADE, sidans cache: ingen_nyckel, STÄMPELN FÖLL: Wix Data 500");
    expect(rad).not.toMatch(/@/);
  });
});
