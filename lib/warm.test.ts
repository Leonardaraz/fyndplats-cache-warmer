// Provet är det som avgör om ett fullt pass (1 622 renderingar) körs eller inte,
// och att det är FAST är hela dess kostnadsargument. Går den egenskapen förlorad
// i en framtida omskrivning blir kvartscronen tyst mycket dyrare — det syns inte
// i något gränssnitt, bara på fakturan. Därför låses den här.
import test from "node:test";
import assert from "node:assert/strict";
import { fastProv, PROV_STORLEK } from "./warm-prov.ts";

const katalog = (n: number) => Array.from({ length: n }, (_, i) => `produkt-${i}`);

test("provet är fast — samma katalog ger samma sidor varje gång", () => {
  const k = katalog(1622);
  assert.deepEqual(fastProv(k), fastProv(k));
});

test("provet är lagom stort och utan dubbletter", () => {
  const p = fastProv(katalog(1622));
  assert.equal(p.length, PROV_STORLEK);
  assert.equal(new Set(p).size, PROV_STORLEK, "samma sida två gånger vore ett svagare prov");
});

test("provet sprids över katalogen, inte i ett hörn", () => {
  // Klumpar det ihop sig i början missar det ett läge där bara svansen är kall.
  const n = 1622;
  const index = fastProv(katalog(n)).map((s) => Number(s.split("-")[1]));
  assert.ok(index[0]! < n / 12, "första sidan ska ligga tidigt");
  assert.ok(index[index.length - 1]! > n * 0.9, "sista sidan ska ligga sent");
  for (let i = 1; i < index.length; i++) {
    assert.ok(index[i]! > index[i - 1]!, "stigande ordning");
  }
});

test("små och tomma kataloger kraschar inte", () => {
  assert.deepEqual(fastProv([]), []);
  assert.equal(fastProv(katalog(1)).length, 1);
  assert.equal(fastProv(katalog(5)).length, 5, "färre sidor än provet → ta alla");
  assert.equal(new Set(fastProv(katalog(5))).size, 5, "och utan dubbletter");
});
