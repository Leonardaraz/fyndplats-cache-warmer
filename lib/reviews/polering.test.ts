import { describe, expect, it, vi } from "vitest";
import type { StoredReview } from "../store/reviews";
import {
  artikelkartaFor,
  beslutbar,
  kallaFor,
  polera,
  provaBeslut,
  redanGjord,
  restKandidater,
  utanNamn,
  stilfel,
  tolkaBeslut,
  type PoleringDeps,
  type ProduktBeslut,
} from "./polering";

const P1 = "11111111-1111-4111-8111-111111111111";
const P2 = "22222222-2222-4222-8222-222222222222";

function rad(over: Partial<StoredReview> = {}): StoredReview {
  return {
    productId: P1,
    reviewIdAE: "r1",
    rating: 5,
    textOriginal: "Sehr stabil und einfach aufzubauen, wir sind zufrieden.",
    textSwedish: "Sehr stabil und einfach aufzubauen, wir sind zufrieden.",
    customerNameRaw: "Klaus Beispiel",
    customerCountry: "DE",
    initials: "K.B.",
    date: "2026-05-01",
    hasImage: false,
    status: "pending",
    source: "vevor",
    ...over,
  };
}

const BRA = "Stabil och lätt att sätta ihop, vi är nöjda.";

function beslut(over: Partial<ProduktBeslut> = {}): ProduktBeslut {
  return { productId: P1, oversatt: { r1: BRA }, dolj: {}, ...over };
}

/** Ett lager i minnet som lyder samma regler som de riktiga. */
function lager(rader: StoredReview[]) {
  const data = rader.map((r) => ({ ...r }));
  const skrivna: string[] = [];
  const deps: PoleringDeps = {
    listByProduct: async (id) => data.filter((r) => r.productId === id).map((r) => ({ ...r })),
    artikelkarta: async () => null,
    editText: async (id, rid, sv) => {
      const r = data.find((x) => x.productId === id && x.reviewIdAE === rid)!;
      r.textSwedish = sv;
      r.status = "edited";
      skrivna.push(`text ${id}/${rid}`);
    },
    setStatus: async (id, rid, status) => {
      const r = data.find((x) => x.productId === id && x.reviewIdAE === rid)!;
      r.status = status;
      skrivna.push(`dolj ${id}/${rid}`);
    },
    meddelaButiken: vi.fn(async (ids: string[]) => ({ uppdaterade: ids.length > 0 ? 1 : 0, misslyckade: 0, utanNyckel: false })),
  };
  return { data, skrivna, deps };
}

describe("stilfel — husets stil och tvätten", () => {
  it("släpper vardaglig svenska", () => {
    expect(stilfel(BRA)).toEqual([]);
    expect(stilfel("Funkar bra, 3-4 timmar att montera. Rekommenderar")).toEqual([]);
  });

  it("fäller tankstreck, semikolon, citattecken, tre punkter och AI-fraser", () => {
    expect(stilfel("Bra – men tung")).toContain("tankstreck");
    expect(stilfel("Bra - men tung")).toContain("tankstreck");
    expect(stilfel("Bra; men tung")).toContain("semikolon");
    // En smilis och en saknad punkt står kvar som kunden skrev (Leonard 2026-10-31).
    expect(stilfel("Funkar fint ;) rekommenderar")).toEqual([]);
    expect(stilfel("Snabb leverans och bra kvalitet :-) 😊")).toEqual([]);
    expect(stilfel("Bra;men tung ;-)")).toContain("semikolon");
    expect(stilfel("Den är \"bra\"")).toContain("citattecken");
    expect(stilfel("Bra…")).toContain("tre punkter");
    expect(stilfel("Sammantaget en bra köp")).toContain("AI-fras");
  });

  it("☠️ fäller leverantörer, budfirmor, priser och säljaren", () => {
    expect(stilfel("Bättre än VEVOR:s förra")).toContain("marknadsplats eller leverantör");
    expect(stilfel("Kom med DHL efter en vecka")).toContain("budfirma");
    expect(stilfel("Värd sina 899 kr")).toContain("pris");
    expect(stilfel("Kostade 120 €")).toContain("pris");
    expect(stilfel("Säljaren svarade snabbt")).toContain("säljare eller kundtjänst");
  });

  it("fäller ett artikelnummer i texten", () => {
    expect(stilfel("Beställde TESTVEVOR0123456789 och den är bra")).toContain("artikelnummerform");
  });
});

describe("utanNamn — namn i originalet", () => {
  const f = (textOriginal: string, customerNameRaw?: string) => utanNamn({ textOriginal, customerNameRaw });

  it("☠️ redigerar recensentens eget namn och en signatur sist i texten", () => {
    expect(f("Klaus hat sie aufgebaut, super.", "Klaus Beispiel")).toEqual({ text: "‹NAMN› hat sie aufgebaut, super.", namn: true });
    expect(f("Tolle Bank. Liebe Grüße, Klaus M.")).toEqual({ text: "Tolle Bank. Liebe Grüße, ‹NAMN›", namn: true });
    expect(f("Sehr gut, LG Anna")).toEqual({ text: "Sehr gut, LG ‹NAMN›", namn: true });
  });

  it("tar inte en mening efter en hälsning, ett maskerat namn eller en hälsning utan namn för ett namn", () => {
    expect(f("Muy buena. Saludos. Ahora la uso cada día.").namn).toBe(false);
    expect(f("Funkar bra, rekommenderar", "M***a").namn).toBe(false);
    expect(f("Super Qualität. mfg").namn).toBe(false);
    expect(f("Stabil und schön.", "Kim").namn).toBe(false);
  });
});

describe("kallaFor — läsningen till rundans katalog", () => {
  it("tar bara väntande rader som inte är kundens egna, och räknar resten", () => {
    const p = kallaFor(P1, [
      rad(),
      rad({ reviewIdAE: "r2", status: "edited", textSwedish: "Bra" }),
      rad({ reviewIdAE: "r3", status: "rejected" }),
      rad({ reviewIdAE: "r4", source: "customer", textOriginal: "Jättebra", textSwedish: "Jättebra" }),
      rad({ productId: P2, reviewIdAE: "r5" }),
    ], null);
    expect(p.attBesluta.map((r) => r.id)).toEqual(["r1"]);
    expect(p).toMatchObject({ synliga: 1, dolda: 1, kundVantar: 1 });
  });

  it("☠️ bär aldrig namn eller land, och redigerar artikelnummer", () => {
    const p = kallaFor(P1, [rad({ textOriginal: "Gut, Artikel TESTVEVOR0123456789 passt." })], null);
    const json = JSON.stringify(p);
    expect(json).not.toContain("Klaus");
    expect(json).not.toContain("\"DE\"");
    expect(json).not.toContain("TESTVEVOR0123456789");
    expect(p.attBesluta[0].text).toContain("‹REDIGERAT›");
  });

  it("☠️ redigerar namnet i originalet och märker raden, och en översättning av den fälls", () => {
    const r = rad({ textOriginal: "Klaus hat den Tisch in zehn Minuten aufgebaut, sehr stabil." });
    const p = kallaFor(P1, [r], null);
    expect(p.attBesluta[0]).toMatchObject({ namn: true, text: "‹NAMN› hat den Tisch in zehn Minuten aufgebaut, sehr stabil." });
    const fel = provaBeslut(beslut({ oversatt: { r1: "Han satte ihop bordet på tio minuter, väldigt stabilt." } }), [r], null);
    expect(fel.join("\n")).toMatch(/originalet bär ett namn/);
    expect(provaBeslut(beslut({ oversatt: {}, dolj: { r1: "namn i texten" } }), [r], null)).toEqual([]);
  });
});

describe("provaBeslut", () => {
  it("godkänner ett beslut för varje väntande rad", () => {
    expect(provaBeslut(beslut(), [rad()], null)).toEqual([]);
  });

  it("☠️ fäller en väntande rad utan beslut", () => {
    const fel = provaBeslut(beslut(), [rad(), rad({ reviewIdAE: "r2" })], null);
    expect(fel.join("\n")).toMatch(/1 väntande utan beslut \(r2\)/);
  });

  it("fäller okänt id, kundens eget omdöme och samma id två gånger", () => {
    expect(provaBeslut(beslut({ dolj: { r9: "fel vara" } }), [rad()], null).join("\n")).toMatch(/r9: finns inte/);
    const kund = rad({ reviewIdAE: "k1", source: "customer" });
    expect(provaBeslut(beslut({ dolj: { k1: "x" } }), [rad(), kund], null).join("\n")).toMatch(/kundomdöme/);
    expect(provaBeslut(beslut({ dolj: { r1: "x" } }), [rad()], null).join("\n")).toMatch(/både som översatt och dold/);
  });

  it("fäller en översättning som är oöversatt eller bryter mot stilen", () => {
    const oversatt = { r1: rad().textOriginal };
    expect(provaBeslut(beslut({ oversatt }), [rad()], null).join("\n")).toMatch(/oöversatt/);
    expect(provaBeslut(beslut({ oversatt: { r1: "Stabil – och lätt att sätta ihop, vi är nöjda." } }), [rad()], null).join("\n")).toMatch(/tankstreck/);
  });

  it("☠️ läser id:t per produkt: samma id på en annan produkt räknas inte", () => {
    const annan = rad({ productId: P2 });
    expect(provaBeslut(beslut(), [annan], null).join("\n")).toMatch(/r1: finns inte på produkten/);
  });
});

describe("VEVOR: bara recensioner om produktens egen artikel", () => {
  const EGEN = "Sehr stabil und einfach aufzubauen, wir sind zufrieden.";
  const ANNAN = "Die 50-Liter-Variante ist größer als gedacht, aber gut.";
  const OKAND = "Kam schnell an und funktioniert wie beschrieben, danke.";
  const rader = [
    rad({ reviewIdAE: "e1", textOriginal: EGEN }),
    rad({ reviewIdAE: "a1", textOriginal: ANNAN }),
    rad({ reviewIdAE: "o1", textOriginal: OKAND }),
  ];
  // Avläsningarnas artikel per text, nycklad som recensionsnyckel (gemener, ett mellanrum).
  const perText = new Map<string, string | null>([
    [EGEN.toLowerCase(), "ART-A"],
    [`  ${ANNAN.toLowerCase()} `.trim(), "ART-B"],
  ]);
  const karta = artikelkartaFor(rader, new Set(["ART-A"]), perText);

  it("artikelkartaFor: egen, annan och okänd (texten saknas eller artikeln är null)", () => {
    expect(Object.fromEntries(karta)).toEqual({ e1: "egen", a1: "annan", o1: "okand" });
    const oklar = artikelkartaFor([rad({ reviewIdAE: "x", textOriginal: EGEN })], new Set(["ART-A"]), new Map([[EGEN.toLowerCase(), null]]));
    expect(oklar.get("x")).toBe("okand");
  });

  it("☠️ radens egen artikel går före avläsningen: en äldre rad blir inte okänd", () => {
    const k = artikelkartaFor(
      [rad({ reviewIdAE: "g1", textOriginal: "Text som inte längre står i avläsningen.", vevorArtikel: "ART-A" }),
       rad({ reviewIdAE: "g2", textOriginal: EGEN, vevorArtikel: "ART-B" })],
      new Set(["ART-A"]),
      perText,
    );
    expect(Object.fromEntries(k)).toEqual({ g1: "egen", g2: "annan" });
  });

  it("kallaFor tar bara med den egna artikeln och räknar resten", () => {
    const p = kallaFor(P1, rader, karta);
    expect(p.attBesluta.map((r) => r.id)).toEqual(["e1"]);
    expect(p).toMatchObject({ annanArtikel: 1, okandArtikel: 1 });
    expect(beslutbar(rader[0], null)).toBe(true);
    expect(beslutbar(rader[1], karta)).toBe(false);
  });

  it("☠️ en rad om en annan artikel eller med okänd artikel kan varken översättas eller döljas här", () => {
    const fel = provaBeslut(
      { productId: P1, oversatt: { e1: BRA, a1: "Varianten på 50 liter är större än vi trodde men bra." }, dolj: { o1: "osäker" } },
      rader,
      karta,
    ).join("\n");
    expect(fel).toMatch(/a1: gäller en annan artikel/);
    expect(fel).toMatch(/o1: artikeln går inte att avgöra/);
  });

  it("de raderna kräver inget beslut: den egna räcker", () => {
    expect(provaBeslut({ productId: P1, oversatt: { e1: BRA }, dolj: {} }, rader, karta)).toEqual([]);
  });

  it("polera läser artikelkartan per produkt och skriver bara den egna", async () => {
    const { skrivna, deps } = lager(rader);
    deps.artikelkarta = async () => karta;
    const svar = await polera([{ productId: P1, oversatt: { e1: BRA }, dolj: {} }], false, deps);
    expect(svar.ok).toBe(true);
    expect(skrivna).toEqual([`text ${P1}/e1`]);
    const fel = await polera([{ productId: P1, oversatt: { e1: BRA, a1: "Varianten på 50 liter är större än vi trodde men bra." }, dolj: {} }], false, deps);
    expect(fel.ok).toBe(false);
    expect(skrivna).toEqual([`text ${P1}/e1`]);
  });
});

describe("tolkaBeslut", () => {
  it("tar emot översatt och dolj som id → text", () => {
    const t = tolkaBeslut({ produkter: [P1], beslut: [{ productId: P1, oversatt: { r1: BRA }, dolj: { r2: "handlar om leveransen" } }] });
    expect("beslut" in t && t.beslut[0]).toEqual({ productId: P1, oversatt: { r1: BRA }, dolj: { r2: "handlar om leveransen" } });
  });

  it("☠️ ger varje produkt i rundan ett beslut, tomt när recensioner.json saknar den", () => {
    const t = tolkaBeslut({ produkter: [P1, P2], beslut: [{ productId: P2, dolj: { r1: "handlar om leveransen" } }] });
    expect("beslut" in t && t.beslut).toEqual([
      { productId: P1, oversatt: {}, dolj: {} },
      { productId: P2, oversatt: {}, dolj: { r1: "handlar om leveransen" } },
    ]);
    const utan = tolkaBeslut({ produkter: [P1] });
    expect("beslut" in utan && utan.beslut).toEqual([{ productId: P1, oversatt: {}, dolj: {} }]);
  });

  it("vägrar utan produkter, dubbletter, tomma texter och ett beslut för en produkt utanför rundan", () => {
    expect("fel" in tolkaBeslut({})).toBe(true);
    expect("fel" in tolkaBeslut({ beslut: [{ productId: P1 }] })).toBe(true);
    expect("fel" in tolkaBeslut({ produkter: [P1, P1] })).toBe(true);
    expect("fel" in tolkaBeslut({ produkter: [P1], beslut: [{ productId: P1 }, { productId: P1 }] })).toBe(true);
    expect("fel" in tolkaBeslut({ produkter: [P1], beslut: [{ productId: P1, dolj: { r1: "" } }] })).toBe(true);
    expect("fel" in tolkaBeslut({ produkter: [P1], beslut: [{ productId: P2 }] })).toBe(true);
  });

  it("☠️ en glömd produkt med väntande recensioner fäller hela anropet", async () => {
    const { skrivna, deps } = lager([rad(), rad({ productId: P2 })]);
    const t = tolkaBeslut({ produkter: [P1, P2], beslut: [{ productId: P1, oversatt: { r1: BRA } }] });
    if (!("beslut" in t)) throw new Error("tolkningen föll");
    const svar = await polera(t.beslut, false, deps);
    expect(svar.ok).toBe(false);
    expect(svar.fel.join("\n")).toMatch(new RegExp(`${P2}: 1 väntande utan beslut`));
    expect(skrivna).toEqual([]);
  });
});

describe("restKandidater — publicerade produkter med väntande recensioner", () => {
  it("tar bara synliga produkter, räknar inte kundens egna och märker VEVOR", () => {
    const k = restKandidater(
      [
        { productId: P1, source: "aosom", antal: 3 },
        { productId: P1, source: "customer", antal: 2 },
        { productId: P2, source: "vevor", antal: 5 },
        { productId: "dold", source: "aosom", antal: 9 },
        { productId: "bara-kund", source: "customer", antal: 1 },
      ],
      new Set([P1, P2, "bara-kund"]),
    );
    expect(k).toEqual([
      { productId: P2, vantande: 5, vevor: true },
      { productId: P1, vantande: 3, vevor: false },
    ]);
  });
});

describe("polera", () => {
  it("skriver, läser tillbaka och säger till butiken", async () => {
    const { data, skrivna, deps } = lager([rad(), rad({ reviewIdAE: "r2" })]);
    const svar = await polera([beslut({ dolj: { r2: "handlar om leveransen" } })], false, deps);
    expect(svar.ok).toBe(true);
    expect(skrivna).toEqual([`text ${P1}/r1`, `dolj ${P1}/r2`]);
    expect(data.find((r) => r.reviewIdAE === "r1")).toMatchObject({ status: "edited", textSwedish: BRA });
    expect(data.find((r) => r.reviewIdAE === "r2")?.status).toBe("rejected");
    expect(svar.produkter[0]).toMatchObject({ oversatta: 1, dolda: 1, redan: 0, avvikelser: [] });
    expect(deps.meddelaButiken).toHaveBeenCalledWith([P1]);
  });

  it("☠️ allt eller inget: ett fel i en produkt skriver ingenting i någon", async () => {
    const { skrivna, deps } = lager([rad(), rad({ productId: P2 })]);
    const svar = await polera(
      [beslut(), beslut({ productId: P2, oversatt: { r1: "Bra; men tung att lyfta upp för trappan." } })],
      false,
      deps,
    );
    expect(svar.ok).toBe(false);
    expect(svar.fel.join("\n")).toMatch(/semikolon/);
    expect(skrivna).toEqual([]);
    expect(deps.meddelaButiken).not.toHaveBeenCalled();
  });

  it("torrt skriver ingenting", async () => {
    const { skrivna, deps } = lager([rad()]);
    const svar = await polera([beslut()], true, deps);
    expect(svar.ok).toBe(true);
    expect(skrivna).toEqual([]);
  });

  it("en omkörning efter en skrivning räknar raderna som gjorda och skriver inget", async () => {
    const { skrivna, deps } = lager([rad({ status: "edited", textSwedish: BRA })]);
    const svar = await polera([beslut()], false, deps);
    expect(svar.ok).toBe(true);
    expect(svar.produkter[0]).toMatchObject({ oversatta: 0, redan: 1 });
    expect(skrivna).toEqual([]);
  });

  it("☠️ ett foto som ligger kvar hos leverantören efter publiceringen är en avvikelse", async () => {
    const { deps } = lager([rad({ imageUrl: "https://img.aosomcdn.com/test/foto.jpg", hasImage: true })]);
    const svar = await polera([beslut()], false, deps);
    expect(svar.ok).toBe(false);
    expect(svar.produkter[0].avvikelser).toEqual(["r1: fotot ligger kvar hos leverantören"]);
  });

  it("☠️ en rad som inte läser tillbaka som planen är en avvikelse", async () => {
    const { deps } = lager([rad()]);
    deps.editText = async () => {};
    const svar = await polera([beslut()], false, deps);
    expect(svar.ok).toBe(false);
    expect(svar.produkter[0].avvikelser).toEqual(["r1: inte publicerad med texten"]);
  });

  it("redanGjord skiljer en dold rad från en publicerad", () => {
    expect(redanGjord(rad({ status: "rejected" }), { dolj: true })).toBe(true);
    expect(redanGjord(rad({ status: "edited", textSwedish: BRA }), { sv: BRA })).toBe(true);
    expect(redanGjord(rad({ status: "edited", textSwedish: "Annat" }), { sv: BRA })).toBe(false);
  });
});
