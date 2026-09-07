# -*- coding: utf-8 -*-
"""Runda 88 — rättelse av modell I:s ohärledda hjulstorlek (Steg 7, andra vändan).

Texten som redan ligger i Wix skiljer sig från den rättade på EXAKT fyra
strängbyten (uppmätt med difflib mot den gamla `texter.py`). Anropet gör
därför bytena på Wix egen text i stället för att bära hela brödtexten en
gång till — och grindar resultatet mot det NYA facit innan något skrivs.

☠️ Grinden är oförändrad i sak: stämmer inte längd OCH hash mot `facit.json`
   skrivs ingenting för den produkten. Går ett byte inte igenom som väntat
   syns det som en hash-miss, inte som en tyst halvrättad sida.
"""
import json, os

HAR = os.path.dirname(os.path.abspath(__file__))
L = lambda n: json.load(open(os.path.join(HAR, n), encoding="utf-8"))
plan = {r["kort"]: r for r in L("skrivplan.json")}
import jsgen_sokord as _so  # noqa: E402  (samma tabell som Steg 7)
facit = L("facit.json")
vid = L("variantid.json")

BYTEN = [
    ["sparkcykel-barn-16-tum-korg-bla",  "sparkcykel-barn-bla-korg-stankskarmar"],
    ["sparkcykel-barn-16-tum-korg-rosa", "sparkcykel-barn-rosa-korg-stankskarmar"],
    ["modellen med 16-tumshjul och korg", "modellen med korg och stänkskärmar"],
    ["mönstrat slitbana", "mönstrad slitbana"],
]

rader = [{"kort": k, "id": vid[k]["id"], "slug": plan[k]["slug"],
          "name": plan[k]["name"], "title": plan[k]["title"],
          "meta": plan[k]["meta"],
          "huvudord": _so.SOKORD[k][0], "relord": _so.SOKORD[k][1],
          "langd": facit[k]["synligLangd"], "hash": facit[k]["synligHash"]}
         for k in plan]

JS = """async () => {
  const SITE = "e6d27e90-4749-4720-9afe-0bbe91c1b3d3";
  const RADER = %s;
  const BYTEN = %s;
  const synlig = (h) => h.replace(/<[^>]+>/g, " ").replace(/\\s+/g, " ").trim();
  const hasha = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.codePointAt(0)) %% 1000000007; return h; };
  const ut = {};
  for (const r of RADER) {
    const g = await wix.request({ scope: "site", siteId: SITE, method: "GET",
      url: "https://www.wixapis.com/stores/v3/products/" + r.id + "?fields=PLAIN_DESCRIPTION" });
    const p = g.data.product;
    let html = p.plainDescription ?? "";
    for (const [fran, till] of BYTEN) html = html.split(fran).join(till);
    const s = synlig(html);
    // ☠️ GRINDEN FORE SKRIVNINGEN — en text som inte stammer mot facit skrivs inte.
    if (s.length !== r.langd || hasha(s) !== r.hash) {
      ut[r.kort] = { GRIND: "FALLER", langd: s.length, vantat: r.langd,
                     hash: hasha(s), vantatHash: r.hash };
      continue;
    }
    const w = await wix.request({ scope: "site", siteId: SITE, method: "PATCH",
      url: "https://www.wixapis.com/stores/v3/products/" + r.id,
      body: { product: { revision: p.revision, name: r.name, slug: r.slug,
                         plainDescription: html, visible: false,
        seoData: { tags: [
          { type: "title", children: r.title, custom: false, disabled: false },
          { type: "meta", props: { name: "description", content: r.meta }, custom: false, disabled: false }
        ], settings: { preventAutoRedirect: false, keywords: [
          { term: r.huvudord, isMain: true, origin: "USER" },
          { term: r.relord, isMain: false, origin: "USER" }
        ] } } } } });
    const np = w.data.product;
    ut[r.kort] = { slug: np.slug?.name ?? np.slug, namn: np.name,
                   synlig: np.visible, langd: s.length, revision: np.revision,
                   sokord: (np.seoData?.settings?.keywords ?? []).map((x) => x.term) };
  }
  return ut;
}"""

js = JS % (json.dumps(rader, ensure_ascii=False), json.dumps(BYTEN, ensure_ascii=False))
open(os.path.join(HAR, "rattelse.js"), "w", encoding="utf-8").write(js)
print("rattelse.js  %d tecken, %d produkter" % (len(js), len(rader)))
