#!/usr/bin/env python3
"""Runda N33: bygger steg 1:s spärrtillägg, steg3.js, steg4.js och steg5.js ur rundans filer.

Samma krav som N32 skrev ned: inget tal och ingen sträng i skrivanropen får
skrivas av för hand. Allt här läses ur ids.tsv, namn.tsv, seo.tsv, slugs.txt,
sku.tsv, variant.tsv, kategori.tsv, vantat-hash.tsv och media-hash.tsv.

variant.tsv är utläst ur LÄS-MIG:s las-tabell av ett skript (run 3663–3670)
och kontrolleras mot steg 4:s färska GET i steg 5; stämplingens
variant_skus byggs ur samma fil (`python3 bygg-steg.py --stampla`).

  steg 1  bygg-skrivning.py summerar bara brödtexten. Det här skriptet lägger
          till en andra spärr i SAMMA anrop, över kort|pid|namn|slug|SEO-titel|
          SEO-beskrivning, så att även de fält som H3 mätte upp som de farliga
          (avskrivna, 5 av 5 drev isär) fälls före skrivningen och inte först i
          återläsningen.
  steg 3  kategorinamnen slås upp i en FÄRSK categories/query i samma anrop;
          saknas ett namn skrivs ingenting. Facit = bulk-svarets per-rad success.
  steg 4  variant-SKU sist och ensam, round-trip ur en FÄRSK GET med options
          och visible, spärr över kort|pid|sku.
  steg 5  separat återläsning av alla fyra stegen mot facit ur filerna;
          bevisar att fälten fanns innan noll tolkas.

ANVÄNDNING (från rundans katalog):
  python3 ../../polish-gates/bygg-skrivning.py > steg1-bas.js
  python3 bygg-steg.py steg1-bas.js > steg1.js   (skriver även steg3/4/5.js)
  python3 bygg-steg.py --stampla                  (variant_skus per produkt)
  python3 bygg-steg.py --rattelse k1,k2 > r.js    (bara plainDescription)
"""
import io, json, sys


def summa(s):
    h = 0
    for c in s:
        h = (h * 31 + (ord(c) & 0xFFFF)) % 1000000007
    return h


def tsv(namn, n):
    ut = {}
    for r in io.open(namn, encoding="utf-8"):
        if r.strip():
            d = r.rstrip("\n").split("\t", n - 1)
            ut[d[0]] = d[1:]
    return ut


ids = tsv("ids.tsv", 3)
namn = tsv("namn.tsv", 2)
seo = tsv("seo.tsv", 3)
sku = tsv("sku.tsv", 2)
var = tsv("variant.tsv", 2)
kat = tsv("kategori.tsv", 2)
vh = tsv("vantat-hash.tsv", 3)
mh = tsv("media-hash.tsv", 3)
slug = {r.split()[0]: r.split()[1] for r in io.open("slugs.txt", encoding="utf-8") if r.strip()}

fel = []
kort_lista = list(ids)
for k in kort_lista:
    for kalla, nm in ((namn, "namn.tsv"), (seo, "seo.tsv"), (sku, "sku.tsv"), (kat, "kategori.tsv"),
                      (vh, "vantat-hash.tsv"), (mh, "media-hash.tsv"), (slug, "slugs.txt"),
                      (var, "variant.tsv")):
        if k not in kalla:
            fel.append(f"{k}: saknar rad i {nm}")
if fel:
    sys.stderr.write("BYGGET FALLER:\n" + "\n".join("  " + f for f in fel) + "\n")
    sys.exit(1)

rader = []
for k in kort_lista:
    rader.append({
        "kort": k, "pid": ids[k][0], "namn": namn[k][0], "slug": slug[k],
        "seoTitel": seo[k][0], "seoBesk": seo[k][1], "sku": sku[k][0], "variantId": var[k][0],
        "textHash": vh[k][0], "textTecken": int(vh[k][1]),
        "mediaSumma": int(mh[k][0]), "mediaTecken": int(mh[k][1]),
        "kat": [x.strip() for x in kat[k][0].split(" + ")],
    })

SUMMA_JS = """  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };"""

# ── stämpling: en rad per produkt med workflow-inputs, ur sku.tsv + variant.tsv ──
if len(sys.argv) > 1 and sys.argv[1] == "--stampla":
    for r in rader:
        print(r["kort"] + "\t" + r["pid"] + "\t" + json.dumps({r["variantId"]: r["sku"]}, ensure_ascii=False))
    sys.exit(0)

# ── rättelse efter publicering: BARA plainDescription, bara för namngivna kort ──
# Samma regler som steg 1: nyttolasten byggs ur <kort>.html, facit är
# raa-hash.tsv (strängen SOM DEN SKICKAS, rstrip("\n")), och spärren ligger i
# SAMMA anrop som skrivningen och avbryter hela batchen. Fältmasken bär bara
# plainDescription — namn, slug, SEO, media, kategorier och varianten rörs inte.
if len(sys.argv) > 2 and sys.argv[1] == "--rattelse":
    raa = tsv("raa-hash.tsv", 3)
    valda = [k for k in sys.argv[2].split(",") if k]
    plan, fel = [], []
    for k in valda:
        if k not in ids:
            fel.append(f"{k}: finns inte i ids.tsv")
            continue
        html = io.open(f"{k}.html", encoding="utf-8").read().rstrip("\n")
        if int(raa[k][1]) != len(html) or int(raa[k][0]) != summa(html):
            fel.append(f"{k}: raa-hash.tsv är inaktuell — kör raahash.py")
        plan.append({"kort": k, "pid": ids[k][0], "html": html, "raa": summa(html), "tecken": len(html)})
    if fel or not plan:
        sys.stderr.write("BYGGET FALLER:\n" + "\n".join("  " + f for f in (fel or ["inga kort valda"])) + "\n")
        sys.exit(1)
    nyckel = "\n".join(p["kort"] + "|" + p["pid"] for p in plan)
    ut = ["async function () {",
          "  // Genererad av runda N33:s bygg-steg.py --rattelse ur <kort>.html + raa-hash.tsv — skriv den aldrig för hand.",
          SUMMA_JS,
          "  const PLAN = ["]
    for p in plan:
        ut.append("    {")
        for n in ("kort", "pid", "html"):
            ut.append(f"      {n}: {json.dumps(p[n], ensure_ascii=False)},")
        ut.append(f"      raa: {p['raa']},")
        ut.append(f"      tecken: {p['tecken']}")
        ut.append("    },")
    ut += ["  ];",
           "  // ☠️ SPÄRRARNA LIGGER I SAMMA ANROP SOM SKRIVNINGEN och avbryter HELA batchen.",
           "  const ID = PLAN.map(function (p) { return p.kort + \"|\" + p.pid; }).join(\"\\n\");",
           f"  if (SUMMA(ID) !== {summa(nyckel)} || ID.length !== {len(nyckel)}) {{",
           "    return { AVBRUTET: \"transkriberingsfel i id — ingenting skrivet\", fick: SUMMA(ID), tecken: ID.length };",
           "  }",
           "  const avvik = PLAN",
           "    .filter(function (p) { return SUMMA(p.html) !== p.raa || p.html.length !== p.tecken; })",
           "    .map(function (p) { return { kort: p.kort, fick: SUMMA(p.html), vantat: p.raa, tecken: p.html.length, vantatTecken: p.tecken }; });",
           "  if (avvik.length) return { AVBRUTET: \"transkriberingsfel — ingenting skrivet\", avvik: avvik };",
           "",
           "  const ut = [];",
           "  for (const p of PLAN) {",
           "    const f = await wix.request({ method: \"GET\", url: \"/stores/v3/products/\" + p.pid });",
           "    const rev = (f.data || f).product.revision;",
           "    const kropp = {",
           "      product: {",
           "        revision: rev,",
           "        plainDescription: p.html",
           "      },",
           "      fieldMask: {",
           "        paths: [\"plainDescription\"]",
           "      }",
           "    };",
           "    try {",
           "      const r = await wix.request({ method: \"PATCH\", url: \"/stores/v3/products/\" + p.pid, body: kropp });",
           "      ut.push({ kort: p.kort, ok: true, revisionFore: rev, revisionEfter: (r.data || r).product.revision });",
           "    } catch (e) {",
           "      ut.push({ kort: p.kort, ok: false, fel: String(e && e.message || e).slice(0, 300) });",
           "    }",
           "  }",
           "  const ok = ut.filter(function (r) { return r.ok; }).length;",
           "  return { rader: ut, SAMMANFATTNING: ok + \" av \" + ut.length + \" skrivna\" };",
           "}"]
    print("\n".join(ut))
    sys.exit(0)

# ── steg 1: spärr över metadatafälten, insatt i bygg-skrivning.py:s utdata ──
if len(sys.argv) > 1:
    bas = io.open(sys.argv[1], encoding="utf-8").read()
    meta = "\n".join("|".join([r["kort"], r["pid"], r["namn"], r["slug"], r["seoTitel"], r["seoBesk"]])
                     for r in rader)
    ankare = "  const avvik = PLAN\n"
    if bas.count(ankare) != 1:
        sys.stderr.write("BYGGET FALLER: hittar inte spärrankaret i steg 1\n")
        sys.exit(1)
    tillagg = (
        "  // Tillagd av runda N33:s bygg-steg.py: spärr även över namn, slug och SEO,\n"
        "  // i SAMMA anrop som skrivningen (H3: avskrivna SEO-fält drev isär 5 av 5).\n"
        "  const META = PLAN.map(function (p) { return [p.kort, p.pid, p.namn, p.slug, p.seoTitel, p.seoBesk].join(\"|\"); }).join(\"\\n\");\n"
        f"  if (SUMMA(META) !== {summa(meta)} || META.length !== {len(meta)}) {{\n"
        "    return { AVBRUTET: \"transkriberingsfel i namn/slug/SEO — ingenting skrivet\", fick: SUMMA(META), tecken: META.length };\n"
        "  }\n\n"
    )
    sys.stdout.write(bas.replace(ankare, tillagg + ankare))

# ── steg 3: kategorier ──
k3 = "\n".join(r["kort"] + "|" + r["pid"] + "|" + " + ".join(r["kat"]) for r in rader)
plan3 = [{"kort": r["kort"], "pid": r["pid"], "kat": r["kat"]} for r in rader]
steg3 = ["async function () {",
         "  // Genererad av runda N33:s bygg-steg.py ur ids.tsv + kategori.tsv — skriv den aldrig för hand.",
         SUMMA_JS,
         "  const PLAN = ["]
for p in plan3:
    steg3.append("    " + json.dumps(p, ensure_ascii=False) + ",")
steg3 += ["  ];",
          f"  const FACIT = {{ summa: {summa(k3)}, tecken: {len(k3)} }};",
          "",
          "  // ☠️ SPÄRREN I SAMMA ANROP SOM SKRIVNINGEN — avbryter HELA batchen.",
          "  const nyckel = PLAN.map(function (p) { return p.kort + \"|\" + p.pid + \"|\" + p.kat.join(\" + \"); }).join(\"\\n\");",
          "  if (SUMMA(nyckel) !== FACIT.summa || nyckel.length !== FACIT.tecken) {",
          "    return { AVBRUTET: \"transkriberingsfel — ingenting skrivet\", fick: SUMMA(nyckel), tecken: nyckel.length };",
          "  }",
          "",
          "  // Kategori-id slås upp på NAMN i en FÄRSK fråga, i samma anrop.",
          "  const qbody = {",
          "    query: {",
          "      cursorPaging: {",
          "        limit: 200",
          "      }",
          "    },",
          "    treeReference: {",
          "      appNamespace: \"@wix/stores\"",
          "    }",
          "  };",
          "  const q = await wix.request({ method: \"POST\", url: \"https://www.wixapis.com/categories/v1/categories/query\", body: qbody });",
          "  const namnTillId = {};",
          "  let antal = 0;",
          "  for (const c of ((q.data || q).categories || [])) { namnTillId[c.name] = c.id; antal++; }",
          "  const saknas = [];",
          "  for (const p of PLAN) for (const n of p.kat) if (!namnTillId[n]) saknas.push(p.kort + \": \" + n);",
          "  if (saknas.length) return { AVBRUTET: \"okänt kategorinamn — ingenting skrivet\", saknas: saknas, antalKategorier: antal };",
          "",
          "  const perKat = {};",
          "  for (const p of PLAN) for (const n of p.kat) (perKat[n] = perKat[n] || []).push(p);",
          "  const ut = [];",
          "  for (const n of Object.keys(perKat)) {",
          "    const items = perKat[n].map(function (p) { return { catalogItemId: p.pid, appId: \"215238eb-22a5-4c36-9e7b-e7c08025e04e\" }; });",
          "    const kropp = {",
          "      items: items,",
          "      treeReference: {",
          "        appNamespace: \"@wix/stores\"",
          "      }",
          "    };",
          "    try {",
          "      const r = await wix.request({ method: \"POST\", url: \"https://www.wixapis.com/categories/v1/bulk/categories/\" + namnTillId[n] + \"/add-items\", body: kropp });",
          "      const d = r.data || r;",
          "      const res = d.results || [];",
          "      for (let i = 0; i < perKat[n].length; i++) {",
          "        // Attribution på radens EGET id först; originalIndex (saknas när det är 0 i proto3) bara som reserv.",
          "        const hit = res.find(function (x) { return (((x.itemMetadata || {}).item) || {}).catalogItemId === perKat[n][i].pid; }) || res.find(function (x) { return ((x.itemMetadata || {}).originalIndex || 0) === i; });",
          "        const m = (hit || {}).itemMetadata || null;",
          "        ut.push({ kort: perKat[n][i].kort, kat: n, success: !!(m && m.success), id: m && m.item ? m.item.catalogItemId === perKat[n][i].pid : null, fel: m && m.error ? JSON.stringify(m.error).slice(0, 200) : null });",
          "      }",
          "      ut.push({ kat: n, bulk: d.bulkActionMetadata || null });",
          "    } catch (e) {",
          "      ut.push({ kat: n, AVBRUTET: String(e && e.message || e).slice(0, 300) });",
          "    }",
          "  }",
          "  const rader = ut.filter(function (x) { return x.kort; });",
          "  const ok = rader.filter(function (x) { return x.success && x.id === true; }).length;",
          "  return { rader: ut, antalKategorier: antal, SAMMANFATTNING: ok + \" av \" + rader.length + \" rader success\" };",
          "}"]
io.open("steg3.js", "w", encoding="utf-8").write("\n".join(steg3) + "\n")

# ── steg 4: variant-SKU sist och ensam ──
k4 = "\n".join(r["kort"] + "|" + r["pid"] + "|" + r["sku"] for r in rader)
steg4 = ["async function () {",
         "  // Genererad av runda N33:s bygg-steg.py ur ids.tsv + sku.tsv — facit räknat ur filen, aldrig skrivet av.",
         SUMMA_JS,
         "  const PLAN = ["]
for r in rader:
    steg4.append("    " + json.dumps({"kort": r["kort"], "pid": r["pid"], "sku": r["sku"]}, ensure_ascii=False) + ",")
steg4 += ["  ];",
          f"  const FACIT = {{ summa: {summa(k4)}, tecken: {len(k4)} }};",
          "",
          "  // ☠️ SPÄRREN I SAMMA ANROP SOM SKRIVNINGEN — avbryter HELA batchen.",
          "  const nyckel = PLAN.map(function (p) { return p.kort + \"|\" + p.pid + \"|\" + p.sku; }).join(\"\\n\");",
          "  if (SUMMA(nyckel) !== FACIT.summa || nyckel.length !== FACIT.tecken) {",
          "    return { AVBRUTET: \"transkriberingsfel — ingenting skrivet\", fick: SUMMA(nyckel), tecken: nyckel.length };",
          "  }",
          "",
          "  const ut = [];",
          "  for (const p of PLAN) {",
          "    // FÄRSK full GET i samma anrop — variantobjektet byggs ALDRIG från grunden.",
          "    const g = await wix.request({ method: \"GET\", url: \"/stores/v3/products/\" + p.pid + \"?fields=VARIANT_OPTION_CHOICE_NAMES\" });",
          "    const prod = (g.data || g).product;",
          "    const vs = ((prod.variantsInfo || {}).variants) || [];",
          "    if (vs.length !== 1) {",
          "      ut.push({ kort: p.kort, ok: false, fel: \"oväntat antal varianter: \" + vs.length + \" — hoppad\" });",
          "      continue;",
          "    }",
          "    // Ändra BARA sku på variantens toppnivå; allt annat följer med ur GET:en.",
          "    const varianter = vs.map(function (v) { return Object.assign({}, v, { sku: p.sku }); });",
          "    const produkt = {",
          "      revision: prod.revision,",
          "      visible: prod.visible,",
          "      variantsInfo: {",
          "        variants: varianter",
          "      }",
          "    };",
          "    const vagar = [\"variantsInfo\", \"visible\"];",
          "    if (Array.isArray(prod.options)) {",
          "      produkt.options = prod.options;",
          "      vagar.push(\"options\");",
          "    }",
          "    const kropp = {",
          "      product: produkt,",
          "      fieldMask: {",
          "        paths: vagar",
          "      }",
          "    };",
          "    try {",
          "      const r = await wix.request({ method: \"PATCH\", url: \"/stores/v3/products/\" + p.pid, body: kropp });",
          "      const efter = (r.data || r).product;",
          "      ut.push({",
          "        kort: p.kort,",
          "        ok: true,",
          "        variantId: vs[0].id,",
          "        skuFore: vs[0].sku,",
          "        variantVisibleFore: vs[0].visible,",
          "        produktVisibleFore: prod.visible,",
          "        prisFore: ((vs[0].price || {}).actualPrice || {}).amount,",
          "        revisionFore: prod.revision,",
          "        revisionEfter: efter.revision",
          "      });",
          "    } catch (e) {",
          "      ut.push({ kort: p.kort, ok: false, fel: String(e && e.message || e).slice(0, 300) });",
          "    }",
          "  }",
          "  const ok = ut.filter(function (r) { return r.ok; }).length;",
          "  return { rader: ut, SAMMANFATTNING: ok + \" av \" + ut.length + \" skrivna\" };",
          "}"]
io.open("steg4.js", "w", encoding="utf-8").write("\n".join(steg4) + "\n")

# ── steg 5: separat återläsning ──
steg5 = ["async function () {",
         "  // Genererad av runda N33:s bygg-steg.py ur ids, namn, seo, slugs, sku, kategori, vantat-hash och media-hash — aldrig skriven av.",
         "  function fnv(s) {",
         "    const b = new TextEncoder().encode(s);",
         "    let h = 0xcbf29ce484222325n;",
         "    const M = 0xFFFFFFFFFFFFFFFFn;",
         "    for (const c of b) {",
         "      h ^= BigInt(c);",
         "      h = (h * 0x100000001b3n) & M;",
         "    }",
         "    return h.toString(16).padStart(16, \"0\");",
         "  }",
         SUMMA_JS,
         "  const FACIT = ["]
for r in rader:
    steg5.append("    " + json.dumps(r, ensure_ascii=False) + ",")
steg5 += ["  ];",
          "  const qbody = {",
          "    query: {",
          "      cursorPaging: {",
          "        limit: 200",
          "      }",
          "    },",
          "    treeReference: {",
          "      appNamespace: \"@wix/stores\"",
          "    }",
          "  };",
          "  const q = await wix.request({ method: \"POST\", url: \"https://www.wixapis.com/categories/v1/categories/query\", body: qbody });",
          "  const namnTillId = {};",
          "  for (const c of ((q.data || q).categories || [])) namnTillId[c.name] = c.id;",
          "",
          "  const ut = [];",
          "  for (const f of FACIT) {",
          "    const url = \"/stores/v3/products/\" + f.pid + \"?fields=PLAIN_DESCRIPTION&fields=MEDIA_ITEMS_INFO&fields=DIRECT_CATEGORIES_INFO&fields=VARIANT_OPTION_CHOICE_NAMES\";",
          "    const r = await wix.request({ method: \"GET\", url: url });",
          "    const p = (r.data || r).product;",
          "    // ☠️ Bevisa att fälten FANNS i projektionen innan noll tolkas.",
          "    const saknas = [];",
          "    if (typeof p.plainDescription !== \"string\") saknas.push(\"plainDescription\");",
          "    if (!p.media || !p.media.itemsInfo || !Array.isArray(p.media.itemsInfo.items)) saknas.push(\"media.itemsInfo\");",
          "    if (!p.directCategoriesInfo || !Array.isArray(p.directCategoriesInfo.categories)) saknas.push(\"directCategoriesInfo\");",
          "    if (!p.variantsInfo || !Array.isArray(p.variantsInfo.variants)) saknas.push(\"variantsInfo\");",
          "    if (saknas.length) { ut.push({ kort: f.kort, AVBRUTET: \"fält saknas i projektionen\", saknas: saknas }); continue; }",
          "",
          "    const t = p.plainDescription;",
          "    const tags = ((p.seoData || {}).tags) || [];",
          "    const titel = tags.filter(function (x) { return x.type === \"title\"; });",
          "    const meta = tags.filter(function (x) { return x.type === \"meta\" && (x.props || {}).name === \"description\"; });",
          "    const kw = (((p.seoData || {}).settings || {}).keywords) || [];",
          "    const items = p.media.itemsInfo.items;",
          "    const nyckel = items.map(function (m) { return m.id + \"|\" + (m.altText || \"\"); }).join(\"\\n\");",
          "    const katIds = p.directCategoriesInfo.categories.map(function (c) { return c.id; });",
          "    const vantadeKat = f.kat.map(function (n) { return namnTillId[n]; });",
          "    const vs = p.variantsInfo.variants;",
          "    const rad = {",
          "      kort: f.kort,",
          "      rev: p.revision,",
          "      text: fnv(t) === f.textHash && t.length === f.textTecken,",
          "      textTecken: t.length,",
          "      namn: p.name === f.namn,",
          "      slug: p.slug === f.slug,",
          "      visible: p.visible === true,",
          "      seo: tags.length === 2 && titel.length === 1 && titel[0].children === f.seoTitel && meta.length === 1 && meta[0].props.content === f.seoBesk && kw.length === 0,",
          "      media: SUMMA(nyckel) === f.mediaSumma && nyckel.length === f.mediaTecken,",
          "      antalBilder: items.length,",
          "      kat: vantadeKat.every(function (id) { return !!id && katIds.indexOf(id) >= 0; }),",
          "      antalKat: katIds.length,",
          "      sku: vs.length === 1 && vs[0].sku === f.sku,",
          "      variantVisible: vs.length === 1 && vs[0].visible === true,",
          "      variantIdStammer: vs.length === 1 && vs[0].id === f.variantId,",
          "      pris: vs.length === 1 ? ((vs[0].price || {}).actualPrice || {}).amount : null,",
          "      lager: (p.inventory || {}).availabilityStatus",
          "    };",
          "    rad.ALLT = rad.text && rad.namn && rad.slug && rad.visible && rad.seo && rad.media && rad.kat && rad.sku && rad.variantVisible && rad.variantIdStammer;",
          "    ut.push(rad);",
          "  }",
          "  const ok = ut.filter(function (x) { return x.ALLT; }).length;",
          "  return { rader: ut, SAMMANFATTNING: ok + \" av \" + ut.length + \" helt verifierade\" };",
          "}"]
io.open("steg5.js", "w", encoding="utf-8").write("\n".join(steg5) + "\n")
sys.stderr.write("steg3.js, steg4.js, steg5.js skrivna" + (" + steg 1 med metaspärr" if len(sys.argv) > 1 else "") + "\n")
