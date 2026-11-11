// Auditens och tillgänglighetskollens rättelser 2026-11-11. Reglerna är små och
// står i markup och stil, så proven läser källan: en senare ändring som tar
// tillbaka felet ska fällas här och inte upptäckas i nästa granskning.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const las = (...delar: string[]) => readFileSync(join(import.meta.dirname, "..", ...delar), "utf8");
const css = las("app", "globals.css");
/** Sista regeln för en selektor: den som gäller när två har samma tyngd. */
const sista = (selektor: string) => {
  const i = css.lastIndexOf(`\n${selektor}{`);
  assert.ok(i >= 0, `${selektor} saknas`);
  return css.slice(i + 1, css.indexOf("}", i) + 1);
};

describe("uppläst namn innehåller texten som syns (WCAG 2.5.3)", () => {
  const sidfot = las("components", "site.tsx");
  const start = las("app", "page.tsx");

  it("sidfotens Google-betyg har inget aria-label, namnet kommer ur innehållet", () => {
    const rad = sidfot.slice(sidfot.indexOf('<a className="grat"'), sidfot.indexOf("</a>", sidfot.indexOf('<a className="grat"')));
    assert.match(rad, /^<a className="grat" href="\/omdomen">/);
    assert.doesNotMatch(rad, /aria-label/);
    assert.match(rad, /<span className="sr-only">Betyg <\/span><b className="g-score">\{proof\.rating\}<\/b><span className="sr-only"> av 5\. <\/span>/);
    assert.match(rad, /<span className="g-sub">Omdömen på Google<\/span>/);
  });

  it("startsidans kategorirutor har inget aria-label och en tyst mosaik", () => {
    const rad = start.slice(start.indexOf('<PrefetchLink className="homecat"'), start.indexOf("</PrefetchLink>", start.indexOf('<PrefetchLink className="homecat"')));
    assert.doesNotMatch(rad.split("\n")[0], /aria-label/);
    assert.match(rad, /<div className="homecat-mosaic" aria-hidden="true">/);
    assert.match(rad, /alt=""/);
    assert.match(rad, /<span className="homecat-count">\{c\.count\} st<span className="sr-only"> i kategorin<\/span><\/span>/);
  });

  it("toppremsan ligger i ett landmärke", () => {
    assert.match(sidfot, /<aside className="promo" aria-label="Frakt och betalning">/);
    assert.doesNotMatch(sidfot, /<div className="promo">/);
  });
});

describe("kontrast och knappstorlek", () => {
  it("kategorisidans guidelänkar står i --brand, inte i --orange", () => {
    assert.equal(sista(".prog-bloglinks a"), ".prog-bloglinks a{color:var(--brand)}");
  });

  it("bläddringsradens etiketter har ingen genomskinlighet", () => {
    assert.equal(sista(".pbrowse-etikett"), ".pbrowse-etikett{opacity:1}");
  });

  it("varukorgens plus, minus och Ta bort är 44 px", () => {
    assert.match(sista(".qbtn"), /^\.qbtn\{width:44px;height:44px;/);
    assert.match(sista(".li-x"), /min-height:44px/);
  });
});
