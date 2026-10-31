import { describe, expect, it } from "vitest";
import type { KategoriNod } from "@/lib/wix/kategoritrad";
import {
  FLYTTADE,
  NAMNBYTEN,
  REGLER,
  TRADET,
  VAPENSKAP,
  allaMal,
  byggUppslag,
  klassa,
  losMal,
  sokvagPassar,
  tolkaMal,
} from "./kategorier";

const a = (vag: string[], namn: string) => ({ kategorier: vag.map((n, i) => ({ id: String(i), namn: n })), namn });

/** Trädet som det ser ut i Wix efter natten: varje avdelning med sina underkategorier. */
function tradEfter(): KategoriNod[] {
  const ut: KategoriNod[] = [];
  for (const [avd, subs] of Object.entries(TRADET)) {
    const id = `avd:${avd}`;
    ut.push({ id, namn: avd, foralder: null, synlig: true });
    for (const s of subs) ut.push({ id: `kat:${s}`, namn: s, foralder: id, synlig: false });
  }
  return ut;
}

describe("reglerna", () => {
  it("☠️ varje mål finns i TRADET, och varje underkategori i TRADET används av en regel", () => {
    const mal = allaMal();
    for (const m of mal) expect(TRADET[m.avdelning], m.avdelning).toBeDefined();
    for (const m of mal) expect(TRADET[m.avdelning]).toContain(m.kategori);
    const anvanda = new Set(mal.map((m) => `${m.avdelning}/${m.kategori}`));
    for (const [avd, subs] of Object.entries(TRADET)) for (const s of subs) expect(anvanda.has(`${avd}/${s}`), `${avd}/${s}`).toBe(true);
  });

  it("ingen underkategori står under två avdelningar", () => {
    const sett = new Map<string, string>();
    for (const [avd, subs] of Object.entries(TRADET)) {
      for (const s of subs) {
        expect(sett.get(s), s).toBeUndefined();
        sett.set(s, avd);
      }
    }
  });

  it("varje mål går att tolka, och bara vapenskåpen saknar kategori", () => {
    for (const [, , mal] of REGLER) {
      const m = tolkaMal(mal);
      if (m === VAPENSKAP) expect(mal).toBe(VAPENSKAP);
      else expect(m.avdelning && m.kategori).toBeTruthy();
    }
    expect(() => tolkaMal("Bara avdelning")).toThrow();
  });
});

describe("sökvägen", () => {
  it("tom sökväg passar allt", () => {
    expect(sokvagPassar("", [])).toBe(true);
    expect(sokvagPassar("", ["Bil", "x"])).toBe(true);
  });

  it("alla nivåer utom den sista ska vara lika, och den sista kan vara början av namnet", () => {
    expect(sokvagPassar("Utomhus>Djurtillbehör", ["Utomhus", "Djurtillbehör och djurliv", "Hundtillbehör"])).toBe(true);
    expect(sokvagPassar("Verktyg>Elverktyg>Metall", ["Verktyg", "Elverktyg", "Metallbearbetningsverktyg"])).toBe(true);
    expect(sokvagPassar("Verktyg>Elverk>Metall", ["Verktyg", "Elverktyg", "Metallbearbetningsverktyg"])).toBe(false);
  });

  it("en sökväg som slutar med > kräver nivån exakt", () => {
    expect(sokvagPassar("Bil>", ["Bil"])).toBe(true);
    expect(sokvagPassar("Bil>", ["Bil", "Bildelar"])).toBe(true);
    expect(sokvagPassar("Bil>", ["Bilvård", "x"])).toBe(false);
  });

  it("en kortare sökväg än regeln passar inte", () => {
    expect(sokvagPassar("Bad>Badrumssäkerhet", ["Bad"])).toBe(false);
  });
});

describe("klassningen", () => {
  it("namnregler utan sökväg går före kategorin", () => {
    const k = klassa(a(["Utomhus", "Trädgårdscenter", "Trädgårdsredskap"], "Barnvagn 3 i 1"));
    expect(k).toMatchObject({ typ: "kategori", mal: { avdelning: "Barn & Familj", kategori: "Baby & Småbarn" } });
  });

  it("☠️ vapenskåp och pistolskåp i Kassaskåp får ingen kategori", () => {
    expect(klassa(a(["Verktyg", "Säkerhet och trygghet", "Kassaskåp"], "Vapenskåp för gevär")).typ).toBe(VAPENSKAP);
    expect(klassa(a(["Verktyg", "Säkerhet och trygghet", "Kassaskåp"], "Pistolskåp med kodlås")).typ).toBe(VAPENSKAP);
  });

  it("ett vanligt kassaskåp går till Hem & Inredning, ett fodral till verktygsförvaringen", () => {
    expect(klassa(a(["Verktyg", "Säkerhet och trygghet", "Kassaskåp"], "Kassaskåp 50 liter"))).toMatchObject({
      mal: { avdelning: "Hem & Inredning", kategori: "Kassaskåp" },
    });
    expect(klassa(a(["Verktyg", "Säkerhet och trygghet", "Kassaskåp"], "Hårt fodral med skumlås"))).toMatchObject({
      mal: { avdelning: "Verktyg & Maskiner", kategori: "Verktygsvagnar & verktygslådor" },
    });
  });

  it("reptiltillbehör går till Terrarier före de andra djurreglerna", () => {
    const k = klassa(a(["Utomhus", "Djurtillbehör och djurliv", "Reptil- och amfibietillbehör"], "Värmelampa med skål"));
    expect(k).toMatchObject({ mal: { avdelning: "Husdjur", kategori: "Terrarier" } });
  });

  it("köksvagnar går till Serveringsvagnar, rostfria arbetsbord till Storkök", () => {
    const vag = ["Möbler", "Köks- och matrumsmöbler", "Vagnar och verktygsbord"];
    expect(klassa(a(vag, "Köksvagn med tre hyllor"))).toMatchObject({ mal: { kategori: "Serveringsvagnar & rullvagnar" } });
    expect(klassa(a(vag, "Arbetsbord i rostfritt stål"))).toMatchObject({ mal: { kategori: "Storkök & restaurang" } });
  });

  it("utan regel blir varan utan kategori", () => {
    expect(klassa(a(["Okänd", "Kategori"], "Något"))).toEqual({ typ: "omappad" });
    expect(klassa(a([], "Något"))).toEqual({ typ: "omappad" });
  });
});

/** Felplaceringar som stickproven per kategori hittade 2026-10-31. Namnen är förkortade. */
describe("auditens fynd", () => {
  const mal = (vag: string[], namn: string) => {
    const k = klassa(a(vag, namn));
    return k.typ === "kategori" ? `${k.mal.avdelning}/${k.mal.kategori}` : k.typ;
  };

  it("☠️ ett ord långt in i namnet styr inte en namnregel utan sökväg", () => {
    // Bilrampen nämner barnvagnar bland det den passar för, husdomkraften "stolpe för".
    expect(mal(["Bil", "Butiksutrustning", "Bilramper"], "Gummiramp, 15 ton, för rullstol och barnvagn")).toBe("Bil & Garage/Verkstadsutrustning");
    expect(mal(["Byggnadsmaterial", "Byggnadsbeslag", "Jack-inlägg"], "Domkraft för hus, justerbar stödbalk, stolpe för källare")).toBe(
      "Bygg & Renovering/Beslag & järnvaror",
    );
    expect(mal(["Verktyg", "Säkerhet och trygghet", "Hemsäkerhet"], "Stolpe, 4 st. avspärrningsset för folkmassor")).toBe(
      "Företag & Proffs/Butik, evenemang & trafik",
    );
  });

  it("☠️ en gevärsväska är ett vapenfodral, men ett kassaskåp med brandsäker väska är ett kassaskåp", () => {
    const kassa = ["Verktyg", "Säkerhet och trygghet", "Kassaskåp"];
    expect(mal(kassa, "Hård gevärsväska, låsbar, 109 cm")).toBe(VAPENSKAP);
    expect(mal(kassa, "Kassaskåp med nyckellås, Kassaskåp med brandsäker väska")).toBe("Hem & Inredning/Kassaskåp");
    expect(mal(kassa, "Brandsäker dokumentväska")).toBe("Hem & Inredning/Kassaskåp");
  });

  it("barnens grindar, lekhagar och sängskydd går till Baby & Småbarn", () => {
    expect(mal(["Utomhus", "Djurtillbehör och djurliv", "Hundtillbehör"], "Barngrind för trappor, hundgrind")).toBe("Barn & Familj/Baby & Småbarn");
    expect(mal(["Verktyg", "Säkerhet och trygghet", "Hemsäkerhet"], "Babylekhage, hopfällbar lekhage för småbarn")).toBe(
      "Barn & Familj/Baby & Småbarn",
    );
  });

  it("hundbadkar, hamsterburar, ramper och kattburar hamnar rätt bland husdjuren", () => {
    const djur = ["Utomhus", "Djurtillbehör och djurliv"];
    expect(mal([...djur, "Reptil- och amfibietillbehör"], "Hundtvättstation i rostfritt stål")).toBe("Husdjur/Pälsvård & Skötsel");
    expect(mal([...djur, "Smådjurstillbehör"], "Hamsterbur i trä, tuggsäker bur för kanin och marsvin")).toBe("Husdjur/Hamsterburar & gnagarburar");
    expect(mal([...djur, "Hundtillbehör"], "Hundramp för säng, för soffa och bil")).toBe("Husdjur/Lek & Tillbehör för husdjur");
    expect(mal([...djur, "Katttillbehör"], "Kattbur med hjul, flygbolagsgodkänd")).toBe("Husdjur/Selar, Koppel & Transport");
    expect(mal([...djur, "Katttillbehör"], "Kattbur 4-våningar, DIY kattlekhage")).toBe("Husdjur/Valphagar & hundhagar");
  });

  it("kommersiella frysar och ismaskiner går till Storkök, en vattendestillator inte till vattenkokarna", () => {
    expect(mal(["Vitvaror", "Ismaskiner", "Kommersiell snöflingismaskin"], "Kommersiell ismaskin 180 kg/dag")).toBe("Företag & Proffs/Storkök & restaurang");
    expect(mal(["Vitvaror", "Frysar", "Kommersiell frys"], "Kommersiell glassmonter, frysbox")).toBe("Företag & Proffs/Storkök & restaurang");
    expect(mal(["Vitvaror", "Små köksapparater", "Vattenkokare"], "Vattendestilleri 4 l")).toBe("Kök & Husgeråd/Köksmaskiner & Apparater");
  });

  it("skorstenssotning går till Värme, eldstadsverktyg till Gnistskydd och en tältkamin till Camping", () => {
    const eld = ["Uppvärmning, ventilation och kylning", "Eldstäder"];
    expect(mal([...eld, "Tillbehör för eldstäder"], "Skorstensfejarsats, 8 m")).toBe("Bygg & Renovering/Värme, ventilation & AC");
    expect(mal([...eld, "Tillbehör för eldstäder"], "Eldstadsverktygsset, 5 delar")).toBe("Hem & Inredning/Gnistskydd");
    expect(mal([...eld, "Fristående spisar"], "Vedspis, campingtältspis i rostfritt stål")).toBe("Sport & Fritid/Camping & kylboxar");
  });

  it("bröllop och stolsöverdrag går till Kalas & Fest, utomhusmattor till Mattor", () => {
    expect(mal(["Heminredning", "Vaser"], "Bröllopsblomställ, 10 st")).toBe("Jul & Högtider/Kalas & Fest");
    expect(mal(["Möbler", "Köks- och matrumsmöbler", "Överdrag till uteplatsstolar"], "30 st stolsöverdrag i spandex")).toBe(
      "Jul & Högtider/Kalas & Fest",
    );
    expect(mal(["Golv", "Matta", "I lager Matta"], "Inomhus- och utomhusmatta 1,8 x 15 m")).toBe("Hem & Inredning/Mattor");
  });

  it("luftgevärspumpar går till Jakt & fiske, en gräsklipparlyft stannar bland trädgårdsmaskinerna", () => {
    expect(mal(["VVS", "Vakuumpump", "Luftpistolpump"], "PCP handpump, 3 steg")).toBe("Sport & Fritid/Jakt & fiske");
    expect(mal(["Utomhus", "Utomhusutrustning för kraft", "Reservdelar till utomhusutrustning"], "Hydraulisk cylinderdomkraft, 20 ton")).toBe(
      "Bil & Garage/Domkrafter & billyftar",
    );
    expect(mal(["Utomhus", "Utomhusutrustning för kraft", "Åkgräsklippare"], "Gräsklipparlyft med hydraulisk domkraft")).toBe(
      "Trädgård & Utemöbler/Trädgårdsmaskiner",
    );
  });
});

describe("kodgranskningen 2026-10-31", () => {
  const mal = (vag: string[], namn: string) => {
    const k = klassa(a(vag, namn));
    return k.typ === "kategori" ? `${k.mal.avdelning}/${k.mal.kategori}` : k.typ;
  };
  const djur = (under: string) => ["Utomhus", "Djurtillbehör och djurliv", under];

  it("☠️ ett vapenskåp utanför sökvägen Kassaskåp är ändå ett vapenskåp", () => {
    expect(mal(["Sport och friluftsliv", "Jaktutrustning", "Jaktvagnar"], "Vapenskåp för 5 gevär med kodlås")).toBe(VAPENSKAP);
    expect(mal(["Möbler", "Vardagsrumsmöbler", "Accentskåp"], "Bösskåp med elektroniskt lås")).toBe(VAPENSKAP);
    expect(mal(["Möbler", "Vardagsrumsmöbler", "Accentskåp"], "Gevärskåp i stål med digital knappsats")).toBe(VAPENSKAP);
    expect(mal(["Verktyg", "Säkerhet och trygghet", "Kassaskåp"], "42 Tall Wall Gun Safe with keypad")).toBe(VAPENSKAP);
    // Ett skåp för annat är inget vapenskåp.
    expect(mal(["Förvaring och organisering", "Förvaring i tvättstugan", "Tvättstugaskåp"], "Väggskåp för tvättstuga, 2 våningar")).not.toBe(VAPENSKAP);
  });

  it("produkttypen går före egenskaperna bland djurtillbehören", () => {
    expect(mal(djur("Fågeltillbehör"), "Hönshus i trä med ramp och värpbox")).toBe("Husdjur/Hönshus & hönsgårdar");
    expect(mal(djur("Smådjurstillbehör"), "Kaninbur i två våningar med ramp")).toBe("Husdjur/Kaninburar & marsvinsburar");
    expect(mal(djur("Katttillbehör"), "Klösträd 150 cm med kattbädd")).toBe("Husdjur/Klösträd");
    expect(mal(djur("Katttillbehör"), "Kattträd med flera plattformar")).toBe("Husdjur/Klösträd");
    // En kycklingmatare är en matare, inget hönshus.
    expect(mal(djur("Leveranser till lantbruksdjur"), "Automatisk kycklingmatare, 18 kg, regntät")).toBe("Husdjur/Mat & Vattenskålar");
    // Det som står efter "för" är vad varan passar till.
    expect(mal(djur("Smådjurstillbehör"), "Husdjursramp för hund och kanin")).toBe("Husdjur/Lek & Tillbehör för husdjur");
  });

  it("orm är ett ord, inte en del av plattform eller formad", () => {
    expect(mal(djur("Hundtillbehör"), "Hundleksak formad som ben")).toBe("Husdjur/Lek & Tillbehör för husdjur");
  });

  it("en barnvagn för husdjur är en hundvagn", () => {
    expect(mal(djur("Hundtillbehör"), "Barnvagn för husdjur, 4 hjul")).toBe("Husdjur/Hundvagnar");
    expect(mal(djur("Hundtillbehör"), "Hundbarnvagn med 3 hjul")).toBe("Husdjur/Hundvagnar");
  });

  it("bröllop och kalas går före evenemangsregeln, tältkaminen före gnistskydden", () => {
    expect(mal(["Utomhus", "Trädgårdscenter", "Utomhusdekor"], "Ballongbåge, backdrop för bröllop")).toBe("Jul & Högtider/Kalas & Fest");
    expect(mal(["Uppvärmning, ventilation och kylning", "Eldstäder", "Fristående spisar"], "Tältkamin med gnistgaller")).toBe(
      "Sport & Fritid/Camping & kylboxar",
    );
    expect(mal(["Verktyg", "Säkerhet och trygghet", "Hemsäkerhet"], "Barngrind för trappor")).toBe("Barn & Familj/Baby & Småbarn");
  });
});

describe("uppslaget i Wix", () => {
  it("trädet efter natten har varje regelmål", () => {
    const u = byggUppslag(tradEfter());
    expect(u.fel).toEqual([]);
    expect(u.idn.get("Bygg & Renovering/Pumpar")).toEqual({ avdelning: "avd:Bygg & Renovering", kategori: "kat:Pumpar" });
  });

  it("före natten: Verktyg & Fordon godtas för Verktyg & Maskiner, och Bil & släp under den", () => {
    const trad = tradEfter().map((k) => (k.namn === "Verktyg & Maskiner" ? { ...k, namn: "Verktyg & Fordon" } : k));
    const vm = trad.find((k) => k.namn === "Verktyg & Fordon")!;
    for (const flyttad of Object.keys(FLYTTADE)) {
      const i = trad.findIndex((k) => k.namn === flyttad);
      trad[i] = { ...trad[i], foralder: vm.id };
    }
    expect(NAMNBYTEN["Verktyg & Maskiner"]).toContain("Verktyg & Fordon");
    expect(byggUppslag(trad).fel).toEqual([]);
  });

  it("☠️ en underkategori under fel avdelning, ett namn två gånger eller en saknad avdelning ger fel", () => {
    const trad = tradEfter();
    const pumpar = trad.findIndex((k) => k.namn === "Pumpar");
    trad[pumpar] = { ...trad[pumpar], foralder: "avd:Möbler" };
    expect(losMal(trad, { avdelning: "Bygg & Renovering", kategori: "Pumpar" })).toEqual({
      fel: "underkategorin Pumpar ligger inte under Bygg & Renovering",
    });
    const dubbel = [...tradEfter(), { id: "x", namn: "Pumpar", foralder: "avd:Möbler", synlig: true }];
    expect("fel" in losMal(dubbel, { avdelning: "Bygg & Renovering", kategori: "Pumpar" })).toBe(true);
    const utan = tradEfter().filter((k) => k.namn !== "Företag & Proffs");
    expect(byggUppslag(utan).fel.some((f) => f.includes("Företag & Proffs"))).toBe(true);
  });
});
