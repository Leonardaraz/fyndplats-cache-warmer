#!/usr/bin/env python3
"""bygg-forsta-koll.py <ut.js>: bygger ett ExecuteWixAPI-skript som LÄSER (skriver ingenting) de sidor rundan rört och för varje variant räknar ut, ur Wix egna data och med butikens regel
(headless-site lib/variant-price.ts `v3MultiVariantData` och lib/variant-bilder.ts `synligaBilderForKombination`):

  - hur många bilder kombinationen visar,
  - vilken bild som blir kombinationens FÖRSTA bild (kandidaterna är färgvalets länkade bilder först, sedan övriga vals; den som är kopplad i flest optioner och passar varianten vinner, lika antal ger den tidigaste),
    och om den är ett original (måttbild), ett kort eller ett foto,
  - Wix egen variantbild (varukorg, kassa och order) mot färgens första länkade foto.

☠️ Ett original (en måttbild kopplad till både färg och storlek) vinner över ett foto kopplat bara till färgen. Därför ska färgens första foto vara kopplat också till storlekarna (bas-gammal-form.json
och ändra.json). Kontrollen fäller på varje kombination där första bilden är ett original eller ett kort, på varje variant vars Wix-bild inte är färgens första foto, och på varje vy under fyra bilder.

Sidorna och vilka filer som är original/kort läses ur rundans orig.tsv, bort.tsv och behall-som-reserv.tsv samt agare_<id8>.json (sidornas fulla id).
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ut = sys.argv[1]

sidor = {}
for namn in sorted(os.listdir(HERE)):
    if namn.startswith("agare_") and namn.endswith(".json"):
        d = json.load(open(os.path.join(HERE, namn), encoding="utf-8"))[0]
        sidor[d["id"]] = {"original": [], "kort": []}
id8 = {k[:8]: k for k in sidor}
for rad in open(os.path.join(HERE, "orig.tsv"), encoding="utf-8"):
    if rad.startswith("#") or not rad.strip():
        continue
    p = rad.rstrip("\n").split("\t")
    sidor[id8[p[0]]]["original"].append(p[1])
for fil in ("bort.tsv", "behall-som-reserv.tsv"):
    for rad in open(os.path.join(HERE, fil), encoding="utf-8"):
        if rad.startswith("#") or not rad.strip():
            continue
        p = rad.rstrip("\n").split("\t")
        sidor[id8[p[0]]]["kort"].append(p[1])

JS = r'''async function () {
  const SIDOR = __SIDOR__;
  const T0 = Date.now();
  const hex = function (id) { return id ? String(id).replace(/^b379ce_/, "").slice(0, 6) : "ingen"; };
  const arFarg = function (n) { return /färg|color|kulör/i.test(n); };
  const ut = [];
  for (const id of Object.keys(SIDOR)) {
    if (Date.now() - T0 > 42000) { ut.push({ id: id.slice(0, 8), fel: "ej körd, tiden räckte inte (kör om)" }); continue; }
    const info = SIDOR[id];
    const r = await wix.request({ method: "GET", url: "https://www.wixapis.com/stores/v3/products/" + id + "?fields=MEDIA_ITEMS_INFO&fields=VARIANT_OPTION_CHOICE_NAMES" });
    const p = r.data.product;
    const gal = ((p.media && p.media.itemsInfo && p.media.itemsInfo.items) || []).map(function (i) { return i.id; });
    const options = p.options || [];
    const choiceImages = {};
    const koppladTill = {};
    const optById = {};
    for (const o of options) {
      const perFil = (koppladTill[o.id] = {});
      optById[o.id] = { name: o.name, choice: {}, forst: {} };
      for (const c of (o.choicesSettings && o.choicesSettings.choices) || []) {
        const ids = (c.linkedMedia || []).map(function (m) { return m.id; });
        choiceImages[c.choiceId] = ids;
        optById[o.id].choice[c.choiceId] = c.name;
        optById[o.id].forst[c.choiceId] = ids[0] || "";
        for (const f of ids) { (perFil[f] = perFil[f] || new Set()).add(c.choiceId); }
      }
    }
    const typ = function (f) {
      const h = hex(f);
      return info.original.indexOf(h) >= 0 ? "ORIGINAL" : (info.kort.indexOf(h) >= 0 ? "KORT" : "foto");
    };
    const rader = [];
    let fel = 0;
    for (const v of (p.variantsInfo && p.variantsInfo.variants) || []) {
      if (v.visible === false) continue;
      const valPer = {};
      const namn = [];
      let colorImage = "";
      let firstImage = "";
      let colorExp = "";
      const fargK = [];
      const ovrK = [];
      for (const ch of v.choices || []) {
        const oid = ch.optionChoiceIds && ch.optionChoiceIds.optionId;
        const cid = ch.optionChoiceIds && ch.optionChoiceIds.choiceId;
        const o = optById[oid];
        if (!o) continue;
        valPer[oid] = cid;
        namn.push(o.choice[cid]);
        const far = arFarg(o.name);
        (far ? fargK : ovrK).push.apply(far ? fargK : ovrK, choiceImages[cid] || []);
        const img = o.forst[cid] || "";
        if (img) {
          if (!colorImage && far) colorImage = img;
          if (!firstImage) firstImage = img;
        }
        if (far && !colorExp) colorExp = img;
      }
      let forsta = colorImage || firstImage;
      let basta = 0;
      fargK.concat(ovrK).forEach(function (f) {
        let antal = 0;
        let passar = true;
        for (const oid of Object.keys(koppladTill)) {
          const val = koppladTill[oid][f];
          if (!val) continue;
          antal++;
          if (!val.has(valPer[oid])) { passar = false; break; }
        }
        if (passar && antal > basta) { basta = antal; forsta = f; }
      });
      const passarBild = function (f) {
        for (const oid of Object.keys(koppladTill)) {
          const val = koppladTill[oid][f];
          if (val && !val.has(valPer[oid])) return false;
        }
        return true;
      };
      const harEgna = gal.some(function (f) {
        return Object.keys(koppladTill).some(function (oid) { return !!koppladTill[oid][f]; }) && passarBild(f);
      });
      let vy = harEgna ? gal.filter(passarBild) : gal.slice();
      if (vy.length === 0) vy = gal.slice();
      const wixBild = v.media && v.media.image ? v.media.image.id : (v.media && v.media.id) || null;
      const t = typ(forsta);
      const varukorgOk = !colorExp || wixBild === colorExp;
      const problem = [];
      if (t !== "foto") problem.push("första bilden är " + t);
      if (!varukorgOk) problem.push("Wix-bilden " + hex(wixBild) + " ≠ färgens första " + hex(colorExp));
      if (vy.length < 4) problem.push("vyn har " + vy.length + " bilder");
      if (problem.length) fel++;
      rader.push(namn.join(" × ") + " | " + vy.length + " bilder | första " + hex(forsta) + " (" + t + ") | Wix " + hex(wixBild) + (varukorgOk ? " ok" : "") + (problem.length ? "  <<< " + problem.join("; ") : ""));
    }
    ut.push({ id: id.slice(0, 8), galleri: gal.length, avvikande: fel, kombinationer: rader });
  }
  return ut;
}
'''
open(ut, "w", encoding="utf-8").write(JS.replace("__SIDOR__", json.dumps(sidor, ensure_ascii=False)))
print("%d sidor, %d tecken" % (len(sidor), len(open(ut, encoding="utf-8").read())))
