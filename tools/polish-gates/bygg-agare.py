#!/usr/bin/env python3
"""bygg-agare.py <ut.js> <spec.json> [--torr]: gör lank-om-bilder.js till ett färdigt ExecuteWixAPI-skript där VARJE galleribild får en uttalad ägare.
--torr bygger en torrkörning (ingenting skrivs, hasMutations false): svaret har valens länkar före → efter och, på en option som inte är färg, butikens vy per val.
--kompakt tar bort radkommentarerna ur ut.js (skriptet klistras in i ExecuteWixAPI, och kommentarerna är tre kilobyte som inte behövs där).

spec.json (2026-10-23, de 16 tvåaxliga sidorna med måttbilder för fel storlek): [{"id": "<fullt produkt-id>", "agare": {"<hex6>": "<valets namn>" | "-"}, "tomt": ["<valets namn>"], "forst": {"<valets namn>": "<hex6>"}}]
  hex6    de sex första tecknen i galleriets fil-id efter "b379ce_". Ska ge exakt en träff i produktens galleri.
  värdet  namnet på valet som äger bilden, i vilken option som helst (namnet ska vara unikt bland alla val på sidan), eller "-" för en gemensam bild utan ägare.
  tomt    val som får lämnas utan länkade bilder trots att de har några nu (lank-om-bilder.js vägrar annars).
  forst   valfritt: valets FÖRSTA länkade bild. Den är butikens första bild för valet och blir variantens bild (varukorg, kassa, order) vid en namn-skrivning.

☠️ Listornas ordning bevaras (2026-10-23): en bild valet fortfarande äger står kvar på sin plats, nya bilder läggs sist i galleriets ordning. Första versionen byggde varje
lista i galleriets ordning och bytte därmed första bild på fem färger (julgranens Vit, väggspegelns Guld, sensorsoptunnans Silver, vedbodens Grön, bokhyllans Vit: från ett
packshot på vit botten till ett miljöfoto). En option vars listor redan stämmer skrivs inte alls, och stämmer allt svarar skriptet `redan_ratt` utan att skriva.
☠️ En id-skrivning av optionerna som ändrar en lista NOLLSTÄLLER variantens bild (varukorg, kassa, order) till huvudbilden: mätt på en dold testprodukt 2026-10-23, där en
omordnad lista och en nylänkad option båda gav huvudbilden efter en namn-skrivning som satt färgens första foto. Kör `variantbild-farg.js` efter varje skrivning med det här verktyget.

Varför: butikens vy för en kombination är de olänkade bilderna plus bilderna som ägs av det valda färg- och storleksvalet, och en bild har EN ägare, det
första valet som länkar den (CLAUDE.md, "Tvåaxliga sidor"). En måttbild vars tal gäller en storlek ska därför ägas av storleken, ett färgfoto av färgen, och
en bild som gäller alla val ska vara olänkad. Att tala om ägaren för varje bild i stället för att lägga till länkar gör två saker som bygg-lank.py inte gör:
en länk som ligger kvar på fel val tas bort, och en bild som planen glömt stoppar körningen i stället för att ligga kvar som den var.

☠️ Planen ska omfatta HELA galleriet. Saknas en bild i `agare` svarar skriptet `ok: false, steg: "agare"` och skriver ingenting.
☠️ Alla val i alla optioner får sin lista skriven, så ingen gammal länk blir kvar på ett val som planen inte nämner. Valen utan bilder i planen töms, och
lank-om-bilder.js kräver `tomt` för ett val som hade bilder. Optioner som inte är färg skrivs först, färgen sist: en bild som flyttas från färg till storlek
är då ägd av båda en kort stund (butiken ser färgen) i stället för av ingen (butiken visar den under varje val).
Efteråt: kolla-agare.py mot butikens egen sida, och variantbild.yml eller farg-forst.js om variantens bild (varukorgen) kan ha blivit fel.
Kör ut.js via ExecuteWixAPI (en sida per körning: skriptet skriver två optioner och läser tillbaka båda, 60 s-taket)."""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    ut, specfil = sys.argv[1], sys.argv[2]
    torr = "--torr" in sys.argv[3:]
    kompakt = "--kompakt" in sys.argv[3:]
    src = open(os.path.join(HERE, "lank-om-bilder.js"), encoding="utf-8").read()
    spec = json.load(open(specfil, encoding="utf-8"))
    for s in spec:
        for h, v in s["agare"].items():
            if len(h) != 6 or any(c not in "0123456789abcdef" for c in h):
                sys.exit("ogiltig hex6 i planen: %r" % h)
            if not isinstance(v, str) or not v:
                sys.exit("ogiltig ägare för %s: %r" % (h, v))
    gammal = '  const PLANER = [{ id: "", axel: "Färg", tomt: [], lankar: {} }];\n'
    if src.count(gammal) != 1:
        sys.exit("mallen saknar PLANER-raden")
    ny = '''  const AGARE = %s;
  const likaA = function (a, b) { return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase(); };
  const PLANER = [];
  for (const T of AGARE) {
    const id8 = String(T.id).slice(0, 8);
    const stopp = function (fel) { return [{ ok: false, steg: "agare", id: id8, fel: fel }]; };
    const r0 = await wix.request({ method: "GET", url: "https://www.wixapis.com/stores/v3/products/" + T.id + "?fields=MEDIA_ITEMS_INFO&fields=VARIANT_OPTION_CHOICE_NAMES" });
    const p = r0.data.product;
    const gal = ((p.media && p.media.itemsInfo && p.media.itemsInfo.items) || []).map(function (i) { return i.id; });
    const agareAv = {};
    for (const h of Object.keys(T.agare)) {
      const traff = gal.filter(function (f) { return f.slice(7, 7 + h.length) === h; });
      if (traff.length !== 1) return stopp("prefix " + h + " ger " + traff.length + " träffar i galleriet");
      agareAv[traff[0]] = T.agare[h] === "-" ? null : T.agare[h];
    }
    const saknas = gal.filter(function (f) { return !(f in agareAv); });
    if (saknas.length > 0) return stopp(saknas.length + " bilder i galleriet har ingen ägare i planen: " + saknas.map(function (f) { return f.slice(7, 13); }).join(","));
    const optioner = (p.options || []).map(function (o) {
      return { namn: o.name, val: ((o.choicesSettings && o.choicesSettings.choices) || []).map(function (c) { return { namn: c.name, gamla: (c.linkedMedia || []).map(function (m) { return m.id; }) }; }) };
    });
    const allaVal = [];
    optioner.forEach(function (o) { o.val.forEach(function (v) { allaVal.push(v.namn); }); });
    for (const f of gal) {
      const a = agareAv[f];
      if (a === null) continue;
      const traffar = allaVal.filter(function (n) { return likaA(n, a); });
      if (traffar.length !== 1) return stopp("ägaren " + a + " för " + f.slice(7, 13) + " ger " + traffar.length + " val på sidan (ska vara exakt ett)");
    }
    let forstFel = null;
    const planer = optioner.map(function (o) {
      const lankar = {};
      let andrad = false;
      o.val.forEach(function (v) {
        const agda = gal.filter(function (f) { return agareAv[f] !== null && likaA(agareAv[f], v.namn); });
        const kvar = v.gamla.filter(function (f) { return agda.indexOf(f) >= 0; });
        let lista = kvar.concat(agda.filter(function (f) { return kvar.indexOf(f) < 0; }));
        const fk = Object.keys(T.forst || {}).find(function (k) { return likaA(k, v.namn); });
        if (fk) {
          const h = T.forst[fk];
          const traff = lista.filter(function (f) { return f.slice(7, 7 + h.length) === h; });
          if (traff.length !== 1) forstFel = "forst " + h + " för " + v.namn + " ger " + traff.length + " träffar bland valets bilder";
          else lista = traff.concat(lista.filter(function (f) { return f !== traff[0]; }));
        }
        lankar[v.namn] = lista;
        if (lista.join(",") !== v.gamla.join(",")) andrad = true;
      });
      return { id: T.id, axel: o.namn, tomt: T.tomt || [], lankar: lankar, andrad: andrad };
    });
    if (forstFel) return stopp(forstFel);
    planer.sort(function (a, b) { return (likaA(a.axel, "Färg") ? 1 : 0) - (likaA(b.axel, "Färg") ? 1 : 0); });
    planer.forEach(function (pl) { if (pl.andrad) PLANER.push(pl); });
  }
  if (PLANER.length === 0) return [{ ok: true, redan_ratt: true, fel: "ingen lista skiljer från planen, ingenting skrevs" }];
''' % json.dumps(spec, ensure_ascii=False)
    src = src.replace(gammal, ny)
    if torr:
        if src.count("const TORR = false;") != 1:
            sys.exit("mallen saknar const TORR = false;")
        src = src.replace("const TORR = false;", "const TORR = true;", 1)
    if kompakt:
        src = "".join(rad for rad in src.splitlines(True) if not rad.lstrip().startswith("//"))
    open(ut, "w", encoding="utf-8").write(src)
    print(len(src), "tecken" + (" (TORRKÖRNING: skriver ingenting, hasMutations false)" if torr else ""))


if __name__ == "__main__":
    main()
