import { afterEach, describe, expect, it } from "vitest";
import { KUND_BRAND, kundAvsandare, kundSidfotText, wrapInKundShell } from "./kundmejl";

describe("wrapInKundShell", () => {
  it("☠️ loggan ligger på den mörka rubrikraden — den är ritad för mörk botten", () => {
    const html = wrapInKundShell("<p>x</p>", "");
    const logga = html.indexOf(KUND_BRAND.logoUrl);
    expect(logga).toBeGreaterThan(-1);
    const rad = html.lastIndexOf("<td", logga);
    expect(html.slice(rad, logga)).toContain(`background:${KUND_BRAND.char}`);
  });

  it("☠️ sidfoten är skriven för kunden: kundservice, inga driftord", () => {
    const html = wrapInKundShell("<p>x</p>", "");
    expect(html).toContain("Behöver du hjälp?");
    expect(html).toContain("mailto:info@fyndplats.com");
    expect(html).toContain("+46 73 663 09 90");
    // Numret är en länk på mobilen och bryts aldrig mitt i.
    expect(html).toContain('href="tel:+46736630990"');
    expect(html).not.toMatch(/sync-cron|okända länkar|automatiskt/i);
  });

  it("förhandstexten ligger dold överst och escapas", () => {
    const html = wrapInKundShell("<p>x</p>", "Nu <b>finns</b> den");
    const dold = html.indexOf("display:none");
    expect(dold).toBeGreaterThan(-1);
    expect(dold).toBeLessThan(html.indexOf(KUND_BRAND.logoUrl));
    expect(html).toContain("Nu &lt;b&gt;finns&lt;/b&gt; den");
  });

  it("innehållet hamnar mellan rubriken och sidfoten", () => {
    const html = wrapInKundShell('<p id="innehall">x</p>', "");
    const i = html.indexOf('id="innehall"');
    expect(i).toBeGreaterThan(html.indexOf(KUND_BRAND.logoUrl));
    expect(i).toBeLessThan(html.indexOf("Behöver du hjälp?"));
  });
});

describe("kundSidfotText", () => {
  it("samma uppgifter som HTML-sidfoten", () => {
    expect(kundSidfotText()).toBe(
      "Behöver du hjälp? Mejla info@fyndplats.com eller ring +46 73 663 09 90.\nFyndplats · www.fyndplats.se",
    );
  });
});

describe("kundAvsandare", () => {
  const forut = process.env.RESEND_KUND_FROM;
  afterEach(() => {
    if (forut === undefined) delete process.env.RESEND_KUND_FROM;
    else process.env.RESEND_KUND_FROM = forut;
  });

  it("butikens avsändare som standard, som orderbekräftelsen", () => {
    delete process.env.RESEND_KUND_FROM;
    expect(kundAvsandare()).toBe("Fyndplats <orders@fyndplats.se>");
  });

  it("går att byta i miljön", () => {
    process.env.RESEND_KUND_FROM = "Fyndplats <hej@fyndplats.se>";
    expect(kundAvsandare()).toBe("Fyndplats <hej@fyndplats.se>");
  });
});
