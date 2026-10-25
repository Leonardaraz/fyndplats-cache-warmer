#!/usr/bin/env python3
"""mkgalleri.py <ut.js> <fullt-produkt-id> [<fullt-produkt-id> ...]

Skriver ExecuteWixAPI-kod för en LÄSNING (hasMutations false) som visar hur en publicerad sida ser ut i Wix, i ett anrop och utan
webbläsare. Körs efter varje sammanslagning, före länkningen av värdens foton och före livemätningen:

  gal     en rad per galleribild: plats, de sex första tecknen i fil-id:t efter `b379ce_` (samma prefix som `bygg-lank.py` tar) och alt-texten
  opts    per option och val: de platser i galleriet som valet länkar (`Färg: Ljusgrå [1,2,3] | Beige [7,8]`)
  vyer    BARA för en sida med exakt en option: vad butiken visar per val som mängd av platser, alltså olänkade bilder plus valets egna
          (samma regel som `live-bilder.mjs` mäter; valets första länkade bild läggs först av butiken, så ordningen är inte med)
  vs      varianterna: val, SKU, synlighet, pris och vilken galleriplats variantens bild har (Wix variantbild, den som varukorgen visar)

Varför: efter en sammanslagning länkar `lib/aosom/sammanslagning.ts` värdens egna foton till värdens färg med butikens ägarregler
(`olankadeAgare`). Ett värdfoto vars alt-text nämner givarens färg, som `en grå katt` på en beige klöstunna, tolkas som givarens och
blir olänkat, och butiken visar det då bara under givarens färg (N314, `56cb4143` bild 5, 2026-10-25). Det syns i `vyer` och inte i
någon skrivkontroll, för skrivningen gick som planerad. En värds fotoplatser som saknas bland valets länkar och inte är kort eller
måttbilder är det att leta efter. Rättningen är `bygg-lank.py` och sedan `variantbild.yml` med `ids`.

Klistra in ut.js som `code` i ExecuteWixAPI. Svaret är kompakt (en post per sida) och ryms för tio sidor."""
import sys

JS = r'''async function () {
  const IDS = [
%s
  ];
  const ut = [];
  for (const pid of IDS) {
    const url = "https://www.wixapis.com/stores/v3/products/" + pid + "?fields=MEDIA_ITEMS_INFO&fields=VARIANT_OPTION_CHOICE_NAMES";
    const r = await wix.request({ method: "GET", url: url });
    const p = (r.data || r).product;
    const items = (p.media && p.media.itemsInfo && p.media.itemsInfo.items) || [];
    const ids = items.map(function (m) { return m.id || (m.image && m.image.id) || ""; });
    const gal = items.map(function (m, i) {
      return (i + 1) + " " + ids[i].slice(7, 13) + " " + String(m.altText || "").slice(0, 70);
    });
    const options = p.options || [];
    const lankade = new Set();
    options.forEach(function (o) {
      ((o.choicesSettings && o.choicesSettings.choices) || []).forEach(function (c) {
        (c.linkedMedia || []).forEach(function (x) { lankade.add(x.id); });
      });
    });
    const delade = [];
    ids.forEach(function (x, i) { if (!lankade.has(x)) delade.push(i + 1); });
    const opts = options.map(function (o) {
      const ch = (o.choicesSettings && o.choicesSettings.choices) || [];
      return o.name + ": " + ch.map(function (c) {
        return c.name + " [" + (c.linkedMedia || []).map(function (x) { return ids.indexOf(x.id) + 1; }).join(",") + "]";
      }).join(" | ");
    });
    let vyer = null;
    if (options.length === 1) {
      const ch = (options[0].choicesSettings && options[0].choicesSettings.choices) || [];
      vyer = ch.map(function (c) {
        const egna = (c.linkedMedia || []).map(function (x) { return ids.indexOf(x.id) + 1; });
        const alla = delade.concat(egna);
        const unika = alla.filter(function (v, i) { return alla.indexOf(v) === i; }).sort(function (a, b) { return a - b; });
        return c.name + ": " + unika.length + " bilder [" + unika.join(",") + "]";
      });
    }
    const vs = ((p.variantsInfo && p.variantsInfo.variants) || []).map(function (v) {
      const a = v.price && v.price.actualPrice && v.price.actualPrice.amount;
      const ch = (v.choices || []).map(function (c) { return (c.optionChoiceNames && c.optionChoiceNames.choiceName) || ""; }).join("/");
      const m = v.media && v.media.id ? ids.indexOf(v.media.id) + 1 : "?";
      return ch + " " + v.sku + " " + (v.visible ? "syns" : "DOLD") + " " + a + " bild#" + m;
    });
    ut.push({ id: pid.slice(0, 8), namn: p.name, slug: p.slug, vis: p.visible, rev: p.revision, bilder: items.length, delade: delade, gal: gal, opts: opts, vyer: vyer, vs: vs });
  }
  return ut;
}
'''


def main(a):
    if len(a) < 2:
        print(__doc__)
        return 2
    ids = a[1:]
    for i in ids:
        if len(i) != 36 or i.count('-') != 4:
            print(f'inte ett fullt produkt-id: {i}')
            return 2
    lista = ',\n'.join(f'    "{i}"' for i in ids)
    open(a[0], 'w', encoding='utf-8').write(JS % lista)
    print(f'skrev {a[0]}: {len(JS % lista)} tecken, {len(ids)} sidor')
    return 0


sys.exit(main(sys.argv[1:]))
