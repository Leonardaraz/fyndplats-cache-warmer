#!/usr/bin/env python3
"""Lägger KORTET sist i bildlistan och räknar facit för mediaskrivningen.

Tar vid där `bygg-media.py` slutar:

  bygg-media.py         bilder.tsv + alt.tsv      -> nyttolast-media.json
  bygg-medieskrivning.py  + kort-filer.tsv
                          + kortalt.tsv           -> medieskrivning.json
                                                     media-hash.tsv

☠️ KORTET LIGGER SIST, OCH DET ÄR INTE EN SMAKSAK. Position 1 blir huvudbild
och delningsbild i sökresultat och kategorilistor — ett kort som hamnar först
gör en tillverkad grafik till produktens ansikte. Samma skäl som håller
måttskissen sist i `bygg-media.py`.

☠️ KORTETS FIL-ID MÅSTE VARA BEVISAT, INTE ANTAGET. `kort-filer.tsv` byggs ur
md5-jämförelsen mot den hemhämtade filen, aldrig ur uppladdningens ordning:
`UploadImageToWixSite` svarar med en lista id utan att säga vilket id som kom
från vilken adress. Samma attribution-på-ordning som huset redan vägrat lita
på i lagersynken.

☠️ FACIT RÄKNAS PÅ `id + "|" + altText`, RADER SAMMANFOGADE MED `\\n`, och
används av ALT-TEXTGRINDEN i samma anrop som mediaskrivningen. Alt-texter är
lika transkriberade som brödtexten — runda J2 publicerade åtta produkter med
fyrtio tyska alt-texter och varje API-svar sa framgång. Samma aritmetik som
`raahash.py`, av samma skäl: den går att spegla i sandlådans JS.

⚠️ HELA `itemsInfo.items` ERSÄTTS av skrivningen. Det som inte står i listan
finns inte kvar på produkten — därav att antalet mäts ur `bilder.tsv` i
`bygg-media.py` och aldrig antas till fem.

ANVÄNDNING (från rundans katalog):
  python3 ../../polish-gates/bygg-media.py
  python3 ../../polish-gates/bygg-medieskrivning.py
"""
import collections, io, json, sys

def summa(s):
    # h*31 haller sig under 2^53 — samma exakta aritmetik i JS och Python.
    h = 0
    for c in s:
        h = (h * 31 + (ord(c) & 0xFFFF)) % 1000000007
    return h

media = json.load(io.open("nyttolast-media.json", encoding="utf-8"),
                  object_pairs_hook=collections.OrderedDict)

kortfil, kortalt, fel = {}, {}, []
for r in io.open("kort-filer.tsv", encoding="utf-8"):
    if r.strip():
        kort, sort, f = r.rstrip("\n").split("\t")
        if sort == "kort":
            kortfil[kort] = f
for r in io.open("kortalt.tsv", encoding="utf-8"):
    if r.strip():
        kort, alt = r.rstrip("\n").split("\t", 1)
        kortalt[kort] = alt

for kort in media:
    if kort not in kortfil:
        fel.append(f"{kort}: saknar rad i kort-filer.tsv (obevisat fil-id?)")
    if not kortalt.get(kort, "").strip():
        fel.append(f"{kort}: saknar alt-text i kortalt.tsv")
    if kort in kortfil and not kortfil[kort].startswith("b379ce_"):
        fel.append(f"{kort}: misstänkt kort-fil-id {kortfil[kort]!r}")
    if kort in kortfil and kortfil[kort] in {p["id"] for p in media[kort]}:
        fel.append(f"{kort}: kortet ligger redan i bildlistan")

if fel:
    print("BYGGET FALLER:\n" + "\n".join("  " + f for f in fel))
    sys.exit(1)

ut, rader = collections.OrderedDict(), []
for kort, poster in media.items():
    ut[kort] = list(poster) + [{"id": kortfil[kort], "altText": kortalt[kort]}]
    s = "\n".join(p["id"] + "|" + p["altText"] for p in ut[kort])
    rader.append(f"{kort}\t{summa(s)}\t{len(s)}")

json.dump(ut, io.open("medieskrivning.json", "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
io.open("media-hash.tsv", "w", encoding="utf-8").write("\n".join(rader) + "\n")
for kort, poster in ut.items():
    print(f"{kort}  {len(poster)} poster (kortet sist: {poster[-1]['id'][:20]}…)")
print("\n" + "\n".join(rader))

# ── STEG 2:s skrivanrop ────────────────────────────────────────────────────
#
# ☠️ NYTTOLASTEN BYGGS AV ETT SKRIPT, PRECIS SOM STEG 1:s. Fram till nu har
# mediaskrivningen skrivits av för hand i chatten medan brödtexten gick via
# `bygg-skrivning.py` — alltså exakt den asymmetri runda H3 mätte upp: det
# som gick via fil kom fram (0 av 8 drev isär), det som skrevs av gjorde det
# inte (5 av 5). Alt-texter är lika transkriberade som brödtext, och runda J2
# publicerade fyrtio tyska alt-texter med ett API-svar som sa framgång.
#
# ☠️ SPÄRREN LIGGER I SAMMA ANROP SOM SKRIVNINGEN och avbryter HELA batchen.
# En kontroll i ett eget, tidigare anrop bevisar bara att just DEN kopieringen
# var rätt.
# ids.tsv är samma facit som steg 1 använde — produkt-id hämtas aldrig ur
# minnet eller ur ett tidigare svar.
ids_media = {}
for r in io.open("ids.tsv", encoding="utf-8"):
    if r.strip():
        d = r.rstrip("\n").split("\t")
        ids_media[d[0]] = d[1]
saknade = [k for k in ut if k not in ids_media]
if saknade:
    print("BYGGET FALLER: saknar produkt-id i ids.tsv för " + ", ".join(saknade))
    sys.exit(1)

js = ['async function () {',
      '  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.',
      '  const SUMMA = function (s) {',
      '    let h = 0;',
      '    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;',
      '    return h;',
      '  };',
      '',
      '  const PLAN = [']
facit = dict((r.split("\t")[0], (int(r.split("\t")[1]), int(r.split("\t")[2])))
             for r in "\n".join(rader).split("\n"))
for kort, poster in ut.items():
    s, t = facit[kort]
    js += ['    {',
           '      kort: %s,' % json.dumps(kort, ensure_ascii=False),
           '      pid: %s,' % json.dumps(ids_media[kort], ensure_ascii=False),
           '      poster: [']
    for p in poster:
        js.append('        { id: %s, altText: %s },'
                  % (json.dumps(p["id"], ensure_ascii=False),
                     json.dumps(p["altText"], ensure_ascii=False)))
    js += ['      ],',
           '      raa: %d,' % s,
           '      tecken: %d' % t,
           '    },']
js += ['  ];',
       '',
       '  // ☠️ SPÄRREN LIGGER HÄR, I SAMMA ANROP SOM SKRIVNINGEN, och den avbryter',
       '  // HELA batchen. Facit räknas på `id + "|" + altText` per rad, sammanfogat',
       '  // med radbrytning — alltså BÅDE bildernas ordning och alt-texternas ord.',
       '  const NYCKEL = function (poster) {',
       '    return poster.map(function (p) { return p.id + "|" + p.altText; }).join("\\n");',
       '  };',
       '  const avvik = PLAN',
       '    .filter(function (p) { const s = NYCKEL(p.poster); return SUMMA(s) !== p.raa || s.length !== p.tecken; })',
       '    .map(function (p) { const s = NYCKEL(p.poster); return { kort: p.kort, fick: SUMMA(s), vantat: p.raa, tecken: s.length, vantatTecken: p.tecken }; });',
       '  if (avvik.length) return { AVBRUTET: "transkriberingsfel — ingenting skrivet", avvik: avvik };',
       '',
       '  const utfall = [];',
       '  for (const p of PLAN) {',
       '    // ⚠️ Revisionen läses i SAMMA anrop — en äldre är inaktuell.',
       '    const f = await wix.request({ method: "GET", url: "/stores/v3/products/" + p.pid });',
       '    // ☠️ Svarets form läses tolerant (#280) — ett svar är ett SVAR, inte en',
       '    // skrivmall. Kroppen som SKICKAS heter alltid `body`.',
       '    const rev = (f.data || f).product.revision;',
       '',
       '    // ⚠️ MEDIA SKRIVS ENSAM. `media.main` skickas INTE — den är read-only i',
       '    // V3 och gav en extra omimport av huvudbilden. Hela `itemsInfo.items`',
       '    // ersätts, så listan ÄR produktens bilder efteråt.',
       '    const kropp = {',
       '      product: {',
       '        revision: rev,',
       '        media: { itemsInfo: { items: p.poster } }',
       '      },',
       '      fieldMask: { paths: ["media"] }',
       '    };',
       '',
       '    try {',
       '      const r = await wix.request({ method: "PATCH", url: "/stores/v3/products/" + p.pid, body: kropp });',
       '      const prod = (r.data || r).product;',
       '      utfall.push({ kort: p.kort, ok: true, skickade: p.poster.length, revisionEfter: prod.revision });',
       '    } catch (e) {',
       '      utfall.push({ kort: p.kort, ok: false, fel: String(e && e.message || e).slice(0, 300) });',
       '    }',
       '  }',
       '',
       '  // ⚠️ PATCH-svaret bär INTE media.itemsInfo i sin projektion — en lyckad',
       '  // skrivning rapporterar 0 bilder (#253). Kvittot är aterlas.js senare.',
       '  const ok = utfall.filter(function (r) { return r.ok; }).length;',
       '  return { rader: utfall, SAMMANFATTNING: ok + " av " + utfall.length + " skrivna" };',
       '}']
io.open("steg2.js", "w", encoding="utf-8").write("\n".join(js) + "\n")
print("\nsteg2.js skriven (%d tecken)" % len("\n".join(js)))
