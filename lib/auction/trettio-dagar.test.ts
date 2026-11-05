import { describe, expect, it } from "vitest";
import { DAG_MS, MARGINAL_MS, type Prispunkt } from "../pricing/rea";
import type { Prisforlopp } from "../pricing/rea-lager";
import {
  fonsterFran,
  forstaSankning,
  slutadeInomFonstret,
  trettioDagar,
  variantKlarar,
} from "./trettio-dagar";

// Auktionen startar torsdag 07:00 svensk tid (06:00 UTC), första sänkningen 08:00.
const START = "2026-11-05T06:00:00.000Z";
const T1 = forstaSankning(START);
// Seeden kör natten före starten.
const NU = Date.parse("2026-11-05T03:47:00.000Z");
const dagarFore = (d: number) => new Date(T1 - d * DAG_MS).toISOString();
// Historik som börjar långt före fönstret: 999 kr hela tiden.
const stadig: Prispunkt[] = [{ t: dagarFore(60), p: 99_900 }];

describe("forstaSankning och fönstret", () => {
  it("första sänkningen ett steg efter start", () => {
    expect(new Date(T1).toISOString()).toBe("2026-11-05T07:00:00.000Z");
  });
  it("fönstret är 30 dygn plus marginalen", () => {
    expect(T1 - fonsterFran(T1)).toBe(30 * DAG_MS + MARGINAL_MS);
  });
});

describe("variantKlarar", () => {
  it("samma pris hela fönstret klarar", () => {
    expect(variantKlarar(stadig, 99_900, T1, NU)).toBe("ok");
  });

  it("ett lägre pris 29 dygn före stoppar", () => {
    const h: Prispunkt[] = [...stadig, { t: dagarFore(29), p: 89_900 }, { t: dagarFore(20), p: 99_900 }];
    expect(variantKlarar(h, 99_900, T1, NU)).toBe("lagre_pris");
  });

  it("ett lägre pris som slutade 32 dygn före klarar", () => {
    const h: Prispunkt[] = [{ t: dagarFore(60), p: 89_900 }, { t: dagarFore(32), p: 99_900 }];
    expect(variantKlarar(h, 99_900, T1, NU)).toBe("ok");
  });

  it("ett lägre pris som slutade 30,5 dygn före stoppar (marginalen)", () => {
    const h: Prispunkt[] = [{ t: dagarFore(60), p: 89_900 }, { t: dagarFore(30.5), p: 99_900 }];
    expect(variantKlarar(h, 99_900, T1, NU)).toBe("lagre_pris");
  });

  it("en höjning inom fönstret stoppar: det överstrukna priset är inte det lägsta", () => {
    const h: Prispunkt[] = [{ t: dagarFore(60), p: 89_900 }, { t: dagarFore(10), p: 99_900 }];
    expect(variantKlarar(h, 99_900, T1, NU)).toBe("lagre_pris");
  });

  it("en sänkning inom fönstret klarar: startpriset är då det lägsta", () => {
    const h: Prispunkt[] = [{ t: dagarFore(60), p: 99_900 }, { t: dagarFore(10), p: 89_900 }];
    expect(variantKlarar(h, 89_900, T1, NU)).toBe("ok");
  });

  it("ett startpris som höjts efter sista avläsningen stoppar", () => {
    // Historiken säger 899 kr, men seeden läser 999 kr: höjningen är inte avläst än.
    const h: Prispunkt[] = [{ t: dagarFore(60), p: 89_900 }];
    expect(variantKlarar(h, 99_900, T1, NU)).toBe("lagre_pris");
  });

  it("historik som börjar för sent stoppar", () => {
    const h: Prispunkt[] = [{ t: dagarFore(25), p: 99_900 }];
    expect(variantKlarar(h, 99_900, T1, NU)).toBe("ofullstandig");
  });

  it("ingen historik alls stoppar", () => {
    expect(variantKlarar([], 99_900, T1, NU)).toBe("ofullstandig");
  });

  it("en variant som inte gick att köpa när fönstret började stoppar", () => {
    const h: Prispunkt[] = [{ t: dagarFore(60), p: null }, { t: dagarFore(20), p: 99_900 }];
    expect(variantKlarar(h, 99_900, T1, NU)).toBe("ny");
  });

  it("en tid då varianten inte gick att köpa är inget pris", () => {
    const h: Prispunkt[] = [...stadig, { t: dagarFore(15), p: null }, { t: dagarFore(14), p: 99_900 }];
    expect(variantKlarar(h, 99_900, T1, NU)).toBe("ok");
  });

  it("punkter efter nu räknas inte", () => {
    const h: Prispunkt[] = [...stadig, { t: new Date(NU + 60_000).toISOString(), p: 1_000 }];
    expect(variantKlarar(h, 99_900, T1, NU)).toBe("ok");
  });
});

describe("slutadeInomFonstret", () => {
  it("en auktion som slutade 20 dygn före stoppar", () => {
    expect(slutadeInomFonstret({ status: "expired", endedAt: dagarFore(20) }, T1)).toBe(true);
  });
  it("en auktion som slutade 40 dygn före stoppar inte", () => {
    expect(slutadeInomFonstret({ status: "sold", endedAt: dagarFore(40) }, T1)).toBe(false);
  });
  it("en köad eller levande rad är ingen tidigare auktion", () => {
    expect(slutadeInomFonstret({ status: "queued" }, T1)).toBe(false);
    expect(slutadeInomFonstret({ status: "live" }, T1)).toBe(false);
  });
  it("en avslutad rad utan slut går inte att placera och stoppar", () => {
    expect(slutadeInomFonstret({ status: "expired" }, T1)).toBe(true);
  });
});

describe("trettioDagar", () => {
  const forlopp = (punkter: Prispunkt[], id = "v1"): Prisforlopp => ({ productId: "p1", varianter: [{ id, punkter }] });
  const bas = {
    varianter: [{ id: "v1", listOre: 99_900 }],
    luckor: [],
    forra: undefined,
    tSankning: T1,
    nuMs: NU,
  };

  it("en vara med stadigt pris och ingen tidigare auktion klarar", () => {
    expect(trettioDagar({ ...bas, forlopp: forlopp(stadig) })).toEqual({ ok: true });
  });

  it("en egen auktion 20 dygn före stoppar före historiken läses", () => {
    expect(
      trettioDagar({ ...bas, forlopp: forlopp(stadig), forra: { status: "expired", endedAt: dagarFore(20) } }),
    ).toEqual({ ok: false, skal: "nyssAuktionerad" });
  });

  it("en lucka i fönstret stoppar", () => {
    const luckor = [{ fran: dagarFore(12), till: dagarFore(11.5) }];
    expect(trettioDagar({ ...bas, forlopp: forlopp(stadig), luckor })).toEqual({
      ok: false,
      skal: "prishistorik",
      detalj: "lucka",
    });
  });

  it("en lucka före fönstret stoppar inte", () => {
    const luckor = [{ fran: dagarFore(50), till: dagarFore(49) }];
    expect(trettioDagar({ ...bas, forlopp: forlopp(stadig), luckor })).toEqual({ ok: true });
  });

  it("saknad historik stoppar", () => {
    expect(trettioDagar({ ...bas, forlopp: undefined })).toEqual({
      ok: false,
      skal: "prishistorik",
      detalj: "saknar_variant",
    });
  });

  it("en enda variant matchas en mot en även när id:t skrivs olika", () => {
    expect(trettioDagar({ ...bas, forlopp: forlopp(stadig, "00000000-0000-0000-0000-000000000000") })).toEqual({
      ok: true,
    });
  });

  it("flera varianter kräver historik för varje variant", () => {
    const f: Prisforlopp = { productId: "p1", varianter: [{ id: "a", punkter: stadig }] };
    expect(
      trettioDagar({
        ...bas,
        varianter: [
          { id: "a", listOre: 99_900 },
          { id: "b", listOre: 99_900 },
        ],
        forlopp: f,
      }),
    ).toEqual({ ok: false, skal: "prishistorik", detalj: "saknar_variant" });
  });

  it("en variant med lägre pris i fönstret stoppar hela produkten", () => {
    const f: Prisforlopp = {
      productId: "p1",
      varianter: [
        { id: "a", punkter: stadig },
        { id: "b", punkter: [...stadig, { t: dagarFore(5), p: 79_900 }, { t: dagarFore(4), p: 99_900 }] },
      ],
    };
    expect(
      trettioDagar({
        ...bas,
        varianter: [
          { id: "a", listOre: 99_900 },
          { id: "b", listOre: 99_900 },
        ],
        forlopp: f,
      }),
    ).toEqual({ ok: false, skal: "prishistorik", detalj: "lagre_pris" });
  });

  it("en schemalagd rad prövas mot sin egen start, inte nästa", () => {
    // Raden startar om två dagar; en sänkning 31 dygn före DEN starten ligger
    // utanför dess fönster men innanför fönstret för en start i morgon.
    const senare = "2026-11-07T06:00:00.000Z";
    const t = forstaSankning(senare);
    const h: Prispunkt[] = [{ t: new Date(t - 70 * DAG_MS).toISOString(), p: 89_900 }, { t: new Date(t - 31.5 * DAG_MS).toISOString(), p: 99_900 }];
    expect(trettioDagar({ ...bas, forlopp: forlopp(h), tSankning: t })).toEqual({ ok: true });
    expect(trettioDagar({ ...bas, forlopp: forlopp(h), tSankning: T1 })).toEqual({
      ok: false,
      skal: "prishistorik",
      detalj: "lagre_pris",
    });
  });
});
