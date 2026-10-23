#!/usr/bin/env python3
"""bygg-lank.py <ut.js> <spec.json> [--torr]: gör lank-om-bilder.js till ett färdigt ExecuteWixAPI-skript för de foton som ska LÄNKAS till ett val.
--torr bygger en torrkörning (ingenting skrivs): svaret har butikens vy per val före och efter på en option som inte är färg.

spec.json (2026-10-22, efter sammanslagningarna T84 och T86): [{"id": "<fullt produkt-id>", "axel": "Färg"|"Storlek",
"val": {"<valets namn>": ["<hex6>", ...]}}]. Varje hex6 är de sex första tecknen i galleriets fil-id efter "b379ce_" och ska ge exakt en träff
i produktens galleri. Skriptet läser produkten, lägger de nya fil-id:na efter valets nuvarande länkar (galleriordning) och släpper aldrig en gammal länk;
resten gör lank-om-bilder.js (galleriet rörs inte, options och variantsInfo ordagrant ur GET:en, `visible` med, återläsning av allt).
Kör ut.js via ExecuteWixAPI (högst tre sidor per körning) och sedan variantbild.yml med ids."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, 'lank-om-bilder.js'), encoding='utf-8').read()
spec = json.load(open(sys.argv[2], encoding='utf-8'))
old = '  const PLANER = [{ id: "", axel: "Färg", tomt: [], lankar: {} }];\n'
assert src.count(old) == 1
new = '''  const TILLAGG = %s;
  const likaT = function (a, b) { return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase(); };
  const PLANER = [];
  for (const T of TILLAGG) {
    const r0 = await wix.request({ method: "GET", url: "https://www.wixapis.com/stores/v3/products/" + T.id + "?fields=MEDIA_ITEMS_INFO&fields=VARIANT_OPTION_CHOICE_NAMES" });
    const p = r0.data.product;
    const gal = ((p.media && p.media.itemsInfo && p.media.itemsInfo.items) || []).map(function (i) { return i.id; });
    const ax = (p.options || []).find(function (o) { return likaT(o.name, T.axel); });
    if (!ax) return [{ ok: false, steg: "tillagg", id: T.id.slice(0, 8), fel: "ingen option " + T.axel }];
    const val = (ax.choicesSettings && ax.choicesSettings.choices) || [];
    const lankar = {};
    for (const namn of Object.keys(T.val)) {
      const c = val.find(function (x) { return likaT(x.name, namn); });
      if (!c) return [{ ok: false, steg: "tillagg", id: T.id.slice(0, 8), fel: "inget val " + namn }];
      const gamla = (c.linkedMedia || []).map(function (m) { return m.id; });
      const nya = [];
      for (const h of T.val[namn]) {
        const traff = gal.filter(function (f) { return f.slice(7, 7 + h.length) === h; });
        if (traff.length !== 1) return [{ ok: false, steg: "tillagg", id: T.id.slice(0, 8), fel: "prefix " + h + " ger " + traff.length + " träffar" }];
        if (gamla.indexOf(traff[0]) < 0) nya.push(traff[0]);
      }
      const alla = gamla.concat(nya);
      alla.sort(function (a, b) { return gal.indexOf(a) - gal.indexOf(b); });
      lankar[namn] = alla;
    }
    PLANER.push({ id: T.id, axel: T.axel, tomt: [], lankar: lankar });
  }
''' % json.dumps(spec, ensure_ascii=False)
src = src.replace(old, new)
if '--torr' in sys.argv[3:]:
    assert src.count('const TORR = false;') == 1
    src = src.replace('const TORR = false;', 'const TORR = true;', 1)
open(sys.argv[1], 'w', encoding='utf-8').write(src)
print(len(src), 'tecken' + (' (TORRKÖRNING: skriver ingenting, hasMutations false)' if '--torr' in sys.argv[3:] else ''))
