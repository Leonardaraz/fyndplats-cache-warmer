// Nivåns färgnyckel (lib/medlem/niva-nyckel.ts): varje nivå har sin färg,
// både på medlemskortet och i rutan med medlemspriset.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { nivaNyckel } from "./niva-nyckel.ts";
import { REGLER_V1 } from "./niva.ts";

const las = (fil: string) => readFileSync(new URL(fil, import.meta.url), "utf8");

test("varje nivå i reglerna har en egen nyckel; en okänd nivå blir brons", () => {
  const nycklar = REGLER_V1.nivaer.map((n) => nivaNyckel(n.namn));
  assert.deepEqual(nycklar, ["brons", "silver", "guld", "platina", "diamant", "vip"]);
  assert.equal(new Set(nycklar).size, nycklar.length);
  for (const okand of ["", "Rubin", "guld", "constructor", "__proto__", "toString"]) assert.equal(nivaNyckel(okand), "brons", okand);
});

test("varje nivå utom bronsen (grundfärgen) har sina färger i rutan och på kortet", () => {
  const rutan = las("../../app/globals.css");
  const kortet = las("../../app/konto/konto.module.css");
  for (const n of REGLER_V1.nivaer) {
    const k = nivaNyckel(n.namn);
    if (k === "brons") continue;
    assert.ok(rutan.includes(`.medlemspris[data-niva="${k}"]`), `rutan saknar ${k}`);
    assert.ok(kortet.includes(`.medlemskort[data-niva="${k}"]`), `kortet saknar ${k}`);
  }
});
