// ☠️ MEDIASKRIVNINGENS SPÄRR MÅSTE KUNNA FÄLLA — inte bara finnas.
//
// VARFÖR TESTET FINNS. Steg 1 (brödtext, namn, slug, SEO) har byggts av
// `bygg-skrivning.py` sedan runda H3. Steg 2 — bildlistan med alt-texterna —
// hade fram till N9 INGEN generator: den transkriberades för hand i chatten
// varje runda.
//
// Det är exakt den asymmetri H3 mätte upp:
//
//     via fil          0 av 8 drev isär
//     avskrivet        5 av 5 drev isär
//
// En avskrift ÄR mekanismen; det är inte slarv i enstaka fall. Och priset är
// mätt: runda J2 publicerade åtta lampor med FYRTIO tyska alt-texter, och
// varje API-svar sa framgång. Beskrivningen var ren; bilderna skrek tyska.
//
// `bygg-medieskrivning.py` emitterar `steg2.js` sedan N9, med en spärr i
// SAMMA anrop som skrivningen. Den räknar en kontrollsumma på
// `id + "|" + altText` per rad, sammanfogat med radbrytning — alltså BÅDE
// bildernas ordning och alt-texternas ord — och avbryter HELA batchen vid
// avvikelse.
//
// ⚠️ ATT EN GRIND FINNS SÄGER INGENTING OM ATT DEN KAN SE. Runda J2:s
// alt-svep var påslaget, dokumenterat och räknat som gjort, och kunde inte
// fälla någonting på en lamprunda — ordlistan var ett avtryck av en annan
// runda. Det här testet planterar därför sex fel av olika form och kräver att
// var och en fäller på RÄTT produkt, samt att en orörd plan släpps igenom.
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const GATES = resolve(__dirname, "../../tools/polish-gates");
// N9 är rundan generatorn skrevs för, och dess filer är kompletta: nio
// produkter, fem till sex bilder var, kortet sist.
const RUNDA = resolve(__dirname, "../../tools/polish-assets/runda-n9-billigast");

type Post = { id: string; altText: string };
type Rad = { kort: string; pid: string; poster: Post[]; raa: number; tecken: number };

let katalog = "";
afterEach(() => katalog && rmSync(katalog, { recursive: true, force: true }));

/** Samma aritmetik som generatorn och som spärren i anropet. */
function summa(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + (c.codePointAt(0)! & 0xffff)) % 1000000007;
  return h;
}

// Exakt de filer byggarna läser. Rundkatalogen är 76 MB bilder, och att
// kopiera den åtta gånger vore både långsamt och otydligt om vad kontraktet
// faktiskt är.
const INDATA = [
  "bilder.tsv",
  "bilder-bort.tsv",
  "alt.tsv",
  "kort-filer.tsv",
  "kortalt.tsv",
  "ids.tsv",
] as const;

/** Kör generatorn mot en kopia av rundans indata och plockar ut dess PLAN. */
function bygg(): Rad[] {
  katalog = mkdtempSync(join(tmpdir(), "mediagrind-"));
  for (const f of INDATA) copyFileSync(join(RUNDA, f), join(katalog, f));
  execFileSync("python3", [join(GATES, "bygg-media.py")], { cwd: katalog });
  execFileSync("python3", [join(GATES, "bygg-medieskrivning.py")], { cwd: katalog });
  const src = readFileSync(join(katalog, "steg2.js"), "utf-8");
  const block = src.match(/const PLAN = (\[[\s\S]*?\n {2}\]);/);
  if (!block) throw new Error("hittade ingen PLAN i steg2.js");
  // eslint-disable-next-line no-eval
  return eval(block[1]) as Rad[];
}

/**
 * Speglar spärren som ligger i skrivanropet, ordagrant. Returnerar de kort
 * som skulle fällas — spärren avbryter HELA batchen så fort listan inte är
 * tom, men testet vill veta VILKA rader den pekar ut.
 */
function fallda(plan: Rad[]): string[] {
  return plan
    .filter((p) => {
      const s = p.poster.map((x) => `${x.id}|${x.altText}`).join("\n");
      return summa(s) !== p.raa || s.length !== p.tecken;
    })
    .map((p) => p.kort);
}

describe("mediaskrivningens transkriberingsspärr", () => {
  it("släpper igenom en ORÖRD plan ur generatorn", () => {
    // Riktningen som gör grinden användbar. En överkänslig spärr som fäller
    // på korrekt indata lär mottagaren att sluta läsa — samma argument som
    // mot att varna vid 48 h på token-förnyelsen.
    const plan = bygg();
    expect(plan.length).toBeGreaterThan(0);
    expect(fallda(plan)).toEqual([]);
  });

  it("FÄLLER ett enda ändrat tecken i en alt-text", () => {
    const plan = bygg();
    const mål = plan[0];
    mål.poster[1].altText = mål.poster[1].altText.replace("a", "e");
    expect(fallda(plan)).toEqual([mål.kort]);
  });

  // ☠️ Homoglyfen är den farligaste formen: samma teckental, annan byte, och
  // osynlig för ögat. Batch 65 publicerade ett kyrilliskt `т` i "granträ" och
  // jag återinförde det identiskt i mitt eget rättningsförsök.
  it("FÄLLER ett kyrilliskt homoglyf med OFÖRÄNDRAD längd", () => {
    const plan = bygg();
    const mål = plan[1];
    const före = mål.poster[0].altText;
    mål.poster[0].altText = före.replace("o", "о");
    expect(mål.poster[0].altText).not.toBe(före);
    expect(mål.poster[0].altText.length).toBe(före.length);
    expect(fallda(plan)).toEqual([mål.kort]);
  });

  // ☠️ Ordningen är betydelsebärande. Position 1 blir huvudbild OCH
  // delningsbild i sökresultat och kategorilistor — ett kort som hamnar
  // först gör en tillverkad grafik till produktens ansikte.
  it("FÄLLER när kortet flyttas från sista till första plats", () => {
    const plan = bygg();
    const mål = plan[2];
    mål.poster.unshift(mål.poster.pop()!);
    expect(fallda(plan)).toEqual([mål.kort]);
  });

  it("FÄLLER ett ändrat fil-id — fel bild på rätt produkt", () => {
    const plan = bygg();
    const mål = plan[3];
    mål.poster[0].id = mål.poster[0].id.replace(/^b379ce_./, "b379ce_0");
    expect(fallda(plan)).toEqual([mål.kort]);
  });

  // ⚠️ Hela `itemsInfo.items` ERSÄTTS av skrivningen. En bild som tappas ur
  // listan finns inte kvar på produkten efteråt.
  it("FÄLLER en bild som tappats ur listan", () => {
    const plan = bygg();
    const mål = plan[4];
    mål.poster.splice(1, 1);
    expect(fallda(plan)).toEqual([mål.kort]);
  });

  // ☠️ Rätt bilder, fel produkt — den klass av fel som ett svar utan fel
  // aldrig kan avslöja, eftersom båda skrivningarna lyckas.
  it("FÄLLER BÅDA raderna när två produkters bildlistor förväxlats", () => {
    const plan = bygg();
    const [a, b] = [plan[5], plan[6]];
    const t = a.poster;
    a.poster = b.poster;
    b.poster = t;
    expect(fallda(plan).sort()).toEqual([a.kort, b.kort].sort());
  });

  // ⚠️ Kortet ska ligga SIST, och det är generatorns jobb — inte spärrens.
  // Testet mäter det separat så att en generator som lägger kortet fel inte
  // kan gömma sig bakom en spärr som bara jämför mot generatorns eget facit.
  it("lägger kortet SIST och ett foto FÖRST på varje produkt", () => {
    for (const p of bygg()) {
      expect(p.poster[p.poster.length - 1].id).toMatch(/\.png$/);
      expect(p.poster[0].id).toMatch(/\.jpg$/);
      expect(p.poster.every((x) => x.altText.trim().length > 0)).toBe(true);
    }
  });
});

// ☠️ KORT ÄR VALFRITT PÅ FILNIVÅ (runda N19, #284 utökad). Saknas
// `kort-filer.tsv` HELT ska hela rundan skrivas utan kort — inte falla på
// "saknar rad i kort-filer.tsv" för varenda produkt. Det är en runda som
// medvetet skjutit upp korten (N15–N19), inte en trasig indata.
describe("mediaskrivning UTAN kort (kort-filer.tsv saknas helt)", () => {
  it("skriver bildlistan orörd, utan att kräva kort-filer.tsv eller kortalt.tsv", () => {
    katalog = mkdtempSync(join(tmpdir(), "mediagrind-utan-kort-"));
    writeFileSync(
      join(katalog, "bilder.tsv"),
      ["p1\t1\tb379ce_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa~mv2.jpg", "p1\t2\tb379ce_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb~mv2.jpg"].join(
        "\n",
      ) + "\n",
    );
    writeFileSync(
      join(katalog, "alt.tsv"),
      ["p1\t1\tEn produkt mot vit bakgrund", "p1\t2\tProdukten i användning"].join("\n") + "\n",
    );
    writeFileSync(join(katalog, "ids.tsv"), "p1\tabc-123\tEn testprodukt\n");

    execFileSync("python3", [join(GATES, "bygg-media.py")], { cwd: katalog });
    // ☠️ Inga kort-filer.tsv/kortalt.tsv skrivna — det är hela poängen.
    execFileSync("python3", [join(GATES, "bygg-medieskrivning.py")], { cwd: katalog });

    const src = readFileSync(join(katalog, "steg2.js"), "utf-8");
    const block = src.match(/const PLAN = (\[[\s\S]*?\n {2}\]);/);
    if (!block) throw new Error("hittade ingen PLAN i steg2.js");
    // eslint-disable-next-line no-eval
    const plan = eval(block[1]) as Rad[];

    expect(plan).toHaveLength(1);
    expect(plan[0].pid).toBe("abc-123");
    // Exakt två poster, ingen tredje (kort) tillagd.
    expect(plan[0].poster).toEqual([
      { id: "b379ce_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa~mv2.jpg", altText: "En produkt mot vit bakgrund" },
      { id: "b379ce_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb~mv2.jpg", altText: "Produkten i användning" },
    ]);
    expect(fallda(plan)).toEqual([]);
  });
});
