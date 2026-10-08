// lib/kassalank.test.ts
//
// Run with: `pnpm test` (node --test --experimental-strip-types).
//
// Vaktar minnet för den förberedda kassaadressen (lib/kassalank.ts): samma
// vagn byggs en gång, en annan vagn byggs om, ett fel sparas aldrig och en
// gammal adress används inte.
import { test } from "node:test";
import assert from "node:assert/strict";
import { skapaKassalankMinne, type Kassalank } from "./kassalank.ts";

const lank = (target: string): Kassalank => ({ target, vag: "redirect-session" });

test("samma vagn byggs en gång och delar svaret", async () => {
  const minne = skapaKassalankMinne();
  let byggen = 0;
  const bygg = async () => { byggen++; return lank("https://kassa/a"); };
  const a = minne.forbered("vagn-1", bygg);
  const b = minne.forbered("vagn-1", bygg);
  assert.equal(a, b);
  assert.equal((await a).target, "https://kassa/a");
  assert.equal(byggen, 1);
  assert.equal(await minne.hamta("vagn-1"), await a);
});

test("en annan vagn byggs om och den gamla glöms", async () => {
  const minne = skapaKassalankMinne();
  await minne.forbered("vagn-1", async () => lank("https://kassa/1"));
  await minne.forbered("vagn-2", async () => lank("https://kassa/2"));
  assert.equal(minne.hamta("vagn-1"), null);
  assert.equal((await minne.hamta("vagn-2"))?.target, "https://kassa/2");
});

test("ett misslyckat bygge sparas aldrig", async () => {
  const minne = skapaKassalankMinne();
  let byggen = 0;
  const felande = minne.forbered("vagn-1", async () => { byggen++; throw new Error("Wix svarade inte"); });
  await assert.rejects(felande);
  // catch-hanteraren i minnet har körts när löftet avgjorts
  await Promise.resolve();
  assert.equal(minne.hamta("vagn-1"), null, "ett fel får inte ligga kvar");
  const andra = await minne.forbered("vagn-1", async () => { byggen++; return lank("https://kassa/ok"); });
  assert.equal(andra.target, "https://kassa/ok");
  assert.equal(byggen, 2);
});

test("ett pågående bygge delas, och ett senare fel rensar bara sin egen post", async () => {
  const minne = skapaKassalankMinne();
  let slapp!: (e: Error) => void;
  const pagaende = minne.forbered("vagn-1", () => new Promise<Kassalank>((_, rej) => { slapp = rej; }));
  assert.equal(minne.hamta("vagn-1"), pagaende, "trycket ska kunna vänta på bygget som redan pågår");
  // en ny vagn hinner ersätta posten innan det gamla bygget faller
  const ny = minne.forbered("vagn-2", async () => lank("https://kassa/2"));
  slapp(new Error("för sent"));
  await assert.rejects(pagaende);
  await Promise.resolve();
  assert.equal(minne.hamta("vagn-2"), ny, "det gamla felet får inte radera den nya vagnens adress");
});

test("en gammal adress används inte", async () => {
  let klocka = 1_000;
  const minne = skapaKassalankMinne({ maxAlderMs: 60_000, nu: () => klocka });
  let byggen = 0;
  const bygg = async () => { byggen++; return lank(`https://kassa/${byggen}`); };
  await minne.forbered("vagn-1", bygg);
  klocka += 59_999;
  assert.notEqual(minne.hamta("vagn-1"), null);
  klocka += 1;
  assert.equal(minne.hamta("vagn-1"), null);
  assert.equal((await minne.forbered("vagn-1", bygg)).target, "https://kassa/2");
});

test("utan vagn finns inget att hämta", async () => {
  const minne = skapaKassalankMinne();
  await minne.forbered("vagn-1", async () => lank("https://kassa/1"));
  assert.equal(minne.hamta(""), null);
  minne.glom();
  assert.equal(minne.hamta("vagn-1"), null);
});
