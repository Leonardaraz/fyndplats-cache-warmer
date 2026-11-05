import { describe, expect, it } from "vitest";
import {
  arFakturaorder,
  arForskottsorder,
  arJuridisktOrgnr,
  arKassakop,
  byggFaktura,
  byggKassakvitto,
  fakturaMejl,
  foretagUrBeslut,
  FORSKOTT_DAGAR,
  KASSAKVITTO_FRAN,
  kronor,
  kvittoMejl,
  lasNotering,
  vantarPaForskottsbetalning,
  type Betalningsuppgifter,
  type FakturaOrder,
  type Foretagsuppgifter,
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

describe("kvittot för ett köp i kassan som företag (medlemskapet E3, villkoren 5.2)", () => {
  const KOPT = new Date("2026-11-07T12:00:00Z");
  const BOLAG: Foretagsuppgifter = {
    namn: "Exempel AB",
    orgnr: "556000-0000",
    adress: { gata: "Företagsvägen 3", postnr: "15244", ort: "Södertälje" },
  };
  // En enskild firma: inget nummer på beslutet, för numret är ett personnummer.
  const FIRMA: Foretagsuppgifter = { namn: "Bos Snickeri", adress: { gata: "Verkstadsgatan 1", postnr: "11122", ort: "Stockholm" } };

  function kassaorder(over: Partial<FakturaOrder> = {}): FakturaOrder {
    return order({
      id: "order-k",
      number: "10180",
      createdDate: "2026-11-07T09:15:00.000Z",
      channelInfo: { type: "WEB" },
      paymentStatus: "PAID",
      purchaseFlowId: "flode-1",
      // Kundens egen notering i kassan. Numret här får aldrig hamna på kvittot.
      buyerNote: "Org.nr: 900101-1234. Referens: Inköp",
      billingInfo: {
        address: { country: "SE", city: "Hemorten", postalCode: "111 22", addressLine: "Privatgatan 2" },
        contactDetails: { firstName: "Bo", lastName: "Berg" },
      },
      ...over,
    });
  }

  it("ett betalt köp ur kassan med köpflöde, från startdagen, inte handlagt eller avbrutet", () => {
    expect(arKassakop(kassaorder())).toBe(true);
    expect(arKassakop(kassaorder({ channelInfo: { type: "UNSPECIFIED" } }))).toBe(true);
    expect(arKassakop(kassaorder({ paymentStatus: "PARTIALLY_REFUNDED" }))).toBe(true);
    for (const paymentStatus of ["NOT_PAID", "PENDING", "PARTIALLY_PAID", "FULLY_REFUNDED", undefined]) {
      expect(arKassakop(kassaorder({ paymentStatus }))).toBe(false);
    }
    expect(arKassakop(kassaorder({ channelInfo: { type: "BACKOFFICE_MERCHANT" } }))).toBe(false);
    expect(arKassakop(kassaorder({ status: "CANCELED" }))).toBe(false);
    expect(arKassakop(kassaorder({ purchaseFlowId: undefined }))).toBe(false);
    expect(arKassakop(kassaorder({ purchaseFlowId: "" }))).toBe(false);
    expect(arKassakop(kassaorder({ createdDate: "2026-11-05T23:59:59.000Z" }))).toBe(false);
    expect(arKassakop(kassaorder({ createdDate: KASSAKVITTO_FRAN }))).toBe(true);
    expect(arKassakop(kassaorder({ createdDate: undefined }))).toBe(false);
  });

  it("☠️ beslutet ger företaget, och bara ett bolags nummer", () => {
    expect(arJuridisktOrgnr("556000-0000")).toBe(true);
    expect(arJuridisktOrgnr("802400-1234")).toBe(true);
    // Ett personnummer (månad 01–12) är en enskild firmas och skrivs aldrig ut.
    expect(arJuridisktOrgnr("900101-1234")).toBe(false);
    expect(arJuridisktOrgnr("191900-0000")).toBe(false);
    expect(arJuridisktOrgnr("5560000000")).toBe(false);
    expect(
      foretagUrBeslut({
        foretagNamn: " Exempel AB ",
        foretagOrgnr: "556000-0000",
        foretagFaktura: { gata: "Företagsvägen 3", postnr: "15244", ort: "Södertälje" },
      }),
    ).toEqual(BOLAG);
    expect(foretagUrBeslut({ foretagNamn: "Bos Snickeri", foretagOrgnr: "900101-1234" })).toEqual({ namn: "Bos Snickeri" });
    expect(foretagUrBeslut({ foretagNamn: "X AB", foretagFaktura: { postnr: "15244", ort: "Södertälje" } })).toEqual({ namn: "X AB" });
    // En privat medlemskorg har inget företag på beslutet.
    expect(foretagUrBeslut({ purchaseFlowId: "flode-1", profil: "privat" })).toBeNull();
    expect(foretagUrBeslut({ foretagNamn: "   " })).toBeNull();
  });

  it("köparen är företaget ur beslutet, och kundens notering ger aldrig numret", () => {
    const r = byggKassakvitto(kassaorder(), BOLAG, KOPT, BETALNING);
    if (!r.ok) throw new Error(r.fel);
    expect(r.faktura.kassakop).toBe(true);
    expect(r.faktura.forskott).toBe(false);
    expect(r.faktura.nummer).toBe("10180");
    expect(r.faktura.orderdatum).toBe("2026-11-07");
    expect(r.faktura.kund).toMatchObject({
      foretag: "Exempel AB",
      namn: "Bo Berg",
      orgnr: "556000-0000",
      adressrader: ["Företagsvägen 3", "152 44 Södertälje"],
      epost: "kund@exempel.se",
      referens: "Inköp",
    });
    // Leveransen och beloppen kommer ur ordern, som på en faktura.
    expect(r.faktura.totalOre).toBe(655900);
    const firma = byggKassakvitto(kassaorder(), FIRMA, KOPT, BETALNING);
    if (!firma.ok) throw new Error(firma.fel);
    expect(firma.faktura.kund.orgnr).toBeUndefined();
    expect(firma.faktura.kund.foretag).toBe("Bos Snickeri");
    expect(firma.faktura.kund.adressrader).toEqual(["Verkstadsgatan 1", "111 22 Stockholm"]);
    // Ett nummer som inte är ett bolags skrivs inte ut, hur det än kom dit.
    const fel = byggKassakvitto(kassaorder(), { ...BOLAG, orgnr: "900101-1234" }, KOPT, BETALNING);
    if (!fel.ok) throw new Error(fel.fel);
    expect(fel.faktura.kund.orgnr).toBeUndefined();
    // Utan adress på beslutet står kassans fakturaadress kvar.
    const utan = byggKassakvitto(kassaorder(), { namn: "Exempel AB" }, KOPT, BETALNING);
    if (!utan.ok) throw new Error(utan.fel);
    expect(utan.faktura.kund.adressrader).toEqual(["Privatgatan 2", "111 22 Hemorten"]);
    // En order som inte går ihop ger inget kvitto, som en faktura.
    const trasig = byggKassakvitto(kassaorder({ priceSummary: { ...kassaorder().priceSummary, total: { amount: "1.00" } } }), BOLAG, KOPT, BETALNING);
    expect(trasig.ok).toBe(false);
  });

  it("PDF:en och mejlet talar om ordern, inte om en faktura", async () => {
    const r = byggKassakvitto(kassaorder(), BOLAG, KOPT, BETALNING);
    if (!r.ok) throw new Error(r.fel);
    const meta = metaRader(r.faktura, { typ: "kvitto", betaldDatum: "2026-11-07" });
    expect(meta.map(([e]) => e)).toEqual([
      "Ordernummer",
      "Kvittodatum",
      "Betalningsdatum",
      "Valuta",
      "Ert org.nr",
      "Er referens",
      "Vår referens",
    ]);
    expect(Object.fromEntries(meta)).toMatchObject({ Ordernummer: "10180", Betalningsdatum: "2026-11-07", "Ert org.nr": "556000-0000" });
    const pdf = await fakturaPdf(r.faktura, { typ: "kvitto", betaldDatum: "2026-11-07" });
    expect((await PDFDocument.load(pdf)).getTitle()).toBe("Kvitto order 10180");

    const m = kvittoMejl(r.faktura, "2026-11-07");
    expect(m.subject).toBe("Kvitto för order 10180 från Fyndplats");
    expect(m.html).toContain("utställt på Exempel AB");
    expect(m.html).toContain("organisationsnummer");
    expect(m.html).toContain(">Order<");
    expect(m.html).not.toContain("Faktura<");
    expect(m.text).toContain("Det här är kvittot för order 10180");
    const firma = byggKassakvitto(kassaorder(), FIRMA, KOPT, BETALNING);
    if (!firma.ok) throw new Error(firma.fel);
    expect(kvittoMejl(firma.faktura, "2026-11-07").html).not.toContain("organisationsnummer");
    // Fakturaordrarnas kvitto är som förut.
    const vanlig = byggFaktura(order({ paymentStatus: "PAID" }), NU, BETALNING);
    if (!vanlig.ok) throw new Error(vanlig.fel);
    expect(kvittoMejl(vanlig.faktura, "2026-10-20").subject).toBe("Kvitto: faktura 10079 är betald");
    expect(metaRader(vanlig.faktura, { typ: "kvitto" })[0]).toEqual(["Fakturanummer", "10079"]);
  });

  function deps(ordrar: FakturaOrder[], foretag: Record<string, Foretagsuppgifter>, over: Partial<FakturaKorDeps> = {}) {
    const skickade: { till: string; subject: string; filnamn: string }[] = [];
    const fragor: string[][] = [];
    const logg = minnesUtskickslogg(() => KOPT);
    const d: FakturaKorDeps = {
      listaOrdrar: async () => ordrar,
      logg,
      betalning: async () => BETALNING,
      logo: async () => undefined,
      skicka: async ({ till, mejl, filnamn }) => {
        skickade.push({ till, subject: mejl.subject, filnamn });
        return { id: `resend-${skickade.length}` };
      },
      foretagskop: async (floden) => {
        fragor.push(floden);
        return new Map(floden.filter((f) => foretag[f]).map((f) => [f, foretag[f]]));
      },
      ...over,
    };
    return { d, skickade, fragor, logg };
  }

  it("skickar kvittot en gång till köparen, och frågar bara om betalda köp ur kassan", async () => {
    const ordrar = [
      kassaorder(),
      kassaorder({ id: "order-p", number: "10181", purchaseFlowId: "flode-privat" }),
      kassaorder({ id: "order-o", number: "10182", purchaseFlowId: "flode-1b", paymentStatus: "NOT_PAID" }),
      order({ createdDate: "2026-11-07T08:00:00.000Z", purchaseFlowId: "flode-handlagd" }),
    ];
    const { d, skickade, fragor } = deps(ordrar, { "flode-1": BOLAG, "flode-1b": BOLAG, "flode-handlagd": BOLAG });
    const a = await korFakturor({ nu: KOPT }, d);
    const b = await korFakturor({ nu: KOPT }, d);
    expect(fragor[0]).toEqual(["flode-1", "flode-privat"]);
    expect(a.kassakvitton).toEqual(["10180"]);
    expect(b.kassakvitton).toEqual([]);
    expect(a.fel).toEqual([]);
    const kvitton = skickade.filter((s) => s.filnamn.startsWith("Kvitto-"));
    expect(kvitton).toEqual([{ till: "kund@exempel.se", subject: "Kvitto för order 10180 från Fyndplats", filnamn: "Kvitto-10180.pdf" }]);
    // Den handlagda ordern fick sin faktura som förut, och inget kassakvitto.
    expect(a.fakturor).toEqual(["10079"]);
  });

  it("torrkörningen skickar inget, och utan uppslaget (webhooken) skickas inga kassakvitton", async () => {
    const t = deps([kassaorder()], { "flode-1": BOLAG });
    const s = await korFakturor({ nu: KOPT, dryRun: true }, t.d);
    expect(s.skulleKassakvitton).toEqual(["10180"]);
    expect(t.skickade).toHaveLength(0);
    const w = deps([kassaorder()], { "flode-1": BOLAG }, { foretagskop: undefined });
    const v = await korFakturor({ nu: KOPT }, w.d);
    expect(v.kassakvitton).toEqual([]);
    expect(w.skickade).toHaveLength(0);
  });

  it("kvittot bär köpets dag, också när körningen går dagar senare", async () => {
    const texter: string[] = [];
    const { d } = deps([kassaorder()], { "flode-1": BOLAG }, {
      skicka: async ({ mejl }) => {
        texter.push(mejl.text);
        return { id: "ok" };
      },
    });
    const s = await korFakturor({ nu: new Date("2026-11-09T08:00:00Z") }, d);
    expect(s.kassakvitton).toEqual(["10180"]);
    expect(texter[0]).toContain("Betalningsdatum: 2026-11-07");
  });

  it("ett läsfel i prisbesluten syns i svaret och stoppar inte fakturorna", async () => {
    const handlagd = order({ createdDate: "2026-11-07T08:00:00.000Z" });
    const { d, skickade } = deps([handlagd, kassaorder()], {}, {
      foretagskop: async () => {
        throw new Error("Wix Data 500");
      },
    });
    const s = await korFakturor({ nu: KOPT }, d);
    expect(s.fakturor).toEqual(["10079"]);
    expect(s.fel).toEqual([{ order: "prisbeslut", typ: "kassakvitto", fel: "Wix Data 500" }]);
    expect(skickade.map((x) => x.filnamn)).toEqual(["Faktura-10079.pdf"]);
  });

  it("ett fallet utskick släpps, och provet går till provadressen utan att röra loggen", async () => {
    let forsok = 0;
    const f = deps([kassaorder()], { "flode-1": BOLAG }, {
      skicka: async () => (++forsok === 1 ? { skipped: "no_api_key" } : { id: "ok" }),
    });
    const a = await korFakturor({ nu: KOPT }, f.d);
    expect(a.fel[0]).toMatchObject({ order: "10180", typ: "kassakvitto" });
    expect(await f.logg.finns("order-k", "kvitto")).toBe(false);
    const b = await korFakturor({ nu: KOPT }, f.d);
    expect(b.kassakvitton).toEqual(["10180"]);

    const p = deps([kassaorder()], { "flode-1": BOLAG });
    const s = await korFakturor({ nu: KOPT, ordernummer: ["10180"], provTill: "prov@exempel.se" }, p.d);
    expect(s.kassakvitton).toEqual(["10180"]);
    expect(p.skickade[0]).toMatchObject({ till: "prov@exempel.se", subject: "[Prov] Kvitto för order 10180 från Fyndplats" });
    expect(await p.logg.finns("order-k", "kvitto")).toBe(false);
  });
});
