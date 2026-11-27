// Run: node --test --experimental-strip-types lib/gowish.test.ts
//
// GoWish önskelistknapp på produktsidan (Leonard 2026-11-25). Reglerna står i
// lib/gowish.ts, components/gowish-knapp.tsx och app/produkt/[slug]/gowish.css.
// Kvittot i en riktig webbläsare (sidbyten, rutan, reservvägen, tio
// skärmstorlekar) står i CLAUDE.md, "GoWish: önskelistknappen på produktsidan".
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  GOWISH_KNAPP_ID,
  GOWISH_KNAPP_TEXT,
  GOWISH_REGION,
  GOWISH_SKRIPT,
  GOWISH_SKRIPT_ID,
  gowishProduktadress,
  gowishReservadress,
  gowishSvenskRuta,
  GOWISH_DIALOG_ID,
  GOWISH_RAM_ID,
  GOWISH_RUTA,
  GOWISH_RUTA_SV,
  GOWISH_VANTA_MS,
} from "./gowish.ts";

const rot = join(import.meta.dirname, "..");
const las = (...delar: string[]) => readFileSync(join(rot, ...delar), "utf8");
const utanKommentarer = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "");
// Hela rader som är kommentarer. ☠️ Inte allt efter "//": det tar också adressen i "https://…".
const RADKOMMENTAR = /^\s*\/\/.*$/gm;
const knapp = las("components", "gowish-knapp.tsx");
const vy = las("components", "productview.tsx");
const sida = las("app", "produkt", "[slug]", "page.tsx");
const stil = utanKommentarer(las("app", "produkt", "[slug]", "gowish.css"));

/** Alla källfiler under en katalog, utan prov. */
function filer(katalog: string, ut: string[] = []): string[] {
  for (const namn of readdirSync(join(rot, katalog))) {
    const p = join(katalog, namn);
    if (statSync(join(rot, p)).isDirectory()) filer(p, ut);
    else if (/\.(tsx?|css)$/.test(namn) && !/\.test\.ts$/.test(namn)) ut.push(p);
  }
  return ut;
}

describe("värdena är GoWish egna, ur deras guide och deras skript", () => {
  it("skriptet hämtas från deras lagring, med det id och den region guiden anger", () => {
    assert.equal(GOWISH_SKRIPT, "https://storage.googleapis.com/gowish-button-prod/js/gowish-iframe.js");
    // Skriptet letar upp sin egen tagg på id:t för att läsa regionen.
    assert.equal(GOWISH_SKRIPT_ID, "gowish-iframescript");
    // ☠️ Utan region väljer skriptet Danmark: onskeskyen.dk och appens schema onskeskyen://.
    assert.equal(GOWISH_REGION, "global");
  });

  it("knappens id är ett av de fem skriptet lyssnar på: den runda varianten utan text", () => {
    const LYSSNAR = ["ov-onskeskyen-generated-wish-button", "gowishRoundedButton", "gowishBlueButton", "gowishWhiteButton", "gowishDynamicButton"];
    assert.ok(LYSSNAR.includes(GOWISH_KNAPP_ID));
    assert.equal(GOWISH_KNAPP_ID, "gowishRoundedButton");
    assert.equal(GOWISH_KNAPP_TEXT, "Lägg till i GoWish");
  });
});

describe("adressen GoWish får är varans kanoniska", () => {
  it("samma adress som sidans canonical och og:url", () => {
    assert.equal(gowishProduktadress("gungande-knastol-gra"), "https://www.fyndplats.se/produkt/gungande-knastol-gra");
    // Sidan bygger sin canonical och sin og:url på samma sätt.
    assert.match(sida, /alternates: \{ canonical: `https:\/\/www\.fyndplats\.se\/produkt\/\$\{p\.slug\}` \}/);
    assert.match(sida, /url: `https:\/\/www\.fyndplats\.se\/produkt\/\$\{p\.slug\}`/);
  });

  it("inget ur adressfältet följer med: varken val, utm eller annonsens klick-id", () => {
    const ut = gowishProduktadress("soffa");
    assert.equal(new URL(ut).search, "");
    assert.equal(new URL(ut).hash, "");
    // Funktionen tar bara varans slug. Den kan inte läsa adressfältet.
    assert.doesNotMatch(las("lib", "gowish.ts").replace(RADKOMMENTAR, ""), /window|location|searchParams/);
  });

  it("reservadressen är den skriptet själv lägger i sin iframe, med adressen kodad", () => {
    assert.equal(
      gowishReservadress("https://www.fyndplats.se/produkt/soffa"),
      "https://gowish.com/sv/quick-add?source=button&crawlerTarget=https%3A%2F%2Fwww.fyndplats.se%2Fprodukt%2Fsoffa",
    );
    // Ett tecken som hade brutit frågesträngen kodas.
    assert.match(gowishReservadress("https://www.fyndplats.se/produkt/a&b=c"), /crawlerTarget=https%3A%2F%2Fwww\.fyndplats\.se%2Fprodukt%2Fa%26b%3Dc$/);
  });
});

describe("två lägen: en länk utan samtycke, GoWish ruta med", () => {
  // Butikens regel för allt som hämtas från en tredje part: bara med samtycke
  // till alla cookies. Utan det är knappen en vanlig länk, och ingenting hämtas
  // därifrån förrän kunden trycker (components/trustpilot-insamling.tsx,
  // components/klarna-osm.tsx och sekretesspolicyn).
  const utan = knapp.slice(knapp.indexOf("if (!samtycke) {"), knapp.indexOf("const tryck"));
  const med = knapp.slice(knapp.indexOf("const tryck"));

  it("läget följer samtycket till alla cookies, som Trustpilots och Klarnas moduler", () => {
    assert.match(knapp, /import \{ useMarketingConsent \} from "\.\.\/lib\/use-marketing-consent";/);
    assert.match(knapp, /const samtycke = useMarketingConsent\(\);/);
    assert.ok(utan.length > 200 && med.length > 300, "hittar inte de två grenarna");
  });

  it("utan samtycke: en länk till GoWish egen sida i en ny flik, och ingenting annat", () => {
    assert.match(utan, /<a\s+className="gowish-ikon"\s+href=\{reserv\}\s+target="_blank"\s+rel="noopener noreferrer"/);
    assert.match(knapp, /const reserv = gowishReservadress\(adress\);/);
    // Varken skriptet eller GoWish id finns i den grenen: skriptet står efter den.
    assert.doesNotMatch(utan, /<Script|GOWISH_KNAPP_ID|<button|data-producturl/);
    assert.equal(knapp.split("<Script").length - 1, 1);
    assert.ok(knapp.indexOf("<Script") > knapp.indexOf("const tryck"));
  });

  // Rutan har ingen synlig text (Leonard 2026-11-26: "bara en ruta ... med
  // gowish symbolen"). Namnet står i aria-label och, för musen, i title.
  it("länken heter Lägg till i GoWish och säger att den öppnar en ny flik, också för den som inte ser den", () => {
    assert.match(utan, /aria-label=\{`\$\{GOWISH_KNAPP_TEXT\} \(öppnas i en ny flik\)`\}\s+title=\{GOWISH_KNAPP_TEXT\}/);
  });

  it("med samtycke: en riktig knapp med GoWish id, varans adress i data-producturl och ett namn", () => {
    assert.match(
      med,
      /<button\s+id=\{GOWISH_KNAPP_ID\}\s+className="gowish-ikon"\s+type="button"\s+data-producturl=\{adress\}\s+onClick=\{tryck\}\s+aria-label=\{GOWISH_KNAPP_TEXT\}\s+title=\{GOWISH_KNAPP_TEXT\}\s*>/,
    );
    assert.match(knapp, /const adress = gowishProduktadress\(slug\);/);
  });

  // Molnet är dekoration: knappens namn står i aria-label.
  it("ikonen är dold för skärmläsare, i båda lägena", () => {
    assert.match(knapp, /<svg viewBox="0 0 26 16" width="28" height="17" aria-hidden="true" focusable="false">/);
    assert.match(utan, /<Moln \/>/);
    assert.match(med, /<Moln \/>/);
  });

  // ☠️ Skriptet lyssnar själv på klicket. Ett eget anrop till createIframe när
  // skriptet finns öppnar rutan, och skriptets lyssnare stänger den igen.
  it("☠️ klicket gör ingenting eget när skriptet finns, och öppnar länkens sida när det saknas", () => {
    assert.match(med, /const tryck = \(\) => \{\n\s+if \(window\.GoWish\) return svenskRuta\(\);\n\s+window\.open\(reserv, "_blank", "noopener,noreferrer"\);\n\s+\};/);
    assert.doesNotMatch(knapp.replace(RADKOMMENTAR, ""), /createIframe\(/);
  });
});

describe("skriptet: efter laddningen, och bara där knappen finns", () => {
  it("next/script med lazyOnload, GoWish id och region", () => {
    assert.match(knapp, /import Script from "next\/script";/);
    assert.match(knapp, /<Script id=\{GOWISH_SKRIPT_ID\} src=\{GOWISH_SKRIPT\} strategy="lazyOnload" data-region=\{GOWISH_REGION\} \/>/);
  });

  it("ingen annan fil hämtar något från GoWish", () => {
    const traffar = [...filer("app"), ...filer("components"), ...filer("lib")]
      .filter((f) => /gowish-button-prod|gowish-iframe\.js|gowish-iframe\.css/.test(utanKommentarer(readFileSync(join(rot, f), "utf8")).replace(RADKOMMENTAR, "")));
    assert.deepEqual(traffar, ["lib/gowish.ts"]);
  });

  it("knappen används bara av produktvyn, och sidans layout bär varken knapp eller skript", () => {
    const anvandare = [...filer("app"), ...filer("components")].filter((f) => /GowishKnapp/.test(readFileSync(join(rot, f), "utf8")));
    assert.deepEqual(anvandare.sort(), ["components/gowish-knapp.tsx", "components/productview.tsx"]);
    // Kommentarer får nämna GoWish (Heylinks klick-id fångas i layouten, åt
    // GoWish, se lib/heylink.ts). Koden får inte bära knappen eller skriptet.
    const layout = las("app", "layout.tsx").replace(/\/\*[\s\S]*?\*\//g, "").replace(RADKOMMENTAR, "");
    assert.doesNotMatch(layout, /gowish/i);
  });
});

describe("produktsidan: rutan står i köpraden, bredvid hjärtat", () => {
  it("i köpraden efter hjärtat, före bevakningen och leveransrutan", () => {
    const rad = vy.indexOf('<div className="buy-rad">');
    const hjarta = vy.indexOf("<FavoritKnapp", rad);
    const gowish = vy.indexOf("<GowishKnapp slug={slug} />");
    const radSlut = vy.indexOf("</div>", gowish);
    const bevaka = vy.indexOf("<RestockForm productId={productId} />");
    const leverans = vy.indexOf("<DeliveryEstimate showStock />");
    assert.ok(rad > -1 && rad < hjarta && hjarta < gowish && gowish < radSlut && radSlut < bevaka && bevaka < leverans);
    // Ingen annan div öppnas mellan hjärtat och rutan: den står i köpraden.
    assert.doesNotMatch(vy.slice(hjarta, gowish), /<div/);
    assert.equal(vy.split("<GowishKnapp").length - 1, 1, "en knapp, inte en till i den fasta köpraden");
  });

  // En önskan om en slutsåld vara skickar den som ska köpa presenten till en
  // sida utan köpknapp. Är bara det valda alternativet slut finns varan kvar.
  it("bara när varan finns i lager", () => {
    assert.match(vy, /\{inStock && <GowishKnapp slug=\{slug\} \/>\}/);
  });

  it("stilen följer med produktsidan, inte med varje sida", () => {
    assert.match(sida, /import "\.\/gowish\.css";/);
    // Kommentarer i layouten får nämna GoWish (se provet ovan om layoutens kod).
    for (const f of ["app/globals.css", "app/layout.tsx"]) {
      const kod = readFileSync(join(rot, f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(RADKOMMENTAR, "");
      assert.doesNotMatch(kod, /gowish/i, f);
    }
  });
});

describe("sekretesspolicyn säger vad knappen gör", () => {
  const policy = las("app", "sekretesspolicy", "page.tsx");

  it("GoWish står bland dem vi delar uppgifter med, med båda lägena", () => {
    const punkt = (policy.match(/<li><strong>GoWish<\/strong>[\s\S]*?<\/li>/) || [""])[0];
    assert.ok(punkt.length > 200, "hittar inte punkten om GoWish");
    assert.match(punkt, /adressen till varan/);
    assert.match(punkt, /IP-adress och webbläsare/);
    assert.match(punkt, /Om du samtyckt till marknadsföringscookies hämtas/);
    assert.match(punkt, /Har du valt bara nödvändiga cookies är knappen en vanlig länk, och ingenting hämtas från GoWish förrän du klickar på den\./);
  });

  it("punkten står intill Trustpilots, som har samma regel", () => {
    assert.ok(policy.indexOf("<li><strong>Trustpilot</strong>") < policy.indexOf("<li><strong>GoWish</strong>"));
    assert.ok(policy.indexOf("<li><strong>GoWish</strong>") < policy.indexOf("<li><strong>Bolagsverket</strong>"));
  });
});

describe("stilen: rutan har sin plats från början, och inget hämtas utifrån", () => {
  // Länken och knappen delar klassen: en regel, samma mått, ingen förskjutning när de byts.
  it("länken och knappen har samma regel, utan understrykning", () => {
    assert.match(stil, /\.buy-rad \.gowish-ikon\{[^}]*text-decoration:none;cursor:pointer;/);
    assert.doesNotMatch(stil, /\.gowish-ikon (a|button)\b|\.pdp-gowish|\.gowish-btn/);
  });

  it("samma ruta som hjärtat: bredd, höjd, ram och hörn, också på en smal telefon", () => {
    const globals = las("app", "globals.css");
    // Hjärtats egen regel står först på raden (mobilens 48 px står i en mediefråga).
    const hjarta = (globals.match(/(?:^|\n)\.fav-knapp\{[^}]*\}/) || [""])[0];
    for (const del of ["width:54px", "min-height:52px", "border:1.5px solid #D8CFC5", "border-radius:var(--r-md)", "background:#fff"]) {
      assert.ok(hjarta.includes(del), `hjärtat: ${del}`);
      assert.ok((stil.match(/\.buy-rad \.gowish-ikon\{[^}]*\}/) || [""])[0].includes(del), `rutan: ${del}`);
    }
    assert.match(globals, /@media\(max-width:420px\)\{[^@]*\.buy-rad \.fav-knapp\{width:48px\}/);
    assert.match(stil, /@media\(max-width:420px\)\{\.buy-rad \.gowish-ikon\{width:48px\}\}/);
    assert.match(globals, /@media\(max-width:359px\)\{[^@]*\.buy-rad \.fav-knapp\{width:44px\}/);
    assert.match(stil, /@media\(max-width:359px\)\{\.buy-rad \.gowish-ikon\{width:44px\}\}/);
    assert.match(stil, /\.buy-rad \.gowish-ikon:focus-visible\{outline:none;box-shadow:var\(--e-ring\)\}/);
  });

  // GoWish ljusa blå (#4397FF) ger 2,95:1 mot vitt; en ikon som ensam bär
  // knappens betydelse behöver 3:1. Den mörkare tonen ur deras knapp ger 4,1:1.
  it("molnet står i GoWish mörkare blå, som klarar 3:1 mot vitt", () => {
    assert.match(stil, /\.buy-rad \.gowish-ikon\{[^}]*color:#387ED4;/);
    assert.doesNotMatch(stil, /#4397FF/i);
  });

  // GoWish egen stilmall börjar med @import av ett typsnitt från
  // fonts.cdnfonts.com och pekar ut ikoner i deras lagring.
  it("☠️ ingen @import och ingen adress till en annan värd", () => {
    assert.doesNotMatch(stil, /@import/);
    assert.doesNotMatch(stil, /url\(/);
    assert.doesNotMatch(stil, /https?:\/\/|cdnfonts|googleapis/);
    assert.doesNotMatch(stil, /font-family/);
  });

  it("rutans regler är GoWish egna, och på telefon sitter den i nederkanten", () => {
    assert.match(stil, /\.gowish-dialog\{display:flex;justify-content:center;align-items:center;background-color:rgba\(23,34,50,\.25\);border-width:0\}/);
    assert.match(stil, /\.gowish-iframe\{height:615px;border:none;margin:0 auto;overflow:hidden;border-radius:30px\}/);
    assert.match(stil, /@media screen and \(max-width:767px\)\{[\s\S]*?\.gowish-iframe\{position:fixed;bottom:0;left:50%;transform:translateX\(-50%\);margin:0;border-radius:0\}/);
  });

  // ☠️ Skriptets egen stil sätter min-height:615px och läggs in EFTER den här
  // filen. En regel med en klass förlorar mot den; därför två klasser.
  it("☠️ på en låg eller smal skärm får rutan ett tak, med två klasser i väljaren", () => {
    assert.match(stil, /@media screen and \(max-height:665px\)\{\s*\.gowish-dialog \.gowish-iframe\{min-height:0;max-height:calc\(100vh - 50px\);max-height:calc\(100dvh - 50px\)\}\s*\}/);
    assert.match(stil, /@media screen and \(max-width:400px\)\{\s*\.gowish-dialog \.gowish-iframe\{min-width:0;max-width:calc\(100vw - 16px\)\}\s*\}/);
    // 100vh först: en webbläsare utan dvh tar den raden.
    assert.ok(stil.indexOf("max-height:calc(100vh - 50px)") < stil.indexOf("max-height:calc(100dvh - 50px)"));
  });
});

// ☠️ GoWish ruta står på engelska om adressen inte börjar med /sv/ (mätt
// 2026-11-25 med svensk webbläsare: "Sign in to add the wish"). Leonard: "Allt
// med go wish … ska stå på svenska". Skriptet har inget språkval.
describe("GoWish på svenska", () => {
  const KNAPP = readFileSync(new URL("../components/gowish-knapp.tsx", import.meta.url), "utf8");
  const SKRIPTET = "https://gowish.com/quick-add?source=button&crawlerTarget=https%3A%2F%2Fwww.fyndplats.se%2Fprodukt%2Fsoffa";

  it("länken utan samtycke och reservvägen går till den svenska sidan", () => {
    assert.ok(gowishReservadress("https://www.fyndplats.se/produkt/soffa").startsWith("https://gowish.com/sv/quick-add?source=button&crawlerTarget="));
  });

  it("adressen som skriptet ger rutan blir den svenska, tecken för tecken i övrigt", () => {
    assert.equal(GOWISH_RUTA, "https://gowish.com/quick-add?");
    assert.equal(GOWISH_RUTA_SV, "https://gowish.com/sv/quick-add?");
    assert.equal(gowishSvenskRuta(SKRIPTET), SKRIPTET.replace("gowish.com/quick-add?", "gowish.com/sv/quick-add?"));
    assert.equal(gowishSvenskRuta(`${SKRIPTET}&metadataSource=x`), `${SKRIPTET}&metadataSource=x`.replace("gowish.com/quick-add?", "gowish.com/sv/quick-add?"));
    assert.equal(gowishSvenskRuta(SKRIPTET), gowishReservadress("https://www.fyndplats.se/produkt/soffa"), "rutan och länken får samma adress");
  });

  it("en adress som redan är svensk, en annan region eller något annat lämnas", () => {
    for (const annan of [
      null,
      undefined,
      "",
      "about:blank",
      gowishSvenskRuta(SKRIPTET),
      "https://onskeskyen.dk/quick-add?source=button&crawlerTarget=x",
      "https://gowish.com/da/quick-add?source=button&crawlerTarget=x",
      "https://gowish.com/sv/login?source=button",
      "https://gowish.com.example.org/quick-add?x",
      "https://example.org/?u=https://gowish.com/quick-add?x",
    ]) {
      assert.equal(gowishSvenskRuta(annan), null, String(annan));
    }
  });

  it("id:na är de som GoWish skript ger sin ram och sin ruta", () => {
    assert.equal(GOWISH_RAM_ID, "gowish-iframe");
    assert.equal(GOWISH_DIALOG_ID, "gowish-iframe-dialog");
  });

  it("bevakningen startar vid klicket, byter bara ramens adress och slutar när rutan stängts", () => {
    const t = KNAPP.replace(/\/\*[\s\S]*?\*\//g, "").replace(RADKOMMENTAR, "");
    const f = t.slice(t.indexOf("function svenskRuta()"), t.indexOf("export function GowishKnapp"));
    assert.match(f, /const bevakning = new MutationObserver\(se\);/);
    assert.match(f, /const tid = window\.setTimeout\(sluta, GOWISH_VANTA_MS\);/);
    assert.match(f, /if \(document\.getElementById\(GOWISH_DIALOG_ID\)\) settRutan = true;\s*else if \(settRutan\) return sluta\(\);/);
    assert.match(f, /const svensk = ram instanceof HTMLIFrameElement \? gowishSvenskRuta\(ram\.getAttribute\("src"\)\) : null;/);
    assert.match(f, /if \(ram instanceof HTMLIFrameElement && svensk\) ram\.src = svensk;/);
    assert.match(f, /bevakning\.observe\(document\.body, \{ childList: true, subtree: true, attributes: true, attributeFilter: \["src"\] \}\);\s*se\(\);/);
    assert.equal(t.match(/new MutationObserver\(/g)?.length, 1);
    assert.equal(t.match(/svenskRuta\(\)/g)?.length, 2, "definitionen och anropet i klicket, inget annat");
    assert.ok(GOWISH_VANTA_MS >= 15_000, "appen får upp till tio sekunder på sig på telefon innan rutan laddas");
  });
});
