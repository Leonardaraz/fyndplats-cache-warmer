#!/usr/bin/env python3
"""mkkompakt2.py <ut.js> <rundkatalog>[,<rundkatalog>...] [--prefix] [--givarbilder <givarrunda>:<givare-id8>:<värd-id8>]... [givare-id8=fullt-id ...]

Skriver ExecuteWixAPI-kod för en LÄSNING som jämför varje sida i rundornas skrivplaner mot Wix: namn, adress, texthash och längd, SEO-titel och -beskrivning,
bildernas ordning och alt-texter, kategorier och SKU. Svaret bär bara avvikelser och en kort sammanfattning, så att en körning över många sidor ryms i ett svar.
Sidor med options får också sina val (antal länkade bilder per val) och varianternas val, SKU, synlighet, pris och variantens bild (plats i galleriet).
Allt som jämförs kommer ur skrivplanen: koden skriver ingenting. Klistra in ut.js som `code` i ExecuteWixAPI (hasMutations false).

  --prefix       sidan är en sammanslagen värd: bara värdens första bilder (planens antal) och deras alt-texter jämförs, för givarens bilder ligger efter dem.
  --givarbilder  <givarrunda>:<givare-id8>:<värd-id8>  jämför också bilderna efter värdens egna: givarrundans `bildplan.json` (fil-id och alt-text i galleriets
                 ordning) mot det som ligger i värdens galleri efter värdens bilder. Kan anges en gång per givare. ☠️ Alt-texterna paras med filen och inte med platsen:
                 en extra bild (position 10) läggs sist i givarens galleri fast den står i mitten av `tas_med`, så platsen går inte att gissa (T95, 2026-10-24).
  givare-id8=fullt-id   kontrollerar att givaren är dold.

Rundkatalogerna ligger under tools/polish-assets/. Om två rundor har samma produkt gäller den sist angivna (T95b ersatte T95:s växthus, som fick ett nytt namn).
Skriven i en session 2026-10-24 (T95) och flyttad hit från dess scratchpad; läs README:ns avsnitt Läs först om sökvägar."""
import json, os, sys

ROT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'polish-assets')
PREFIX = '--prefix' in sys.argv
GIVBILDER = []
argv = []
_i = 1
while _i < len(sys.argv):
    a = sys.argv[_i]
    if a == '--prefix':
        pass
    elif a == '--givarbilder':
        _i += 1
        GIVBILDER.append(sys.argv[_i].split(':'))
        assert len(GIVBILDER[-1]) == 3, '--givarbilder tar <givarrunda>:<givare-id8>:<värd-id8>'
    else:
        argv.append(a)
    _i += 1
argv = [sys.argv[0]] + argv
if len(argv) < 3:
    print(__doc__)
    sys.exit(2)
ut = argv[1]
rundor = argv[2].split(',')
giv = dict(a.split('=', 1) for a in argv[3:])

def fnv(s):
    h = 0xcbf29ce484222325
    for b in s.encode('utf-8'):
        h ^= b
        h = (h * 0x100000001b3) & 0xFFFFFFFFFFFFFFFF
    return f'{h:016x}'


EXP = {}
for r in rundor:
    d = json.load(open(f'{ROT}/{r}/skrivplan.json', encoding='utf-8'))
    for p in d['produkter']:
        ids = [m['id'] for m in p['media']]
        alts = [m['altText'] for m in p['media']]
        EXP[p['kort']] = dict(
            pid=p['pid'], namn=p['namn'], slug=p['slug'], h=p['textHash'], n=p['textTecken'],
            st=fnv(p['seoTitel']), sb=fnv(p['seoBesk']), kat=p['kat'], sku=p.get('sku') or '',
            nb=len(ids), ih=fnv(json.dumps(ids, ensure_ascii=False, separators=(',', ':'))), ah=fnv(json.dumps(alts, ensure_ascii=False, separators=(',', ':'))),
        )

DON = {}
for grunda, giv8, vard8 in GIVBILDER:
    plan = json.load(open(f'{ROT}/{grunda}/bildplan.json', encoding='utf-8'))
    traff = [p for p in plan['produkter'] if p['kort'] == giv8]
    assert len(traff) == 1, f'{giv8} finns inte exakt en gång i {grunda}/bildplan.json'
    DON[vard8] = dict(ids=[m['id'] for m in traff[0]['media']], alts=[m['altText'] for m in traff[0]['media']])

js = '''async function () {
  const EXP = %s;
  const GIV = %s;
  const DON = %s;
  function fnv(s) {
    const b = new TextEncoder().encode(s);
    let h = 0xcbf29ce484222325n;
    const M = 0xFFFFFFFFFFFFFFFFn;
    for (const c of b) {
      h ^= BigInt(c);
      h = (h * 0x100000001b3n) & M;
    }
    return h.toString(16).padStart(16, "0");
  }
  const bid = function (m) {
    if (!m) return "";
    const id = m.id || (m.image && m.image.id) || "";
    if (id) return id;
    const u = m.url || (m.image && m.image.url) || "";
    return u ? u.split("?")[0].split("/").pop() : "";
  };
  const PREFIX = %s;
  const kmap = {};
  const kbody = { query: { cursorPaging: { limit: 200 } }, treeReference: { appNamespace: "@wix/stores" } };
  let kres = await wix.request({ method: "POST", url: "https://www.wixapis.com/categories/v1/categories/query", body: kbody });
  let kd = kres.data || kres;
  (kd.categories || []).forEach(function (c) { kmap[c.id] = c.name; });
  let sidor = 1;
  while (kd.pagingMetadata && kd.pagingMetadata.hasNext && kd.pagingMetadata.cursors && kd.pagingMetadata.cursors.next && sidor < 10) {
    const nb = { query: { cursorPaging: { limit: 200, cursor: kd.pagingMetadata.cursors.next } }, treeReference: { appNamespace: "@wix/stores" } };
    kres = await wix.request({ method: "POST", url: "https://www.wixapis.com/categories/v1/categories/query", body: nb });
    kd = kres.data || kres;
    (kd.categories || []).forEach(function (c) { kmap[c.id] = c.name; });
    sidor += 1;
  }
  const rader = [];
  const avvik = [];
  for (const kort of Object.keys(EXP)) {
    const e = EXP[kort];
    const url = "https://www.wixapis.com/stores/v3/products/" + e.pid + "?fields=PLAIN_DESCRIPTION&fields=MEDIA_ITEMS_INFO&fields=DIRECT_CATEGORIES_INFO&fields=VARIANT_OPTION_CHOICE_NAMES";
    const r = await wix.request({ method: "GET", url: url });
    const p = (r.data || r).product;
    if (typeof p.plainDescription !== "string") {
      return { AVBRUTET: "plainDescription saknas i projektionen", kort: kort };
    }
    const t = p.plainDescription;
    const items = (p.media && p.media.itemsInfo && p.media.itemsInfo.items) || [];
    const vs = (p.variantsInfo && p.variantsInfo.variants) || [];
    const catNamn = (((p.directCategoriesInfo && p.directCategoriesInfo.categories) || []).map(function (c) { return kmap[c.id] || ("OKAND:" + c.id); }));
    const tags = (p.seoData && p.seoData.tags) || [];
    const ti = tags.filter(function (x) { return x.type === "title"; })[0];
    const me = tags.filter(function (x) { return x.type === "meta" && x.props && x.props.name === "description"; })[0];
    const ids = items.map(bid);
    const alts = items.map(function (m) { return m.altText || ""; });
    const f = [];
    if (p.name !== e.namn) f.push("namn: " + p.name);
    if (p.slug !== e.slug) f.push("slug: " + p.slug);
    if (fnv(t) !== e.h || t.length !== e.n) f.push("text " + t.length + "/" + e.n + " " + fnv(t) + "/" + e.h);
    if (fnv((ti ? ti.children : "") || "") !== e.st) f.push("seoTitel: " + (ti ? ti.children : null));
    if (fnv((me && me.props ? me.props.content : "") || "") !== e.sb) f.push("seoBesk avviker");
    if (PREFIX) {
      if (items.length < e.nb || fnv(JSON.stringify(ids.slice(0, e.nb))) !== e.ih) f.push("bildordning (värdens " + e.nb + " första): " + ids.length + " bilder");
      if (fnv(JSON.stringify(alts.slice(0, e.nb))) !== e.ah) f.push("alt avviker bland värdens " + e.nb + " första");
    } else {
      if (items.length !== e.nb || fnv(JSON.stringify(ids)) !== e.ih) f.push("bildordning: " + ids.length + " mot " + e.nb);
      if (fnv(JSON.stringify(alts)) !== e.ah) f.push("alt avviker (" + alts.length + " bilder)");
    }
    if (DON[kort]) {
      const rid = ids.slice(e.nb);
      const ralt = alts.slice(e.nb);
      if (JSON.stringify(rid) !== JSON.stringify(DON[kort].ids)) f.push("givarens bilder (efter värdens " + e.nb + ") avviker: " + rid.length + " mot " + DON[kort].ids.length);
      if (JSON.stringify(ralt) !== JSON.stringify(DON[kort].alts)) f.push("givarens alt avviker");
    }
    const saknas = e.kat.filter(function (k) { return catNamn.indexOf(k) < 0; });
    if (saknas.length) f.push("kategorier saknas: " + saknas.join(", "));
    if (e.sku && vs.length === 1 && vs[0].sku !== e.sku) f.push("sku: " + vs[0].sku);
    const rad = { kort: kort, ok: f.length === 0, rev: p.revision, vis: p.visible, bilder: items.length, kat: catNamn.length };
    if ((p.options || []).length) {
      rad.options = (p.options || []).map(function (o) { return o.name + ": " + ((o.choicesSettings && o.choicesSettings.choices) || []).map(function (c) { return c.name + "(" + ((c.linkedMedia || []).length) + ")"; }).join(", "); });
      rad.varianter = vs.map(function (x) {
        const a = x.price && x.price.actualPrice && x.price.actualPrice.amount;
        const m = x.media && x.media.id ? ids.indexOf(x.media.id) + 1 : "?";
        return ((x.choices || []).map(function (c) { return (c.optionChoiceNames && c.optionChoiceNames.choiceName) || ""; }).join("/")) + " " + x.sku + " " + (x.visible ? "syns" : "DOLD") + " " + a + " bild#" + m;
      });
    }
    rader.push(rad);
    if (f.length) avvik.push({ kort: kort, f: f });
  }
  const gv = [];
  for (const k of Object.keys(GIV)) {
    const r2 = await wix.request({ method: "GET", url: "https://www.wixapis.com/stores/v3/products/" + GIV[k] });
    const p2 = (r2.data || r2).product;
    gv.push({ k: k, visible: p2.visible, slug: p2.slug });
  }
  const ok = rader.filter(function (r) { return r.ok; }).length;
  return {
    SAMMANFATTNING: ok + " av " + rader.length + " LIKA",
    avvik: avvik,
    rader: rader,
    givare: gv
  };
}
''' % (json.dumps(EXP, ensure_ascii=False), json.dumps(giv), json.dumps(DON, ensure_ascii=False), 'true' if PREFIX else 'false')

open(ut, 'w', encoding='utf-8').write(js)
print('skrev', ut, len(js), 'tecken,', len(EXP), 'sidor')
