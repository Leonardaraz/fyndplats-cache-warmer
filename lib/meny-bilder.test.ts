// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Menyns bilder (2026-11-15): urvalet, handvalen, adresserna och var bilderna
// får komma ifrån. Se lib/meny-bilder.ts för varför bilderna har en egen
// hämtning och inte ligger i sidans HTML.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  AVDELNING_PRODUKT_KANT,
  hjalteAdress,
  MENY_BILD_KANT,
  menyBildAdress,
  menyBildIStorlek,
  menyBildSrcSet,
  rangordna,
  valjMenyBilder,
  wixNyckel,
  type MenyKandidat,
  type MenyNod,
} from "./meny-bilder.ts";
import { MENY_BILD_VAL } from "./meny-bild-val.ts";

const bild = (n: string) => `https://static.wixstatic.com/media/b379ce_${n}~mv2.jpg`;
const adress = (n: string) => `https://static.wixstatic.com/media/b379ce_${n}~mv2.jpg/v1/fit/w_112,h_112,q_80/file.webp`;

function produkt(slug: string, kategori: string, extra: Partial<MenyKandidat> = {}): MenyKandidat {
  return { slug, img: bild(slug), inStock: true, collectionIds: [kategori], ...extra };
}

// Två avdelningar: Möbler med två underkategorier och Trädgård med en.
const TRAD: MenyNod[] = [
  { id: "m", slug: "mobler", name: "Möbler", subs: [{ id: "s", slug: "soffor", name: "Soffor" }, { id: "b", slug: "bord", name: "Bord" }] },
  { id: "t", slug: "tradgard", name: "Trädgård", subs: [{ id: "u", slug: "utemobler", name: "Utemöbler" }] },
];

// ── Adresserna ───────────────────────────────────────────────────────────

test("wixNyckel: nyckeln ur en Wix-adress eller en ren nyckel, annars null", () => {
  assert.equal(wixNyckel(bild("abc")), "b379ce_abc~mv2.jpg");
  assert.equal(wixNyckel("https://static.wixstatic.com/media/b379ce_abc~mv2.jpg/v1/fill/w_500,h_500/x.jpg"), "b379ce_abc~mv2.jpg");
  assert.equal(wixNyckel("b379ce_abc~mv2.jpg"), "b379ce_abc~mv2.jpg");
  assert.equal(wixNyckel("wix:image://v1/b379ce_abc~mv2.jpg/x.jpg"), null);
  assert.equal(wixNyckel("https://images.unsplash.com/photo-1?w=400"), null);
  assert.equal(wixNyckel(""), null);
});

test("menyBildAdress: hela bilden i en kvadrat om 112 px, webp", () => {
  assert.equal(MENY_BILD_KANT, 112);
  assert.equal(menyBildAdress(bild("abc")), adress("abc"));
  assert.equal(
    menyBildAdress(bild("abc"), 56),
    "https://static.wixstatic.com/media/b379ce_abc~mv2.jpg/v1/fit/w_56,h_56,q_80/file.webp",
  );
  // fit, aldrig fill: produkten beskärs inte.
  assert.match(menyBildAdress(bild("abc")) ?? "", /\/v1\/fit\//);
  assert.equal(menyBildAdress("https://example.com/a.jpg"), null);
});

test("hjalteAdress: Unsplash får form och bredd, höjden tas bort, allt annat blir null", () => {
  const ut = hjalteAdress("https://images.unsplash.com/photo-123?w=1600&h=900&q=80&fit=crop", 496, "4:5");
  assert.ok(ut);
  const u = new URL(ut);
  assert.equal(u.hostname, "images.unsplash.com");
  assert.equal(u.pathname, "/photo-123");
  assert.equal(u.searchParams.get("h"), null, "med både w och h bortser Unsplash från ar");
  assert.equal(u.searchParams.get("w"), "496");
  assert.equal(u.searchParams.get("ar"), "4:5");
  assert.equal(u.searchParams.get("fit"), "crop");
  assert.equal(u.searchParams.get("crop"), "center");
  assert.equal(u.searchParams.get("q"), "75");
  assert.equal(u.searchParams.get("auto"), "format");
  assert.equal(hjalteAdress(bild("abc"), 496, "4:5"), null);
  assert.equal(hjalteAdress("", 496, "4:5"), null);
  assert.equal(hjalteAdress("images.unsplash.com/inte-en-adress", 496, "4:5"), null);
});

// ── Urvalet ──────────────────────────────────────────────────────────────

test("rangordna: mest såld, sedan bildpoäng, sedan äldst, sist slug", () => {
  const lista: MenyKandidat[] = [
    produkt("d", "s", { popularity: 1, imageScore: 9, createdAt: 5 }),
    produkt("c", "s", { popularity: 1, imageScore: 9, createdAt: 3 }),
    produkt("b", "s", { popularity: 1, imageScore: 10 }),
    produkt("a", "s", { popularity: 5 }),
    produkt("f", "s", { popularity: 1, imageScore: 9 }),
    produkt("e", "s", { popularity: 1, imageScore: 9 }),
  ];
  // Saknat datum räknas som nyast, och lika i allt avgörs av sluggen.
  assert.deepEqual([...lista].sort(rangordna).map((p) => p.slug), ["a", "b", "c", "d", "e", "f"]);
});

test("valjMenyBilder: den mest sålda i lager per kategori, och avdelningen ur sina underkategorier", () => {
  const ut = valjMenyBilder(TRAD, [
    produkt("soffa-1", "s", { popularity: 3 }),
    produkt("soffa-2", "s", { popularity: 9 }),
    produkt("bord-1", "b"),
    produkt("utemobel-1", "u"),
    produkt("utemobel-2", "u", { popularity: 2 }),
  ]);
  assert.equal(ut.soffor, adress("soffa-2"));
  assert.equal(ut.bord, adress("bord-1"));
  assert.equal(ut.utemobler, adress("utemobel-2"));
  // Avdelningen väljer sist och tar den bästa som ingen underkategori tagit.
  assert.equal(ut.mobler, adress("soffa-1"));
  assert.equal(ut.tradgard, adress("utemobel-1"));
});

test("valjMenyBilder: samma produkt står aldrig två gånger, och minsta urvalet väljer först", () => {
  // Bordet är den enda produkten i Bord men också den mest sålda i Soffor.
  // Bord har minst urval och väljer först, så Soffor tar nästa.
  const ut = valjMenyBilder(TRAD, [
    produkt("bordssoffa", "s", { popularity: 9, collectionIds: ["s", "b"] }),
    produkt("soffa-1", "s", { popularity: 1 }),
  ]);
  assert.equal(ut.bord, adress("bordssoffa"));
  assert.equal(ut.soffor, adress("soffa-1"));
  // Möbler har ingen produkt kvar och saknas i svaret: menyn visar bara namnet.
  assert.equal(ut.mobler, undefined);
  const anvanda = Object.values(ut);
  assert.equal(new Set(anvanda).size, anvanda.length);
});

test("valjMenyBilder: slut i lager, utan Wix-bild, flaggad bild eller nekad produkt blir aldrig menybild", () => {
  const ut = valjMenyBilder(
    TRAD,
    [
      produkt("slut", "s", { popularity: 99, inStock: false }),
      produkt("unsplash", "s", { popularity: 98, img: "https://images.unsplash.com/photo-1" }),
      produkt("kollage", "s", { popularity: 97, imageFlags: ["collage"] }),
      produkt("text", "s", { popularity: 96, imageFlags: ["baked_text"] }),
      produkt("vattenstampel", "s", { popularity: 95, imageFlags: ["watermark"] }),
      produkt("bricka", "s", { popularity: 94, imageFlags: ["badge"] }),
      produkt("kinesisk", "s", { popularity: 93, imageFlags: ["chinese_text"] }),
      produkt("nekad", "s", { popularity: 92 }),
      produkt("ren", "s", { popularity: 1, imageFlags: ["white_bg"] }),
    ],
    { neka: new Set(["nekad"]) },
  );
  assert.equal(ut.soffor, adress("ren"));
});

test("valjMenyBilder: handvalet går först, men bara om det duger och inte redan är taget", () => {
  const produkter = [
    produkt("bast", "s", { popularity: 9 }),
    produkt("vald", "s", { popularity: 1 }),
    produkt("bord-1", "b"),
    produkt("slutsald", "u", { inStock: false }),
    produkt("utemobel-1", "u"),
  ];
  const ut = valjMenyBilder(TRAD, produkter, {
    val: { soffor: "vald", utemobler: "slutsald", bord: "finns-inte", mobler: "vald" },
  });
  assert.equal(ut.soffor, adress("vald"));
  // Ett val som slutat gälla faller tyst tillbaka på det automatiska.
  assert.equal(ut.utemobler, adress("utemobel-1"));
  assert.equal(ut.bord, adress("bord-1"));
  // Möbler pekar på samma produkt som Soffor redan tagit och får nästa bästa.
  assert.equal(ut.mobler, adress("bast"));
});

test("valjMenyBilder: tomt träd och tom katalog ger tomt svar", () => {
  assert.deepEqual(valjMenyBilder([], [produkt("a", "s")]), {});
  assert.deepEqual(valjMenyBilder(TRAD, []), {});
});

// ── Handvalen ────────────────────────────────────────────────────────────

test("MENY_BILD_VAL: en rad per kategori, ingen produkt två gånger", () => {
  const kalla = readFileSync("lib/meny-bild-val.ts", "utf8");
  const rader = kalla.split("\n").filter((r) => /^\s+"/.test(r));
  for (const rad of rader) assert.match(rad, /^ {2}"[a-z0-9-]+": "[a-z0-9-]+",$/, rad);
  const nycklar = Object.keys(MENY_BILD_VAL);
  // En dubblettnyckel skrivs tyst över och syns som för få nycklar.
  assert.equal(rader.length, nycklar.length, "en kategori förekommer två gånger");
  const varden = Object.values(MENY_BILD_VAL);
  const dubbletter = varden.filter((v, i) => varden.indexOf(v) !== i);
  assert.deepEqual(dubbletter, [], "samma produkt får inte stå för två kategorier");
  assert.ok(nycklar.length >= 150, `väntade ett val per kategori i menyn, hittade ${nycklar.length}`);
});

test("MENY_BILD_VAL: bara produktslugs, aldrig ett leverantörsnummer eller en adress", () => {
  const kalla = readFileSync("lib/meny-bild-val.ts", "utf8");
  assert.doesNotMatch(kalla, /https?:\/\//);
  assert.doesNotMatch(kalla, /static\.wixstatic|wix:image/);
  for (const v of Object.values(MENY_BILD_VAL)) {
    // Aosoms nummer i gemener som i en slug: tre tecken, bindestreck, tre
    // siffror, sedan V, två siffror och bokstäver; också med bokstav först.
    assert.doesNotMatch(v, /\d{3}-\d{3}[a-z]/, v);
    assert.doesNotMatch(v, /[a-z0-9]{3}-\d{3}v\d{2}/, v);
  }
});

test("valjMenyBilder och lib/meny-bilder.ts importerar ingenting", () => {
  // Lövmodul: handvalen skickas in av rutten, så att provet kör modulen direkt.
  const kalla = readFileSync("lib/meny-bilder.ts", "utf8");
  assert.doesNotMatch(kalla, /^\s*import\s/m);
  assert.doesNotMatch(readFileSync("lib/meny-bild-val.ts", "utf8"), /^\s*import\s/m);
});

test("menyBildIStorlek och menyBildSrcSet: miniatyren i fler storlekar, andra adresser orörda", () => {
  const liten = adress("abc");
  const i = (k: number) => `https://static.wixstatic.com/media/b379ce_abc~mv2.jpg/v1/fit/w_${k},h_${k},q_80/file.webp`;
  // Avdelningens produktbild i datorns stora ruta (cirka 160 px bred, tre bildpunkter per px).
  assert.equal(AVDELNING_PRODUKT_KANT, 480);
  assert.equal(menyBildIStorlek(liten, AVDELNING_PRODUKT_KANT), i(480));
  assert.equal(menyBildIStorlek(liten, 168), i(168));
  // 112 px räcker för 56 px med två bildpunkter per px; en telefon med tre får 168.
  assert.equal(menyBildSrcSet(liten), `${liten} 2x, ${i(168)} 3x`);
  // Bara menyns egen miniatyr byts: en annan storlek, form eller kvalitet står kvar.
  assert.equal(menyBildSrcSet(i(480)), undefined);
  assert.equal(menyBildIStorlek(i(480), 168), null);
  assert.equal(menyBildIStorlek(liten.replace("/v1/fit/", "/v1/fill/"), 480), null);
  assert.equal(menyBildIStorlek(liten.replace("q_80", "q_90"), 480), null);
  assert.equal(menyBildIStorlek(`${liten}?x=1`, 480), null);
  // Miljöfotot och främmande adresser får ingen srcset.
  assert.equal(menyBildSrcSet("https://images.unsplash.com/photo-1?w=496&fit=crop&ar=4:5"), undefined);
  assert.equal(menyBildIStorlek("https://example.com/a.jpg", 480), null);
});

test("datorns avdelningsruta visar produktbilden i 480 px, och miniatyrerna har en 3x-variant", () => {
  // ☠️ Förut stod menyns miniatyr (112 px) i rutan om 232 × 290 och blev suddig.
  const dator = readFileSync("components/meganav.tsx", "utf8");
  assert.match(dator, /menyBildIStorlek\(produkt, AVDELNING_PRODUKT_KANT\) \?\? produkt/);
  const hook = readFileSync("components/use-meny-bilder.tsx", "utf8");
  assert.match(hook, /srcSet=\{menyBildSrcSet\(src\)\}/);
});

// ── Var bilderna kommer ifrån ────────────────────────────────────────────

test("bilderna hämtas ur /api/meny-bilder i webbläsaren, inte ur sidans HTML", () => {
  // Trädet i sidhuvudet bär inga bilder: ett nytt bildval hade annars gjort
  // varje sida "ny" för Vercel (samma skäl som antalen, lib/meny-antal.ts).
  const data = readFileSync("lib/sidhuvud-data.ts", "utf8");
  assert.doesNotMatch(data, /meny-bild|valjMenyBilder|MENY_BILD_VAL/);
  const site = readFileSync("components/site.tsx", "utf8");
  assert.doesNotMatch(site, /meny-bild|bilder=/i);
  for (const fil of ["components/meganav.tsx", "components/mobilenav.tsx"]) {
    const src = readFileSync(fil, "utf8");
    assert.match(src, /useMenyBilder\(\)/, `${fil} ska hämta bilderna i webbläsaren`);
    assert.doesNotMatch(src, /meny-bild-val|valjMenyBilder/, `${fil} får inte välja bilder själv`);
  }
  // Handvalen läses bara av rutten och går aldrig till webbläsaren.
  const hook = readFileSync("components/use-meny-bilder.tsx", "utf8");
  // En hämtning per sidvisning, delad av datorns meny och mobilens.
  assert.match(hook, /lofte \?\?= fetch\("\/api\/meny-bilder"\)/);
  assert.doesNotMatch(hook, /meny-bild-val/);
});

test("rutten: CDN-cachad en timme, kort cache när katalogen är reservkatalogen", () => {
  const rutt = readFileSync("app/api/meny-bilder/route.ts", "utf8");
  assert.match(rutt, /export const revalidate = 3600;/);
  assert.match(rutt, /"public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400"/);
  assert.match(rutt, /katalogenArDegraderad\(produkter\)/);
  assert.match(rutt, /"public, max-age=60, s-maxage=60"/);
  assert.match(rutt, /valjMenyBilder\(tree, produkter, \{ val: MENY_BILD_VAL, neka: MOSAIC_DENYLIST \}\)/);
});

test("menyerna hämtar bilderna först när någon rör menyn eller webbläsaren är ledig", () => {
  const dator = readFileSync("components/meganav.tsx", "utf8");
  // Datorns meny förvärmer bara på en dator med mus. Mobilmenyn hämtar listan
  // när webbläsaren är ledig, men ritar bilderna först när menyknappen trycks.
  assert.match(dator, /matchMedia\?\.\("\(hover: hover\) and \(pointer: fine\)"\)/);
  assert.match(dator, /forvarmMenyBilder\(\)/);
  assert.match(dator, /const open = \(i: number\) => \{[^}]*hamtaMenyBilder\(\)/);
  const mobil = readFileSync("components/mobilenav.tsx", "utf8");
  assert.match(mobil, /onPointerDown=\{forvarna\}/);
  assert.match(mobil, /onClick=\{oppna\}/);
  // En dold panels bilder laddas aldrig: datorns bilder är lata.
  const hook = readFileSync("components/use-meny-bilder.tsx", "utf8");
  // Förvärmningen väntar tills sidan har laddat klart, så att listan och
  // mobilens miniatyrer aldrig tävlar med sidans egna bilder om nätet.
  assert.match(hook, /if \(document\.readyState === "complete"\) starta\(\);\s*else window\.addEventListener\("load", starta, \{ once: true \}\);/);
  assert.match(hook, /window\.removeEventListener\("load", starta\);/);
  assert.match(hook, /loading=\{lat \? "lazy" : "eager"\}/);
  assert.match(hook, /alt=""/);
});

test("bara det som syns ritar bilder: den öppna panelen och den öppnade mobilmenyn", () => {
  // Förut fick alla tretton paneler och den stängda mobilmenyn sina bildelement
  // så fort bildlistan kom: cirka 186 element i en lång uppgift på varje sida,
  // och mobilmenyns tretton bilder hämtades fast ingen öppnat den. Mätt
  // 2026-11-15 med processorn strypt fyra gånger: TBT på mobil cirka 105 → 200 ms.
  const dator = readFileSync("components/meganav.tsx", "utf8");
  assert.match(dator, /const panelensBilder = \(i: number\) => \(active === i \? bilder : null\);/);
  assert.doesNotMatch(dator, /bilder\?\.(bilder|hjaltar)\[/, "ingen panel läser bildlistan förbi panelensBilder");
  assert.match(dator, /foto=\{panelensBilder\(i\)\?\.hjaltar\[m\.slug\]\}/);
  assert.match(dator, /produkt=\{panelensBilder\(i\)\?\.bilder\[m\.slug\]\}/);
  assert.match(dator, /<MenyBild src=\{panelensBilder\(i\)\?\.bilder\[s\.slug\]\} \/>/);
  const mobil = readFileSync("components/mobilenav.tsx", "utf8");
  assert.match(mobil, /const stegBilder = visaBilder \? bilder : null;/);
  // Båda varianterna av avdelningsraden (knapp och länk) går genom stegBilder.
  assert.equal(mobil.match(/<MenyBild src=\{stegBilder\?\.bilder\[m\.slug\]\}/g)?.length, 2);
  // På en pekskärm utan sparläge ritas de i förväg (lådan har dem när den glider in);
  // annars när trycket börjar och vid klicket (tangentbordet har inget tryck).
  assert.match(mobil, /matchMedia\?\.\("\(hover: none\) and \(pointer: coarse\)"\)\.matches === true/);
  assert.match(mobil, /return pekskarm && !sparlage;/);
  assert.match(mobil, /connection\?\.saveData === true/);
  // Servern ritar aldrig lådan, så ett annat startvärde i webbläsaren ger ingen skillnad i HTML:en.
  assert.match(mobil, /if \(typeof window === "undefined"\) return false;/);
  assert.match(mobil, /\{mounted \? createPortal\(menu, document\.body\) : null\}/);
  assert.match(mobil, /const forvarna = \(\) => \{[^}]*setVisaBilder\(true\)/);
  assert.match(mobil, /const oppna = \(\) => \{[^}]*setVisaBilder\(true\)/);
  // Ingen förladdning vid sidan av: den tog 2x-bilden också där skärmen ville ha 3x.
  assert.doesNotMatch(mobil, /new Image\(\)\.src/);
});

test("cookierutan väntar medan mobilmenyn är öppen, som för varukorgen och favoriterna", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\nbody:has\(\.drawer\.show\) \.cookiebar,body:has\(\.mobilemenu\.open\) \.cookiebar\{visibility:hidden\}/);
});
