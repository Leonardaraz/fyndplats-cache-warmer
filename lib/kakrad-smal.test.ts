// Cookierutan på de smalaste telefonerna (granskningen 2026-11-10).
//
// Knapparna "Endast nödvändiga" och "Acceptera alla" fick `white-space:nowrap`
// under 540 px, så att texten står på en rad och rutan blir lägre (213 → 185 px
// vid 390 px). Men under 330 px ryms de två knapparna inte bredvid varandra med
// texten på en rad. Knappraden får brytas (`flex-wrap:wrap` i grundregeln), så
// knapparna föll i två rader och rutan blev 261 px hög vid 320 px, högre än
// före ändringen (235 px). Rutan täcker då en tredjedel av skärmen på just de
// minsta telefonerna.
//
// Rättelsen är en regel för 340 px och smalare: raden bryts aldrig, knapparna
// får krympa under sin text och texten får brytas inne i knappen. Mätt i en
// webbläsare efter rättelsen: 207 px vid 310–330 px och 227 px vid 280–300 px.
//
// Provet läser app/globals.css och fäller om någon av de tre delarna tas bort.
// Tas `flex-wrap:nowrap` bort faller knapparna i två rader igen. Tas
// `min-width:0` eller `white-space:normal` bort sticker knapparna ut ur rutan
// vid 300 px i stället.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

/** Innehållet i det första mediablocket med exakt det här villkoret som nämner väljaren. */
function mediablock(villkor: string, valjare: string): string {
  let i = -1;
  for (;;) {
    i = css.indexOf(`@media(${villkor}){`, i + 1);
    assert.ok(i >= 0, `inget block @media(${villkor}) med ${valjare} i globals.css`);
    const slut = css.indexOf("}}", i);
    const block = css.slice(i, slut + 2);
    if (block.includes(valjare)) return block;
  }
}

test("under 540 px står knapptexten på en rad, och knapparna är minst 44 px höga", () => {
  const block = mediablock("max-width:540px", ".ck-ghost,.ck-primary");
  assert.match(block, /\.ck-ghost,\.ck-primary\{[^}]*white-space:nowrap/);
  assert.match(block, /\.ck-ghost,\.ck-primary\{[^}]*min-height:44px/);
});

test("under 340 px bryts knappraden aldrig i två rader", () => {
  const block = mediablock("max-width:340px", ".cookiebtns");
  assert.match(block, /\.cookiebtns\{[^}]*flex-wrap:nowrap/);
});

test("under 340 px får knapparna krympa och texten brytas, så att de inte sticker ut ur rutan", () => {
  const block = mediablock("max-width:340px", ".ck-ghost,.ck-primary");
  assert.match(block, /\.ck-ghost,\.ck-primary\{[^}]*min-width:0/);
  assert.match(block, /\.ck-ghost,\.ck-primary\{[^}]*white-space:normal/);
});

test("regeln för 340 px står efter regeln för 540 px, annars vinner nowrap", () => {
  const smal = css.indexOf("@media(max-width:340px){.cookiebtns{");
  const bred = css.indexOf("@media(max-width:540px){.cookiebar{");
  assert.ok(smal >= 0 && bred >= 0, "båda reglerna ska finnas");
  assert.ok(smal > bred, "340-regeln ska stå efter 540-regeln");
});
