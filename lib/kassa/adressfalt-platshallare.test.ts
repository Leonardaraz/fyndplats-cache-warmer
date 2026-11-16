// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Kassans adressfält är Stripes egna och ritas i en ram som tar en till två
// sekunder att ladda. Platshållaren bär fältens etiketter så länge (Leonard
// 2026-11-16: "rutorna är blanka").
//
// ☠️ PROVAT OCH BORTTAGET samma dag: att köra Stripe.js redan vid trycket på
// "Till kassan" i varukorgen. Mätt på förhandsbygget med strypt processor (4×),
// fyra varv var: fälten gick att skriva i efter 2,06 s med förstarten och 2,01 s
// utan (ingen skillnad), men kassan visades efter 0,55 s i stället för 0,21 s,
// eftersom Stripe.js då körs mitt i sidbytet. Varukorgen får därför inte
// starta Stripe.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const las = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

describe("adressfältets platshållare ser ut som fälten", () => {
  const kassa = las("app/kassa/kassa.tsx");
  const css = las("app/kassa/kassa.module.css");
  const a = kassa.indexOf("className={s.adressSkelett}");
  const block = kassa.slice(a, kassa.indexOf("</div>", a));

  it("de tre rutorna bär fältens etiketter i Stripes ordning", () => {
    assert.ok(a > -1, "platshållaren saknas");
    assert.deepEqual([...block.matchAll(/<span>([^<]+)<\/span>/g)].map((m) => m[1]), ["Förnamn", "Efternamn", "Adress"]);
  });

  it("rutorna har fältens ram och ingen grå skimmer", () => {
    const regel = css.slice(css.indexOf(".adressSkelett span {"), css.indexOf("}", css.indexOf(".adressSkelett span {")));
    assert.match(regel, /border: 1\.5px solid #d9cfc4;/);
    assert.match(regel, /color: #6b6157;/);
    assert.doesNotMatch(regel, /skimmer|linear-gradient/);
  });

  it("ett tryck på platshållaren ger fältet fokus när det är ritat", () => {
    assert.match(block.slice(0, 200) + kassa.slice(a - 200, a), /onPointerDown=\{\(\) => \{ villTillAdress\.current = true; \}\}/);
    assert.match(kassa, /if \(adressLage === "redo" && villTillAdress\.current\) \{\s*villTillAdress\.current = false;\s*adressfaltRef\.current\?\.focus\(\);/);
  });
});

describe("varukorgen startar inte Stripe", () => {
  it("components/cart.tsx laddar varken Stripe.js eller kassans Stripe-kod", () => {
    const korg = las("components/cart.tsx");
    assert.doesNotMatch(korg, /js\.stripe\.com|loadStripe|stripe-forstart|use-stripe-betalning/);
  });
});
