import { describe, expect, it } from "vitest";
import {
  DEFAULT_DAY_VALUE_SEK,
  deliveryCandidates,
  deliveryScore,
  isDeliveryMethodMissing,
  parseDeliveryOptions,
  rankDeliveryOptions,
  type DeliveryOption,
} from "./freight";

// Bakgrund (2026-08-19): order #10021 avvisades med DELIVERY_METHOD_NOT_EXIST.
// placeOrder skickade CAINIAO_ECONOMY_GLOBAL hårdkodat för varje produkt.
// Utöver att tjänsten inte finns överallt var den sällan bästa valet: samma
// vara ligger ofta i flera lager med olika pris OCH leveranstid.

const alt = (serviceName: string, costSek: number | null, maxDays: number | null): DeliveryOption =>
  ({ serviceName, costSek, maxDays });

describe("isDeliveryMethodMissing", () => {
  it("känner igen felkoden", () => {
    expect(isDeliveryMethodMissing("DELIVERY_METHOD_NOT_EXIST")).toBe(true);
    expect(isDeliveryMethodMissing("code=DELIVERY_METHOD_NOT_EXIST msg=..")).toBe(true);
  });

  it("laser KODEN aven nar texten doljer den", () => {
    // createOrder bygger aeError som `error_msg || felkod ...`, sa en lasbar
    // text fran AliExpress doljer koden helt — och da hade omforsoket aldrig
    // fyrat, vilket gjort hela fixen till en no-op (granskning 2026-08-19).
    expect(
      isDeliveryMethodMissing(
        "The delivery method is not available for this product",
        "DELIVERY_METHOD_NOT_EXIST",
      ),
    ).toBe(true);
  });

  it("en ANNAN kod ger inget omforsok aven med luddig text", () => {
    expect(isDeliveryMethodMissing("something about delivery", "B_ORDER_LIMIT")).toBe(false);
  });

  it("skiljer den från ANDRA fel — bara fraktsättet får ge omförsök", () => {
    // Ett omförsök på fel grund är i värsta fall en dubbelbeställning.
    for (const annat of [
      "DELIVERY_NOT_AVAILABLE_TO_YOUR_ADDRESS",
      "B_DROPSHIPPER_DELIVERY_ADDRESS_VALIDATE_FAIL",
      "InsufficientBalance", "", null, undefined,
    ]) {
      expect(isDeliveryMethodMissing(annat)).toBe(false);
    }
  });
});

describe("parseDeliveryOptions", () => {
  it("läser ds.freight.query: ören till kronor och pessimistisk dag", () => {
    const o = parseDeliveryOptions({
      method: "aliexpress.ds.freight.query",
      raw: {
        result: {
          delivery_option_list: [
            { code: "CAINIAO_STANDARD", shipping_fee_cent: 0, min_delivery_days: 8, max_delivery_days: 14 },
            { code: "EMS", shipping_fee_cent: 4900, max_delivery_days: 6 },
          ],
        },
      },
    });
    expect(o).toEqual([
      { serviceName: "CAINIAO_STANDARD", costSek: 0, maxDays: 14 },
      { serviceName: "EMS", costSek: 49, maxDays: 6 },
    ]);
  });

  it("läser freight.calculate: belopp som sträng och intervall som text", () => {
    const o = parseDeliveryOptions({
      method: "aliexpress.logistics.buyer.freight.calculate",
      raw: {
        result: {
          aeop_freight_calculate_result_for_buyer_dto_list: {
            aeop_freight_calculate_result_for_buyer_d_t_o: [
              { service_name: "CAINIAO_ECONOMY_GLOBAL", freight: { amount: "0.00" }, estimated_delivery_time: "15-30" },
            ],
          },
        },
      },
    });
    // Intervall → PESSIMISTISKA änden; kunden upplever den, inte den optimistiska.
    expect(o).toEqual([{ serviceName: "CAINIAO_ECONOMY_GLOBAL", costSek: 0, maxDays: 30 }]);
  });

  it("okänd kostnad/tid blir null, inte en gissad nolla", () => {
    const o = parseDeliveryOptions({ method: "x", raw: { delivery_option_list: [{ code: "A" }] } });
    expect(o).toEqual([{ serviceName: "A", costSek: null, maxDays: null }]);
  });

  it("tom lista vid fel, tomt svar eller oväntad form — aldrig ett kast", () => {
    expect(parseDeliveryOptions({ method: "x", error: "timeout" })).toEqual([]);
    expect(parseDeliveryOptions({ method: "x", raw: {} })).toEqual([]);
    expect(parseDeliveryOptions({ method: "x", raw: null })).toEqual([]);
    expect(parseDeliveryOptions({ method: "x", raw: { delivery_option_list: [{ shipping_fee_cent: 0 }] } })).toEqual([]);
  });

  it("dubbletter på tjänstenamn tas bort", () => {
    const o = parseDeliveryOptions({
      method: "x",
      raw: { delivery_option_list: [{ code: "A" }, { code: "A" }, { code: "B" }] },
    });
    expect(o.map((x) => x.serviceName)).toEqual(["A", "B"]);
  });
});

describe("rankDeliveryOptions — billigast OCH snabbast", () => {
  it("gratis och snabb slår gratis och långsam", () => {
    const r = rankDeliveryOptions([alt("LÅNGSAM", 0, 30), alt("SNABB", 0, 7)]);
    expect(r[0].serviceName).toBe("SNABB");
  });

  it("billig och långsam slår dyr och snabb när prisskillnaden är stor", () => {
    // 200 kr dyrare för 10 dagars vinst är inte värt det vid 5 kr/dag.
    const r = rankDeliveryOptions([alt("DYR_SNABB", 200, 5), alt("BILLIG", 0, 15)]);
    expect(r[0].serviceName).toBe("BILLIG");
  });

  it("dyr och snabb slår billig och långsam när tidsskillnaden är stor", () => {
    // 20 kr för att korta 30 dagar till 5 är en bra affär.
    const r = rankDeliveryOptions([alt("BILLIG_SEG", 0, 40), alt("SNABB", 20, 5)]);
    expect(r[0].serviceName).toBe("SNABB");
  });

  it("avvägningen ligger dar dagvardet sager — 5 kr per dag", () => {
    // 10 dagar snabbare är värt exakt 50 kr; en krona över och det tippar.
    const knappt = rankDeliveryOptions([alt("SEG", 0, 20), alt("SNABB", 49, 10)]);
    expect(knappt[0].serviceName).toBe("SNABB");
    const knappt2 = rankDeliveryOptions([alt("SEG", 0, 20), alt("SNABB", 51, 10)]);
    expect(knappt2[0].serviceName).toBe("SEG");
    expect(DEFAULT_DAY_VALUE_SEK).toBe(5);
  });

  it("okand leveranstid vinner inte pa snabbhet genom att tiga", () => {
    const r = rankDeliveryOptions([alt("TYST", 0, null), alt("ANGIVEN", 0, 10)]);
    expect(r[0].serviceName).toBe("ANGIVEN");
  });

  it("okand kostnad antas gratis — DS-svar utelamnar ofta fri frakt", () => {
    // Att straffa tystnad hade sorterat bort just de billigaste alternativen.
    expect(deliveryScore(alt("A", null, 10))).toBe(deliveryScore(alt("B", 0, 10)));
  });

  it("vid lika poang vinner det snabbare", () => {
    // Leveranstiden ar det kunden marker.
    const r = rankDeliveryOptions([alt("DYR_SNABB", 50, 0), alt("GRATIS_SEG", 0, 10)]);
    expect(r[0].serviceName).toBe("DYR_SNABB");
  });

  it("ar stabil — samma indata ger samma ordning", () => {
    const inn = [alt("B", 0, 10), alt("A", 0, 10), alt("C", 0, 10)];
    expect(rankDeliveryOptions(inn).map((o) => o.serviceName))
      .toEqual(rankDeliveryOptions(inn).map((o) => o.serviceName));
  });

  it("muterar inte inlistan", () => {
    const inn = [alt("B", 0, 30), alt("A", 0, 5)];
    const kopia = [...inn];
    rankDeliveryOptions(inn);
    expect(inn).toEqual(kopia);
  });
});

describe("deliveryCandidates", () => {
  it("basta forst, och undefined SIST", () => {
    // undefined = skicka inte falt et alls, lat AliExpress valja.
    expect(deliveryCandidates([alt("SEG", 0, 30), alt("SNABB", 0, 5)]))
      .toEqual(["SNABB", "SEG", undefined]);
  });

  it("tom alternativlista ger BARA 'lat AliExpress valja'", () => {
    // Den starkaste reserven vi har. Tidigare gissade koden pa
    // CAINIAO_ECONOMY_GLOBAL, vilket avvisar hela ordern nar det ar fel —
    // och det VAR fel: AliExpress egen produktsida for samma vara erbjod
    // frakt fran Tjeckien, Frankrike och Spanien (2026-08-19).
    expect(deliveryCandidates([])).toEqual([undefined]);
  });

  it("innehaller alltid exakt EN undefined, sist", () => {
    const k = deliveryCandidates([alt("A", 0, 5), alt("B", 0, 9)]);
    expect(k.filter((x) => x === undefined)).toHaveLength(1);
    expect(k[k.length - 1]).toBeUndefined();
  });
});


describe("num-tolkningen via parseDeliveryOptions", () => {
  const enRad = (rad: Record<string, unknown>) =>
    parseDeliveryOptions({ method: "x", raw: { delivery_option_list: [{ code: "A", ...rad }] } })[0];

  it("DATUM ar inte ett dagintervall", () => {
    // "2026-09-05" hade lasts som 5-9 dagar och gjort ett 45-dagarsalternativ
    // till ranklistans vinnare (granskning 2026-08-19).
    for (const datum of ["2026-09-05", "09/05/2026", "Sep 5, 2026"]) {
      expect(enRad({ estimated_delivery_time: datum }).maxDays).toBeNull();
    }
  });

  it("dagintervall tas i den pessimistiska anden", () => {
    expect(enRad({ estimated_delivery_time: "15-30" }).maxDays).toBe(30);
  });

  it("ett TOMT falt kortsluter inte kedjan till senare falt", () => {
    // ?? hoppar bara over null/undefined. AliExpress returnerar rutinmassigt
    // tomma strangar for falt den inte kan fylla.
    expect(enRad({ max_delivery_days: "", delivery_time: "6" }).maxDays).toBe(6);
    expect(enRad({ shipping_fee_cent: "", shipping_fee: "12" }).costSek).toBe(12);
  });

  it("formaterad avgift lases i stallet for att antas gratis", () => {
    // Okand kostnad antas noll, sa ett oparsat 199-kronorsalternativ hade
    // rankats som billigast — precis den marginallacka rankningen ska stoppa.
    expect(enRad({ shipping_fee_format: "SEK 199.00" }).costSek).toBe(199);
  });
});
