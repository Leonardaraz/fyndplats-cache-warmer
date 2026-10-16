#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""bygg_aterlas.py <rundakatalog> [utfil]: bygger den fulla återläsningen (text-hash, namn, slug, SEO, kategorinamn,
bilder med alt, varianter, synlighet, revision) som ExecuteWixAPI-kod. FACIT och IDS läses ur rundans filer, aldrig för hand.
Utdata paddas så att svaret sparas i en fil (jfr_aterlas.py läser den)."""
import io, os, sys

R = sys.argv[1]
facit = {}
for rad in io.open(f'{R}/vantat-hash.tsv', encoding='utf-8'):
    d = rad.rstrip('\n').split('\t')
    if len(d) == 3:
        facit[d[0]] = (d[1], int(d[2]))
ids = {}
for rad in io.open(f'{R}/ids.tsv', encoding='utf-8'):
    d = rad.rstrip('\n').split('\t')
    if len(d) >= 2:
        ids[d[0]] = d[1]
utan = [k for k in ids if k not in facit]
if utan:
    sys.exit('AVBRYT: id utan facit: ' + ', '.join(sorted(utan)))

F = '\n'.join('    "%s": ["%s", %d],' % (k, facit[k][0], facit[k][1]) for k in sorted(ids))
I = '\n'.join('    "%s": "%s",' % (k, ids[k]) for k in sorted(ids))

js = '''async function () {
  const FACIT = {
%s
  };
  const IDS = {
%s
  };
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
  const ut = [];
  for (const kort of Object.keys(IDS)) {
    const pid = IDS[kort];
    const url = "https://www.wixapis.com/stores/v3/products/" + pid + "?fields=PLAIN_DESCRIPTION&fields=MEDIA_ITEMS_INFO&fields=DIRECT_CATEGORIES_INFO&fields=VARIANT_OPTION_CHOICE_NAMES";
    const r = await wix.request({ method: "GET", url: url });
    const p = (r.data || r).product;
    if (typeof p.plainDescription !== "string") {
      return { AVBRUTET: "plainDescription saknas i projektionen", kort: kort };
    }
    const t = p.plainDescription;
    const v = FACIT[kort];
    const items = (p.media && p.media.itemsInfo && p.media.itemsInfo.items) || [];
    const vs = (p.variantsInfo && p.variantsInfo.variants) || [];
    const catIds = ((p.directCategoriesInfo && p.directCategoriesInfo.categories) || []).map(function (c) { return c.id; });
    ut.push({
      kort: kort,
      tecken: t.length,
      vantatTecken: v ? v[1] : null,
      LIKA: !!v && fnv(t) === v[0] && t.length === v[1],
      name: p.name,
      slug: p.slug,
      visible: p.visible,
      revision: p.revision,
      seo: p.seoData || null,
      cats: catIds.map(function (id) { return kmap[id] || ("OKAND:" + id); }),
      items: items.map(function (m) { return { id: bid(m), alt: m.altText || "" }; }),
      variants: vs.map(function (x) {
        const a = x.price && x.price.actualPrice && x.price.actualPrice.amount;
        const n = a === undefined || a === null ? null : parseFloat(a);
        return { sku: x.sku, vis: x.visible, pris: n === null ? null : (Number.isInteger(n) ? String(n) : String(n)) };
      })
    });
  }
  const lika = ut.filter(function (r) { return r.LIKA; }).length;
  return {
    rader: ut,
    SAMMANFATTNING: lika + " av " + ut.length + " LIKA",
    allaSkiljer: lika === 0 && ut.length > 1,
    pad: "x".repeat(101000)
  };
}
''' % (F, I)

ut = sys.argv[2] if len(sys.argv) > 2 else None
if ut:
    io.open(ut, 'w', encoding='utf-8').write(js)
    print('skrev', ut, len(js), 'tecken,', len(ids), 'produkter')
else:
    print(js)
