#!/usr/bin/env python3
"""bygg-agare.py <ut.js> <spec.json> [--torr]: gör lank-om-bilder.js till ett färdigt ExecuteWixAPI-skript där VARJE galleribild får en uttalad ägare.
--torr bygger en torrkörning (ingenting skrivs, hasMutations false): svaret har valens länkar före → efter och, på en option som inte är färg, butikens vy per val.
--kompakt tar bort radkommentarerna ur ut.js (skriptet klistras in i ExecuteWixAPI, och kommentarerna är tre kilobyte som inte behövs där).

spec.json (2026-10-23, de 16 tvåaxliga sidorna med måttbilder för fel storlek): [{"id": "<fullt produkt-id>", "agare": {"<hex6>": "<valets namn>" | ["<val>", "<val>"] | "-"}, "tomt": ["<valets namn>"], "forst": {"<valets namn>": "<hex6>"}}]
  hex6    de sex första tecknen i galleriets fil-id efter "b379ce_". Ska ge exakt en träff i produktens galleri.
  värdet  namnet på valet som äger bilden, i vilken option som helst (namnet ska vara unikt bland alla val på sidan), eller "-" för en gemensam bild utan ägare.
          En LISTA ger bilden en ägare i flera optioner, högst en per option: ["Vit", "136 cm"] är en bild av den vita hyllan på 136 cm (se nedan).
  tomt    val som får lämnas utan länkade bilder trots att de har några nu (lank-om-bilder.js vägrar annars).
  forst   valfritt: valets FÖRSTA länkade bild. Den är butikens första bild för valet och blir variantens bild (varukorg, kassa, order) vid en namn-skrivning.

En bild per kombination (2026-10-23, Leonards skärmbilder av bokhyllan 79ab08fe): butiken visade en bild under ALLA val i den andra optionen, och en bild av den
stora vita hyllan gick därför inte att visa bara under Vit × 136 cm. Butiksändringen (tools/polish-assets/tva-axlar-revision-2026-10-23/butik-kopplingar.patch,
lib/variant-bilder.ts synligaBilderForKombination på headless-site) visar en bild när den, i VARJE option som kopplar den, är kopplad till det valda valet.
☠️ Länka aldrig en bild i två optioner innan butiksändringen är ute. Den gamla butiken ger bilden EN ägare, det första val som kopplar den i optionernas ordning,
och på en sida där Storlek står före Färg (bokhyllan) hade bilden av den vita stora hyllan då visats under båda färgerna i 136 cm.
☠️ Torrkörningen svarar också med `kombinationer`: butikens vy per variant med den nya regeln (ägare ur alt-texten räknas för olänkade bilder, som butiken gör),
butikens första bild (`forsta`, lib/variant-price.ts) och Wix variantbild efter en namn-skrivning med färgen först (`varukorg`, den som varukorg, kassa och
order läser). `varukorgPassar: false` betyder att varukorgen visar en bild som inte hör till kombinationen: med färgen först blir det färgens första bild för
ALLA storlekar. Läs varje kombination innan du skriver: ingen vy under fyra bilder utan att det är ett beslut.

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


def giltig_agare(v):
    if isinstance(v, str):
        return bool(v)
    if isinstance(v, list):
        return len(v) >= 1 and all(isinstance(n, str) and n and n != "-" for n in v) and len({n.strip().lower() for n in v}) == len(v)
    return False


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
            if not giltig_agare(v):
                sys.exit("ogiltig ägare för %s: %r" % (h, v))
    gammal = '  const PLANER = [{ id: "", axel: "Färg", tomt: [], lankar: {} }];\n'
    if src.count(gammal) != 1:
        sys.exit("mallen saknar PLANER-raden")
    ny = '''  const AGARE = %s;
  const likaA = function (a, b) { return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase(); };
  const PLANER = [];
  const KOMB = [];
  // Ägare ur alt-texten för en olänkad bild, som butiken räknar dem (lib/variant-bilder.ts agareMedAltText, steg 1 och 2).
  const FORE = "(?<![\\\\p{L}\\\\p{N}])";
  const EFTER = "(?![\\\\p{L}\\\\p{N}])";
  const BAKGRUND = /(?<![\\p{L}])(?:vit|vita|vitt|grå|gråa|grått|svart|svarta|ljus|ljusa|ljusgrå|beige)\\s+(?:bakgrund|bakgrunden|studiobakgrund|yta|ytan)(?![\\p{L}])/giu;
  const escR = function (s) { return s.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&"); };
  const fargFormer = function (e) {
    const w = String(e || "").trim().toLowerCase();
    if (!/^\\p{L}{3,}$/u.test(w)) return null;
    const f = new Set([w, w + "a", w + "t", w + "tt"]);
    if (w.endsWith("d")) f.add(w.slice(0, -1) + "tt");
    if (w.endsWith("t")) f.add(w + "t");
    return Array.from(f);
  };
  const namnda = function (alt, etiketter) {
    const text = String(alt || "").replace(BAKGRUND, " ");
    return etiketter.filter(function (e) { const f = fargFormer(e); return !!f && new RegExp(FORE + "(?:" + f.map(escR).join("|") + ")" + EFTER, "iu").test(text); });
  };
  const arKort = function (alt) {
    return /^\\s*(?:fyndplats|mått|specifikation)/i.test(alt) || /(?:spec(?:ifikations)?|mått|färg|fakta|storleks)kort/i.test(alt) || /mått(?:bild|ritning|skiss|skisser|uppgifter)/i.test(alt);
  };
  const arFargOption = function (o) { return /färg|color|kulör/i.test(o.namn); };
  // Butikens vy per kombination med OCH-regeln (lib/variant-bilder.ts synligaBilderForKombination), butikens första bild
  // (lib/variant-price.ts) och Wix variantbild efter en namn-skrivning med färgen först (lib/wix/variant-media.ts, forsta_val).
  const kombinationer = function (id8, p, gal, alts, optioner, planer) {
    const hex = function (f) { return f ? f.slice(7, 13) : null; };
    const kopplad = {};
    const forstaAgare = {};
    optioner.forEach(function (o, i) {
      o.val.forEach(function (v) {
        (planer[i].lankar[v.namn] || []).forEach(function (f) {
          if (!kopplad[f]) kopplad[f] = {};
          if (!kopplad[f][i]) kopplad[f][i] = [];
          kopplad[f][i].push(v.namn);
          if (!(f in forstaAgare)) forstaAgare[f] = v.namn;
        });
      });
    });
    const fo = optioner.find(arFargOption);
    const etiketter = fo ? fo.val.map(function (v) { return v.namn; }).filter(function (n) { return fargFormer(n); }) : [];
    const altAgare = {};
    if (etiketter.length >= 2) {
      const agare = Object.assign({}, forstaAgare);
      gal.forEach(function (f) {
        if (f in agare) return;
        const t = namnda(alts[f], etiketter);
        if (t.length === 1) { agare[f] = t[0]; altAgare[f] = t[0]; }
      });
      const huvudFarg = gal.length ? agare[gal[0]] : undefined;
      if (huvudFarg && etiketter.indexOf(huvudFarg) >= 0) {
        const antal = {};
        Object.keys(agare).forEach(function (f) { antal[agare[f]] = (antal[agare[f]] || 0) + 1; });
        if (etiketter.some(function (e) { return e !== huvudFarg && antal[e] === 1; })) {
          gal.forEach(function (f) {
            if (f in agare) return;
            if (arKort(alts[f] || "") || namnda(alts[f], etiketter).length > 1) return;
            agare[f] = huvudFarg;
            altAgare[f] = huvudFarg;
          });
        }
      }
    }
    const foi = fo ? optioner.indexOf(fo) : -1;
    const grupper = function (f) {
      if (kopplad[f]) return kopplad[f];
      if (altAgare[f] && foi >= 0) { const g = {}; g[foi] = [altAgare[f]]; return g; }
      return null;
    };
    const ut = [];
    ((p.variantsInfo && p.variantsInfo.variants) || []).forEach(function (v) {
      if (v.visible === false) return;
      const valPer = {};
      const ordning = [];
      (v.choices || []).forEach(function (ch) {
        const ids = ch.optionChoiceIds || {};
        const oi = optioner.findIndex(function (o) { return o.id === ids.optionId; });
        if (oi < 0) return;
        const c = optioner[oi].val.find(function (x) { return x.id === ids.choiceId; });
        if (!c) return;
        valPer[oi] = c.namn;
        ordning.push(oi);
      });
      const passar = function (f) {
        const g = grupper(f);
        if (!g) return true;
        return Object.keys(g).every(function (oi) { return g[oi].some(function (n) { return n === valPer[oi]; }); });
      };
      const egna = gal.some(function (f) { return !!grupper(f) && passar(f); });
      let vy = egna ? gal.filter(passar) : gal.slice();
      const lista = function (oi) { return planer[oi].lankar[valPer[oi]] || []; };
      const fargOi = ordning.filter(function (oi) { return arFargOption(optioner[oi]); });
      const ovrigaOi = ordning.filter(function (oi) { return !arFargOption(optioner[oi]); });
      let forsta = null;
      for (const oi of fargOi) { if (lista(oi).length) { forsta = lista(oi)[0]; break; } }
      if (!forsta) for (const oi of ordning) { if (lista(oi).length) { forsta = lista(oi)[0]; break; } }
      let basta = 0;
      fargOi.concat(ovrigaOi).forEach(function (oi) {
        lista(oi).forEach(function (f) {
          const antal = Object.keys(kopplad[f] || {}).length;
          if (antal > basta && passar(f)) { basta = antal; forsta = f; }
        });
      });
      const i = forsta ? vy.indexOf(forsta) : -1;
      if (i > 0) vy = [forsta].concat(vy.slice(0, i), vy.slice(i + 1));
      let varukorg = null;
      fargOi.concat(optioner.map(function (o, oi) { return oi; }).filter(function (oi) { return fargOi.indexOf(oi) < 0 && ordning.indexOf(oi) >= 0; })).some(function (oi) {
        if (lista(oi).length) { varukorg = lista(oi)[0]; return true; }
        return false;
      });
      ut.push({
        kombination: ordning.map(function (oi) { return valPer[oi]; }).join(" × "),
        antal: vy.length,
        vy: vy.map(hex).join(","),
        forsta: hex(forsta),
        varukorg: hex(varukorg),
        varukorgPassar: varukorg ? passar(varukorg) && vy.indexOf(varukorg) >= 0 : null,
      });
    });
    const altMarkt = Object.keys(altAgare).map(function (f) { return hex(f) + "=" + altAgare[f]; });
    return { id: id8, kombinationer: ut, agareUrAltText: altMarkt };
  };
  for (const T of AGARE) {
    const id8 = String(T.id).slice(0, 8);
    const stopp = function (fel) { return [{ ok: false, steg: "agare", id: id8, fel: fel }]; };
    const r0 = await wix.request({ method: "GET", url: "https://www.wixapis.com/stores/v3/products/" + T.id + "?fields=MEDIA_ITEMS_INFO&fields=VARIANT_OPTION_CHOICE_NAMES" });
    const p = r0.data.product;
    const galItems = (p.media && p.media.itemsInfo && p.media.itemsInfo.items) || [];
    const gal = galItems.map(function (i) { return i.id; });
    const alts = {};
    galItems.forEach(function (i) { alts[i.id] = String(i.altText || ""); });
    const agareAv = {};
    for (const h of Object.keys(T.agare)) {
      const traff = gal.filter(function (f) { return f.slice(7, 7 + h.length) === h; });
      if (traff.length !== 1) return stopp("prefix " + h + " ger " + traff.length + " träffar i galleriet");
      const v = T.agare[h];
      agareAv[traff[0]] = v === "-" ? null : (Array.isArray(v) ? v : [v]);
    }
    const saknas = gal.filter(function (f) { return !(f in agareAv); });
    if (saknas.length > 0) return stopp(saknas.length + " bilder i galleriet har ingen ägare i planen: " + saknas.map(function (f) { return f.slice(7, 13); }).join(","));
    const optioner = (p.options || []).map(function (o) {
      return { id: o.id, namn: o.name, val: ((o.choicesSettings && o.choicesSettings.choices) || []).map(function (c) { return { id: c.choiceId, namn: c.name, gamla: (c.linkedMedia || []).map(function (m) { return m.id; }) }; }) };
    });
    const optionerFor = function (n) {
      const t = [];
      optioner.forEach(function (o, i) { o.val.forEach(function (v) { if (likaA(v.namn, n)) t.push(i); }); });
      return t;
    };
    for (const f of gal) {
      const a = agareAv[f];
      if (a === null) continue;
      const iOption = {};
      for (const n of a) {
        const t = optionerFor(n);
        if (t.length !== 1) return stopp("ägaren " + n + " för " + f.slice(7, 13) + " ger " + t.length + " val på sidan (ska vara exakt ett)");
        if (iOption[t[0]] !== undefined) return stopp("bilden " + f.slice(7, 13) + " har två ägare i optionen " + optioner[t[0]].namn + ": " + iOption[t[0]] + " och " + n);
        iOption[t[0]] = n;
      }
    }
    let forstFel = null;
    const planer = optioner.map(function (o) {
      const lankar = {};
      let andrad = false;
      o.val.forEach(function (v) {
        const agda = gal.filter(function (f) { return agareAv[f] !== null && agareAv[f].some(function (a) { return likaA(a, v.namn); }); });
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
    KOMB.push(kombinationer(id8, p, gal, alts, optioner, planer));
    planer.sort(function (a, b) { return (likaA(a.axel, "Färg") ? 1 : 0) - (likaA(b.axel, "Färg") ? 1 : 0); });
    planer.forEach(function (pl) { if (pl.andrad) PLANER.push(pl); });
  }
  if (PLANER.length === 0) return [{ ok: true, redan_ratt: true, fel: "ingen lista skiljer från planen, ingenting skrevs" }].concat(KOMB);
''' % json.dumps(spec, ensure_ascii=False)
    src = src.replace(gammal, ny)
    slut = "  return ut;\n}"
    if src.count(slut) != 1:
        sys.exit("mallen saknar slutraden `return ut;`")
    src = src.replace(slut, "  return ut.concat(KOMB);\n}")
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
