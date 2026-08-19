import { describe, expect, it } from "vitest";
import {
  deliveryCandidates,
  isDeliveryMethodMissing,
  shippingServiceNames,
} from "./freight";

// Bakgrund (2026-08-19): order #10021 avvisades med DELIVERY_METHOD_NOT_EXIST.
// placeOrder skickade CAINIAO_ECONOMY_GLOBAL hårdkodat för varje produkt, och
// den tjänsten finns inte för alla säljare/lager/destinationer. Saknas den
// vägrar AliExpress HELA ordern.

describe("isDeliveryMethodMissing", () => {
  it("känner igen felkoden i AliExpress felsträng", () => {
    expect(isDeliveryMethodMissing("DELIVERY_METHOD_NOT_EXIST")).toBe(true);
    expect(isDeliveryMethodMissing("code=DELIVERY_METHOD_NOT_EXIST msg=...")).toBe(true);
  });

  it("skiljer det från ANDRA fel — bara fraktsättet får ge omförsök", () => {
    // Ett omförsök på fel grund är i värsta fall en dubbelbeställning.
    for (const annat of [
      "DELIVERY_NOT_AVAILABLE_TO_YOUR_ADDRESS",
      "B_DROPSHIPPER_DELIVERY_ADDRESS_VALIDATE_FAIL",
      "InsufficientBalance",
      "",
      null,
      undefined,
    ]) {
      expect(isDeliveryMethodMissing(annat)).toBe(false);
    }
  });
});

describe("shippingServiceNames", () => {
  it("plockar tjänstenamnen ur ds.freight.query-formen", () => {
    const outcome = {
      method: "aliexpress.ds.freight.query",
      raw: {
        result: {
          delivery_option_list: [
            { code: "CAINIAO_STANDARD", shipping_fee_cent: 0 },
            { code: "AE_RU_CAINIAO_EXPEDITED", shipping_fee_cent: 500 },
          ],
        },
      },
    };
    expect(shippingServiceNames(outcome)).toEqual([
      "CAINIAO_STANDARD",
      "AE_RU_CAINIAO_EXPEDITED",
    ]);
  });

  it("plockar dem ur freight.calculate-formen med service_name", () => {
    const outcome = {
      method: "aliexpress.logistics.buyer.freight.calculate",
      raw: {
        result: {
          aeop_freight_calculate_result_for_buyer_dto_list: {
            aeop_freight_calculate_result_for_buyer_d_t_o: [
              { service_name: "CAINIAO_ECONOMY_GLOBAL", freight: { amount: 0 } },
              { service_name: "EMS", freight: { amount: 120 } },
            ],
          },
        },
      },
    };
    expect(shippingServiceNames(outcome)).toEqual(["CAINIAO_ECONOMY_GLOBAL", "EMS"]);
  });

  it("bevarar ordningen — AliExpress listar billigast först", () => {
    const outcome = {
      method: "x",
      raw: { delivery_option_list: [{ code: "A" }, { code: "B" }, { code: "C" }] },
    };
    expect(shippingServiceNames(outcome)).toEqual(["A", "B", "C"]);
  });

  it("tar bort dubbletter", () => {
    const outcome = {
      method: "x",
      raw: { delivery_option_list: [{ code: "A" }, { code: "A" }, { code: "B" }] },
    };
    expect(shippingServiceNames(outcome)).toEqual(["A", "B"]);
  });

  it("tom lista vid fel, tomt svar eller oväntad form — aldrig ett kast", () => {
    expect(shippingServiceNames({ method: "x", error: "timeout" })).toEqual([]);
    expect(shippingServiceNames({ method: "x", raw: {} })).toEqual([]);
    expect(shippingServiceNames({ method: "x", raw: null })).toEqual([]);
    expect(shippingServiceNames({ method: "x", raw: { delivery_option_list: [] } })).toEqual([]);
  });

  it("hoppar over alternativ utan lasbart tjanstenamn", () => {
    const outcome = {
      method: "x",
      raw: { delivery_option_list: [{ shipping_fee_cent: 0 }, { code: "B" }] },
    };
    expect(shippingServiceNames(outcome)).toEqual(["B"]);
  });
});

describe("deliveryCandidates", () => {
  it("den beprovade tjansten forst nar den finns bland alternativen", () => {
    expect(deliveryCandidates(["EMS", "CAINIAO_ECONOMY_GLOBAL", "DHL"], "CAINIAO_ECONOMY_GLOBAL"))
      .toEqual(["CAINIAO_ECONOMY_GLOBAL", "EMS", "DHL"]);
  });

  it("finns den inte hamnar den SIST som sista utvag", () => {
    // Beteendet får aldrig bli sämre än förut när fraktfrågan misslyckats.
    expect(deliveryCandidates(["EMS", "DHL"], "CAINIAO_ECONOMY_GLOBAL"))
      .toEqual(["EMS", "DHL", "CAINIAO_ECONOMY_GLOBAL"]);
  });

  it("tom alternativlista ger bara defaulten", () => {
    expect(deliveryCandidates([], "CAINIAO_ECONOMY_GLOBAL")).toEqual(["CAINIAO_ECONOMY_GLOBAL"]);
  });

  it("stadar blanksteg och tomma poster", () => {
    expect(deliveryCandidates([" EMS ", "", "   "], "DEF")).toEqual(["EMS", "DEF"]);
  });
});
