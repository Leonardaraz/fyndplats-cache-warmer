# -*- coding: utf-8 -*-
"""Runda 107 Steg 9 — bygger media-nyttolasten.

☠️ ORDNINGEN VERIFIERAS, DEN ANTAS INTE. Rundan flyttar måttritningen sist och
   tar bort fyra bilder — allt uttryckt som ORIGINALPOSITIONER. Skulle Wix
   ordning skilja sig från den `hamta-bilder.py` hämtade, hade en positions-
   baserad omflyttning tyst satt fel alt-text på fel bild. Skriptet skickar
   därför med FILNAMNEN per position och avbryter produkten om de inte stämmer.

☠️ `visible: false` i varje PATCH — annars publiceras utkastet.
☠️ `id`, aldrig `url`: en wixstatic-adress får Wix att importera om filen.
☠️ `items[].altText`, inte `items[].image.altText` — `image` är readOnly.
⚠️  PATCH-svaret bär inte `media.itemsInfo`. Kvittot är en EGEN GET.
"""
import importlib.util, json, os, sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HAR)
import alt as A                                          # noqa: E402
import matt                                              # noqa: E402

_s = importlib.util.spec_from_file_location("hb", HAR + "/hamta-bilder.py")
HB = importlib.util.module_from_spec(_s); _s.loader.exec_module(HB)

KORTFIL = {
 "5f14c112": "b379ce_1129d0582fe74c56a04919ab962b06f1~mv2.jpg",
 "957b042d": "b379ce_b2246903a3b2447485dcba526e8bc2af~mv2.jpg",
 "6649471e": "b379ce_3c7046716a8148ee93df12a9ad1ce1c7~mv2.jpg",
 "854371fe": "b379ce_2f25222840af4e6e840af049ca8e9245~mv2.jpg",
 "da1a8a75": "b379ce_0f1f42dd6f8e47c4a3ee00761e0370b1~mv2.jpg",
 "64c0809d": "b379ce_329bd8e76c7e4507acbc80b1a886790b~mv2.jpg",
}

# Galleriordningen som ORIGINALPOSITION (1-baserad), "K" = vårt eget kort.
# Runbookens ordning: 1 hjälte, 2 verklighet, 3+ egna kort, SIST måttritning.
#
# ⚠️ ALLA SEX HAR IDENTISK STRUKTUR — 1 studio, 2 miljö, 3 måttritning, 4 väv,
#    5 fot — och därför samma rad. Den skrivs ändå ut sex gånger: ordningen är
#    en MÄTNING per produkt (Steg 4), inte en familjeregel, och en delad rad
#    hade tystnat den dag en sida får ett galleri till.
#
# ☠️ INGEN BILD TAS BORT den här rundan. Steg 4 granskade alla trettio: noll
#    tysk text i pixlarna, noll logotyper, och måttritningarna bär bara siffror.
ORDNING = {k: [1, 2, "K", 4, 5, 3] for k in matt.UTKAST}


def poster():
    ut = []
    for k in matt.UTKAST:
        alt = A.galleri(k)
        ordning = ORDNING[k]
        assert len(alt) == len(ordning), (k, len(alt), len(ordning))
        rader = []
        for plats, a in zip(ordning, alt):
            if plats == "K":
                rader.append({"fil": KORTFIL[k], "alt": a, "kalla": "kort"})
            else:
                rader.append({"fil": HB.GALLERIER[k][plats - 1], "alt": a,
                              "kalla": "orig %d" % plats})
        ut.append({"k": k, "id": matt.UTKAST[k][6],
                   "vantade": HB.GALLERIER[k], "rader": rader})
    return ut


if __name__ == "__main__":
    p = poster()
    for d in p:
        print("=== %s  %d bilder" % (d["k"], len(d["rader"])))
        for i, r in enumerate(d["rader"], 1):
            print("  %d  %-9s %s" % (i, r["kalla"], r["alt"][:78]))
    js = """async function() {
  const P = %s;
  const ut = [];
  for (const p of P) {
    const g = await wix.request({ method: "GET",
      url: `/stores/v3/products/${p.id}?fields=MEDIA_ITEMS_INFO` });
    const gp = (g.data && g.data.product) || g.product || g;
    const items = ((gp.media || {}).itemsInfo || {}).items || [];
    const filnamn = items.map((it) => {
      const u = (it.image && (it.image.url || it.image.id)) || it.id || "";
      const m = String(u).match(/[^/]+~mv2\\.[a-z]+/i);
      return m ? m[0] : String(u);
    });
    if (JSON.stringify(filnamn) !== JSON.stringify(p.vantade)) {
      ut.push(`${p.k} | AVBRUTEN: galleriet ser annorlunda ut: ${JSON.stringify(filnamn)}`);
      continue;
    }
    const nya = p.rader.map((r) => ({ id: r.fil, altText: r.alt }));
    await wix.request({ method: "PATCH", url: `/stores/v3/products/${p.id}`,
      body: { product: { id: p.id, revision: gp.revision, visible: false,
                         media: { itemsInfo: { items: nya } } } } });
    const r2 = await wix.request({ method: "GET",
      url: `/stores/v3/products/${p.id}?fields=MEDIA_ITEMS_INFO` });
    const q = (r2.data && r2.data.product) || r2.product || r2;
    const ef = (((q.media || {}).itemsInfo || {}).items) || [];
    const efFil = ef.map((it) => {
      const u = (it.image && (it.image.url || it.image.id)) || it.id || "";
      const m = String(u).match(/[^/]+~mv2\\.[a-z]+/i);
      return m ? m[0] : String(u);
    });
    const vantFil = p.rader.map((r) => r.fil);
    const vantAlt = p.rader.map((r) => r.alt);
    const efAlt = ef.map((it) => it.altText || "");
    ut.push([p.k,
      ef.length === p.rader.length ? `${ef.length} bilder ok` : `ANTAL ${ef.length} != ${p.rader.length}`,
      JSON.stringify(efFil) === JSON.stringify(vantFil) ? "ordning ok" : `ORDNING FEL: ${JSON.stringify(efFil)}`,
      JSON.stringify(efAlt) === JSON.stringify(vantAlt) ? "alt ok" : `ALT FEL: ${JSON.stringify(efAlt.map((a, i) => a === vantAlt[i] ? "ok" : a))}`,
      q.visible === false ? "utkast ok" : `PUBLICERAD! visible=${q.visible}`,
    ].join(" | "));
  }
  return ut;
}""" % json.dumps(p, ensure_ascii=False)
    open("js-media.txt", "w").write(js)
    print("\njs-media.txt  %d tecken" % len(js))
