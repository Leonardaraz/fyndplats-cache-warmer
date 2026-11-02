// Tre grindluckor som granskningen 2026-09-27 hittade, alla i samma klass:
// en regel stod i runbooken men ingen grind höll den, eller så höll grinden
// fel sak.
//
//   1. FRAKTVIKTEN. Importens "Vikt" är vikten med förpackning. 142 av 147
//      B-sidor bar den som varans vikt, fast runbooken sa "Fraktvikt". Den nya
//      kontrollen i gate.py fäller exakt de 142 sidorna i filerna före
//      rättelsen och ingen efter.
//   2. EN STRUKEN BILD. gate-alt och bygg-media räknade bara hur MÅNGA bilder
//      en produkt fick stryka, så en alt-rad för en struken position gick
//      igenom när antalet råkade stämma.
//   3. SALDOT. Wix-saldot är redan minskat med synkens buffert på tre, och
//      gate-lager drog av den en gång till. Den fällde köpbara varor.
//
// Testerna kör grindarna, de speglar dem inte (samma beslut som
// gatelib.test.ts), och varje lucka prövas åt båda hållen.
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const GRINDAR = resolve(__dirname, "../../tools/polish-gates");
const B = '<span style="font-weight: 700">';

let katalog = "";
afterEach(() => katalog && rmSync(katalog, { recursive: true, force: true }));

/** Kör en grind i en tillfällig rundkatalog och returnerar utskrift och kod. */
function kor(skript: string, filer: Record<string, string>): { ut: string; kod: number } {
  katalog = mkdtempSync(join(tmpdir(), "grindlucka-"));
  for (const [namn, innehall] of Object.entries(filer)) writeFileSync(join(katalog, namn), innehall);
  try {
    const ut = execFileSync("python3", [join(GRINDAR, skript)], { cwd: katalog, encoding: "utf-8" });
    return { ut, kod: 0 };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; status?: number };
    if (typeof e.stdout !== "string") throw err;
    return { ut: e.stdout + (e.stderr ?? ""), kod: e.status ?? 1 };
  }
}

describe("fraktvikten i gate.py", () => {
  // Källan bär importens spec-block, precis som en Aosom-rad i kallor.json.
  const KALLA = `<p>Wandschrank aus Holz.</p><ul><li><p>${B}Vikt:</span> 40 kg</p></li></ul>`;
  const TEXT = (etikett: string, mening: string) => `<p>${mening}</p>
<h2>Tekniska specifikationer</h2>
<ul><li><p>${B}${etikett}:</span> 40 kg</p></li></ul>
<h2>Användning och skötsel</h2>
<p>Torka av skåpet.</p>
<h2>Vanliga frågor</h2>
<p>${B}Hur tungt är paketet?</span></p>
<p>40 kg.</p>
`;
  const filer = (html: string, kalla = KALLA) => ({
    "prod.html": html,
    "slugs.txt": "prod vaggskap\n",
    "kallor.json": JSON.stringify({ prod: kalla }),
  });

  it("FÄLLER importens Vikt som varans vikt, i spec-raden och i löptexten", () => {
    const { ut, kod } = kor("gate.py", filer(TEXT("Vikt", "Skåpet väger 40 kg.")));
    expect(kod).toBe(1);
    expect(ut.match(/\[FRAKTVIKT\]/g)).toHaveLength(2);
  });

  it("är REN med Fraktvikt och en mening om paketet", () => {
    const { ut } = kor("gate.py", filer(TEXT("Fraktvikt", "Paketet väger 40 kg.")));
    expect(ut).not.toMatch(/FRAKTVIKT/);
  });

  // ☠️ Ett annat tal kan vara varans verkliga vikt, och en tysk Gewicht med
  // samma tal betyder att varan faktiskt väger så. Ingen av dem ska fällas.
  it("är REN när den tyska texten anger samma tal som produktens vikt", () => {
    const { ut } = kor("gate.py", filer(TEXT("Vikt", "Skåpet."), `${KALLA}<p>Gewicht: 40 kg</p>`));
    expect(ut).not.toMatch(/FRAKTVIKT/);
  });

  // ☠️ VEVOR:s `Vikt` är varans egen. Utan raden `=== vevor-källa` i källan fällde grinden
  // varje VEVOR-sida, för den tog specifikationens vikt för Aosoms viktrad med förpackning.
  it("är REN för en VEVOR-källa, där Vikt är varans egen vikt", () => {
    const vevor = `=== vevor-källa: Vikt i specifikationen är varans egen ===\n${KALLA}`;
    const { ut } = kor("gate.py", filer(TEXT("Vikt", "Skåpet väger 40 kg."), vevor));
    expect(ut).not.toMatch(/FRAKTVIKT/);
  });

  it("fäller fortfarande samma text när källan inte är märkt som VEVOR", () => {
    const { ut } = kor("gate.py", filer(TEXT("Vikt", "Skåpet väger 40 kg."), KALLA));
    expect(ut).toMatch(/\[FRAKTVIKT\]/);
  });

  it("räknar inte användarvikten som varans vikt", () => {
    const { ut } = kor("gate.py", filer(TEXT("Vikt", "Skåpet."), `${KALLA}<p>Benutzergewicht: 40 kg</p>`));
    expect(ut).toMatch(/\[FRAKTVIKT\]/);
  });
});

describe("en struken bild får ingen alt-rad", () => {
  const BILDER = [1, 2, 3, 4, 5].map((p) => `prod\t${p}\tb379ce_${"a".repeat(31)}${p}~mv2.jpg`).join("\n") + "\n";
  const ALT = (positioner: number[]) =>
    positioner.map((p) => `prod\t${p}\tVäggskåp i vitt, bild ${["ett", "två", "tre", "fyra", "fem"][p - 1]}`).join("\n") + "\n";
  const filer = (positioner: number[]) => ({
    "bilder.tsv": BILDER,
    "bilder-bort.tsv": "prod\t2\tvarumärke på rekvisita\n",
    "alt.tsv": ALT(positioner),
    "kallor.json": JSON.stringify({ prod: "<p>Wandschrank aus Holz.</p>" }),
  });

  it("FÄLLER en alt-rad för den strukna positionen, trots rätt antal", () => {
    // Fyra rader mot fem bilder minus en struken: antalet stämmer.
    expect(kor("gate-alt.py", filer([1, 2, 3, 4])).ut).toMatch(/STRUKEN BILD: prod position 2/);
    expect(kor("bygg-media.py", filer([1, 2, 3, 4])).ut).toMatch(/position 2 är struken/);
  });

  it("är REN när den strukna positionen saknar alt-rad", () => {
    expect(kor("gate-alt.py", filer([1, 3, 4, 5])).ut).not.toMatch(/STRUKEN/);
    expect(kor("bygg-media.py", filer([1, 3, 4, 5])).kod).toBe(0);
  });
});

// ☠️ MÅTTBILDEN SIST, AVGJORT PÅ ALT-TEXTEN (2026-10-21). bygg-media.py lade "källposition 3" sist, vilket bara stämmer
// när måttbilden råkar ligga där. I T78 låg den på 5 (agilityvärden) och 4 (hindersetet): en närbild på ett rör
// hamnade sist och måttbilden mitt i galleriet, utan ett enda fel. Utan en alt-text som börjar på Måttbild gäller
// den gamla regeln, så äldre rundor bygger som förut.
describe("måttbilden läggs sist", () => {
  const BILDER = [1, 2, 3, 4, 5].map((p) => `prod\t${p}\tb379ce_${"a".repeat(31)}${p}~mv2.jpg`).join("\n") + "\n";
  const filer = (alt: string[]) => ({
    "bilder.tsv": BILDER,
    "alt.tsv": alt.map((a, i) => `prod\t${i + 1}\t${a}`).join("\n") + "\n",
  });
  const ordning = () =>
    (JSON.parse(readFileSync(join(katalog, "nyttolast-media.json"), "utf-8")) as { prod: { id: string }[] }).prod.map(
      (x) => x.id.replace(/^.*a(\d)~mv2\.jpg$/, "$1"),
    );

  it("lägger Måttbild sist även när den ligger på position 5", () => {
    const { kod } = kor(
      "bygg-media.py",
      filer(["Huvudbild", "Miljöbild", "Närbild på ett rör", "Närbild på en fot", "Måttbild: 99 cm hög"]),
    );
    expect(kod).toBe(0);
    expect(ordning()).toEqual(["1", "2", "3", "4", "5"]);
  });

  it("flyttar bort måttbilden från position 4 och behåller position 3 på plats", () => {
    const { kod } = kor(
      "bygg-media.py",
      filer(["Huvudbild", "Miljöbild", "Närbild på ett rör", "Måttskiss: 30 cm hög", "Närbild på en fot"]),
    );
    expect(kod).toBe(0);
    expect(ordning()).toEqual(["1", "2", "3", "5", "4"]);
  });

  it("följer den gamla regeln (position 3 sist) när ingen alt-text börjar på Måttbild", () => {
    const { kod } = kor("bygg-media.py", filer(["Huvudbild", "Miljöbild", "Ritning", "Närbild på ett rör", "Närbild på en fot"]));
    expect(kod).toBe(0);
    expect(ordning()).toEqual(["1", "2", "4", "5", "3"]);
  });
});

describe("saldot i Wix är redan buffrat", () => {
  const filer = (saldo: number) => ({ "ids.tsv": "prod\t499\tWandschrank\n", "lager.tsv": `prod\t${saldo}\n` });

  it("släpper ett saldo på 2 som tunt men köpbart", () => {
    const { ut, kod } = kor("gate-lager.py", filer(2));
    expect(kod).toBe(0);
    expect(ut).toMatch(/tunt, men köpbart/);
  });

  it("FÄLLER saldo 0", () => {
    const { ut, kod } = kor("gate-lager.py", filer(0));
    expect(kod).toBe(1);
    expect(ut).toMatch(/SLUTSÅLD/);
  });
});

// ☠️ Planen byggdes lika gärna om en grind aldrig körts. bygg-skrivplan.py kör
// nu hela kedjan först och vägrar vid ett fynd. Provat på en kopia av B19,
// vars plan är känd: samma sha när allt är rent, inget bygge vid ett fynd, och
// samma sha igen när fyndet kvitteras med ett skäl.
describe("bygg-skrivplan.py kör grindarna först", () => {
  const B19 = resolve(__dirname, "../../tools/polish-assets/runda-b19-aldsta");
  const SHA = "f6914bc0cc858b035ba7b9712d98cefd53051eb82aa774503beaf94a794d793a";

  function bygg(andra: (dir: string) => void): { ut: string; kod: number; sha: string; dir: string } {
    katalog = mkdtempSync(join(tmpdir(), "runda-b19-kopia-"));
    // Katalognamnet blir plannamnet, så kopian måste heta som originalet.
    const dir = join(katalog, "runda-b19-aldsta");
    cpSync(B19, dir, { recursive: true, filter: (s) => !/\/(orig|ark|live|ghost)(\/|$)/.test(s) });
    rmSync(join(dir, "skrivplan.json"), { force: true });
    andra(dir);
    let ut = "", kod = 0;
    try {
      ut = execFileSync("python3", [join(GRINDAR, "bygg-skrivplan.py")], { cwd: dir, encoding: "utf-8" });
    } catch (err) {
      const e = err as { stdout?: string; stderr?: string; status?: number };
      ut = (e.stdout ?? "") + (e.stderr ?? ""); kod = e.status ?? 1;
    }
    const sha = /plan_sha256: ([0-9a-f]{64})/.exec(ut)?.[1] ?? "";
    return { ut, kod, sha, dir };
  }

  it("bygger B19:s kända plan när alla grindar är rena", () => {
    const r = bygg(() => {});
    expect(r.kod).toBe(0);
    expect(r.sha).toBe(SHA);
  });

  it("vägrar bygga när en grind faller", () => {
    const r = bygg((dir) => {
      const rader = readFileSync(join(dir, "lager.tsv"), "utf-8").split("\n");
      rader[0] = rader[0].replace(/\t\d+$/, "\t0");
      writeFileSync(join(dir, "lager.tsv"), rader.join("\n"));
    });
    expect(r.kod).toBe(1);
    expect(r.ut).toMatch(/gate-lager\.py: FÖLL/);
    expect(r.sha).toBe("");
  });

  // En sammanslagen sida (2026-09-30): ingen rad i sku.tsv eller variant.tsv,
  // och planen bär `varianter` i stället för sku och variantId.
  function somSammanslagen(dir: string, behallSku = false) {
    const forsta = readFileSync(join(dir, "ids.tsv"), "utf-8").split("\t")[0];
    writeFileSync(join(dir, "sammanslagna.tsv"), `${forsta}\t2\n`);
    const filer = behallSku ? ["variant.tsv"] : ["sku.tsv", "variant.tsv"];
    for (const fil of filer) {
      const rader = readFileSync(join(dir, fil), "utf-8").split("\n").filter((r) => !r.startsWith(`${forsta}\t`));
      writeFileSync(join(dir, fil), rader.join("\n"));
    }
    return forsta;
  }

  it("bygger en sammanslagen sida med antal varianter och utan SKU", () => {
    let kort = "";
    const r = bygg((dir) => { kort = somSammanslagen(dir); });
    expect(r.kod).toBe(0);
    const plan = JSON.parse(readFileSync(join(r.dir, "skrivplan.json"), "utf-8"));
    const p = plan.produkter.find((x: { kort: string }) => x.kort === kort);
    expect(p.varianter).toBe(2);
    expect(p.sku).toBeUndefined();
    expect(p.variantId).toBeUndefined();
    // De andra produkterna är oförändrade.
    expect(plan.produkter.filter((x: { sku?: string }) => x.sku).length).toBe(plan.produkter.length - 1);
  });

  it("☠️ vägrar en sammanslagen sida som ändå har en SKU-rad", () => {
    const r = bygg((dir) => { somSammanslagen(dir, true); });
    expect(r.kod).toBe(1);
    expect(r.ut).toMatch(/får ingen rad i sku\.tsv/);
  });

  it("bygger samma plan när fyndet är kvitterat med ett skäl", () => {
    const r = bygg((dir) => {
      const rader = readFileSync(join(dir, "lager.tsv"), "utf-8").split("\n");
      rader[0] = rader[0].replace(/\t\d+$/, "\t0");
      writeFileSync(join(dir, "lager.tsv"), rader.join("\n"));
      writeFileSync(join(dir, "grind-undantag.txt"), "gate-lager.py provfall i testet\n");
    });
    expect(r.kod).toBe(0);
    expect(r.ut).toMatch(/gate-lager\.py: föll, kvitterad/);
    expect(r.sha).toBe(SHA);
  });

  // ☠️ EN KVITTENS GÄLLER BARA DET DEN KVITTERAR (2026-10-14). N144b hade sju
  // fynd i gate.py: sex om EN 71 och ett om `Polypropylen` (tyska och danska,
  // svenska är polypropen). En rad `gate.py EN 71 antas uppfyllt …` kvitterade
  // hela skriptet, bygget skrev bara "föll, kvitterad", och det tyska ordet
  // publicerades. Livegrind fångade det först på den publicerade sidan.
  const EN71 =
    "gate.py EN 71 antas uppfyllt för allt från Aosom (Leonards beslut 2026-10-08), källtexten nämner ingen standard\n";

  /** Lägger en mening först i första sidans text. */
  function medText(dir: string, mening: string) {
    const forsta = readFileSync(join(dir, "ids.tsv"), "utf-8").split("\t")[0];
    const fil = join(dir, `${forsta}.html`);
    writeFileSync(fil, readFileSync(fil, "utf-8").replace("<p>", `<p>${mening} `));
  }

  it("☠️ en kvittens för EN 71 släpper inte igenom ett annat fynd i gate.py", () => {
    const r = bygg((dir) => {
      medText(dir, "Uppfyller EN 71. Materialet är Polypropylen.");
      writeFileSync(join(dir, "grind-undantag.txt"), EN71);
    });
    expect(r.kod).toBe(1);
    expect(r.ut).toMatch(/gate\.py: FÖLL, kvittensen/);
    expect(r.ut).toMatch(/\[TYSK REST\] 'Polypropylen'/);
    // EN 71-fyndet är kvitterat och skrivs inte ut som ett som återstår.
    expect(r.ut).not.toMatch(/EN-NORM UTAN KÄLLA/);
    expect(r.sha).toBe("");
  });

  it("en kvittens för EN 71 släpper igenom just EN 71-fynden", () => {
    const r = bygg((dir) => {
      medText(dir, "Uppfyller EN 71.");
      writeFileSync(join(dir, "grind-undantag.txt"), EN71);
    });
    expect(r.ut).toMatch(/gate\.py: föll, kvitterad/);
    expect(r.ut).not.toMatch(/gate\.py: FÖLL/);
  });

  it("☠️ en kvittens för EN 71 täcker inte ett gate.py som föll utan ett enda fynd (saknat facit)", () => {
    const r = bygg((dir) => {
      rmSync(join(dir, "kallor.json"));
      writeFileSync(join(dir, "grind-undantag.txt"), EN71);
    });
    expect(r.kod).toBe(1);
    expect(r.ut).toMatch(/gate\.py: FÖLL, kvittensen/);
    expect(r.ut).toMatch(/utan ett enda igenkänt fynd/);
  });

  it("övriga kvittenser gäller fortfarande hela skriptet", () => {
    const r = bygg((dir) => {
      medText(dir, "Materialet är Polypropylen.");
      writeFileSync(join(dir, "grind-undantag.txt"), "gate.py provfall i testet\n");
    });
    expect(r.ut).toMatch(/gate\.py: föll, kvitterad \(provfall i testet\)/);
  });
});
