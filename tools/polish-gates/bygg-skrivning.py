#!/usr/bin/env python3
"""Emitterar STEG 1:s skrivanrop ur rundans filer — brödtext, namn, slug, SEO.

☠️ HELA POÄNGEN ÄR ATT NYTTOLASTEN BYGGS AV ETT SKRIPT. Runda H3 skrev
brödtexten ur fil (0 av 8 drev isär) och SEO-taggarna för hand ur minnet
(5 av 5 drev isär). En avskrift ÄR mekanismen; det är inte slarv i enstaka
fall. Regeln gäller varje fält som når kunden, inte bara brödtexten.

☠️ SPÄRREN LIGGER I SAMMA ANROP SOM SKRIVNINGEN, och den AVBRYTER hela
batchen. En kontroll i ett eget, tidigare anrop bevisar bara att just DEN
kopieringen var rätt — nästa anrop transkriberar om texten, och det är där
felet uppstår. `fontagen-weight` visar varför en delvis skriven batch är det
dyra utfallet: Wix strök spannet TYST och rapporterade framgång.

☠️ FACIT RÄKNAS PÅ STRÄNGEN SOM DEN SKICKAS. `raa-hash.tsv` kommer ur
`raahash.py`, som `rstrip("\\n")`:ar filen — se den filens docstring för
runda M4:s avbrott på ETT tecken av 3 515.

☠️ TVÅ SEO-TAGGAR, INTE FEM. Importens fem bär tyska og-värden som ska BORT,
inte skrivas om; en tredje tagg är ett gömställe (runda 19–33 lämnade
`klappbar` kvar i `og:title` sedan titeln rättats). `settings.keywords`
töms av samma skäl — importen lägger ett tyskt huvudnyckelord där.

⚠️ `revision` LÄSES I SAMMA ANROP. En fältmask-PATCH mot V3 avvisas med
`400 revision must not be empty`, och en revision hämtad i ett tidigare anrop
kan ha hunnit bli inaktuell.

⚠️ STEG 1 AV FYRA. Media skrivs ENSAM efteråt, kategorier sedan, och
`variantsInfo` SIST och ENSAM — den tål inte att samåka med andra fält och
tiger när den inte tas emot (#256).

ANVÄNDNING (från rundans katalog, efter raahash.py):
  python3 ../../polish-gates/bygg-skrivning.py > steg1.js
"""
import glob, io, json, os, sys

def las_tsv(namn, kolumner):
    ut = {}
    for r in io.open(namn, encoding="utf-8"):
        if r.strip():
            d = r.rstrip("\n").split("\t", kolumner - 1)
            ut[d[0]] = d[1:]
    return ut

ids  = las_tsv("ids.tsv", 3)
namn = las_tsv("namn.tsv", 2)
seo  = las_tsv("seo.tsv", 3)
raa  = las_tsv("raa-hash.tsv", 3)
slug = {r.split()[0]: r.split()[1] for r in io.open("slugs.txt", encoding="utf-8") if r.strip()}

plan, fel = [], []
for kort in ids:
    f = f"{kort}.html"
    if not os.path.exists(f):
        fel.append(f"{kort}: {f} saknas")
        continue
    # rstrip("\n"): strängen SOM DEN SKICKAS — samma som raahash.py räknar på.
    html = io.open(f, encoding="utf-8").read().rstrip("\n")
    for tecken in (" ", " "):
        if tecken in html:
            fel.append(f"{kort}: radseparator U+{ord(tecken):04X} i texten")
    if kort not in raa:
        fel.append(f"{kort}: saknar rad i raa-hash.tsv")
        continue
    if int(raa[kort][1]) != len(html):
        fel.append(f"{kort}: raa-hash.tsv är inaktuell ({raa[kort][1]} mot {len(html)}) — kör raahash.py")
    for källa, nyckel in ((namn, "namn.tsv"), (seo, "seo.tsv"), (slug, "slugs.txt")):
        if kort not in källa:
            fel.append(f"{kort}: saknar rad i {nyckel}")
    if kort in seo and not seo[kort][0].endswith("| Fyndplats"):
        fel.append(f"{kort}: seo-titeln saknar '| Fyndplats'")
    if kort in seo and len(seo[kort][0]) > 60:
        fel.append(f"{kort}: seo-titeln är {len(seo[kort][0])} tecken (tak 60)")
    if kort in seo and len(seo[kort][1]) > 160:
        fel.append(f"{kort}: seo-beskrivningen är {len(seo[kort][1])} tecken (tak 160)")
    if kort in namn and kort in seo and kort in slug:
        plan.append({
            "kort": kort, "pid": ids[kort][0], "namn": namn[kort][0], "slug": slug[kort],
            "html": html, "raa": int(raa[kort][0]), "tecken": len(html),
            "seoTitel": seo[kort][0], "seoBesk": seo[kort][1],
        })

if fel:
    sys.stderr.write("BYGGET FALLER:\n" + "\n".join("  " + f for f in fel) + "\n")
    sys.exit(1)

print("async function () {")
print("  // Genererad av tools/polish-gates/bygg-skrivning.py — skriv den aldrig för hand.")
print("  const SUMMA = function (s) {")
print("    let h = 0;")
print("    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;")
print("    return h;")
print("  };")
print()
print("  const PLAN = [")
for p in plan:
    print("    {")
    for nyckel in ("kort", "pid", "namn", "slug", "seoTitel", "seoBesk", "html"):
        print(f"      {nyckel}: {json.dumps(p[nyckel], ensure_ascii=False)},")
    print(f"      raa: {p['raa']},")
    print(f"      tecken: {p['tecken']}")
    print("    },")
print("  ];")
print("""
  // ☠️ SPÄRREN LIGGER HÄR, I SAMMA ANROP SOM SKRIVNINGEN, och den avbryter
  // HELA batchen. En delvis skriven batch är det dyra utfallet.
  const avvik = PLAN
    .filter(function (p) { return SUMMA(p.html) !== p.raa || p.html.length !== p.tecken; })
    .map(function (p) { return { kort: p.kort, fick: SUMMA(p.html), vantat: p.raa, tecken: p.html.length, vantatTecken: p.tecken }; });
  if (avvik.length) return { AVBRUTET: "transkriberingsfel — ingenting skrivet", avvik: avvik };

  const ut = [];
  for (const p of PLAN) {
    // ⚠️ Revisionen läses i SAMMA anrop — en äldre är inaktuell, och en
    // fältmask-PATCH utan den avvisas med 400.
    const f = await wix.request({ method: "GET", url: "/stores/v3/products/" + p.pid });
    const rev = f.data.product.revision;

    const kropp = {
      product: {
        revision: rev,
        name: p.namn,
        slug: p.slug,
        plainDescription: p.html,
        visible: true,
        seoData: {
          tags: [
            { type: "title", children: p.seoTitel },
            { type: "meta", props: { name: "description", content: p.seoBesk } }
          ],
          settings: { keywords: [] }
        }
      },
      fieldMask: { paths: ["name", "slug", "plainDescription", "visible", "seoData"] }
    };

    try {
      const r = await wix.request({ method: "PATCH", url: "/stores/v3/products/" + p.pid, body: kropp });
      ut.push({ kort: p.kort, ok: true, revisionFore: rev, revisionEfter: r.data.product.revision });
    } catch (e) {
      ut.push({ kort: p.kort, ok: false, fel: String(e && e.message || e).slice(0, 300) });
    }
  }

  // ⚠️ PATCH-svaret är INGEN återläsning — dess projektion utelämnar
  // plainDescription helt (#253). Kvittot är aterlas.js en stund senare.
  const ok = ut.filter(function (r) { return r.ok; }).length;
  return { rader: ut, SAMMANFATTNING: ok + " av " + ut.length + " skrivna" };
}""")
