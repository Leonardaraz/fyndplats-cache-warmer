import { describe, expect, it, vi } from "vitest";
import type { StoredReview } from "../store/reviews";
import { MAX_RADER, korFotoBort, planeraFotoBort, tolkaMal, type FotoBortDeps } from "./foto-bort";

const P1 = "11111111-1111-4111-8111-111111111111";
const P2 = "e0b154ec-0779-4cb3-8149-84f0996fbacf";
const bild = (n: string) => `https://static.wixstatic.com/media/test_${n}~mv2.jpg`;

function rad(p: Partial<StoredReview> = {}): StoredReview {
  return {
    productId: P1,
    reviewIdAE: "gen-a1",
    rating: 5,
    textOriginal: "Great",
    textSwedish: "Mycket fin kamin som ger skön värme",
    initials: "A.B.",
    date: "2025-01-02",
    hasImage: true,
    imageUrl: bild("a"),
    imageUrls: [bild("a")],
    status: "edited",
    source: "aosom",
    ...p,
  };
}

describe("tolkaMal", () => {
  it("tar emot en rad med produkt, recension och bilder", () => {
    const { mal, fel } = tolkaMal([{ productId: ` ${P1} `, reviewIdAE: " gen-a1 ", bilder: [bild("a")] }]);
    expect(fel).toEqual([]);
    expect(mal).toEqual([{ productId: P1, reviewIdAE: "gen-a1", bilder: [bild("a")], visaIgen: false }]);
  });

  it("en rad som bara visar en dold recension igen är giltig utan bilder", () => {
    const { mal, fel } = tolkaMal([{ productId: P1, reviewIdAE: "gen-a1", visaIgen: true }]);
    expect(fel).toEqual([]);
    expect(mal).toEqual([{ productId: P1, reviewIdAE: "gen-a1", bilder: [], visaIgen: true }]);
  });

  it("kastar ogiltiga rader och säger varför, de andra släpps igenom", () => {
    const { mal, fel } = tolkaMal([
      { productId: "inte-ett-guid", reviewIdAE: "gen-a1", bilder: [bild("a")] },
      { productId: P1, reviewIdAE: "", bilder: [bild("a")] },
      { productId: P1, reviewIdAE: "gen-b2", bilder: [] },
      { productId: P1, reviewIdAE: "gen-c3", bilder: ["https://x.se/a b.jpg"] },
      { productId: P1, reviewIdAE: "gen-d4", bilder: [bild("d")] },
      "skräp",
    ]);
    expect(mal.map((m) => m.reviewIdAE)).toEqual(["gen-d4"]);
    expect(fel).toHaveLength(5);
    expect(fel.join("\n")).toMatch(/produkt-id/);
    expect(fel.join("\n")).toMatch(/recensions-id/);
    expect(fel.join("\n")).toMatch(/inget att göra/);
    expect(fel.join("\n")).toMatch(/adress/);
  });

  it("samma recension två gånger är ett fel, inte en tyst sammanslagning", () => {
    const { mal, fel } = tolkaMal([
      { productId: P1, reviewIdAE: "gen-a1", bilder: [bild("a")] },
      { productId: P1, reviewIdAE: "gen-a1", bilder: [bild("b")] },
    ]);
    expect(mal).toHaveLength(1);
    expect(fel.join("\n")).toMatch(/två gånger/);
  });

  it("samma recensions-id på två olika produkter är två olika rader", () => {
    const { mal, fel } = tolkaMal([
      { productId: P1, reviewIdAE: "gen-a1", bilder: [bild("a")] },
      { productId: P2, reviewIdAE: "gen-a1", bilder: [bild("a")] },
    ]);
    expect(fel).toEqual([]);
    expect(mal).toHaveLength(2);
  });

  it("☠️ fler rader än taket stoppar hela körningen, inget släpps igenom", () => {
    const alla = Array.from({ length: MAX_RADER + 1 }, (_, i) => ({ productId: P1, reviewIdAE: `gen-${i}`, bilder: [bild("a")] }));
    const { mal, fel } = tolkaMal(alla);
    expect(mal).toEqual([]);
    expect(fel.join("\n")).toMatch(/för många/);
  });

  it("något som inte är en lista ger ett fel", () => {
    expect(tolkaMal({ productId: P1 }).mal).toEqual([]);
    expect(tolkaMal(null).fel.length).toBeGreaterThan(0);
  });
});

describe("planeraFotoBort", () => {
  it("tar bort en av två bilder och behåller ordningen på resten", () => {
    const r = rad({ imageUrl: bild("a"), imageUrls: [bild("a"), bild("b"), bild("c")] });
    const [p] = planeraFotoBort([r], [{ productId: P1, reviewIdAE: "gen-a1", bilder: [bild("b")], visaIgen: false }]);
    expect(p.utfall).toBe("andras");
    expect(p.ny?.imageUrl).toBe(bild("a"));
    expect(p.ny?.imageUrls).toEqual([bild("a"), bild("c")]);
    expect(p.ny?.hasImage).toBe(true);
    expect(p.bilderFore).toBe(3);
    expect(p.bilderEfter).toBe(2);
  });

  it("tar bort första bilden: nästa blir imageUrl", () => {
    const r = rad({ imageUrl: bild("a"), imageUrls: [bild("a"), bild("b")] });
    const [p] = planeraFotoBort([r], [{ productId: P1, reviewIdAE: "gen-a1", bilder: [bild("a")], visaIgen: false }]);
    expect(p.ny?.imageUrl).toBe(bild("b"));
    expect(p.ny?.imageUrls).toEqual([bild("b")]);
  });

  it("tar bort den enda bilden: alla tre bildfälten finns men är tomma, och försvinner ur JSON", () => {
    const [p] = planeraFotoBort([rad()], [{ productId: P1, reviewIdAE: "gen-a1", bilder: [bild("a")], visaIgen: false }]);
    expect(p.utfall).toBe("andras");
    const ny = p.ny as StoredReview;
    expect(ny.hasImage).toBe(false);
    // Nycklarna måste finnas (som undefined): lagret skriver en helersättning av raden,
    // och en saknad nyckel hade inte kunnat rensa det gamla värdet vid en spread.
    expect("imageUrl" in ny).toBe(true);
    expect("imageUrls" in ny).toBe(true);
    expect(ny.imageUrl).toBeUndefined();
    expect(ny.imageUrls).toBeUndefined();
    const lagrad = JSON.parse(JSON.stringify(ny));
    expect("imageUrl" in lagrad).toBe(false);
    expect("imageUrls" in lagrad).toBe(false);
  });

  it("en gammal rad med bara imageUrl (ingen lista) hanteras", () => {
    const r = rad({ imageUrl: bild("a"), imageUrls: undefined });
    const [p] = planeraFotoBort([r], [{ productId: P1, reviewIdAE: "gen-a1", bilder: [bild("a")], visaIgen: false }]);
    expect(p.ny?.hasImage).toBe(false);
    expect(p.bilderFore).toBe(1);
  });

  it("rör inget annat än bilderna: text, betyg, datum, initialer, status och källa är oförändrade", () => {
    const r = rad({ imageUrl: bild("a"), imageUrls: [bild("a"), bild("b")] });
    const [p] = planeraFotoBort([r], [{ productId: P1, reviewIdAE: "gen-a1", bilder: [bild("a")], visaIgen: false }]);
    const { hasImage: _h, imageUrl: _u, imageUrls: _us, ...resten } = p.ny as StoredReview;
    const { hasImage: _h2, imageUrl: _u2, imageUrls: _us2, ...restenFore } = r;
    expect(resten).toEqual(restenFore);
  });

  it("en bild som inte finns på recensionen skrivs inte: raden är redan klar, och bilden rapporteras som saknad", () => {
    const [p] = planeraFotoBort([rad()], [{ productId: P1, reviewIdAE: "gen-a1", bilder: [bild("finns-inte")], visaIgen: false }]);
    expect(p.utfall).toBe("redan_klar");
    expect(p.ny).toBeUndefined();
    expect(p.saknade).toBe(1);
  });

  it("av två begärda bilder finns bara en: den tas bort och den andra rapporteras som saknad", () => {
    const r = rad({ imageUrl: bild("a"), imageUrls: [bild("a"), bild("b")] });
    const [p] = planeraFotoBort([r], [{ productId: P1, reviewIdAE: "gen-a1", bilder: [bild("b"), bild("x")], visaIgen: false }]);
    expect(p.utfall).toBe("andras");
    expect(p.ny?.imageUrls).toEqual([bild("a")]);
    expect(p.saknade).toBe(1);
  });

  it("en recension som inte finns ger recension_saknas och ingenting att skriva", () => {
    const [p] = planeraFotoBort([rad()], [{ productId: P1, reviewIdAE: "gen-finns-inte", bilder: [bild("a")], visaIgen: false }]);
    expect(p.utfall).toBe("recension_saknas");
    expect(p.ny).toBeUndefined();
  });

  it("recensions-id räknas per produkt: samma id på en annan produkt rörs inte", () => {
    const [p] = planeraFotoBort([rad({ productId: P2 })], [{ productId: P1, reviewIdAE: "gen-a1", bilder: [bild("a")], visaIgen: false }]);
    expect(p.utfall).toBe("recension_saknas");
  });

  it("visaIgen: en dold recension blir synlig (edited) och fotot går bort i samma steg", () => {
    const r = rad({ status: "rejected" });
    const [p] = planeraFotoBort([r], [{ productId: P1, reviewIdAE: "gen-a1", bilder: [bild("a")], visaIgen: true }]);
    expect(p.utfall).toBe("andras");
    expect(p.ny?.status).toBe("edited");
    expect(p.ny?.hasImage).toBe(false);
    expect(p.statusFore).toBe("rejected");
    expect(p.statusEfter).toBe("edited");
  });

  it("visaIgen utan bilder: bara statusen ändras", () => {
    const [p] = planeraFotoBort([rad({ status: "rejected" })], [{ productId: P1, reviewIdAE: "gen-a1", bilder: [], visaIgen: true }]);
    expect(p.utfall).toBe("andras");
    expect(p.ny?.status).toBe("edited");
    expect(p.ny?.imageUrls).toEqual([bild("a")]);
  });

  it("visaIgen på en redan synlig recension ändrar inte status och är redan klar", () => {
    for (const status of ["edited", "approved"] as const) {
      const [p] = planeraFotoBort([rad({ status })], [{ productId: P1, reviewIdAE: "gen-a1", bilder: [], visaIgen: true }]);
      expect(p.utfall).toBe("redan_klar");
      expect(p.ny).toBeUndefined();
    }
  });

  it("☠️ visaIgen publicerar aldrig en väntande recension (pending) som ingen godkänt", () => {
    const [p] = planeraFotoBort([rad({ status: "pending" })], [{ productId: P1, reviewIdAE: "gen-a1", bilder: [], visaIgen: true }]);
    expect(p.utfall).toBe("redan_klar");
    expect(p.ny).toBeUndefined();
    expect(p.statusEfter).toBe("pending");
  });

  it("fotot kan tas bort från en dold recension utan att den visas", () => {
    const [p] = planeraFotoBort([rad({ status: "rejected" })], [{ productId: P1, reviewIdAE: "gen-a1", bilder: [bild("a")], visaIgen: false }]);
    expect(p.utfall).toBe("andras");
    expect(p.ny?.status).toBe("rejected");
    expect(p.ny?.hasImage).toBe(false);
  });

  it("är idempotent: samma plan på resultatet ändrar inget mer", () => {
    const mal = [{ productId: P1, reviewIdAE: "gen-a1", bilder: [bild("a")], visaIgen: true }];
    const [forsta] = planeraFotoBort([rad({ status: "rejected" })], mal);
    const [andra] = planeraFotoBort([forsta.ny as StoredReview], mal);
    expect(andra.utfall).toBe("redan_klar");
    expect(andra.ny).toBeUndefined();
  });

  it("rapportraden bär bara det som syns på sidan: initialer, datum, antal, status. Ingen text, inget namn", () => {
    const [p] = planeraFotoBort([rad({ customerNameRaw: "Hemligt Namn", customerCountry: "DE" })], [{ productId: P1, reviewIdAE: "gen-a1", bilder: [bild("a")], visaIgen: false }]);
    expect(p.initialer).toBe("A.B.");
    expect(p.datum).toBe("2025-01-02");
    const synligt = JSON.stringify({ ...p, ny: undefined });
    expect(synligt).not.toContain("Hemligt");
    expect(synligt).not.toContain("Mycket fin");
  });
});

function fejkLager(rader: StoredReview[]) {
  const skrivna: StoredReview[] = [];
  const deps: FotoBortDeps = {
    listByProduct: vi.fn(async (id: string) => rader.filter((r) => r.productId === id)),
    upsert: vi.fn(async (r: StoredReview) => {
      skrivna.push(r);
    }),
    sagTillButiken: vi.fn(async () => ({ utfall: "uppdaterad", status: 200, produkter: 1 })),
  };
  return { deps, skrivna };
}

describe("korFotoBort", () => {
  const mal = [{ productId: P1, reviewIdAE: "gen-a1", bilder: [bild("a")], visaIgen: true }];

  it("torrkörning skriver ingenting och ropar inte på butiken, men visar vad som skulle ändras", async () => {
    const { deps, skrivna } = fejkLager([rad({ status: "rejected" })]);
    const rapport = await korFotoBort(mal, false, deps);
    expect(skrivna).toEqual([]);
    expect(deps.sagTillButiken).not.toHaveBeenCalled();
    expect(rapport.skarp).toBe(false);
    expect(rapport.rader[0].utfall).toBe("andras");
    expect(rapport.skrivna).toBe(0);
  });

  it("skarp körning skriver de ändrade raderna och säger till butiken om just de produkterna, med vad = recensioner", async () => {
    const { deps, skrivna } = fejkLager([
      rad({ status: "rejected" }),
      rad({ productId: P2, reviewIdAE: "gen-z9", imageUrl: bild("z"), imageUrls: [bild("z")] }),
    ]);
    const rapport = await korFotoBort(
      [...mal, { productId: P2, reviewIdAE: "gen-z9", bilder: [bild("finns-inte")], visaIgen: false }],
      true,
      deps,
    );
    expect(skrivna).toHaveLength(1);
    expect(skrivna[0].status).toBe("edited");
    expect(skrivna[0].hasImage).toBe(false);
    expect(rapport.skrivna).toBe(1);
    expect(rapport.misslyckade).toBe(0);
    expect(deps.sagTillButiken).toHaveBeenCalledTimes(1);
    expect(deps.sagTillButiken).toHaveBeenCalledWith([{ id: P1, vad: "recensioner" }]);
    expect(rapport.butiken).toEqual({ utfall: "uppdaterad", status: 200, produkter: 1 });
  });

  it("läser varje produkt en gång även när den har flera rader", async () => {
    const { deps } = fejkLager([
      rad({ reviewIdAE: "gen-a1" }),
      rad({ reviewIdAE: "gen-a2", imageUrl: bild("b"), imageUrls: [bild("b")] }),
    ]);
    await korFotoBort(
      [
        { productId: P1, reviewIdAE: "gen-a1", bilder: [bild("a")], visaIgen: false },
        { productId: P1, reviewIdAE: "gen-a2", bilder: [bild("b")], visaIgen: false },
      ],
      false,
      deps,
    );
    expect(deps.listByProduct).toHaveBeenCalledTimes(1);
  });

  it("ett skrivfel på en rad stoppar inte de andra, och butiken får bara det som faktiskt skrevs", async () => {
    const { deps, skrivna } = fejkLager([
      rad({ reviewIdAE: "gen-a1" }),
      rad({ productId: P2, reviewIdAE: "gen-z9", imageUrl: bild("z"), imageUrls: [bild("z")] }),
    ]);
    (deps.upsert as ReturnType<typeof vi.fn>).mockImplementationOnce(async () => {
      throw new Error("databasen sa nej");
    });
    const rapport = await korFotoBort(
      [
        { productId: P1, reviewIdAE: "gen-a1", bilder: [bild("a")], visaIgen: false },
        { productId: P2, reviewIdAE: "gen-z9", bilder: [bild("z")], visaIgen: false },
      ],
      true,
      deps,
    );
    expect(rapport.misslyckade).toBe(1);
    expect(rapport.skrivna).toBe(1);
    expect(skrivna.map((r) => r.productId)).toEqual([P2]);
    expect(rapport.rader.map((r) => r.utfall)).toEqual(["fel", "andras"]);
    expect(deps.sagTillButiken).toHaveBeenCalledWith([{ id: P2, vad: "recensioner" }]);
  });

  it("en produkt som inte går att läsa ger fel på dess rader, de andra produkterna körs ändå", async () => {
    const { deps, skrivna } = fejkLager([rad({ productId: P2, reviewIdAE: "gen-z9", imageUrl: bild("z"), imageUrls: [bild("z")] })]);
    (deps.listByProduct as ReturnType<typeof vi.fn>).mockImplementationOnce(async () => {
      throw new Error("lagret nere");
    });
    const rapport = await korFotoBort(
      [
        { productId: P1, reviewIdAE: "gen-a1", bilder: [bild("a")], visaIgen: false },
        { productId: P2, reviewIdAE: "gen-z9", bilder: [bild("z")], visaIgen: false },
      ],
      true,
      deps,
    );
    expect(rapport.rader.map((r) => r.utfall)).toEqual(["fel", "andras"]);
    expect(skrivna).toHaveLength(1);
  });

  it("butikens svar kan inte fälla körningen: ett kast blir 'misslyckades' i rapporten", async () => {
    const { deps } = fejkLager([rad({ status: "rejected" })]);
    (deps.sagTillButiken as ReturnType<typeof vi.fn>).mockImplementationOnce(async () => {
      throw new Error("ECONNRESET");
    });
    const rapport = await korFotoBort(mal, true, deps);
    expect(rapport.skrivna).toBe(1);
    expect(rapport.butiken).toEqual({ utfall: "misslyckades" });
  });

  it("inget skrivet betyder inget anrop till butiken", async () => {
    const { deps } = fejkLager([rad()]);
    const rapport = await korFotoBort([{ productId: P1, reviewIdAE: "gen-a1", bilder: [bild("finns-inte")], visaIgen: false }], true, deps);
    expect(rapport.skrivna).toBe(0);
    expect(deps.sagTillButiken).not.toHaveBeenCalled();
    expect(rapport.butiken).toBeUndefined();
  });
});
