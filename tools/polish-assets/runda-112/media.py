# -*- coding: utf-8 -*-
"""Runda 112 Steg 9 — bygger galleri-PATCHarna och deras kvitto.

☠️ `media.itemsInfo.items` ERSÄTTS I SIN HELHET. Varje item måste därför bära
   sin `altText`, också de vi inte rör — ett item utan fältet blir ett item
   utan alt-text.

☠️ ITEM-ID:T ÄR FIL-ID:T. Uppmätt mot skarpa V3 före skrivningen:
   `items[0].id === items[0].image.id`. Kroppen skickar alltså `{id, altText}`
   och ALDRIG `url` — `url` betyder "extern adress" för V3, och en
   wixstatic-adress importeras då om till en NY fil.

☠️ `media.main` SKICKAS INTE. Den är read-only och sätts till första item:et;
   inkluderas den ignorerar Wix TYST hela `media`-objektet.

☠️ OCH SVARET KAN INTE ANVÄNDAS SOM KVITTO — PATCH returnerar inte
   `media.itemsInfo` alls, så det går inte att skilja "sparat" från "raderat".
   Verifieringen är en EGEN GET med `fields=MEDIA_ITEMS_INFO`, och den räknar
   både antalet, ordningen och varje alt-text.

⚠️ `visible: false` skickas med, som varje PATCH i kedjan. Den speglar ned
   `false` på varianterna igen — det är ett normalförlopp, och Steg 13 sätter
   båda till `true`.
"""
import importlib.util
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import matt                                                       # noqa: E402
import alt as A                                                   # noqa: E402
import bildplan                                                   # noqa: E402

# ⚠️ `hamta-bilder.py` har bindestreck i namnet och går inte att importera med
#    `import`. Den laddas därför explicit — hellre det än en kopia av
#    fil-id-listan här, som hade glidit isär från den som HÄMTADE bilderna.
_HAR = os.path.dirname(os.path.abspath(__file__))
_s = importlib.util.spec_from_file_location("hb", os.path.join(_HAR, "hamta-bilder.py"))
HB = importlib.util.module_from_spec(_s)
_s.loader.exec_module(HB)

# Uppladdade 2026-09-09, alla verifierade `200` mot `/v1/fill/w_400,h_400`.
KORT = {
    "1b87909f": "b379ce_bf21946c975247539502c996f6e64010~mv2.jpg",
    "422ab1bd": "b379ce_9d2eab4e13aa4cc5b46616a14eb8d2d3~mv2.jpg",
    "a8c82049": "b379ce_1c56905a993d451a8ae368aa4f0c79be~mv2.jpg",
    "ddca577d": "b379ce_9b9b173c96384066a3f6d93a8c08a034~mv2.jpg",
    "77d2b35c": "b379ce_eaca2a111a4d41ad8138edc4c8ad2cf0~mv2.jpg",
    "0370673c": "b379ce_fa368d85e58d42ada7c4873d517c3206~mv2.jpg",
    "fe11166f": "b379ce_72247113689f4681a59b64b33e1fdb38~mv2.jpg",
    "623b6504": "b379ce_682142889f9b488096aad3c5f4c34449~mv2.jpg",
    "77e4a558": "b379ce_8085763124a9497a80f4d7d74bcfd86f~mv2.jpg",
}
# Beskurna råbilder → den NYA filen som ersätter originalet i galleriet.
ERSATT = {("1b87909f", 3): "b379ce_8fd42aabf24f4357aa512e9c55216f75~mv2.jpg"}


def poster():
    ut = []
    for k in matt.RUNDAN:
        items = []
        for idx, txt in A.ALT[k]:
            if idx == "KORT":
                fil = KORT[k]
            elif (k, idx) in ERSATT:
                fil = ERSATT[(k, idx)]
            else:
                fil = HB.GALLERIER[k][idx - 1]
            items.append({"id": fil, "altText": txt})
        assert [i for i, _ in A.ALT[k]] == bildplan.GALLERI[k], k
        ut.append({"k": k, "id": matt.WIX[k], "items": items})
    return ut


if __name__ == "__main__":
    p = poster()
    for i in range(0, len(p), 3):
        namn = "js-media-%d.txt" % (i // 3 + 1)
        js = """async function() {
  const P = %s;
  const ut = [];
  for (const p of P) {
    const g0 = await wix.request({ scope: "site", method: "GET",
      url: `https://www.wixapis.com/stores/v3/products/${p.id}` });
    const gp = (g0.data && g0.data.product) || g0.product || g0;
    await wix.request({ scope: "site", method: "PATCH",
      url: `https://www.wixapis.com/stores/v3/products/${p.id}`,
      body: { product: { id: p.id, revision: gp.revision, visible: gp.visible,
        media: { itemsInfo: { items: p.items } } } } });
    const r = await wix.request({ scope: "site", method: "GET",
      url: `https://www.wixapis.com/stores/v3/products/${p.id}?fields=MEDIA_ITEMS_INFO` });
    const q = (r.data && r.data.product) || r.product || r;
    const it = (((q.media || {}).itemsInfo || {}).items) || [];
    const ordning = it.map(x => x.id).join("|") === p.items.map(x => x.id).join("|");
    const alt = it.every((x, n) => x.altText === p.items[n].altText);
    const utanAlt = it.filter(x => !x.altText).length;
    ut.push([p.k,
      it.length === p.items.length ? `${it.length} bilder ok` : `ANTAL ${it.length} != ${p.items.length}`,
      ordning ? "ordning ok" : "ORDNING FEL",
      alt ? "alt ok" : "ALT FEL",
      utanAlt === 0 ? "inga tomma alt" : `${utanAlt} UTAN ALT`,
      q.visible === false ? "utkast ok" : `PUBLICERAD: ${q.visible}`,
    ].join(" | "));
  }
  return ut;
}""" % json.dumps(p[i:i + 3], ensure_ascii=False)
        open(namn, "w").write(js)
        print("%s  %d produkter  %d tecken" % (namn, len(p[i:i + 3]), len(js)))
