// Betalningstexterna säger vem som tar betalningen (Leonard 2026-11-12, efter
// en granskning: vanliga frågor sa "Alla betalningar går via Klarna" fast kort,
// Apple Pay och Google Pay går via Stripe sedan vår egen kassa).
//
// Proven läser källan: texterna står i sidorna, inte i en delad modul.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

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
    // Klarna anger betalningstiden per köp (components/klarna-message.tsx).
    /14 eller 30 dagar/,
  ];

  it("i sidor och komponenter", () => {
    const alla = [...filer("app"), ...filer("components")];
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

  it("kassan och villkoren räknar upp samma betalsätt", () => {
    // Kassans egen rad under betalfältet (app/kassa/kassa.tsx).
    assert.match(las("app", "kassa", "kassa.tsx"), /"Kort, Apple Pay, Google Pay eller Klarna, krypterat via Stripe\."/);
  });
});
