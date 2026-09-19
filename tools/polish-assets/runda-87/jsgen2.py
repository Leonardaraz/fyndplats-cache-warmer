# -*- coding: utf-8 -*-
"""Genererar skrivnings-anropen ur skrivplan.json.

Texten typas ALDRIG för hand in i anropet — den genereras mekaniskt ur den
fil linten och mutationstestet har godkänt. Det är hela poängen med batch
64:s mätning (fil → 0 fel, inline → 9 fel).
"""
import json
import os
HAR = os.path.dirname(os.path.abspath(__file__))
plan = json.load(open(os.path.join(HAR, "skrivplan.json"), encoding="utf-8"))
HUVUD = """async () => {
  const SITE = "e6d27e90-4749-4720-9afe-0bbe91c1b3d3";
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
    const g = await wix.request({ scope: "site", siteId: SITE, method: "GET",
      url: "https://www.wixapis.com/stores/v3/products/" + r.id });
    const rev = g.data.product.revision;
    const w = await wix.request({ scope: "site", siteId: SITE, method: "PATCH",
      url: "https://www.wixapis.com/stores/v3/products/" + r.id,
      body: { product: {
        revision: rev,
        name: r.name,
        slug: r.slug,                 // NAKEN strang i en PATCH
        plainDescription: r.html,
        brand: null,                  // husmarket ar strippat ur namnet
        visible: false,               // utkastet forblir utkast tills Steg 13
        seoData: {
          tags: [
            { type: "title", children: r.title, custom: false, disabled: false },
            { type: "meta", props: { name: "description", content: r.meta }, custom: false, disabled: false }
          ],
          // Runda 86: settings ror sig INTE av en tags-skrivning, och
          // barer darfor leverantorens tyska rubrik genom hela poleringen.
          settings: { preventAutoRedirect: false, keywords: [
            { term: r.huvudord, isMain: true, origin: "USER" },
            { term: r.relord, isMain: false, origin: "USER" }
          ] }
        }
      } } });
    const np = w.data.product;
    ut[r.kort] = { revision: np.revision, slug: np.slug?.name ?? np.slug,
                   synlig: np.visible, langd: s.length,
                   sokord: (np.seoData?.settings?.keywords ?? []).map((k) => k.term) };
  }
  return ut;
}"""
for i, halva in enumerate([plan[:4], plan[4:]], 1):
    js = HUVUD % json.dumps(halva, ensure_ascii=False)
    open(os.path.join(HAR, "skrivning-%d.js" % i), "w", encoding="utf-8").write(js)
    print("skrivning-%d.js  %d tecken, %d produkter" % (i, len(js), len(halva)))
