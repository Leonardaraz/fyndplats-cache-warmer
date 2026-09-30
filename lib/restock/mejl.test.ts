import { describe, expect, it } from "vitest";
import { byggRestockMejl, formateraPris, kortnamn, mejlbild, uppraknat } from "./mejl";

const BAS = {
  produktnamn: "3D-träpussel raket – mekanisk rymdfärja med raketramp, ljus och 446 delar",
  produktUrl: "https://www.fyndplats.se/produkt/3d-trapussel-raket-rymdfarja",
  bildUrl: "https://static.wixstatic.com/media/b379ce_b1c6920e75144a418650898c0cad9d24~mv2.jpg",
  pris: { min: 1139, max: 1139 },
};

describe("byggRestockMejl", () => {
  it("ämnesraden bär namnets första led, mejlet hela namnet", () => {
    const m = byggRestockMejl(BAS);
    expect(m.subject).toBe("Tillbaka i lager: 3D-träpussel raket");
    expect(m.html).toContain("3D-träpussel raket – mekanisk rymdfärja med raketramp, ljus och 446 delar");
    expect(m.text).toContain("3D-träpussel raket – mekanisk rymdfärja med raketramp, ljus och 446 delar");
  });

  it("länken går till vår produktsida, både i bilden och i knappen", () => {
    const m = byggRestockMejl(BAS);
    const lankar = [...m.html.matchAll(/href="([^"]+)"/g)].map((x) => x[1]);
    expect(lankar).toEqual([BAS.produktUrl, BAS.produktUrl]);
    expect(m.text).toContain(`Visa produkten: ${BAS.produktUrl}`);
  });

  it("☠️ en bild som inte ligger hos Wix släpps inte igenom", () => {
    const m = byggRestockMejl({ ...BAS, bildUrl: "https://ae01.alicdn.com/kf/Sabc.jpg" });
    expect(m.html).not.toContain("alicdn");
    expect(m.html).not.toContain("<img");
  });

  it("☠️ påståendet om att varan ofta tar slut är borta — det är inte sant för varje vara", () => {
    const m = byggRestockMejl(BAS);
    expect(m.html).not.toMatch(/säljer ofta slut|passa på/i);
    expect(m.html).not.toMatch(/sync-cron|okända länkar/i);
  });

  it("utan pris står inget pris, men mejlet är helt", () => {
    const m = byggRestockMejl({ ...BAS, pris: undefined });
    expect(m.html).not.toMatch(/\d kr/);
    expect(m.html).toContain("Visa produkten");
  });

  it("escapar namnet", () => {
    const m = byggRestockMejl({ ...BAS, produktnamn: 'Hylla <b>90</b> & "co"' });
    expect(m.html).toContain("Hylla &lt;b&gt;90&lt;/b&gt; &amp; &quot;co&quot;");
    expect(m.html).not.toContain("<b>90</b>");
  });

  it("klartextversionen slutar med butikens sidfot", () => {
    const m = byggRestockMejl(BAS);
    expect(m.text).toMatch(/--\nBehöver du hjälp\? Mejla info@fyndplats\.com eller ring \+46 73 663 09 90\.\nFyndplats · www\.fyndplats\.se$/);
  });
});

describe("byggRestockMejl med varianter", () => {
  it("ämnesraden, inledningen och kortet säger vilken färg som kom tillbaka", () => {
    const m = byggRestockMejl({ ...BAS, varianter: ["Vit"] });
    expect(m.subject).toBe("Tillbaka i lager: 3D-träpussel raket – Vit");
    expect(m.html).toContain("Nu finns den i utförandet Vit igen.");
    expect(m.text).toContain("Nu finns den i utförandet Vit igen.");
    expect(m.text.split("\n")).toContain("Utförande: Vit");
    expect(m.html).toContain("Utförande: Vit");
  });

  it("flera varianter räknas upp", () => {
    const m = byggRestockMejl({ ...BAS, varianter: ["Vit", "Grå"] });
    expect(m.subject).toBe("Tillbaka i lager: 3D-träpussel raket – Vit och Grå");
    expect(m.html).toContain("Nu finns den i utförandena Vit och Grå igen.");
  });

  it("escapar variantens namn", () => {
    const m = byggRestockMejl({ ...BAS, varianter: ["<b>Vit</b>"] });
    expect(m.html).not.toContain("<b>Vit</b>");
  });
});

describe("uppraknat", () => {
  it("svensk uppräkning", () => {
    expect(uppraknat([])).toBe("");
    expect(uppraknat(["Vit"])).toBe("Vit");
    expect(uppraknat(["Vit", "Grå"])).toBe("Vit och Grå");
    expect(uppraknat(["Vit", "Grå", "Svart"])).toBe("Vit, Grå och Svart");
  });
});

describe("kortnamn", () => {
  it("tar första ledet före ett tankstreck eller bindestreck med mellanslag", () => {
    expect(kortnamn("Kontorsstol – ergonomisk med nackstöd")).toBe("Kontorsstol");
    expect(kortnamn("Kontorsstol - ergonomisk")).toBe("Kontorsstol");
  });

  it("ett bindestreck inne i ett ord delar inte namnet", () => {
    expect(kortnamn("3D-träpussel raket")).toBe("3D-träpussel raket");
  });

  it("kapar ett långt namn vid ett ord", () => {
    const k = kortnamn("Förvaringsskåp med dörrar och justerbara hyllor för badrum kök och hall i vitt");
    expect(k.length).toBeLessThanOrEqual(60);
    expect(k.endsWith("…")).toBe(true);
    expect(k).not.toMatch(/\s…$/);
  });
});

describe("mejlbild", () => {
  it("ger ett kvadratiskt utsnitt ur mitten, i dubbel storlek", () => {
    expect(mejlbild(BAS.bildUrl)).toBe(`${BAS.bildUrl}/v1/fill/w_480,h_480,al_c,q_85/produkt.jpg`);
  });

  it("byter ut ett befintligt utsnitt i stället för att lägga ett till", () => {
    expect(mejlbild(`${BAS.bildUrl}/v1/fit/w_100,h_100/x.jpg`)).toBe(
      `${BAS.bildUrl}/v1/fill/w_480,h_480,al_c,q_85/produkt.jpg`,
    );
  });

  it("allt utanför Wix mediebibliotek blir null", () => {
    expect(mejlbild(undefined)).toBeNull();
    expect(mejlbild("")).toBeNull();
    expect(mejlbild("https://img.aosomcdn.com/x.jpg")).toBeNull();
  });
});

describe("formateraPris", () => {
  it("ett pris", () => {
    expect(formateraPris({ min: 1139, max: 1139 })).toBe("1 139 kr");
  });

  it("olika pris per variant ger Från", () => {
    expect(formateraPris({ min: 499, max: 649 })).toBe("Från 499 kr");
  });

  it("inget pris eller noll ger null", () => {
    expect(formateraPris(undefined)).toBeNull();
    expect(formateraPris({ min: 0, max: 0 })).toBeNull();
  });
});
