// ☠️ RADERNA I RECENSIONSLISTAN SKA SE LIKADANA UT.
//
// Fram till 2026-09-19 bar egna kunders omdömen ett grönt "✓ Verifierat köp"
// vid namnet medan de importerade var omärkta. Märkningen var ärligt menad,
// men effekten blev den motsatta: butikens FÖRSTA riktiga kundomdöme låg som
// en utpekad rad mitt i en lista på tjugo, och skillnaden syntes som att just
// det omdömet var av ett annat slag.
//
// Butiksägarens beslut: alla omdömen i listan gäller ett genomfört köp av
// varan, och listan ska läsas som en lista. Upplysningen bärs av fotnoten
// under den — som därför inte heller får försvinna, och som testas här.
//
// ☠️ REGELN SOM INTE ÄNDRADES: kommer märkningen någon gång tillbaka får den
// ALDRIG sättas på en importerad rad. "✓ Verifierat köp" betyder ett köp i VÅR
// butik, verifierat med token per order (lib/review-token.ts), och
// lib/review-source.ts håller kvar definitionen med sina egna prov.
//
// Källkodsprov, inte renderingsprov, av samma skäl som
// review-store-access.test.ts: det som ska fällas är att någon skriver
// tillbaka etiketten i JSX:en eller i nyttolasten, och det syns i källan.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Kommentarer beskriver historien och ska inte fälla — bara riktig kod. */
function utanKommentarer(källa: string): string {
  return källa
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/.*$/gm, "");
}

function läs(relativ: string): string {
  return utanKommentarer(readFileSync(join(process.cwd(), relativ), "utf8"));
}

test("☠️ listan märker ingen rad — egna kunders omdömen ser ut som alla andra", () => {
  const kod = läs("components/ProductReviews.tsx");

  assert.ok(
    !kod.includes("Verifierat köp"),
    'ProductReviews renderar "✓ Verifierat köp" igen. Märkningen pekade ut '
      + "butikens egna omdömen i listan — det var precis det som togs bort.",
  );
  assert.ok(
    !kod.includes("ursprungEtikett"),
    "ProductReviews läser ursprungEtikett igen — fältet finns inte längre i "
      + "nyttolasten, och en etikett vid namnet är inte längre listans form.",
  );
  assert.ok(
    !kod.includes("rev-verified"),
    "rev-verified är tillbaka i JSX:en. Klassen togs bort ur globals.css, så "
      + "märket skulle dessutom rendera oformaterat.",
  );
  assert.ok(
    !kod.includes("firstParty"),
    "ProductReviews skiljer på raderna igen via firstParty. Flaggan finns kvar "
      + "för produktsidans JSON-LD, men ingen KUNDVÄND yta får använda den.",
  );
});

test("☠️ etiketten når inte heller RSC-nyttolasten", () => {
  const kod = läs("lib/reviews.ts");

  assert.ok(
    !kod.includes("ursprungEtikett"),
    "lib/reviews.ts lägger tillbaka ursprungEtikett i ProductReview. Ett fält "
      + "som inte renderas ligger ändå läsbart i sidans källa — samma läxa som "
      + 'när "Importerat omdöme" och source togs bort ur nyttolasten.',
  );
  assert.ok(
    !kod.includes("etikett"),
    "lib/reviews.ts plockar ut en etikett ur härkomst() igen. Modulen ska bara "
      + "läsa förstahand-flaggan.",
  );
});

test("fotnoten står kvar — den bär hela upplysningen nu", () => {
  const kod = läs("components/ProductReviews.tsx");

  assert.ok(
    kod.includes("Omdömen om produkten, skrivna av verifierade köpare."),
    "Fotnoten under listan är borta. Utan radmärkningen är den den enda "
      + "upplysningen om vad omdömena är — den får inte tas bort eller skrivas om.",
  );
});

test("definitionen av ett verifierat köp lever kvar i review-source", () => {
  // Att radmärkningen är borta från sidan får inte tolkas som att etiketten
  // blivit fri att sätta på vad som helst. Modulen som äger formuleringen
  // står kvar, med sina egna prov i review-source.test.ts.
  const kod = läs("lib/review-source.ts");

  assert.ok(
    kod.includes("✓ Verifierat köp"),
    "Definitionen av vem som är en verifierad köpare är borta ur "
      + "lib/review-source.ts. Regeln gäller fortfarande: etiketten betyder ett "
      + "köp i VÅR butik och får aldrig sättas på en importerad rad.",
  );
});
