# -*- coding: utf-8 -*-
"""Genererar Steg 7-skrivningen ur skrivplan.json (aldrig inline).

☠️ Texten typas ALDRIG för hand in i anropet. Batch 64 mätte nio fel mot
   noll: en sträng som skrivs direkt i ett JSON-anrop kan ingen grind läsa,
   och API-svaret ekar tillbaka exakt det man skrev.
☠️ Facit-grinden ligger INNE i det genererade anropet, före PATCH:en.
   Stämmer inte längd OCH hash skrivs ingenting för den produkten.
☠️ `slug` skickas som NAKEN STRÄNG i en PATCH — GET returnerar {name: …}.
☠️ `visible: false` skickas uttryckligen. Varje PATCH som utelämnar det
   PUBLICERAR utkastet (uppmätt mot skarpa V3 2026-08-28).
☠️ `seoData.settings.keywords` skrivs i SAMMA anrop: en tags-skrivning rör
   inte `settings`, så leverantörens tyska rubrik överlever annars hela
   poleringen (runda 86 fick rätta det separat på alla sju).
"""
import json, os

HAR = os.path.dirname(os.path.abspath(__file__))
L = lambda n: json.load(open(os.path.join(HAR, n), encoding="utf-8"))

plan = L("skrivplan.json")
vid = L("variantid.json")

from jsgen_sokord import SOKORD                                        # noqa: E402

rader = []
for r in plan:
    huvud, rel = SOKORD[r["kort"]]
    rader.append({"kort": r["kort"], "id": vid[r["kort"]]["id"],
                  "name": r["name"], "slug": r["slug"], "html": r["html"],
                  "title": r["title"], "meta": r["meta"],
                  "huvudord": huvud, "relord": rel,
                  "langd": r["langd"], "hash": r["hash"]})

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
        visible: false,               // utkastet forblir utkast till Steg 13
        seoData: {
          tags: [
            { type: "title", children: r.title, custom: false, disabled: false },
            { type: "meta", props: { name: "description", content: r.meta }, custom: false, disabled: false }
          ],
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

for i, halva in enumerate([rader[:4], rader[4:]], 1):
    js = HUVUD % json.dumps(halva, ensure_ascii=False)
    open(os.path.join(HAR, "skrivning-%d.js" % i), "w", encoding="utf-8").write(js)
    print("skrivning-%d.js  %d tecken, %d produkter" % (i, len(js), len(halva)))
