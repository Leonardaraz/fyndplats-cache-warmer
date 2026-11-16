// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Stripe.js förstartas vid trycket på "Till kassan" (lib/kassa/stripe-forstart.ts),
// och kassans adressfält visar sina etiketter medan Stripes ram laddas.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { forstartaStripe, STRIPE_SKRIPT } from "./stripe-forstart.ts";

const las = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

function dokument(finns = false) {
  const tillagda: { src?: string; async?: boolean }[] = [];
  return {
    tillagda,
    fragor: [] as string[],
    querySelector(this: { fragor: string[] }, v: string) { this.fragor.push(v); return finns ? ({} as Element) : null; },
    createElement: () => ({} as HTMLScriptElement),
    head: { appendChild: <T extends Node>(n: T) => { tillagda.push(n as unknown as { src?: string }); return n; } },
  };
}

describe("forstartaStripe", () => {
  it("lägger in Stripe.js en gång, asynkront, med kassans adress", () => {
    const d = dokument();
    assert.equal(forstartaStripe(d as never, {}), true);
    assert.equal(d.tillagda.length, 1);
    assert.equal(d.tillagda[0].src, STRIPE_SKRIPT);
    assert.equal(d.tillagda[0].async, true);
    assert.deepEqual(d.fragor, [`script[src="${STRIPE_SKRIPT}"]`]);
  });

  it("gör ingenting när Stripe redan finns eller skriptet redan står i sidan", () => {
    const d1 = dokument();
    assert.equal(forstartaStripe(d1 as never, { Stripe: () => {} }), false);
    assert.equal(d1.tillagda.length, 0);
    const d2 = dokument(true);
    assert.equal(forstartaStripe(d2 as never, {}), false);
    assert.equal(d2.tillagda.length, 0);
  });

  it("ett fel stoppar aldrig vägen till kassan", () => {
    const trasig = { querySelector: () => { throw new Error("nej"); }, createElement: () => ({}), head: { appendChild: () => {} } };
    assert.equal(forstartaStripe(trasig as never, {}), false);
  });

  it("adressen är densamma som kassans loadStripe och förladdningen använder", () => {
    const klient = las("lib/kassa/stripe-klient.ts");
    assert.ok(klient.includes(`export const STRIPE_JS = "${STRIPE_SKRIPT}";`), "STRIPE_JS har en annan adress");
  });

  it("modulen är ett löv: varukorgen får inte dra med sig kassans kod", () => {
    assert.doesNotMatch(las("lib/kassa/stripe-forstart.ts"), /^import /m);
  });
});

describe("varukorgen förstartar Stripe på vägen till vår egen kassa", () => {
  const korg = las("components/cart.tsx");
  it("anropet står före router.push(\"/kassa\"), i grenen för vår egen kassa", () => {
    const a = korg.indexOf("if (egen) {");
    const b = korg.indexOf('router.push("/kassa");', a);
    assert.ok(a > -1 && b > a, "grenen saknas");
    assert.match(korg.slice(a, b), /forstartaStripe\(\);/);
  });
});

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
