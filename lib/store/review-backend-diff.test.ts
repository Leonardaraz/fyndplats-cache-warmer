// Jämförelsen som gör steg 3 till en verifierad växling i stället för en
// gissning. Det som testas är de tre riktningar där en tyst felrapport hade
// varit dyrast — inte att en Map fungerar.

import { describe, expect, it } from "vitest";
import { MIN_PRODUKTER, jamforBetyg } from "./review-backend-diff";
import type { ProduktBetyg } from "./reviews";

/** N produkter med identiskt betyg i båda lagren. */
function bada(n: number, från = 0): ProduktBetyg[] {
  return Array.from({ length: n }, (_, i) => ({
    productId: `p${från + i}`,
    antal: 3,
    snitt: 4.7,
  }));
}

describe("☠️ ett tomt aggregat är inte ett godkännande", () => {
  it("två tomma sidor är IDENTISKA men aldrig säkra", () => {
    // Utan golvet: noll avvikelser → "växla på" → butiken tappar varenda
    // stjärna. Samma spärr-form som MIN_FEED_RADER och MIN_WIX_PRODUKTER.
    const d = jamforBetyg([], []);
    expect(d.avvikandeTotalt).toBe(0);
    expect(d.saker).toBe(false);
    expect(d.varning).toMatch(/LÄSFEL/);
  });

  it("en tom Postgres-sida mot en full Wix-sida är inte säker", () => {
    const d = jamforBetyg(bada(MIN_PRODUKTER), []);
    expect(d.saker).toBe(false);
    expect(d.varning).toMatch(/postgres=0/);
  });

  it("under golvet fäller även när sidorna stämmer exakt", () => {
    const d = jamforBetyg(bada(MIN_PRODUKTER - 1), bada(MIN_PRODUKTER - 1));
    expect(d.avvikandeTotalt).toBe(0);
    expect(d.saker).toBe(false);
  });

  it("på golvet och identiska = säkert", () => {
    const d = jamforBetyg(bada(MIN_PRODUKTER), bada(MIN_PRODUKTER));
    expect(d.saker).toBe(true);
    expect(d.varning).toBe("");
    expect(d.wixOmdomen).toBe(MIN_PRODUKTER * 3);
    expect(d.postgresOmdomen).toBe(MIN_PRODUKTER * 3);
  });
});

describe("☠️ en tömd källa är EJ TILLÄMPLIG, inte underkänd", () => {
  it("wix=0 med frisk Postgres fäller inte — den svarar inte på frågan", () => {
    // Efter steg 5 är Wix-raderna borta. Utan det här läget hade rutten fällt
    // vid varenda körning därefter, för alltid. Ett falsklarm som alltid fyrar
    // är lika illa som ett fel ingen ser.
    const d = jamforBetyg([], bada(MIN_PRODUKTER));
    expect(d.kallanTomd).toBe(true);
    expect(d.saker).toBe(false);
    expect(d.varning).toMatch(/steg 5/);
    expect(d.postgresProdukter).toBe(MIN_PRODUKTER);
  });

  it("☠️ men BÅDA tomma är fortfarande ett läsfel, inte en tömd källa", () => {
    // Skillnaden är hela poängen: en tömd källa har en frisk kopia bakom sig.
    // Två tomma sidor betyder att kopian också är borta — det är katastrofen.
    const d = jamforBetyg([], []);
    expect(d.kallanTomd).toBe(false);
    expect(d.varning).toMatch(/LÄSFEL/);
  });

  it("en tunn Postgres-sida räknas inte som tömd källa", () => {
    const d = jamforBetyg([], bada(MIN_PRODUKTER - 1));
    expect(d.kallanTomd).toBe(false);
    expect(d.saker).toBe(false);
  });
});

describe("skillnader fångas åt BÅDA hållen", () => {
  it("en produkt som saknas i Postgres", () => {
    const wix = [...bada(MIN_PRODUKTER), { productId: "ensam", antal: 2, snitt: 5 }];
    const d = jamforBetyg(wix, bada(MIN_PRODUKTER));
    expect(d.saker).toBe(false);
    expect(d.avvikandeTotalt).toBe(1);
    expect(d.avvikande[0]).toMatchObject({ productId: "ensam", postgres: null });
  });

  it("en produkt som BARA finns i Postgres", () => {
    // Riktningen är inte symmetrisk i konsekvens men måste vara det i mätning:
    // en extra rad kan lika gärna vara en dubblettskrivning som en ny recension.
    const pg = [...bada(MIN_PRODUKTER), { productId: "extra", antal: 1, snitt: 3 }];
    const d = jamforBetyg(bada(MIN_PRODUKTER), pg);
    expect(d.avvikandeTotalt).toBe(1);
    expect(d.avvikande[0]).toMatchObject({ productId: "extra", wix: null });
  });

  it("☠️ olika ANTAL fäller, hur nära snittet än ligger", () => {
    const wix = [...bada(MIN_PRODUKTER), { productId: "x", antal: 8, snitt: 4.7 }];
    const pg = [...bada(MIN_PRODUKTER), { productId: "x", antal: 7, snitt: 4.7 }];
    const d = jamforBetyg(wix, pg);
    expect(d.saker).toBe(false);
    expect(d.avvikande[0].productId).toBe("x");
  });
});

describe("snittet får avrundas olika, men inte drifta", () => {
  it("0,1 isär är två korrekta avrundningar, inte ett fel", () => {
    // Postgres avrundar i SQL, Wix i JavaScript. Vid exakt 4,65 kan de landa
    // olika — en skillnad kunden aldrig ser, och som inte får stoppa steg 3.
    const wix = [...bada(MIN_PRODUKTER), { productId: "x", antal: 4, snitt: 4.6 }];
    const pg = [...bada(MIN_PRODUKTER), { productId: "x", antal: 4, snitt: 4.7 }];
    expect(jamforBetyg(wix, pg).saker).toBe(true);
  });

  it("ett helt betygssteg isär är ett fel", () => {
    const wix = [...bada(MIN_PRODUKTER), { productId: "x", antal: 4, snitt: 3.7 }];
    const pg = [...bada(MIN_PRODUKTER), { productId: "x", antal: 4, snitt: 4.7 }];
    expect(jamforBetyg(wix, pg).saker).toBe(false);
  });
});

describe("listan kapas men räkningen gör det inte", () => {
  it("avvikandeTotalt bär hela sanningen även när avvikande är kapad", () => {
    // Ett kapat svar som också kapar RÄKNINGEN hade underskattat skadan —
    // exakt felet 'ett stickprov är ingen skadeuppskattning' pekar på.
    const wix = bada(200);
    const pg = bada(200).map((r) => ({ ...r, antal: 9 }));
    const d = jamforBetyg(wix, pg);
    expect(d.avvikandeTotalt).toBe(200);
    expect(d.avvikande.length).toBe(50);
  });
});
