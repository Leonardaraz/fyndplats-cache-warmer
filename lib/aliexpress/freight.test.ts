import { describe, expect, it } from "vitest";
import { matchAeVariant, parseFreightOutcome } from "./freight";

describe("parseFreightOutcome — ds.freight.query-formen", () => {
  it("fraktalternativ finns → shippable", () => {
    const v = parseFreightOutcome({
      method: "aliexpress.ds.freight.query",
      raw: {
        result: {
          success: true,
          delivery_options: {
            delivery_option_d_t_o: [
              { code: "CAINIAO_STANDARD", company: "PostNord", shipping_fee_cent: 0 },
              { code: "EMS", company: "EMS" },
            ],
          },
        },
      },
    });
    expect(v).toMatchObject({ known: true, shippable: true, optionCount: 2 });
  });

  it("TOM alternativ-lista → bevisat ofraktbar", () => {
    const v = parseFreightOutcome({
      method: "aliexpress.ds.freight.query",
      raw: { result: { success: true, delivery_options: { delivery_option_d_t_o: [] } } },
    });
    expect(v).toMatchObject({ known: true, shippable: false, optionCount: 0 });
  });

  it("success=false med fraktvägs-fel → ofraktbar", () => {
    const v = parseFreightOutcome({
      method: "aliexpress.ds.freight.query",
      raw: { result: { success: false, msg: "Seller does not support delivery to this country" } },
    });
    expect(v).toMatchObject({ known: true, shippable: false });
  });

  it("success=false med okänt fel → unknown (nollar aldrig på obevisat)", () => {
    const v = parseFreightOutcome({
      method: "aliexpress.ds.freight.query",
      raw: { result: { success: false, msg: "system busy" } },
    });
    expect(v).toMatchObject({ known: false, shippable: null });
  });
});

describe("parseFreightOutcome — logistics.buyer.freight.calculate-formen", () => {
  it("resultatlistan med alternativ → shippable", () => {
    const v = parseFreightOutcome({
      method: "aliexpress.logistics.buyer.freight.calculate",
      raw: {
        result: {
          aeop_freight_calculate_result_for_buyer_d_t_o_list: {
            aeop_freight_calculate_result_for_buyer_dto: [
              { service_name: "CAINIAO_FULFILLMENT_STD", freight: { amount: "0.00", currency_code: "SEK" } },
            ],
          },
        },
      },
    });
    expect(v).toMatchObject({ known: true, shippable: true, optionCount: 1 });
  });
});

describe("parseFreightOutcome — fel från API-anropet", () => {
  it("'ingen fraktväg'-fel → ofraktbar", () => {
    const v = parseFreightOutcome({
      method: "aliexpress.ds.freight.query",
      error: "AliExpress API-fel: the seller cannot ship to SE for this sku",
    });
    expect(v).toMatchObject({ known: true, shippable: false });
  });

  it("transient/okänt fel → unknown", () => {
    const v = parseFreightOutcome({
      method: "aliexpress.ds.freight.query",
      error: "AliExpress API HTTP-fel: 502",
    });
    expect(v).toMatchObject({ known: false, shippable: null });
  });

  it("oväntad svarsform utan alternativ-fält → unknown med diagnos-not", () => {
    const v = parseFreightOutcome({ method: "x", raw: { foo: "bar" } });
    expect(v.known).toBe(false);
    expect(v.note).toContain("oväntad svarsform");
  });
});

describe("matchAeVariant", () => {
  // Riktiga varianter från SucceBuy-lådskåpet (1005012347030872).
  const AE = [
    { skuId: "12000059000000001", skuProps: { Color: "40 Drawers", "Ships From": "France" } },
    { skuId: "12000059000000002", skuProps: { Color: "22 Drawers", "Ships From": "France" } },
    { skuId: "12000059000000003", skuProps: { Color: "39 Drawers", "Ships From": "France" } },
  ];

  it("numerisk sku_id → exakt likhet", () => {
    expect(matchAeVariant("12000059000000002", AE)).toBe("12000059000000002");
  });

  it("attribut-sträng från extensionen matchas på namngivna värden", () => {
    expect(matchAeVariant("14:350853#39 Drawers;200007763:201336106", AE)).toBe("12000059000000003");
    expect(matchAeVariant("14:200006155#22 Drawers;200007763:201336106", AE)).toBe("12000059000000002");
  });

  it("tvetydig träff → null (hellre ingen kontroll än fel variants dom)", () => {
    const dup = [
      { skuId: "1", skuProps: { Color: "Red" } },
      { skuId: "2", skuProps: { Color: "Red" } },
    ];
    expect(matchAeVariant("10:100#Red", dup)).toBeNull();
  });

  it("attribut utan namngivna värden: entydig bara vid EN SKU", () => {
    expect(matchAeVariant("200007763:201336106", [AE[0]])).toBe("12000059000000001");
    expect(matchAeVariant("200007763:201336106", AE)).toBeNull();
  });

  it("okänt värde → null", () => {
    expect(matchAeVariant("14:1#60 Drawers;200007763:201336106", AE)).toBeNull();
    expect(matchAeVariant("", AE)).toBeNull();
  });
});
