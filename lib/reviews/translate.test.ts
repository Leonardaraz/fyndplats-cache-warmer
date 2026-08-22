import { describe, expect, it, vi } from "vitest";
import {
  applyTranslations,
  buildTranslatePrompt,
  groupForTranslation,
  parseTranslations,
  validateTranslation,
} from "./translate";
import type { StoredReview } from "../store/reviews";

function rad(över: Partial<StoredReview> = {}): StoredReview {
  return {
    productId: "p1",
    reviewIdAE: "a1",
    rating: 5,
    textOriginal: "Great product, assembled in twenty minutes and feels very sturdy.",
    textSwedish: "",
    initials: "A.B.",
    hasImage: false,
    status: "pending",
    ...över,
  };
}

const OK_SV = "Toppenprodukt, monterad på tjugo minuter och känns stabil.";

describe("validateTranslation", () => {
  const källa = "Great product, assembled in twenty minutes and feels very sturdy.";

  it("godkänner en riktig översättning", () => {
    expect(validateTranslation(källa, OK_SV).ok).toBe(true);
  });

  it("avvisar tom text", () => {
    expect(validateTranslation(källa, "   ")).toMatchObject({ ok: false, reason: "tom" });
  });

  // Exakt det den gamla DeepL-fallbacken gjorde: sparade källtexten och lät den
  // gå ut som "svensk". Den vägen ska vara stängd.
  it("avvisar text som är identisk med källan", () => {
    expect(validateTranslation(källa, källa)).toMatchObject({ ok: false, reason: "oöversatt" });
  });

  it("avvisar text som nämner marknadsplatsen", () => {
    expect(
      validateTranslation(källa, "Kom snabbt från AliExpress och känns stabil i konstruktionen."),
    ).toMatchObject({ ok: false, reason: "marknadsplats-nämnd" });
  });

  it("avvisar text som tappat innehåll", () => {
    expect(validateTranslation(källa, "Bra.")).toMatchObject({ ok: false, reason: "för-kort" });
  });

  it("avvisar text som hittat på", () => {
    expect(
      validateTranslation(
        källa,
        "Toppenprodukt som monterades på tjugo minuter och känns stabil. " +
          "Dessutom levererades den blixtsnabbt, emballaget var perfekt, färgen " +
          "stämmer exakt med bilderna och priset är oslagbart jämfört med allt annat.",
      ),
    ).toMatchObject({ ok: false, reason: "för-lång" });
  });

  it("avvisar halvöversatt text med engelska kvar", () => {
    expect(
      validateTranslation(källa, "Very good kvalitet och snabb leverans till dörren."),
    ).toMatchObject({ ok: false, reason: "engelska-kvar" });
  });

  it("ett enstaka engelskt ord fäller inte — det kan vara ett produktnamn", () => {
    expect(
      validateTranslation(
        "Charges fast and the battery lasts all day long without any problem.",
        "Laddar snabbt med Fast Charge och batteriet räcker hela dagen utan problem.",
      ).ok,
    ).toBe(true);
  });
});

describe("groupForTranslation + buildTranslatePrompt", () => {
  const rader = [
    rad({ reviewIdAE: "a1" }),
    rad({ reviewIdAE: "a2" }),
    rad({ productId: "p2", reviewIdAE: "b1", textOriginal: "Le palline sono ottime davvero" }),
  ];
  const namn = (id: string) => (id === "p1" ? "Rosa lekgarderob" : "Bollkastare för hund");

  it("grupperar per produkt", () => {
    const g = groupForTranslation(rader, namn);
    expect(g).toHaveLength(2);
    expect(g[0].rader).toHaveLength(2);
    expect(g[0].namn).toBe("Rosa lekgarderob");
  });

  it("respekterar omgångens tak", () => {
    const många = Array.from({ length: 40 }, (_, i) => rad({ reviewIdAE: `a${i}` }));
    const g = groupForTranslation(många, namn, 25);
    expect(g.reduce((n, x) => n + x.rader.length, 0)).toBe(25);
  });

  // Ballong-lärdomen 2026-08-17: utan produktnamnet blir "le palline"
  // "bollarna" i stället för "bollarna till kastaren".
  it("prompten bär produktnamnet och varje id", () => {
    const p = buildTranslatePrompt(groupForTranslation(rader, namn));
    expect(p).toContain("Rosa lekgarderob");
    expect(p).toContain("Bollkastare för hund");
    expect(p).toContain("[a1]");
    expect(p).toContain("[b1]");
    expect(p).toMatch(/ETT JSON-block/);
    expect(p).toMatch(/Nämn ALDRIG var varan är köpt/);
  });

  it("faller tillbaka på produkt-id när namnet saknas", () => {
    const p = buildTranslatePrompt(groupForTranslation([rad()], () => undefined));
    expect(p).toContain("p1");
  });
});

describe("parseTranslations", () => {
  it("läser ett rent JSON-block", () => {
    expect(parseTranslations('{"a1":"Toppen","a2":"Bra"}')).toEqual({ a1: "Toppen", a2: "Bra" });
  });

  // Chatten svarar ofta med en fence och en mening runt omkring.
  it("tål kodstaket och text runt omkring", () => {
    const svar = 'Här är översättningarna:\n\n```json\n{"a1":"Toppen"}\n```\n\nSäg till om du vill ha fler.';
    expect(parseTranslations(svar)).toEqual({ a1: "Toppen" });
  });

  it("hoppar över tomma värden och trimmar", () => {
    expect(parseTranslations('{" a1 ":" Toppen ","a2":"   ","a3":5}')).toEqual({ a1: "Toppen" });
  });

  it("trasig JSON ger null i stället för ett kast", () => {
    expect(parseTranslations("{a1: Toppen}")).toBeNull();
    expect(parseTranslations("inget block alls")).toBeNull();
    expect(parseTranslations("")).toBeNull();
  });

  it("en lista är inte ett giltigt svar", () => {
    expect(parseTranslations('["Toppen","Bra"]')).toBeNull();
  });
});

describe("applyTranslations", () => {
  it("sparar godkända rader", async () => {
    const save = vi.fn(async () => {});
    const r = await applyTranslations([rad()], { a1: OK_SV }, save);
    expect(r.saved).toBe(1);
    expect(save).toHaveBeenCalledWith("p1", "a1", OK_SV);
  });

  it("sparar ALDRIG en rad som underkänns", async () => {
    const save = vi.fn(async () => {});
    const källa = rad();
    const r = await applyTranslations([källa], { a1: källa.textOriginal }, save);
    expect(r.saved).toBe(0);
    expect(r.rejected).toEqual([{ reviewIdAE: "a1", reason: "oöversatt" }]);
    expect(save).not.toHaveBeenCalled();
  });

  it("id som inte ligger i kön rapporteras i stället för att skrivas", async () => {
    const save = vi.fn(async () => {});
    const r = await applyTranslations([rad()], { finns_ej: OK_SV }, save);
    expect(r.saved).toBe(0);
    expect(r.unknown).toEqual(["finns_ej"]);
    expect(save).not.toHaveBeenCalled();
  });

  it("ett skrivfel stoppar inte resten av omgången", async () => {
    const save = vi.fn(async (_p: string, id: string) => {
      if (id === "a1") throw new Error("Wix nere");
    });
    const r = await applyTranslations(
      [rad({ reviewIdAE: "a1" }), rad({ reviewIdAE: "a2" })],
      { a1: OK_SV, a2: OK_SV },
      save,
    );
    expect(r.errors).toBe(1);
    expect(r.saved).toBe(1);
  });
});

describe("validateTranslation — tät skrift (CJK)", () => {
  // Skarpt fall 2026-08-20: den här japanska recensionen underkändes som
  // "för-lång" trots att översättningen är trogen. 92 tecken japanska bär lika
  // mycket innehåll som 275 tecken svenska — ett tecken är ofta ett helt ord.
  const japanska =
    "無事届いた！コンパクトな猫トイレを探していたから助かった。周囲のプラスチックは問題ないが" +
    "足場の部分のプラスチックが柔らかくて壊れそう。それ以外はいい商品。これステンレスなのに安くて驚く。";
  const svenska =
    "Den kom fram utan problem! Jag letade efter en kompakt kattlåda, så den passade perfekt. " +
    "Plasten runt om är det inget fel på, men plasten i trampdelen känns mjuk och ser ut att " +
    "kunna gå sönder. I övrigt en bra vara. Förvånansvärt billig med tanke på att den är i rostfritt stål.";

  it("godkänner en trogen översättning från japanska", () => {
    expect(validateTranslation(japanska, svenska).ok).toBe(true);
  });

  it("godkänner koreanska på samma sätt", () => {
    const koreanska = "새끼고양이 용으로 구매하게 되었어요 찌그러지거나 뚜껑, 스쿱 깨지지않고 잘 왔어요";
    const sv =
      "Jag köpte den till en kattunge. Den kom fram fint, inget bucklat och varken " +
      "locket eller skopan var trasig.";
    expect(validateTranslation(koreanska, sv).ok).toBe(true);
  });

  // Golvet vänds: blir svenskan KORTARE än en tät källa har innehåll fallit
  // bort, eftersom en trogen översättning alltid blir längre.
  it("underkänner svenska som är kortare än den täta källan", () => {
    expect(validateTranslation(japanska, "Bra kattlåda som kom fram fint.")).toMatchObject({
      ok: false,
      reason: "för-kort",
    });
  });

  it("ett orimligt uppsvälld text fälls fortfarande", () => {
    expect(validateTranslation(japanska, "x".repeat(japanska.length * 7)).ok).toBe(false);
  });

  it("latinska källor påverkas inte", () => {
    const en = "Great product, assembled in twenty minutes and feels very sturdy.";
    // Skulle klara CJK-golvet (1x) men ska falla på det latinska (0.4x).
    expect(validateTranslation(en, "Toppen.")).toMatchObject({ ok: false, reason: "för-kort" });
    expect(validateTranslation(en, "Toppenprodukt, monterad på tjugo minuter och känns stabil.").ok).toBe(true);
  });
});
