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
 "a75fcfde": "b379ce_420a607bc0a340229623e51e45f323a5~mv2.jpg",
 "c0770388": "b379ce_f40764ee306b4fdb810bf86cdfd5ac76~mv2.jpg",
 "2253c509": "b379ce_5d18994f6b5c404682a2e3fc511fd806~mv2.jpg",
 "2435c4d1": "b379ce_fef62e18b8fd467f86271a070ddd1668~mv2.jpg",
 "dcdf889d": "b379ce_25e285b2c20f48beaff571527cb86d30~mv2.jpg",
 "525e6acf": "b379ce_6a590683f4e444d4bf181283123738c5~mv2.jpg",
 "079f2901": "b379ce_cb016dd42e5a4d8a99a0f750beb2883d~mv2.jpg",
}

# Galleriordningen som ORIGINALPOSITION (1-baserad), "K" = vårt eget kort.
# Runbookens ordning: 1 hjälte, 2 verklighet, 3+ egna kort, SIST måttritning.
ORDNING = {
 "a75fcfde": [1, 2, "K", 4, 5, 3],
 "c0770388": [1, 2, "K", 4, 5, 3],
 "2253c509": [1, 2, "K", 5, 3],      # 4 bort: gånghage som inte ingår
 "2435c4d1": [1, 2, "K", 4, 5, 3],
 "dcdf889d": [1, 2, "K", 5, 3],      # 4 bort: samma gånghage
 "525e6acf": [1, 2, "K", 5, 3],      # 4 bort: tysk text i pixlarna
 # ☠️ 079f2901 tappar sin MÅTTRITNING (originalposition 3), inte en miljöbild.
 #    Den visar 122 × 53 × 92 och 48,5 cm; produkten är 123,5 × 62,6 × 92,5 —
 #    och leverantörens EGEN tyska titel för just den här artikeln skriver ut
 #    "123,5x62,6x92,5 cm". Syskonets ritning stämmer mot samma spec-text på
 #    varje tal. En kund som mäter mot 53 cm djup får en vara som är 62,6.
 #    Kortet bär måtten i stället.
 "079f2901": [1, 2, "K", 4, 5],
}


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
        ut.append({"k": k, "id": matt.UTKAST[k][8],
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
