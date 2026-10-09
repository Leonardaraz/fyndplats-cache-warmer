import { describe, expect, it } from "vitest";
import {
  arFakturaorder,
  byggFaktura,
  fakturaMejl,
  kronor,
  kvittoMejl,
  lasNotering,
  type Betalningsuppgifter,
  type FakturaOrder,
} from "./faktura";
import { fakturaPdf } from "./faktura-pdf";
import { betalningUrKonfig, korFakturor, type FakturaKorDeps } from "./faktura-kor";
import { minnesUtskickslogg } from "./faktura-logg";

const BETALNING: Betalningsuppgifter = { betalaTill: "Bankgiro 999-0000", fSkatt: true, dagar: 30 };
const NU = new Date("2026-10-09T12:00:00Z");

function order(over: Partial<FakturaOrder> = {}): FakturaOrder {
  return {
    id: "order-1",
    number: "10079",
    createdDate: "2026-10-09T10:25:52.362Z",
    status: "APPROVED",
    paymentStatus: "NOT_PAID",
    currency: "SEK",
    taxIncludedInPrices: true,
    channelInfo: { type: "BACKOFFICE_MERCHANT" },
    buyerInfo: { email: "kund@exempel.se" },
    buyerNote: "Faktura till Exempel AB, org.nr 556000-0000. Referens: Anna Andersson.",
    billingInfo: {
      address: { country: "SE", city: "Ellös", postalCode: "474 32", addressLine: "Testgatan 1" },
      contactDetails: { firstName: "Anna", lastName: "Andersson", company: "Exempel AB" },
    },
    shippingInfo: { title: "Fri frakt", cost: { price: { amount: "0" } } },
    priceSummary: {
      subtotal: { amount: "6559.00" },
      shipping: { amount: "0" },
      tax: { amount: "1311.80" },
      discount: { amount: "0" },
      total: { amount: "6559.00" },
    },
    lineItems: [
      {
        id: "li-1",
        quantity: 1,
        productName: { original: "Uppresningsfåtölj – massage och 155° liggläge" },
        physicalProperties: { sku: "FP-stol" },
        price: { amount: "6559.00" },
        totalPriceAfterTax: { amount: "6559.00" },
        taxDetails: { taxRate: "0.25" },
      },
    ],
    ...over,
  };
}

describe("arFakturaorder", () => {
  it("tar en handlagd order från och med startdagen", () => {
    expect(arFakturaorder(order())).toBe(true);
  });
  it("tar inte en order ur kassan", () => {
    expect(arFakturaorder(order({ channelInfo: { type: "WEB" } }))).toBe(false);
  });
  it("tar inte en avbruten order", () => {
    expect(arFakturaorder(order({ status: "CANCELED" }))).toBe(false);
  });
  it("tar inte en handlagd order från före startdagen", () => {
    expect(arFakturaorder(order({ createdDate: "2026-10-01T10:00:00Z" }))).toBe(false);
  });
});

describe("byggFaktura", () => {
  it("räknar netto och moms ur ordern, i öre", () => {
    const r = byggFaktura(order(), NU, BETALNING);
    if (!r.ok) throw new Error(r.fel);
    expect(r.faktura.totalOre).toBe(655900);
    expect(r.faktura.nettoOre).toBe(524720);
    expect(r.faktura.moms).toEqual([{ procent: 25, ore: 131180 }]);
    expect(r.faktura.fakturadatum).toBe("2026-10-09");
    expect(r.faktura.forfallodatum).toBe("2026-11-08");
    expect(r.faktura.kund.orgnr).toBe("556000-0000");
    expect(r.faktura.kund.referens).toBe("Anna Andersson");
  });

  it("vägrar när raderna inte går ihop med orderns total", () => {
    const r = byggFaktura(order({ priceSummary: { ...order().priceSummary, total: { amount: "7000.00" } } }), NU, BETALNING);
    expect(r.ok).toBe(false);
  });

  it("vägrar när momsen inte stämmer", () => {
    const r = byggFaktura(order({ priceSummary: { ...order().priceSummary, tax: { amount: "500.00" } } }), NU, BETALNING);
    expect(r.ok).toBe(false);
  });

  it("vägrar priser exklusive moms och annan valuta", () => {
    expect(byggFaktura(order({ taxIncludedInPrices: false }), NU, BETALNING).ok).toBe(false);
    expect(byggFaktura(order({ currency: "EUR" }), NU, BETALNING).ok).toBe(false);
  });

  it("vägrar utan kundens e-post", () => {
    expect(byggFaktura(order({ buyerInfo: {} }), NU, BETALNING).ok).toBe(false);
  });

  it("tar med frakten i momsen", () => {
    const o = order({
      shippingInfo: { title: "Hemleverans", cost: { price: { amount: "199.00" } } },
      priceSummary: {
        subtotal: { amount: "6559.00" },
        shipping: { amount: "199.00" },
        tax: { amount: "1351.60" },
        discount: { amount: "0" },
        total: { amount: "6758.00" },
      },
    });
    const r = byggFaktura(o, NU, BETALNING);
    if (!r.ok) throw new Error(r.fel);
    expect(r.faktura.moms).toEqual([{ procent: 25, ore: 135160 }]);
    expect(r.faktura.nettoOre).toBe(675800 - 135160);
  });
});

describe("texterna", () => {
  it("kronor skriver svenskt format", () => {
    expect(kronor(655900)).toBe("6 559,00 kr");
    expect(kronor(5)).toBe("0,05 kr");
  });
  it("lasNotering hittar org.nr och referens", () => {
    expect(lasNotering("org.nr 5560000000. Referens: Bo")).toEqual({ orgnr: "556000-0000", referens: "Bo" });
    expect(lasNotering(undefined)).toEqual({});
  });
  it("mejlen säger belopp, förfallodag och vart pengarna ska", () => {
    const r = byggFaktura(order(), NU, BETALNING);
    if (!r.ok) throw new Error(r.fel);
    const m = fakturaMejl(r.faktura);
    expect(m.subject).toBe("Faktura 10079 från Fyndplats");
    expect(m.text).toContain("Bankgiro 999-0000");
    expect(m.text).toContain("2026-11-08");
    expect(m.text).toContain("Meddelande till mottagaren: 10079");
    expect(m.html).toContain("i meddelandet till mottagaren");
    const k = kvittoMejl(r.faktura, "2026-10-20");
    expect(k.subject).toContain("betald");
    expect(k.text).toContain("2026-10-20");
  });
  it("PDF:en blir en PDF även med tecken utanför typsnittet", async () => {
    const r = byggFaktura(
      order({ lineItems: [{ ...order().lineItems![0], productName: { original: "Stol 😀 – grå" } }] }),
      NU,
      BETALNING,
    );
    if (!r.ok) throw new Error(r.fel);
    const pdf = await fakturaPdf(r.faktura, { typ: "faktura" });
    expect(Buffer.from(pdf.slice(0, 5)).toString()).toBe("%PDF-");
  });
});

describe("betalningUrKonfig", () => {
  it("kräver en uppgift om vart pengarna ska", () => {
    expect(betalningUrKonfig({})).toBeNull();
    expect(betalningUrKonfig({ fakturaBetalaTill: "Bankgiro 1", fakturaFSkatt: "ja", fakturaDagar: "10" })).toEqual({
      betalaTill: "Bankgiro 1",
      fSkatt: true,
      dagar: 10,
    });
    expect(betalningUrKonfig({ fakturaBetalaTill: "Bankgiro 1", fakturaDagar: "999" })?.dagar).toBe(30);
  });
});

describe("korFakturor", () => {
  function deps(ordrar: FakturaOrder[], over: Partial<FakturaKorDeps> = {}) {
    const skickade: { till: string; subject: string; filnamn: string }[] = [];
    const logg = minnesUtskickslogg(() => NU);
    const d: FakturaKorDeps = {
      listaOrdrar: async () => ordrar,
      logg,
      betalning: async () => BETALNING,
      logo: async () => undefined,
      skicka: async ({ till, mejl, filnamn }) => {
        skickade.push({ till, subject: mejl.subject, filnamn });
        return { id: `resend-${skickade.length}` };
      },
      ...over,
    };
    return { d, skickade, logg };
  }

  it("skickar fakturan en gång, även när två körningar ser ordern", async () => {
    const { d, skickade } = deps([order()]);
    const a = await korFakturor({ nu: NU }, d);
    const b = await korFakturor({ nu: NU }, d);
    expect(a.fakturor).toEqual(["10079"]);
    expect(b.fakturor).toEqual([]);
    expect(b.vantarPaBetalning).toEqual(["10079"]);
    expect(skickade).toHaveLength(1);
    expect(skickade[0]).toMatchObject({ till: "kund@exempel.se", filnamn: "Faktura-10079.pdf" });
  });

  it("torrkörningen skickar ingenting", async () => {
    const { d, skickade } = deps([order()]);
    const s = await korFakturor({ nu: NU, dryRun: true }, d);
    expect(s.skulleFakturor).toEqual(["10079"]);
    expect(skickade).toHaveLength(0);
  });

  it("utan betalningsuppgifter väntar fakturan", async () => {
    const { d, skickade } = deps([order()], { betalning: async () => null });
    const s = await korFakturor({ nu: NU }, d);
    expect(s.vantarPaBetalningsuppgifter).toEqual(["10079"]);
    expect(skickade).toHaveLength(0);
  });

  it("ett fallet utskick släpper raden så att nästa körning försöker igen", async () => {
    let forsok = 0;
    const { d, logg } = deps([order()], {
      skicka: async () => {
        forsok++;
        if (forsok === 1) throw new Error("Resend 500");
        return { id: "ok" };
      },
    });
    const a = await korFakturor({ nu: NU }, d);
    expect(a.fel).toHaveLength(1);
    expect(await logg.finns("order-1", "faktura")).toBe(false);
    const b = await korFakturor({ nu: NU }, d);
    expect(b.fakturor).toEqual(["10079"]);
  });

  it("ett utskick utan id räknas som fallet", async () => {
    const { d, logg } = deps([order()], { skicka: async () => ({ skipped: "no_api_key" }) });
    const s = await korFakturor({ nu: NU }, d);
    expect(s.fel[0].fel).toContain("no_api_key");
    expect(await logg.finns("order-1", "faktura")).toBe(false);
  });

  it("kvittot går när ordern är betald och fakturan skickad härifrån, en gång", async () => {
    const o = order();
    const { d, skickade } = deps([o]);
    await korFakturor({ nu: NU }, d);
    o.paymentStatus = "PAID";
    const a = await korFakturor({ nu: NU }, d);
    const b = await korFakturor({ nu: NU }, d);
    expect(a.kvitton).toEqual(["10079"]);
    expect(b.kvitton).toEqual([]);
    expect(skickade.map((s) => s.filnamn)).toEqual(["Faktura-10079.pdf", "Kvitto-10079.pdf"]);
  });

  it("inget kvitto för en betald order vi inte fakturerat", async () => {
    const { d, skickade } = deps([order({ paymentStatus: "PAID" })]);
    const s = await korFakturor({ nu: NU }, d);
    expect(s.kvitton).toEqual([]);
    expect(skickade).toHaveLength(0);
  });

  it("rör inte ordrar ur kassan", async () => {
    const { d, skickade } = deps([order({ channelInfo: { type: "WEB" } })]);
    const s = await korFakturor({ nu: NU }, d);
    expect(s.fakturaordrar).toBe(0);
    expect(skickade).toHaveLength(0);
  });

  it("provet går till den angivna adressen och rör inte loggen", async () => {
    const { d, skickade, logg } = deps([order()]);
    const s = await korFakturor({ nu: NU, ordernummer: ["10079"], provTill: "intern@exempel.se" }, d);
    expect(s.fakturor).toEqual(["10079"]);
    expect(skickade.every((m) => m.till === "intern@exempel.se" && m.subject.startsWith("[Prov]"))).toBe(true);
    expect(await logg.finns("order-1", "faktura")).toBe(false);
  });

  it("svaret bär aldrig kundens e-post eller namn", async () => {
    const { d } = deps([order()]);
    const s = await korFakturor({ nu: NU }, d);
    const text = JSON.stringify(s);
    expect(text).not.toContain("@");
    expect(text).not.toContain("Andersson");
  });
});
