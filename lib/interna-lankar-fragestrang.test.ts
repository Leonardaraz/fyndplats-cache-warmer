// lib/interna-lankar-fragestrang.test.ts
//
// Run with: `pnpm test` (node --test --experimental-strip-types).
//
// ☠️ VARFÖR DEN FINNS (2026-11-11). Produktsidans "Kontakta oss" länkade till
// /kontaktaoss?produkt=<slug>. Det såg oskyldigt ut, men varje produktsida fick
// därmed en EGEN adress till samma formulär: Semrush läste cirka 5 700 av dem
// som egna sidor (47 % av hela genomsökningen), och hälften av alla varningar
// och fyra av fem notiser i rapporten kom därifrån. Sidorna pekade ut
// /kontaktaoss som original, så inget såg fel ut på sidan.
//
// En intern adress med ?namn= är en NY SIDA för varje sökmotor som följer den.
// Den här filen läser källkoden och fäller när en sådan adress byggs någonstans
// där den inte redan är granskad. Hamnar du här:
//
//   1. Ska adressen bara bära ett förval till en sida som är densamma för alla
//      (ett formulär, en flik, ett läge)? Lägg förvalet efter # i stället, som
//      kontaktHref i lib/kontakt/kontakt.ts. Det som står efter # skickas aldrig
//      till servern och räknas inte som en ny sida.
//   2. Måste den stå i sökdelen (servern läser den, eller sidan visar annat
//      innehåll)? Lägg till en rad i GRANSKADE nedan med skälet, och se till att
//      målsidan pekar ut sitt original med canonical eller är noindex.
//
// Provet ser strängar som börjar med "/" och har ett frågetecken följt av ett
// parameternamn, en ${…} eller strängens slut. En adress som sätts ihop av lösa
// bitar ("/x" + "?a=" + b) ser det inte: det är en snubbeltråd, inte ett bevis.

import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROT = join(import.meta.dirname, "..");
const KATALOGER = ["app", "components", "lib"];

/** En intern sökväg i en sträng, fram till och med det som följer på frågetecknet. */
const ADRESS_MED_SOKDEL = /["'`](\/(?!api\/|_next\/)[^"'`\s?#]*\?(?:[A-Za-z_][\w-]*=|\$\{|(?=["'`])))/g;

type Granskad = { fil: string; adress: string; skal: string };

/**
 * Varje ställe där en intern adress med sökdel byggs i dag, med skälet till att
 * den får stå kvar. Listan ska stämma exakt: en ny träff fäller, och en rad som
 * inte längre träffar fäller också, så att listan inte samlar döda undantag.
 */
const GRANSKADE: Granskad[] = [
  { fil: "app/kassa/kassa.tsx", adress: "/tack?orderId=", skal: "Webbläsaren skickas dit efter betalningen. Ingen länk i HTML, och /tack är noindex." },
  { fil: "app/kassa/klar/tillbaka.tsx", adress: "/tack?orderId=", skal: "Samma som i kassan: en omdirigering i webbläsaren efter betalningen." },
  { fil: "app/kassa/klar/tillbaka.tsx", adress: "/kassa?stripe=", skal: "Omdirigering tillbaka till kassan med Stripes besked. Kassan är noindex." },
  { fil: "app/offert/[id]/page.tsx", adress: "/konto?mal=", skal: "Offertsidan är privat och noindex; länken leder till inloggningen." },
  { fil: "app/konto/mina-sidor.tsx", adress: "/sparning?tn=", skal: "Står bara på Mina sidor, bakom inloggningen." },
  { fil: "app/tack/tack-konto.tsx", adress: "/konto?fran=", skal: "Står bara på tacksidan efter ett köp, som är noindex." },
  { fil: "components/shopbrowser.tsx", adress: "/produkt/${p.slug}?farg=", skal: "?farg= sätts först när kunden själv har filtrerat på en färg, aldrig i serverns HTML. Produktsidan pekar ut sin adress utan sökdel som original." },
  { fil: "components/searchbox.tsx", adress: "/sok?q=", skal: "router.push när kunden söker. Ingen länk i HTML, och söksidan är noindex." },
  { fil: "lib/kassa/stripe-klient.ts", adress: "/kassa?stripe=", skal: "Omdirigering tillbaka till kassan vid fel. Kassan är noindex." },
  { fil: "lib/kassa/aterta-korg.ts", adress: "/kassa?kod=", skal: "Målet för länken i mejlet om en övergiven varukorg. Kassan är noindex." },
  { fil: "lib/kundvagn-lank.ts", adress: "/produkt/${slug}?variant=", skal: "?variant= i varukorgens rad, som ritas i webbläsaren. Produktsidan pekar ut sin adress utan sökdel som original." },
  { fil: "lib/wix-client.ts", adress: "/stores/v3/products/${encodeURIComponent(productId)}?fields=", skal: "En sökväg i Wix API, som läggs efter Wix adress. Ingen sida hos oss." },
  { fil: "lib/wix-lager.ts", adress: "/items/${encodeURIComponent(id)}?dataCollectionId=", skal: "En sökväg i Wix Data API, som läggs efter Wix adress. Ingen sida hos oss." },
];

function kallfiler(katalog: string): string[] {
  const ut: string[] = [];
  for (const namn of readdirSync(katalog)) {
    const hel = join(katalog, namn);
    if (statSync(hel).isDirectory()) {
      // API-rutterna bygger adresser till andra tjänster och svarar aldrig med sidor.
      if (hel === join(ROT, "app", "api")) continue;
      ut.push(...kallfiler(hel));
    } else if (/\.tsx?$/.test(namn) && !/\.test\.ts$/.test(namn)) {
      ut.push(hel);
    }
  }
  return ut;
}

/** Kommentarer bort, så att exempel i löptext inte räknas. "https://" i en sträng rörs inte. */
function utanKommentarer(kod: string): string {
  return kod.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:\w"'`\\])\/\/.*$/gm, "$1");
}

function traffarI(kod: string): string[] {
  return [...utanKommentarer(kod).matchAll(ADRESS_MED_SOKDEL)].map((m) => m[1]);
}

const nyckel = (fil: string, adress: string) => `${fil} :: ${adress}`;

test("☠️ ingen ny intern adress med sökdel: varje ?namn= är en egen sida för en sökmotor", () => {
  const hittade = new Set<string>();
  for (const katalog of KATALOGER) {
    for (const fil of kallfiler(join(ROT, katalog))) {
      const rel = relative(ROT, fil).split(sep).join("/");
      for (const adress of traffarI(readFileSync(fil, "utf8"))) hittade.add(nyckel(rel, adress));
    }
  }
  const granskade = new Set(GRANSKADE.map((g) => nyckel(g.fil, g.adress)));
  const nya = [...hittade].filter((h) => !granskade.has(h)).sort();
  const doda = [...granskade].filter((g) => !hittade.has(g)).sort();
  assert.deepEqual(
    nya,
    [],
    "Ny intern adress med sökdel. Lägg förvalet efter # (se kontaktHref), eller lägg till raden i GRANSKADE med skälet:\n  " + nya.join("\n  "),
  );
  assert.deepEqual(doda, [], "Rader i GRANSKADE som inte längre finns i koden. Ta bort dem:\n  " + doda.join("\n  "));
});

test("varje granskad adress har ett skäl, och listan har inga dubbletter", () => {
  const sedda = new Set<string>();
  for (const g of GRANSKADE) {
    assert.ok(g.skal.trim().length >= 20, `${g.fil}: skälet saknas eller säger ingenting`);
    const k = nyckel(g.fil, g.adress);
    assert.ok(!sedda.has(k), `dubblett: ${k}`);
    sedda.add(k);
  }
});

test("mönstret ser formerna som har gått fel, och bara dem", () => {
  // Formen som orsakade felet: en mallsträng med ?${…}.
  assert.deepEqual(traffarI("return `/kontaktaoss?${q.toString()}#meddelande`;"), ["/kontaktaoss?${"]);
  assert.deepEqual(traffarI('const a = "/kontaktaoss?produkt=" + slug;'), ["/kontaktaoss?produkt="]);
  assert.deepEqual(traffarI("href={`/produkt/${p.slug}?farg=${k}`}"), ["/produkt/${p.slug}?farg="]);
  assert.deepEqual(traffarI("const bas = '/sok?';"), ["/sok?"]);
  // Fragmentet är rätt väg, och rena sökvägar rörs inte.
  assert.deepEqual(traffarI("return `/kontaktaoss#${q.toString()}`;"), []);
  assert.deepEqual(traffarI('href="/kategori/soffbord"'), []);
  // API-anrop och Nexts egna filer är inga sidor.
  assert.deepEqual(traffarI("fetch(`/api/kontakt/produkt?p=${slug}`)"), []);
  assert.deepEqual(traffarI('"/_next/image?url=x"'), []);
  // Externa adresser och exempel i kommentarer räknas inte.
  assert.deepEqual(traffarI('const u = "https://www.fyndplats.se/tack?orderId=1";'), []);
  assert.deepEqual(traffarI("// förr: `/kontaktaoss?produkt=<slug>`\nconst x = 1;"), []);
  assert.deepEqual(traffarI("/* `/kontaktaoss?produkt=<slug>` */ const x = 1;"), []);
  // En kommentar efter kod på samma rad tas bort, koden före står kvar.
  assert.deepEqual(traffarI('const a = "/sok?q=" + t; // `/annat?x=1`'), ["/sok?q="]);
});
