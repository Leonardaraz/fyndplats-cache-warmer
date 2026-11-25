// Run: node --test --experimental-strip-types lib/sok-atervand.test.ts
//
// BAKÅT LANDAR I SÖKLÄGET (Leonard 2026-11-25): "Om jag skriver i sökfältet på
// något och trycker på produkten och sen backar borde jag komma tillbaka till
// där jag var sist i sökfältet inte helt annan plats."
//
// Märket i historikpostens tillstånd prövas här. Hur sökrutan skriver och läser
// det mäts i en webbläsare mot bygget; reglerna som inte får glida isär vaktas
// sist i filen.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { lasSokmarke, medSokmarke, utanSokmarke, SOKMARKE, SOKMARKE_MAX_MS } from "./sok-atervand.ts";
import { LISTLAGE_MAX_MS } from "./sidminne.ts";

const NU = Date.parse("2026-11-25T10:00:00.000Z");
const NEXT = { __NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: { tree: ["", {}], renderedSearch: "" } };

describe("märket i historikpostens tillstånd", () => {
  it("skrivs bredvid det som redan står i tillståndet, och läses tillbaka", () => {
    const s = medSokmarke(NEXT, { q: "dörr", y: 420, t: NU });
    // Nexts egna nycklar står kvar orörda: utan dem laddar Next om hela sidan vid bakåt.
    assert.equal(s.__NA, true);
    assert.deepEqual(s.__PRIVATE_NEXTJS_INTERNALS_TREE, NEXT.__PRIVATE_NEXTJS_INTERNALS_TREE);
    assert.deepEqual(lasSokmarke(s, NU + 5_000), { q: "dörr", y: 420, t: NU });
    // Det givna tillståndet skrivs inte om.
    assert.equal(SOKMARKE in NEXT, false);
  });

  it("ett tomt fält (populära produkter) är också ett läge att komma tillbaka till", () => {
    assert.deepEqual(lasSokmarke(medSokmarke(NEXT, { q: "", y: 0, t: NU }), NU), { q: "", y: 0, t: NU });
  });

  it("platsen avrundas och blir aldrig negativ", () => {
    assert.equal(lasSokmarke(medSokmarke(null, { q: "stol", y: 419.6, t: NU }), NU)?.y, 420);
    assert.equal(lasSokmarke(medSokmarke(null, { q: "stol", y: -30, t: NU }), NU)?.y, 0);
  });

  it("utan tillstånd, eller med något som inte är ett objekt, blir det ett tillstånd med bara märket", () => {
    for (const s of [null, undefined, "text", 7, [1, 2]]) {
      assert.deepEqual(Object.keys(medSokmarke(s, { q: "a", y: 1, t: NU })), [SOKMARKE]);
      assert.equal(lasSokmarke(s, NU), null);
      assert.equal(utanSokmarke(s), null);
    }
  });

  it("tas bort utan att röra resten, och svarar null när det inte finns något att ta bort", () => {
    const s = medSokmarke(NEXT, { q: "dörr", y: 420, t: NU });
    const utan = utanSokmarke(s);
    assert.deepEqual(utan, NEXT);
    assert.equal(lasSokmarke(utan, NU), null);
    // Ingen onödig skrivning i historiken när posten saknar märke.
    assert.equal(utanSokmarke(NEXT), null);
  });

  it("☠️ ett märke äldre än en halvtimme öppnar inget, och inte ett från framtiden", () => {
    const s = medSokmarke(NEXT, { q: "dörr", y: 0, t: NU });
    assert.ok(lasSokmarke(s, NU + SOKMARKE_MAX_MS));
    assert.equal(lasSokmarke(s, NU + SOKMARKE_MAX_MS + 1), null);
    assert.equal(lasSokmarke(s, NU - 1), null);
    // Samma gräns som listans sparade läge.
    assert.equal(SOKMARKE_MAX_MS, LISTLAGE_MAX_MS);
  });

  it("☠️ ett märke med fel form läses inte: tillståndet kan komma från en äldre version av sidan", () => {
    const fel = [
      { q: 5, y: 0, t: NU }, { q: "a", y: "0", t: NU }, { q: "a", y: NaN, t: NU }, { q: "a", y: Infinity, t: NU },
      { q: "a", y: -1, t: NU }, { q: "a", y: 0 }, { q: "a", y: 0, t: "nu" }, { q: "x".repeat(201), y: 0, t: NU }, "dörr", null, 1,
    ];
    for (const m of fel) assert.equal(lasSokmarke({ ...NEXT, [SOKMARKE]: m }, NU), null, JSON.stringify(m));
  });

  it("en orimligt lång text kapas när märket skrivs", () => {
    const m = lasSokmarke(medSokmarke(null, { q: "x".repeat(500), y: 0, t: NU }), NU);
    assert.equal(m?.q.length, 200);
  });
});

const ruta = readFileSync(join(import.meta.dirname, "..", "components", "searchbox.tsx"), "utf8");
const del = (fran: string, till: string) => { const i = ruta.indexOf(fran); assert.ok(i >= 0, `hittar inte ${fran}`); const j = ruta.indexOf(till, i); assert.ok(j > i, `hittar inte ${till}`); return ruta.slice(i, j); };

describe("☠️ sökrutan: bakåt landar i sökläget (components/searchbox.tsx)", () => {
  it("märket skrivs i trycket, före sidbytet, och bara i mobilens sökläge", () => {
    const ga = del("const ga = (href: string) => {", "\n  };");
    assert.ok(ga.indexOf("markUt(href);") > 0 && ga.indexOf("markUt(href);") < ga.indexOf("router.push(href)"), "märket före sidbytet");
    const ut = del("const markUt = (till: string) => {", "\n  };");
    assert.match(ut, /if \(!rutnat \|\| !document\.documentElement\.hasAttribute\("data-sok-lage"\)\) return;/);
    // Varan man redan står på lägger ingen ny post: inget märke.
    assert.match(ut, /if \(till === window\.location\.pathname \+ window\.location\.search\) return;/);
    assert.match(ut, /lamnadMed\.current = skrivMarke\(inputRef\.current\?\.value \?\? q, panelRef\.current\?\.scrollTop \?\? 0\);/);
    // Märket läggs i postens eget tillstånd, utan att adressen ändras.
    assert.match(ruta, /window\.history\.replaceState\(medSokmarke\(window\.history\.state, \{ q, y, t \}\), ""\);/);
  });

  it("☠️ lyssnaren på popstate sitter kvar så länge rutan finns: den byts inte ut när sidan byts", () => {
    // Mätt i bygget 2026-11-25: lyssnaren satt i effekten som följer sidans
    // adress, React ritade bakåtsteget mellan Nexts lyssnare och sökrutans, och
    // sökrutans togs bort innan den hunnit köras.
    const lyssnare = del("const onPop = (e: PopStateEvent) => {", "}, [helskarm]);");
    assert.match(lyssnare, /window\.addEventListener\("popstate", onPop\);\s+return \(\) => window\.removeEventListener\("popstate", onPop\);/);
    assert.equal(ruta.split('addEventListener("popstate"').length - 1, 1, "en enda popstate-lyssnare");
    assert.doesNotMatch(ruta, /popstate[\s\S]{0,200}\}, \[pathname/, "lyssnaren hänger inte på sidans adress");
    // Den läser det senaste ur referenser, inte ur renderingen den skapades i.
    assert.match(lyssnare, /aterstallRef\.current\(marke\); return;/);
    assert.match(ruta, /useLayoutEffect\(\(\) => \{ aterstallRef\.current = aterstall; \}\);/);
    assert.match(lyssnare, /document\.activeElement !== inputRef\.current/);
  });

  it("ett steg till en post med märket öppnar sökläget, bara i mobilens sökrad och i telefonbredd", () => {
    const lyssnare = del("const onPop = (e: PopStateEvent) => {", "\n    };");
    assert.match(lyssnare, /const marke = helskarm \? lasSokmarke\(e\.state, Date\.now\(\)\) : null;\s+if \(marke && arSmal\(\)\) \{ aterstallRef\.current\(marke\); return; \}/);
    // I datorbredd tas märket bort, och panelen stängs som förut.
    assert.match(lyssnare, /if \(marke\) glomMarke\(\);\s+setOpen\(false\);/);
  });

  it("listan visas som den var när den står kvar, och fältet får inget fokus", () => {
    const ater = del("const aterstall = (m: Sokmarke) => {", "\n  };");
    assert.match(ater, /if \(rankadFor\.current === m\.q\) \{ setQ\(m\.q\); setOpen\(true\); setSkickad\(false\); return; \}/);
    // Annars räknas den om, med platsen kvar (onType med aterstaller).
    assert.match(ater, /setHits\(\[\]\);\s+setTotalt\(0\);\s+setLaddar\(true\);\s+void onType\(m\.q, true\);/);
    assert.match(ater, /setPavag\(null\);/);
    assert.doesNotMatch(ater, /\.focus\(\)/, "inget fokus: tangentbordet ska inte komma upp");
    // rankadFor följer träffarna: sätts där de sätts, och nollas där de töms.
    assert.match(ruta, /rankadFor\.current = val;\s+setHits\(svar\.traffar\);/);
    assert.equal(ruta.split("rankadFor.current = null;").length - 1, 2);
  });

  it("platsen i listan ställs tillbaka före första ritningen, och inte medan listan räknas om", () => {
    assert.match(ruta, /useLayoutEffect\(\(\) => \{\s+const plats = platsAtt\.current, panel = panelRef\.current;\s+if \(!plats \|\| !panel \|\| !sokLage \|\| q !== plats\.q \|\| laddar\) return;\s+panel\.scrollTop = plats\.y;\s+platsAtt\.current = null;\s+\}\);/);
    // Skriver kunden själv gäller platsen inte längre, och listan börjar överst.
    assert.match(ruta, /if \(!aterstaller\) \{ platsAtt\.current = null; panelRef\.current\?\.scrollTo\(0, 0\); \}/);
  });

  it("☠️ sökläget stängs på sidan man står på: märket tas bort, utom det som skrevs i trycket som lämnar sidan", () => {
    const stad = del('rot.removeAttribute("data-sok-lage"); slapp(); tillbaka?.();', "}, [sokLage]);");
    assert.match(stad, /const marke = markeHar\(\);\s+if \(marke && marke\.t !== lamnadMed\.current\) glomMarke\(\);/);
    // Ett läge som ställts tillbaka räknas inte längre som lämnat.
    assert.match(del("const aterstall = (m: Sokmarke) => {", "\n  };"), /lamnadMed\.current = null;/);
  });

  it("resultatsidan är sökningen i sin helhet: bakåt därifrån öppnar inte sökläget", () => {
    const go = del("const goSearch = (vald?: string) => {", "\n  };");
    assert.doesNotMatch(go, /markUt\(/);
    assert.ok(go.indexOf("if (rutnat) glomMarke();") > 0 && go.indexOf("if (rutnat) glomMarke();") < go.indexOf("router.push(`/sok?q="), "ett gammalt märke tas bort före sidbytet");
  });

  it("ett dokument som laddats med bakåt öppnar sökläget, en omladdning tar bort märket", () => {
    const start = del("const marke = markeHar();\n    if (!marke) return;", "}, []);");
    assert.match(start, /if \(arSmal\(\) && typ === "back_forward" && !w\.__fpNy && !w\.__fpTrav && !w\.__fpKlick\) aterstall\(marke\);\s+else glomMarke\(\);/);
  });

  it("ordet töms inte av effekten som följer sidans adress när sökläget just ställts tillbaka där", () => {
    assert.match(ruta, /const aterstalld = aterAdress\.current === window\.location\.pathname \+ window\.location\.search;\s+aterAdress\.current = null;/);
    assert.match(ruta, /else if \(fran === "\/sok" && !aterstalld\) \{/);
  });
});
