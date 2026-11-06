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
