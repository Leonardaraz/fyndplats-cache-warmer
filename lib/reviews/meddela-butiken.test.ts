import { describe, expect, it } from "vitest";
import type { AndradProdukt, ButikensSvar } from "../headless/produktsidor";
import { meddelaButikenOmRecensioner } from "./meddela-butiken";

type Utfall = ButikensSvar["utfall"];

/** En butik som svarar med utfallen i tur och ordning (sista upprepas) och minns anropen. */
function butik(...utfall: Utfall[]) {
  const anrop: { produkter: AndradProdukt[]; orsak: string }[] = [];
  const uppdatera = async (produkter: readonly AndradProdukt[], orsak: string): Promise<ButikensSvar> => {
    anrop.push({ produkter: [...produkter], orsak });
    return { utfall: utfall[Math.min(anrop.length - 1, utfall.length - 1)] };
  };
  return { anrop, uppdatera };
}

const ingenPaus = async () => {};
const ids = (n: number) => Array.from({ length: n }, (_, i) => `prod-${i}`);

describe("meddelaButikenOmRecensioner", () => {
  it("ringer inte när inga produkter ändrats", async () => {
    const b = butik("uppdaterad");
    const ut = await meddelaButikenOmRecensioner([], "test", { uppdatera: b.uppdatera });
    expect(b.anrop).toHaveLength(0);
    expect(ut).toEqual({ produkter: 0, anrop: 0, uppdaterade: 0, misslyckade: 0, utanNyckel: false, hoppade: 0 });
  });

  it("ber om recensionerna (inte hela produkten), en gång per produkt, med orsaken", async () => {
    const b = butik("uppdaterad");
    const ut = await meddelaButikenOmRecensioner([" a ", "b", "a", ""], "initialer-slumpa", { uppdatera: b.uppdatera });
    expect(b.anrop).toEqual([
      { produkter: [{ id: "a", vad: "recensioner" }, { id: "b", vad: "recensioner" }], orsak: "initialer-slumpa" },
    ]);
    expect(ut).toMatchObject({ produkter: 2, anrop: 1, uppdaterade: 1, misslyckade: 0 });
  });

  it("delar upp i anrop om högst 500, som butiken kräver", async () => {
    const b = butik("uppdaterad");
    const ut = await meddelaButikenOmRecensioner(ids(1_200), "test", { uppdatera: b.uppdatera });
    expect(b.anrop.map((a) => a.produkter.length)).toEqual([500, 500, 200]);
    expect(ut).toMatchObject({ produkter: 1_200, anrop: 3, uppdaterade: 3, misslyckade: 0, hoppade: 0 });
  });

  it("försöker en gång till när butiken inte svarar", async () => {
    const b = butik("misslyckades", "uppdaterad");
    const pauser: number[] = [];
    const ut = await meddelaButikenOmRecensioner(["a"], "test", {
      uppdatera: b.uppdatera,
      vanta: async (ms) => void pauser.push(ms),
    });
    expect(b.anrop).toHaveLength(2);
    expect(pauser).toEqual([1_000]);
    expect(ut).toMatchObject({ uppdaterade: 1, misslyckade: 0 });
  });

  it("räknar ett anrop som föll två gånger som misslyckat, och går vidare med nästa", async () => {
    const b = butik("misslyckades", "misslyckades", "uppdaterad");
    const ut = await meddelaButikenOmRecensioner(ids(600), "test", { uppdatera: b.uppdatera, vanta: ingenPaus });
    expect(b.anrop).toHaveLength(3);
    expect(ut).toMatchObject({ produkter: 600, anrop: 2, uppdaterade: 1, misslyckade: 1 });
  });

  it("tål att butiken kastar", async () => {
    const ut = await meddelaButikenOmRecensioner(["a"], "test", {
      uppdatera: async () => {
        throw new Error("nätverket");
      },
      vanta: ingenPaus,
    });
    expect(ut).toMatchObject({ uppdaterade: 0, misslyckade: 1 });
  });

  it("utan nyckel i motorn: inget omförsök, resten hoppas över och det syns", async () => {
    const b = butik("ingen_nyckel");
    const ut = await meddelaButikenOmRecensioner(ids(1_200), "test", { uppdatera: b.uppdatera, vanta: ingenPaus });
    expect(b.anrop).toHaveLength(1);
    expect(ut).toEqual({ produkter: 0, anrop: 0, uppdaterade: 0, misslyckade: 0, utanNyckel: true, hoppade: 1_200 });
  });

  it("slutar be om fler när tidsbudgeten är slut, och säger hur många som hoppades", async () => {
    const b = butik("uppdaterad");
    let klocka = 0;
    const ut = await meddelaButikenOmRecensioner(ids(1_200), "test", {
      uppdatera: async (p, o) => {
        klocka += 100;
        return b.uppdatera(p, o);
      },
      nu: () => klocka,
      slutTid: 150,
    });
    // Efter första anropet står klockan på 100 (< 150): ett andra anrop; sedan 200 > 150.
    expect(b.anrop).toHaveLength(2);
    expect(ut).toMatchObject({ produkter: 1_000, anrop: 2, hoppade: 200 });
  });
});
