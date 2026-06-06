// lib/variant-color-image.test.ts
//
// Run with: `pnpm test` (node --test --experimental-strip-types).
//
// Säkerställer att färg-val knyts till rätt produktbild via galleri-bildens
// alt-text (positions-oberoende), att svensk böjning + engelska namn matchar,
// och att bildlösa/ofärgade fall faller tillbaka på dagens beteende.

import test from "node:test";
import assert from "node:assert/strict";
import { colorKeysOf, linkVariantImagesByAltText } from "./variant-color-image.ts";

// Verkliga galleri-alt-texter för hundvagnen (Wix V1, productId 1e1a3869…).
// De per-färg-bilderna ligger SIST (index 9–11); de generiska saknar färgord.
const HUNDVAGN_MEDIA = [
  { url: "https://static.wixstatic.com/media/aa0~mv2.jpg", altText: "Pawhut hopfällbar hundvagn med svängbara hjul" },
  { url: "https://static.wixstatic.com/media/aa1~mv2.jpg", altText: "Hopfällbar hundvagn för mellanstora hundar sedd från sidan" },
  { url: "https://static.wixstatic.com/media/aa2~mv2.jpg", altText: "Hundvagn med svängbara hjul och stabil ram" },
  { url: "https://static.wixstatic.com/media/aa3~mv2.jpg", altText: "Hopfällbar hundvagn ihopfälld för förvaring och transport" },
  { url: "https://static.wixstatic.com/media/aa4~mv2.jpg", altText: "Hundvagn med rymlig sittdel för hunden" },
  { url: "https://static.wixstatic.com/media/aa5~mv2.jpg", altText: "Närbild på hundvagnens svängbara hjul" },
  { url: "https://static.wixstatic.com/media/aa6~mv2.jpg", altText: "Detaljbild av Pawhut hopfällbara hundvagn" },
  { url: "https://static.wixstatic.com/media/aa7~mv2.jpg", altText: "Pawhut hundvagn för promenader och utflykter" },
  { url: "https://static.wixstatic.com/media/aa8~mv2.jpg", altText: "Hopfällbar hundvagn att ta med på resa" },
  { url: "https://static.wixstatic.com/media/GRAY~mv2.jpg", altText: "Pawhut hopfällbar hundvagn i grått" },
  { url: "https://static.wixstatic.com/media/BLUE~mv2.jpg", altText: "Pawhut hopfällbar hundvagn i blått" },
  { url: "https://static.wixstatic.com/media/BEIGE~mv2.jpg", altText: "Pawhut hopfällbar hundvagn i beige" },
];

test("colorKeysOf folds Swedish inflections + English onto one key", () => {
  for (const w of ["grå", "grått", "gråa", "gray", "grey"]) assert.deepEqual([...colorKeysOf(w)], ["grå"]);
  for (const w of ["blå", "blått", "blue"]) assert.deepEqual([...colorKeysOf(w)], ["blå"]);
  for (const w of ["röd", "rött", "red"]) assert.deepEqual([...colorKeysOf(w)], ["röd"]);
  for (const w of ["grön", "grönt", "green"]) assert.deepEqual([...colorKeysOf(w)], ["grön"]);
  for (const w of ["gul", "gult", "yellow"]) assert.deepEqual([...colorKeysOf(w)], ["gul"]);
  for (const w of ["vit", "vitt", "white"]) assert.deepEqual([...colorKeysOf(w)], ["vit"]);
  assert.deepEqual([...colorKeysOf("beige")], ["beige"]);
});

test("colorKeysOf finds the color word inside a full alt-text sentence", () => {
  assert.ok(colorKeysOf("Pawhut hopfällbar hundvagn i grått").has("grå"));
  assert.ok(colorKeysOf("Pawhut hopfällbar hundvagn i blått").has("blå"));
  assert.ok(colorKeysOf("Pawhut hopfällbar hundvagn i beige").has("beige"));
});

test("colorKeysOf is empty for non-color text (size/material/generic)", () => {
  assert.equal(colorKeysOf("Hundvagn med svängbara hjul och stabil ram").size, 0);
  assert.equal(colorKeysOf("EU Plug").size, 0);
  assert.equal(colorKeysOf("Large").size, 0);
  assert.equal(colorKeysOf("").size, 0);
});

test("colorKeysOf matches compound shades via suffix (ljusgrå, mörkblå)", () => {
  assert.ok(colorKeysOf("ljusgrått").has("grå"));
  assert.ok(colorKeysOf("mörkblå").has("blå"));
});

test("hundvagn: each color choice gets the matching per-color image (position-independent)", () => {
  const choices = [
    { label: "Grå", image: "" },
    { label: "Blå", image: "" },
    { label: "Beige", image: "" },
  ];
  linkVariantImagesByAltText(choices, HUNDVAGN_MEDIA);
  assert.match(choices[0].image, /GRAY~mv2/);
  assert.match(choices[1].image, /BLUE~mv2/);
  assert.match(choices[2].image, /BEIGE~mv2/);
  // Alla val fick bild → productview flippar till bild-läge.
  assert.ok(choices.every((c) => c.image));
});

test("matches English raw choice values against Swedish alt-text", () => {
  const choices = [
    { label: "Gray", image: "" },
    { label: "Blue", image: "" },
  ];
  linkVariantImagesByAltText(choices, HUNDVAGN_MEDIA);
  assert.match(choices[0].image, /GRAY~mv2/);
  assert.match(choices[1].image, /BLUE~mv2/);
});

test("never reuses one image for two choices; unmatched choice stays imageless", () => {
  const media = [{ url: "https://static.wixstatic.com/media/G~mv2.jpg", altText: "… i grått" }];
  const choices = [
    { label: "Grå", image: "" },
    { label: "Blå", image: "" }, // ingen blå bild finns
  ];
  linkVariantImagesByAltText(choices, media);
  assert.match(choices[0].image, /G~mv2/);
  assert.equal(choices[1].image, ""); // → faller tillbaka på bubbla/text (allHaveImage = false)
});

test("does not overwrite a choice that already has an explicit image", () => {
  const choices = [
    { label: "Grå", image: "https://static.wixstatic.com/media/EXPLICIT~mv2.jpg" },
    { label: "Blå", image: "" },
  ];
  linkVariantImagesByAltText(choices, HUNDVAGN_MEDIA);
  assert.match(choices[0].image, /EXPLICIT~mv2/); // explicit linkedMedia/variant-images vinner
  assert.match(choices[1].image, /BLUE~mv2/);
});

test("does not assign a gallery image already claimed by an explicit choice", () => {
  // Grå har redan blå-bilden explicit knuten (samma fil-id, annan transform).
  const choices = [
    { label: "Grå", image: "https://static.wixstatic.com/media/BLUE~mv2.jpg/v1/fit/w_800/file.jpg" },
    { label: "Blå", image: "" },
  ];
  linkVariantImagesByAltText(choices, HUNDVAGN_MEDIA);
  // Blå får INTE samma fil som Grå redan har; den matchar den lediga blå-bilden
  // … men den är upptagen → ingen ledig blå → Blå förblir bildlös.
  assert.equal(choices[1].image, "");
});

test("no-op when there are no media items or no choices", () => {
  const choices = [{ label: "Grå", image: "" }];
  linkVariantImagesByAltText(choices, []);
  assert.equal(choices[0].image, "");
  linkVariantImagesByAltText([], HUNDVAGN_MEDIA); // får inte kasta
});
