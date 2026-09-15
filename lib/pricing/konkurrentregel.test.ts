import { describe, it, expect } from "vitest";
import {
  KONKURRENT_MAX_ALDER_DAGAR,
  LOTTNING_FRAN_SEK,
  TAK_MULTIPEL,
  UNDER_PER_GRUPP,
  alderIDagar,
  lottaGrupp,
  rundaNedat,
  tillampaKonkurrentregel,
  type KonkurrentInput,
} from "./konkurrentregel";
import { roundPrice } from "../import/pricing";

const NU = Date.parse("2026-09-15T12:00:00Z");
const dagarSedan = (d: number) => new Date(NU - d * 86_400_000).toISOString();

/** En rad med landad kostnad 2 500 kr inkl. moms → husets regelpris 3 009 (charm9), tak 3 750. */
function bas(over: Partial<KonkurrentInput> = {}): KonkurrentInput {
  const landad = 2500;
  return {
    regelPris: roundPrice(landad * 1.2, "charm9"),
    landadInklMoms: landad,
    konkurrent: { pris: 3495, hamtad: dagarSedan(1) },
    prisgrupp: "A",
    nu: NU,
    rounding: "charm9",
    ...over,
  };
}

describe("tillampaKonkurrentregel", () => {
  it("☠️ ingen grupp → husets regel, exakt som förut", () => {
    // Opt-in per rad: att deploya koden ändrar inte ett enda pris.
    const i = bas({ prisgrupp: undefined });
    expect(tillampaKonkurrentregel(i)).toEqual({ typ: "regel", pris: i.regelPris });
  });

  it("inget konkurrentpris → husets regel", () => {
    const i = bas({ konkurrent: undefined });
    expect(tillampaKonkurrentregel(i)).toEqual({ typ: "regel", pris: i.regelPris });
  });

  it("grupp A hamnar minst 2 % under dem, på strategins rutnät", () => {
    const u = tillampaKonkurrentregel(bas());
    expect(u.typ).toBe("mal");
    if (u.typ !== "mal") return;
    // 2 % under 3 495 är 3 425,1 → charm9 uppåt ger 3 429 (över) → ett steg ner: 3 419.
    expect(u.pris).toBe(3419);
    expect(u.pris).toBeLessThanOrEqual(3495 * (1 - UNDER_PER_GRUPP.A));
    expect(u.underPct).toBeGreaterThanOrEqual(2);
  });

  it("grupp B hamnar minst 5 % under dem", () => {
    const u = tillampaKonkurrentregel(bas({ prisgrupp: "B" }));
    expect(u.typ).toBe("mal");
    if (u.typ !== "mal") return;
    expect(u.pris).toBeLessThanOrEqual(3495 * (1 - UNDER_PER_GRUPP.B));
    expect(u.pris).toBe(3319);
  });

  it("☠️ priset går aldrig under golvet, ens när målet rundas ner", () => {
    // Målet ligger en krona över golvet (3 010,6); nedrundningen hade annars hamnat under.
    const i = bas({ konkurrent: { pris: 3072, hamtad: dagarSedan(0) } });
    const u = tillampaKonkurrentregel(i);
    expect(u.typ).toBe("mal");
    if (u.typ !== "mal") return;
    expect(u.pris).toBe(i.regelPris);
  });

  it("☠️ deras pris under vårt golv → vi står kvar på golvet, och det syns", () => {
    // Vi jagar inte konkurrenten nedåt. Utfallet är ett eget besked så
    // annonsurvalet kan lyfta ut raden.
    const i = bas({ konkurrent: { pris: 2000, hamtad: dagarSedan(0) } });
    expect(tillampaKonkurrentregel(i)).toEqual({ typ: "golv", pris: i.regelPris, derasPris: 2000 });
  });

  it("☠️ målet över taket → taket, och taket är +25 % mot regeln", () => {
    // Gapet mot dealproffsen är 40 % — utan tak hade vi lyft oss över vad
    // marknaden tål, och över synkens spärr på 40 %.
    const i = bas({ konkurrent: { pris: 6000, hamtad: dagarSedan(0) } });
    const u = tillampaKonkurrentregel(i);
    expect(u.typ).toBe("tak");
    if (u.typ !== "tak") return;
    expect(u.pris).toBeLessThanOrEqual(i.landadInklMoms * TAK_MULTIPEL);
    // Under synkens spärr MAX_PRISANDRING_PCT = 40 med marginal.
    expect((u.pris - i.regelPris) / i.regelPris).toBeLessThan(0.3);
    expect(u.pris).toBe(3749);
  });

  it("☠️ ett gammalt konkurrentpris FRYSER raden — inget pris, inte golvet", () => {
    // Att falla tillbaka på golvet hade sänkt priset 200 kr på tusen varor för
    // att ett cron-jobb stod still.
    const i = bas({ konkurrent: { pris: 3495, hamtad: dagarSedan(KONKURRENT_MAX_ALDER_DAGAR + 1) } });
    const u = tillampaKonkurrentregel(i);
    expect(u.typ).toBe("fryst");
    if (u.typ !== "fryst") return;
    expect(u.skal).toBe("gammalt");
  });

  it("exakt på åldersgränsen gäller priset fortfarande", () => {
    const i = bas({ konkurrent: { pris: 3495, hamtad: dagarSedan(KONKURRENT_MAX_ALDER_DAGAR - 0.01) } });
    expect(tillampaKonkurrentregel(i).typ).toBe("mal");
  });

  it("en oläslig stämpel fryser också", () => {
    const i = bas({ konkurrent: { pris: 3495, hamtad: "igår" } });
    expect(tillampaKonkurrentregel(i)).toEqual({ typ: "fryst", skal: "gammalt", alderDagar: null });
  });

  it("ett trasigt konkurrentpris (0, NaN) fryser i stället för att prissätta", () => {
    for (const pris of [0, -5, NaN]) {
      const u = tillampaKonkurrentregel(bas({ konkurrent: { pris, hamtad: dagarSedan(0) } }));
      expect(u.typ).toBe("fryst");
      if (u.typ === "fryst") expect(u.skal).toBe("ogiltigt");
    }
  });

  it("charm99: kliver ner förbi 89-snäppet i stället för att fastna över målet", () => {
    // 2 % under 3 553 är 3 481,9. charm99 ger 3 489 → snäpps UPP till 3 499 (över),
    // och ett steg på tio ger 3 479. Regeln måste alltså ner två steg.
    const i = bas({ rounding: "charm99", konkurrent: { pris: 3553, hamtad: dagarSedan(0) } });
    const u = tillampaKonkurrentregel(i);
    expect(u.typ).toBe("mal");
    if (u.typ !== "mal") return;
    expect(u.pris).toBe(3479);
  });
});

describe("rundaNedat", () => {
  it("hamnar aldrig över råpriset, för någon strategi", () => {
    for (const strategi of ["charm9", "charm99", "charm90", "integer", "nearest10", "none"] as const) {
      for (const ra of [123.4, 999, 1000.5, 2445.1, 2492, 7919]) {
        expect(rundaNedat(ra, strategi, 0)).toBeLessThanOrEqual(ra + 1e-9);
      }
    }
  });

  it("respekterar golvet", () => {
    expect(rundaNedat(2445.1, "charm9", 2600)).toBe(2600);
  });
});

describe("alderIDagar", () => {
  it("räknar dagar och svarar null på skräp", () => {
    expect(alderIDagar(dagarSedan(2), NU)).toBeCloseTo(2, 6);
    expect(alderIDagar("", NU)).toBeNull();
  });
});

describe("lottaGrupp", () => {
  it("☠️ är deterministisk — samma id ger alltid samma grupp", () => {
    for (let k = 0; k < 50; k++) {
      const id = `wix-${k}`;
      expect(lottaGrupp(id, 3000)).toBe(lottaGrupp(id, 3000));
    }
  });

  it("under LOTTNING_FRAN_SEK blir alla A", () => {
    for (let k = 0; k < 50; k++) expect(lottaGrupp(`wix-${k}`, LOTTNING_FRAN_SEK - 1)).toBe("A");
  });

  it("över gränsen delas produkterna ungefär på mitten", () => {
    let b = 0;
    const N = 2000;
    for (let k = 0; k < N; k++) if (lottaGrupp(`c${k}f3-${k * 7919}`, 3000) === "B") b++;
    expect(b / N).toBeGreaterThan(0.4);
    expect(b / N).toBeLessThan(0.6);
  });
});
