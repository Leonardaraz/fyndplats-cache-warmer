# -*- coding: utf-8 -*-
"""Genererar de två skrivnings-anropen ur skrivplan.json.

Texten typas ALDRIG för hand in i anropet — den genereras mekaniskt ur den
fil linten och mutationstestet har godkänt. Det är hela poängen med batch
64:s mätning (fil → 0 fel, inline → 9 fel).
"""
import json
import os
HAR = os.path.dirname(os.path.abspath(__file__))
plan = json.load(open(os.path.join(HAR, "skrivplan.json"), encoding="utf-8"))
HUVUD = """async () => {
  const RADER = %s;
  const synlig = (h) => h.replace(/<[^>]+>/g, " ").replace(/\\s+/g, " ").trim();
  const hasha = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.codePointAt(0)) %% 1000000007; return h; };
  const ut = {};
  for (const r of RADER) {
    const s = synlig(r.html);
    if (s.length !== r.langd || hasha(s) !== r.hash) {
      ut[r.kort] = { GRIND: "FALLER", langd: s.length, vantat: r.langd, hash: hasha(s), vantatHash: r.hash };
      continue;                       // skriver INGENTING for den har produkten
    }
    const g = await wix.request({ scope: "site", method: "GET",
      url: "https://www.wixapis.com/stores/v3/products/" + r.id });
    const rev = g.data.product.revision;
    const w = await wix.request({ scope: "site", method: "PATCH",
      url: "https://www.wixapis.com/stores/v3/products/" + r.id,
      body: { product: {
        revision: rev,
        name: r.name,
        slug: r.slug,                 // NAKEN strang i en PATCH
        plainDescription: r.html,
        visible: false,               // utkastet forblir utkast tills Steg 13
        seoData: { tags: [
          { type: "title", children: r.title, custom: false, disabled: false },
          { type: "meta", props: { name: "description", content: r.meta }, custom: false, disabled: false }
        ] }
      } } });
    ut[r.kort] = { revision: w.data.product.revision, slug: w.data.product.slug?.name ?? w.data.product.slug,
                   synlig: w.data.product.visible, langd: s.length };
  }
  return ut;
}"""
for i, halva in enumerate([plan[:4], plan[4:]], 1):
    js = HUVUD % json.dumps(halva, ensure_ascii=False)
    open(os.path.join(HAR, "skrivning-%d.js" % i), "w", encoding="utf-8").write(js)
    print("skrivning-%d.js  %d tecken, %d produkter" % (i, len(js), len(halva)))
