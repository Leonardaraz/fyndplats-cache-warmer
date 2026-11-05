import { describe, expect, it } from "vitest";
import {
  arFakturaorder,
  arForskottsorder,
  byggFaktura,
  fakturaMejl,
  FORSKOTT_DAGAR,
  kronor,
  kvittoMejl,
  lasNotering,
  vantarPaForskottsbetalning,
  type Betalningsuppgifter,
  type FakturaOrder,
} from "./faktura";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { fakturaPdf, huvudLayout, metaRader, radbryt, STORLEK } from "./faktura-pdf";
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
  it("mejlet delar aldrig ett kontonummer mellan två rader", () => {
    const betalaTill = "Exempelbanken, clearing 1234-5, konto 123 456 789-0";
    const r = byggFaktura(order(), NU, { ...BETALNING, betalaTill });
    if (!r.ok) throw new Error(r.fel);
    const m = fakturaMejl(r.faktura);
    expect(m.html).toContain("Exempelbanken, clearing&nbsp;1234-5, konto&nbsp;123&nbsp;456&nbsp;789-0");
    // Textversionen är oförändrad.
    expect(m.text).toContain(`Betala till: ${betalaTill}`);
  });
  it("fakturan och kvittot anger valutakoden, inte bara kr", () => {
    const r = byggFaktura(order(), NU, BETALNING);
    if (!r.ok) throw new Error(r.fel);
    for (const typ of ["faktura", "kvitto"] as const) {
      const rader = metaRader(r.faktura, { typ, betaldDatum: "2026-10-20" });
      expect(rader).toContainEqual(["Valuta", "SEK"]);
      expect(rader.map(([etikett]) => etikett)).toContain(typ === "kvitto" ? "Betalningsdatum" : "Förfallodatum");
    }
  });
});

describe("fakturans huvud i PDF:en", () => {
  async function typsnitt() {
    const doc = await PDFDocument.create();
    return {
      vanlig: await doc.embedFont(StandardFonts.Helvetica),
      fet: await doc.embedFont(StandardFonts.HelveticaBold),
    };
  }
  const utanMellanrum = (s: string) => s.replace(/\s/g, "");

  it("ett långt värde radbryts mellan sin etikett och marginalen, på fakturan och kvittot", async () => {
    const { vanlig, fet } = await typsnitt();
    const referens = "Anna Andersson, inköpsorder PO-2026-000123, kostnadsställe 4711 Ekonomi";
    const r = byggFaktura(order({ buyerNote: `org.nr 556000-0000. Referens: ${referens}` }), NU, BETALNING);
    if (!r.ok) throw new Error(r.fel);
    for (const typ of ["faktura", "kvitto"] as const) {
      const h = huvudLayout(r.faktura, { typ, betaldDatum: "2026-10-20" }, vanlig, fet);
      const ref = h.meta.find((m) => m.etikett === "Er referens");
      expect(ref?.rader.length).toBeGreaterThan(1);
      expect(utanMellanrum(ref!.rader.join(""))).toBe(utanMellanrum(referens));
      for (const m of h.meta) {
        for (const rad of m.rader) expect(fet.widthOfTextAtSize(rad, STORLEK.varde)).toBeLessThanOrEqual(m.bredd);
      }
    }
  });

  it("kundens namn och leveransadressen radbryts i sin spalt", async () => {
    const { vanlig, fet } = await typsnitt();
    const foretag = "Exempelföretaget Med Ett Mycket Långt Registrerat Namn Aktiebolag";
    const gata = "Långa Industrivägen 123, Port 4, Leveransingång Bakom Huset, Lastkaj B";
    const adress = { country: "SE", city: "Ellös", postalCode: "474 32", addressLine: gata };
    const kontakt = { firstName: "Anna", lastName: "Andersson", company: foretag };
    const r = byggFaktura(
      order({
        billingInfo: { address: adress, contactDetails: kontakt },
        recipientInfo: { address: adress, contactDetails: kontakt },
      }),
      NU,
      BETALNING,
    );
    if (!r.ok) throw new Error(r.fel);
    const h = huvudLayout(r.faktura, { typ: "faktura" }, vanlig, fet);
    const feta = h.kund.rader.filter((rad) => rad.fet);
    expect(feta.length).toBeGreaterThan(1);
    expect(utanMellanrum(feta.map((rad) => rad.text).join(""))).toBe(utanMellanrum(foretag));
    for (const rad of h.kund.rader) {
      const bredd = (rad.fet ? fet : vanlig).widthOfTextAtSize(rad.text, STORLEK.kund);
      expect(bredd).toBeLessThanOrEqual(h.kund.bredd);
    }
    expect(h.leverans.rader.length).toBeGreaterThan(1);
    for (const rad of h.leverans.rader) {
      expect(vanlig.widthOfTextAtSize(rad, STORLEK.leverans)).toBeLessThanOrEqual(h.leverans.bredd);
    }
    const pdf = await fakturaPdf(r.faktura, { typ: "faktura" });
    expect(Buffer.from(pdf.slice(0, 5)).toString()).toBe("%PDF-");
  });

  it("ett ord som ensamt är bredare än raden delas utan att något tecken försvinner", async () => {
    const { fet } = await typsnitt();
    const ord = "ekonomiavdelningen_leverantorsfakturor_exempelforetaget";
    const rader = radbryt(`Ref ${ord}`, fet, 10, 100);
    expect(rader.length).toBeGreaterThan(2);
    for (const rad of rader) expect(fet.widthOfTextAtSize(rad, 10)).toBeLessThanOrEqual(100);
    expect(utanMellanrum(rader.join(""))).toBe(utanMellanrum(`Ref ${ord}`));
  });

  it("korta värden står på en rad var, som förut", async () => {
    const { vanlig, fet } = await typsnitt();
    const r = byggFaktura(order(), NU, BETALNING);
    if (!r.ok) throw new Error(r.fel);
    const h = huvudLayout(r.faktura, { typ: "faktura" }, vanlig, fet);
    expect(h.meta.every((m) => m.rader.length === 1)).toBe(true);
    expect(h.meta.map((m) => m.rader[0])).toEqual(metaRader(r.faktura, { typ: "faktura" }).map(([, v]) => v));
    expect(h.kund.rader.map((rad) => rad.text)).toEqual(["Exempel AB", "Att: Anna Andersson", "Testgatan 1", "474 32 Ellös"]);
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

describe("förskottsfakturan (medlemskapet E3, svar 3.3)", () => {
  const FORSKOTT = "Förskottsfaktura. Org.nr: 556000-0000. Referens: Anna Andersson.";

  it("känns igen på markören först i noteringen, bara på en handlagd order", () => {
    expect(arForskottsorder(order({ buyerNote: FORSKOTT }))).toBe(true);
    expect(arForskottsorder(order({ buyerNote: "  förskottsfaktura." }))).toBe(true);
    expect(arForskottsorder(order())).toBe(false);
    expect(arForskottsorder(order({ buyerNote: FORSKOTT, channelInfo: { type: "WEB" } }))).toBe(false);
    expect(arForskottsorder(order({ buyerNote: "Faktura, inte förskottsfaktura" }))).toBe(false);
  });

  it("☠️ webhooken håller inne leverantörsuppgifterna tills ordern är betald", () => {
    expect(vantarPaForskottsbetalning(order({ buyerNote: FORSKOTT }))).toBe(true);
    expect(vantarPaForskottsbetalning(order({ buyerNote: FORSKOTT, paymentStatus: "PAID" }))).toBe(false);
    // En vanlig fakturaorder skickas före betalningen, som förut.
    expect(vantarPaForskottsbetalning(order())).toBe(false);
  });

  it("förfaller efter högst tio dagar, och läser org.nr och referens ur noteringen", () => {
    const f = byggFaktura(order({ buyerNote: FORSKOTT }), NU, BETALNING);
    if (!f.ok) throw new Error(f.fel);
    expect(FORSKOTT_DAGAR).toBe(10);
    expect(f.faktura.forskott).toBe(true);
    expect(f.faktura.fakturadatum).toBe("2026-10-09");
    expect(f.faktura.forfallodatum).toBe("2026-10-19");
    expect(f.faktura.kund.orgnr).toBe("556000-0000");
    expect(f.faktura.kund.referens).toBe("Anna Andersson");
    // Kortare villkor i konfigurationen gäller också för förskott.
    const kort = byggFaktura(order({ buyerNote: FORSKOTT }), NU, { ...BETALNING, dagar: 5 });
    if (!kort.ok) throw new Error(kort.fel);
    expect(kort.faktura.forfallodatum).toBe("2026-10-14");
    // En vanlig faktura har kvar sina 30 dagar.
    const vanlig = byggFaktura(order(), NU, BETALNING);
    if (!vanlig.ok) throw new Error(vanlig.fel);
    expect(vanlig.faktura.forskott).toBe(false);
    expect(vanlig.faktura.forfallodatum).toBe("2026-11-08");
  });

  it("mejlen säger att varorna skickas när betalningen har kommit in", () => {
    const f = byggFaktura(order({ buyerNote: FORSKOTT }), NU, BETALNING);
    if (!f.ok) throw new Error(f.fel);
    const m = fakturaMejl(f.faktura);
    expect(m.subject).toBe("Förskottsfaktura 10079 från Fyndplats");
    expect(m.html).toContain("Förskottsfaktura 10079");
    expect(m.text).toContain("vi skickar varorna när betalningen har kommit in");
    expect(m.html).not.toContain("Varan skickas inom kort");
    const k = kvittoMejl(f.faktura, "2026-10-12");
    expect(k.text).toContain("förskottsfaktura 10079");
    expect(k.html).toContain("Nu skickar vi varorna");
    // Den vanliga fakturan är orörd.
    const v = byggFaktura(order(), NU, BETALNING);
    if (!v.ok) throw new Error(v.fel);
    expect(fakturaMejl(v.faktura).subject).toBe("Faktura 10079 från Fyndplats");
    expect(fakturaMejl(v.faktura).html).toContain("Varan skickas inom kort");
    expect(kvittoMejl(v.faktura, "2026-10-12").html).not.toContain("Nu skickar vi varorna");
  });

  it("PDF:en heter Förskottsfaktura", async () => {
    const f = byggFaktura(order({ buyerNote: FORSKOTT }), NU, BETALNING);
    if (!f.ok) throw new Error(f.fel);
    const pdf = await PDFDocument.load(await fakturaPdf(f.faktura, { typ: "faktura" }));
    expect(pdf.getTitle()).toBe("Förskottsfaktura 10079");
  });

  it("kvittot på en betald förskottsorder skapar leverantörsuppgifterna, en gång", async () => {
    const o = order({ buyerNote: FORSKOTT });
    const bestallda: string[] = [];
    const logg = minnesUtskickslogg(() => NU);
    const d: FakturaKorDeps = {
      listaOrdrar: async () => [o],
      logg,
      betalning: async () => BETALNING,
      logo: async () => undefined,
      skicka: async () => ({ id: "ok" }),
      efterBetalning: async (x) => {
        bestallda.push(x.number ?? "");
      },
    };
    await korFakturor({ nu: NU }, d);
    expect(bestallda).toEqual([]);
    o.paymentStatus = "PAID";
    const a = await korFakturor({ nu: NU }, d);
    const b = await korFakturor({ nu: NU }, d);
    expect(a.kvitton).toEqual(["10079"]);
    expect(a.forskottBestallda).toEqual(["10079"]);
    expect(b.forskottBestallda).toEqual([]);
    expect(bestallda).toEqual(["10079"]);
  });

  it("en vanlig fakturaorder rörs inte av förskottsvägen", async () => {
    const o = order();
    let anrop = 0;
    const d: FakturaKorDeps = {
      listaOrdrar: async () => [o],
      logg: minnesUtskickslogg(() => NU),
      betalning: async () => BETALNING,
      logo: async () => undefined,
      skicka: async () => ({ id: "ok" }),
      efterBetalning: async () => {
        anrop++;
      },
    };
    await korFakturor({ nu: NU }, d);
    o.paymentStatus = "PAID";
    const s = await korFakturor({ nu: NU }, d);
    expect(s.kvitton).toEqual(["10079"]);
    expect(anrop).toBe(0);
  });

  it("ett fel när uppgifterna skapas syns i svaret, och kvittot räknas som skickat", async () => {
    const o = order({ buyerNote: FORSKOTT, paymentStatus: "NOT_PAID" });
    const d: FakturaKorDeps = {
      listaOrdrar: async () => [o],
      logg: minnesUtskickslogg(() => NU),
      betalning: async () => BETALNING,
      logo: async () => undefined,
      skicka: async () => ({ id: "ok" }),
      efterBetalning: async () => {
        throw new Error("Wix 503");
      },
    };
    await korFakturor({ nu: NU }, d);
    o.paymentStatus = "PAID";
    const s = await korFakturor({ nu: NU }, d);
    expect(s.kvitton).toEqual(["10079"]);
    expect(s.fel).toEqual([{ order: "10079", typ: "uppgifter", fel: "Wix 503" }]);
  });
});
