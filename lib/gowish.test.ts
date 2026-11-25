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

  it("knappens id är ett av de fem skriptet lyssnar på", () => {
    const LYSSNAR = ["ov-onskeskyen-generated-wish-button", "gowishRoundedButton", "gowishBlueButton", "gowishWhiteButton", "gowishDynamicButton"];
    assert.ok(LYSSNAR.includes(GOWISH_KNAPP_ID));
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
      "https://gowish.com/quick-add?source=button&crawlerTarget=https%3A%2F%2Fwww.fyndplats.se%2Fprodukt%2Fsoffa",
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
    assert.match(utan, /<a className="gowish-btn" href=\{reserv\} target="_blank" rel="noopener noreferrer">/);
    assert.match(knapp, /const reserv = gowishReservadress\(adress\);/);
    // Varken skriptet eller GoWish id finns i den grenen: skriptet står efter den.
    assert.doesNotMatch(utan, /<Script|GOWISH_KNAPP_ID|<button|data-producturl/);
    assert.equal(knapp.split("<Script").length - 1, 1);
    assert.ok(knapp.indexOf("<Script") > knapp.indexOf("const tryck"));
  });

  it("länken säger att den öppnar en ny flik, också för den som inte ser den", () => {
    assert.match(utan, /\{GOWISH_KNAPP_TEXT\}\s*<span className="sr-only"> \(öppnas i en ny flik\)<\/span>/);
  });

  it("med samtycke: en riktig knapp med GoWish id och klass, och varans adress i data-producturl", () => {
    assert.match(med, /<button id=\{GOWISH_KNAPP_ID\} className="gowish-btn" type="button" data-producturl=\{adress\} onClick=\{tryck\}>/);
    assert.match(knapp, /const adress = gowishProduktadress\(slug\);/);
    assert.match(med, /\{GOWISH_KNAPP_TEXT\}/);
  });

  // Molnet är dekoration: knappens namn är texten.
  it("ikonen är dold för skärmläsare, i båda lägena", () => {
    assert.match(knapp, /<svg viewBox="0 0 26 16" width="26" height="16" aria-hidden="true" focusable="false">/);
    assert.match(utan, /<Moln \/>/);
    assert.match(med, /<Moln \/>/);
  });

  // ☠️ Skriptet lyssnar själv på klicket. Ett eget anrop till createIframe när
  // skriptet finns öppnar rutan, och skriptets lyssnare stänger den igen.
  it("☠️ klicket gör ingenting eget när skriptet finns, och öppnar länkens sida när det saknas", () => {
    assert.match(med, /const tryck = \(\) => \{\n\s+if \(window\.GoWish\) return;\n\s+window\.open\(reserv, "_blank", "noopener,noreferrer"\);\n\s+\};/);
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
    assert.doesNotMatch(las("app", "layout.tsx"), /gowish/i);
  });
});

describe("produktsidan: knappen står under köpraden", () => {
  it("direkt efter köpraden, före bevakningen och leveransrutan", () => {
    const rad = vy.indexOf('<div className="buy-rad">');
    const gowish = vy.indexOf("<GowishKnapp slug={slug} />");
    const bevaka = vy.indexOf("<RestockForm productId={productId} />");
    const leverans = vy.indexOf("<DeliveryEstimate showStock />");
    assert.ok(rad > -1 && rad < gowish && gowish < bevaka && bevaka < leverans);
    assert.equal(vy.split("<GowishKnapp").length - 1, 1, "en knapp, inte en till i den fasta köpraden");
  });

  // En önskan om en slutsåld vara skickar den som ska köpa presenten till en
  // sida utan köpknapp. Är bara det valda alternativet slut finns varan kvar.
  it("bara när varan finns i lager", () => {
    assert.match(vy, /\{inStock && <GowishKnapp slug=\{slug\} \/>\}/);
  });

  it("stilen följer med produktsidan, inte med varje sida", () => {
    assert.match(sida, /import "\.\/gowish\.css";/);
    for (const f of ["app/globals.css", "app/layout.tsx"]) assert.doesNotMatch(readFileSync(join(rot, f), "utf8"), /gowish/i, f);
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

describe("stilen: knappen har sin plats från början, och inget hämtas utifrån", () => {
  // Länken och knappen delar klassen: en regel, samma mått, ingen förskjutning när de byts.
  it("länken och knappen har samma regel, utan understrykning", () => {
    assert.match(stil, /\.pdp-gowish \.gowish-btn\{[^}]*text-decoration:none;cursor:pointer;/);
    assert.doesNotMatch(stil, /\.pdp-gowish (a|button)\b/);
  });

  it("knappen har en fast höjd och butikens ram, hörn och typsnitt", () => {
    assert.match(stil, /\.pdp-gowish \.gowish-btn\{[^}]*min-height:46px;[^}]*border:1\.5px solid #D8CFC5;border-radius:var\(--r-md\);background:#fff;color:var\(--ink\);\s*font:inherit;/);
    assert.match(stil, /\.pdp-gowish \.gowish-btn\{[^}]*width:100%;max-width:404px;/);
    assert.match(stil, /@media\(max-width:760px\)\{\s*\.pdp-gowish \.gowish-btn\{max-width:none;min-height:48px\}\s*\}/);
    assert.match(stil, /\.pdp-gowish \.gowish-btn:focus-visible\{outline:none;box-shadow:var\(--e-ring\)\}/);
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
