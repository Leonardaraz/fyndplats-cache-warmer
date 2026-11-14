// Betalningstexterna säger vem som tar betalningen (Leonard 2026-11-12, efter
// en granskning: vanliga frågor sa "Alla betalningar går via Klarna" fast kort,
// Apple Pay och Google Pay går via Stripe sedan vår egen kassa).
//
// Proven läser källan: texterna står i sidorna, inte i en delad modul.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { FORSKOTT_DAGAR } from "./medlem/varukorg.ts";

const rot = join(import.meta.dirname, "..");
const las = (...delar: string[]) => readFileSync(join(rot, ...delar), "utf8");

/** Alla .ts/.tsx under katalogen, utom prov. */
function filer(katalog: string): string[] {
  const ut: string[] = [];
  for (const namn of readdirSync(join(rot, katalog))) {
    const sokvag = join(katalog, namn);
    if (statSync(join(rot, sokvag)).isDirectory()) ut.push(...filer(sokvag));
    else if (/\.tsx?$/.test(namn) && !/\.test\.tsx?$/.test(namn)) ut.push(sokvag);
  }
  return ut;
}

describe("ingen text säger att allt går via Klarna", () => {
  // Varje uttryck har stått på en sida som kunderna ser.
  const FEL = [
    /alla betalningar går via Klarna/i,
    /Klarna för alla betalningar/i,
    /Betalning via Klarna/,
    /Betalning sker via <strong>Klarna/,
    /Klarna, som tillhandahåller/,
    /Du betalar via Klarna/,
    /återbetalning via Klarna/,
    // Retur- och ångermejlen (emails/), också efter kortköp.
    /betalmedel via Klarna/,
    // Startsidans kort räknade upp kort och plånböcker under rubriken Klarna.
    /Faktura, delbetalning, kort, Apple Pay eller Google Pay/,
    // Klarna anger betalningstiden per köp (components/klarna-message.tsx).
    /14 eller 30 dagar/,
  ];

  it("i sidor, komponenter och mejl", () => {
    const alla = [...filer("app"), ...filer("components"), ...filer("emails")];
    assert.ok(alla.length > 100, `bara ${alla.length} filer lästa`);
    for (const fil of alla) {
      const text = readFileSync(join(rot, fil), "utf8");
      for (const fel of FEL) assert.doesNotMatch(text, fel, `${relative(rot, join(rot, fil))}: ${fel}`);
    }
  });
});

describe("betalsätten och vem som tar dem", () => {
  it("vanliga frågor nämner kort, plånböckerna, Stripe och Klarna", () => {
    const faq = las("app", "vanliga-fragor", "page.tsx");
    const svar = faq.slice(faq.indexOf('q: "Vilka betalningsmetoder accepterar ni?"'));
    const a = svar.slice(0, svar.indexOf("}"));
    for (const ord of ["Visa", "Mastercard", "American Express", "Apple Pay", "Google Pay", "Stripe", "Klarna"]) assert.match(a, new RegExp(ord), ord);
  });

  it("köpvillkoren § 4 säger att Stripe tar kort och plånböcker, och Klarna sitt eget", () => {
    const villkor = las("app", "kopvillkor", "page.tsx");
    const p4 = villkor.slice(villkor.indexOf('id="betalning"'), villkor.indexOf('id="leverans"'));
    assert.match(p4, /Kort, Apple Pay och Google Pay hanteras av vår betaltjänstleverantör <strong>Stripe<\/strong>/);
    assert.match(p4, /När du betalar med Klarna sker betalningen direkt till Klarna/);
    // Korta sammanfattningen överst säger samma sak.
    assert.match(villkor, /rubrik: "Betalning",\n\s+text: "Kort, Apple Pay och Google Pay via Stripe, eller Klarna/);
  });

  it("tacksidan beskriver inte kundens betalning som Klarna", () => {
    // Tacksidan visas efter varje köp, också med kort. Startsidans löfte
    // "Trygg Klarna-betalning" står kvar: det säger vad kunden kan välja.
    assert.doesNotMatch(las("components", "thankyou.tsx"), /Klarna-betalning/);
  });

  it("retur- och ångermejlen lovar återbetalning till samma betalsätt", () => {
    for (const fil of ["return-confirmation.tsx", "withdrawal-receipt.tsx"]) {
      assert.match(las("emails", fil), /till samma betalsätt som du använde/, fil);
    }
  });

  it("startsidans löfte om betalningen leder till köpvillkoren, och ett kort räknar upp alla betalsätt", () => {
    const sida = las("app", "page.tsx");
    // Den nya startsidan (2026-11-13) har inga trygghetskort. Löftesraden säger
    // "Trygg Klarna-betalning" och länkar till köpvillkoren, där § 4 räknar upp
    // alla betalsätt (provet ovan).
    assert.match(sida, /<a className="uspitem" href="\/kopvillkor"><svg[^]*?<\/svg>Trygg Klarna-betalning<\/a>/);
    // Kommer ett kort om betalningen tillbaka ska det räkna upp alla betalsätt.
    // Kredit nämns inte (provet om CCD2 nedan).
    for (const kort of sida.matchAll(/<h3>Trygg betalning<\/h3><p>([^<]*)<\/p>/g)) {
      assert.match(kort[1], /^Kort, Apple Pay, Google Pay eller Klarna\b/);
    }
  });

  it("kassan och villkoren räknar upp samma betalsätt", () => {
    // Kassans egen rad under betalfältet (app/kassa/kassa.tsx).
    assert.match(las("app", "kassa", "kassa.tsx"), /"Kort, Apple Pay, Google Pay eller Klarna, krypterat via Stripe\."/);
  });
});

/** Alla .md under katalogen. */
function markdown(katalog: string): string[] {
  const ut: string[] = [];
  for (const namn of readdirSync(join(rot, katalog))) {
    const sokvag = join(katalog, namn);
    if (statSync(join(rot, sokvag)).isDirectory()) ut.push(...markdown(sokvag));
    else if (namn.endsWith(".md")) ut.push(sokvag);
  }
  return ut;
}

/** Källan utan kommentarer: en förklaring får nämna det förbjudna, sidan får inte. */
export function utanKommentarer(kallkod: string): string {
  return kallkod
    .replace(/\/\*[\s\S]*?\*\//g, "") // block, också {/* … */} i JSX
    .replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1"); // radkommentarer, inte https://
}

describe("Klarnas kredit nämns bara med Klarnas egna ord (CCD2 från 2026-11-20)", () => {
  // Klarnas riktlinjer för Sverige, som Stripes Klarna-sida länkar till
  // (docs.klarna.com/acquirer/klarna/resources/marketing-tools/partner-marketing-legal-guidelines/sweden/):
  // text om att betala senare, om 30 dagar eller med delbetalning är
  // kreditreklam. Den kräver Klarnas exakta ordalydelse, riskvarningen "Att
  // låna kostar pengar!" lika framträdande och direkt intill, och ett exempel
  // med effektiv ränta. "Räntefritt" får aldrig läggas till. Butikens egna
  // texter säger därför bara "Betala med Klarna" eller räknar upp Klarna bland
  // betalsätten. Klarnas egen ruta (klarna-osm.tsx) och Stripes betalfält
  // uppdateras av Klarna och Stripe och står inte i källan.
  //
  // Mejlen (emails/) läses inte: de är besked om ett köp, inte reklam.
  const KREDIT = [
    /räntefri/i,
    /\bbetala(?:r)?\s+(?:senare|sen|sedan)\b/i,
    /\bbetala\b[^.!?\n"]{0,30}\bsenare\b/i, // "betala direkt, senare eller …"
    /\bbetala(?:r)?\s+(?:om|inom)\s+\d+\s+dagar/i,
    /dagar på dig att betala/i,
    /delbetal/i,
    /\bdela upp\s+(?:betalningen|köpet|beloppet)/i,
    /\bKlarna\b[^.!?\n"]{0,60}\bfaktura|\bfaktura\b[^.!?\n"]{0,60}\bKlarna\b/i,
    /\bpay (?:later|in \d)\b/i,
  ];

  it("ingen sida, komponent, text i lib/ eller blogginlägg nämner Klarnas kredit", () => {
    const kod = [...filer("app"), ...filer("components"), ...filer("lib")];
    const md = markdown(join("content", "blog"));
    assert.ok(kod.length > 300 && md.length > 20, `bara ${kod.length} källfiler och ${md.length} inlägg lästa`);
    const traffar: string[] = [];
    for (const fil of [...kod, ...md]) {
      const text = readFileSync(join(rot, fil), "utf8");
      const synlig = fil.endsWith(".md") ? text : utanKommentarer(text);
      for (const monster of KREDIT) {
        const m = synlig.match(monster);
        if (m) traffar.push(`${fil}: ${JSON.stringify(m[0])}`);
      }
    }
    assert.deepEqual(traffar, []);
  });

  it("produktsidans rad och toppremsan säger Klarnas allmänna text", () => {
    assert.match(las("components", "klarna-message.tsx"), /<span><strong>Betala med Klarna<\/strong><\/span>/);
    assert.match(las("components", "site.tsx"), /· Betala med <b className="klarna-mark">Klarna<\/b>/);
  });

  it("vanliga frågor svarar på fakturafrågan med företagens förskottsfaktura", () => {
    // Leonard 2026-11-14: "Vi erbjuder ju faktura till företagkunder?" En
    // förskottsfaktura betalas innan varan skickas och är ingen kredit.
    const faq = las("app", "vanliga-fragor", "page.tsx");
    const svar = faq.slice(faq.indexOf('q: "Erbjuder ni faktura?"'));
    assert.ok(svar.length > 0 && faq.includes('q: "Erbjuder ni faktura?"'), "frågan saknas");
    const a = svar.slice(0, svar.indexOf("}"));
    assert.match(a, /till företag/);
    assert.match(a, /förskottsfaktura/);
    assert.match(a, new RegExp(`inom ${FORSKOTT_DAGAR} dagar`));
    assert.doesNotMatch(a, /Klarna/);
    assert.match(faq, /href: "\/konto\/foretag", text: "Företagskonto"/);
  });

  it("kommentarerna tas bort, men inte en adress", () => {
    assert.equal(utanKommentarer('a("https://klarna.com") // betala senare'), 'a("https://klarna.com") ');
    assert.equal(utanKommentarer("x /* räntefritt */ y {/* delbetalning */}"), "x  y {}");
  });
});
