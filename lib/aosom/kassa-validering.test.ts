import { describe, expect, it, vi } from "vitest";
import { kassansOvertradelser, lasKassaAnrop, type KassaInfo } from "./kassa-validering";

const rad = (id: string, produkt: string, namn: string) => ({
  id,
  catalogReference: { catalogItemId: produkt, appId: "215238eb-22a5-4c36-9e7b-e7c08025e04e" },
  productName: { original: namn },
});

const info = (postalCode: string | undefined, rader = [rad("l1", "aosom-1", "Fåtölj")]): KassaInfo => ({
  lineItems: rader,
  shippingAddress: postalCode === undefined ? undefined : { address: { country: "SE", postalCode } },
});

const aosom = new Set(["aosom-1", "aosom-2", "aosom-3", "aosom-4", "aosom-5"]);
const deps = { arAosomProdukt: vi.fn(async (id: string) => aosom.has(id)) };

describe("kassansOvertradelser", () => {
  it("stoppar en Aosom-vara till ett spärrat postnummer", async () => {
    const ut = await kassansOvertradelser(info("621 52"), deps);
    expect(ut).toEqual([
      {
        severity: "ERROR",
        target: { other: { name: "OTHER_DEFAULT" } },
        description:
          "Vi kan tyvärr inte leverera Fåtölj till postnummer 621 52. " +
          "Ta bort varan ur kundvagnen eller välj en annan leveransadress.",
      },
    ]);
  });

  it("släpper igenom samma vara till ett vanligt postnummer", async () => {
    expect(await kassansOvertradelser(info("11122"), deps)).toEqual([]);
  });

  it("släpper igenom varor från andra leverantörer till ett spärrat postnummer", async () => {
    expect(await kassansOvertradelser(info("62152", [rad("l1", "ae-1", "Lampa")]), deps)).toEqual([]);
  });

  it("frågar inte efter leverantören innan det finns en adress", async () => {
    const arAosomProdukt = vi.fn(async () => true);
    expect(await kassansOvertradelser(info(undefined), { arAosomProdukt })).toEqual([]);
    expect(arAosomProdukt).not.toHaveBeenCalled();
  });

  it("nämner bara Aosom-varorna, och en produkt på två rader en gång", async () => {
    const arAosomProdukt = vi.fn(async (id: string) => aosom.has(id));
    const ut = await kassansOvertradelser(
      info("47531", [
        rad("l1", "aosom-1", "Fåtölj"),
        rad("l2", "aosom-1", "Fåtölj"),
        rad("l3", "ae-1", "Lampa"),
        rad("l4", "aosom-2", "Bord"),
      ]),
      { arAosomProdukt },
    );
    expect(arAosomProdukt).toHaveBeenCalledTimes(3);
    expect(ut[0].description).toBe(
      "Vi kan tyvärr inte leverera Fåtölj och Bord till postnummer 475 31. " +
        "Ta bort varorna ur kundvagnen eller välj en annan leveransadress.",
    );
  });

  it("kortar en lång lista", async () => {
    const rader = ["A", "B", "C", "D", "E"].map((n, i) => rad(`l${i}`, `aosom-${i + 1}`, n));
    const ut = await kassansOvertradelser(info("62000", rader), deps);
    expect(ut[0].description).toContain("leverera A, B, C och 2 andra varor till postnummer 620 00");
  });
});

describe("lasKassaAnrop", () => {
  const nuSek = 1_800_000_000;
  const giltig = {
    iss: "wix.com",
    aud: "app-1",
    iat: nuSek - 5,
    exp: nuSek + 300,
    data: { request: { validationInfo: info("62152") }, metadata: {} },
  };

  it("läser validationInfo ur data som objekt och som JSON-sträng", () => {
    expect(lasKassaAnrop(giltig, { nuSek })).toEqual({ info: info("62152") });
    expect(lasKassaAnrop({ ...giltig, data: JSON.stringify(giltig.data) }, { nuSek })).toEqual({
      info: info("62152"),
    });
  });

  it("avvisar fel utfärdare, utgånget anrop och fel mottagare", () => {
    expect(lasKassaAnrop({ ...giltig, iss: "annan" }, { nuSek })).toEqual({ fel: "fel utfärdare" });
    expect(lasKassaAnrop({ ...giltig, exp: nuSek - 120 }, { nuSek })).toEqual({ fel: "utgånget" });
    expect(lasKassaAnrop({ ...giltig, iat: nuSek + 600 }, { nuSek })).toEqual({ fel: "utfärdat i framtiden" });
    expect(lasKassaAnrop(giltig, { nuSek, appId: "app-2" })).toEqual({ fel: "fel mottagare" });
    expect(lasKassaAnrop(giltig, { nuSek, appId: "app-1" })).toEqual({ info: info("62152") });
  });

  it("svarar utan info när anropet saknar validationInfo", () => {
    expect(lasKassaAnrop({ ...giltig, data: {} }, { nuSek })).toEqual({ info: null });
  });
});
