// Varukorgens "Till kassan" (components/cart.tsx): medlemskassan frågas FÖRE
// valet av vår kassa. Annars går en medlem direkt till /kassa med besökarens
// korg och betalar fullt pris (fångat i förhandsprovet 2026-11-06).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const kalla = readFileSync(new URL("../../components/cart.tsx", import.meta.url), "utf8");

test("Till kassan: medlemskassan före vår kassa och före Wix kassa", () => {
  const start = kalla.indexOf("const checkout = useCallback(");
  assert.ok(start > 0, "checkout finns");
  const kropp = kalla.slice(start, kalla.indexOf("}, [cart, tillKassan, router]);", start));
  const medlem = kropp.indexOf("await medlemskassa(");
  const egen = kropp.indexOf('router.push("/kassa")');
  const wix = kropp.indexOf("window.location.href = lank.target");
  assert.ok(medlem > 0 && egen > 0 && wix > 0, "alla tre vägarna finns");
  assert.ok(medlem < egen, "medlemskassan frågas före vår kassa");
  assert.ok(medlem < wix, "medlemskassan frågas före Wix kassa");
});

test("☠️ en kund som skickas till Wix kassa syns i serverns logg (Leonard 2026-11-25)", () => {
  // Vår kassa är på för alla: Wix kassa är reservvägen när växeln inte går att
  // läsa. Förut lämnade den vägen inget spår, så ingen kunde säga om kunder
  // hamnade i den gamla kassan.
  const start = kalla.indexOf("const checkout = useCallback(");
  const kropp = kalla.slice(start, kalla.indexOf("}, [cart, tillKassan, router, egenKassa, fragaKassan]);", start));
  assert.ok(kropp.length > 500, "checkout hittades inte");
  // Före navigeringen till Wix kassa, på båda vägarna dit.
  assert.match(kropp, /sagWixKassa\(\);\s+window\.location\.href = lank\.target;/);
  assert.match(kropp, /if \(!medlem\.startsWith\("\/"\)\) sagWixKassa\(\);\s+window\.location\.href = medlem;/);
  // Aldrig på vägen till vår egen kassa.
  const egen = kropp.slice(kropp.indexOf("if (egen) {"), kropp.indexOf('router.push("/kassa")'));
  assert.doesNotMatch(egen, /sagWixKassa/);
  // Raden skickas utan att vänta och kan aldrig stoppa kunden.
  const fn = kalla.slice(kalla.indexOf("function sagWixKassa(): void {"), kalla.indexOf("/** Ska \"Till kassan\" gå till vår egen kassa?"));
  assert.match(fn, /try \{\s+navigator\.sendBeacon\?\.\("\/api\/kassa\/lage"\);\s+\} catch \{/);
  assert.doesNotMatch(fn, /await|fetch\(/);
  // Rutten: en rad med webbläsarens sort, ingenting om kunden eller korgen.
  const rutt = readFileSync(new URL("../../app/api/kassa/lage/route.ts", import.meta.url), "utf8").replace(/^\s*\/\/.*$/gm, "");
  const post = rutt.slice(rutt.indexOf("export function POST"));
  assert.match(post, /console\.warn\(`\[kassa\] varukorgen öppnar Wix kassa \[\$\{webblasarsort\(req\.headers\.get\("user-agent"\)\)\}\]`\)/);
  assert.match(post, /status: 204/);
  assert.doesNotMatch(post, /req\.json|req\.text|cookies\(|cartId/);
});
