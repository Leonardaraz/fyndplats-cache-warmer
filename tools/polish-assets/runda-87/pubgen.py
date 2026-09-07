# -*- coding: utf-8 -*-
"""Genererar publiceringsanropet (Steg 13, andra halvan).

☠️ Facit-grinden ligger INNE i anropet, fore PATCH:en. Stammer inte texten
mot bade langd och hash skrivs INGENTING for den produkten — grinden ar
inte en rapport efterat, den ar det som gor en felskriven produkt omojlig
att publicera.

☠️ Hela variants-arrayen ekas ordagrant tillbaka. En variantsInfo-PATCH
med en kapad array svarar 428 MISSING_VARIANT_OPTION_CHOICE.
"""
import json
import os

HAR = os.path.dirname(os.path.abspath(__file__))
L = lambda n: json.load(open(os.path.join(HAR, n), encoding="utf-8"))

plan = L("skrivplan.json")
facit = L("facit.json")
vid = L("variantid.json")

rader = [{"kort": r["kort"], "id": r["id"], "slug": r["slug"],
          "langd": facit[r["kort"]]["synligLangd"],
          "hash": facit[r["kort"]]["synligHash"],
          "sku": vid[r["kort"]]["sku"]} for r in plan]

HUVUD = """async () => {
  const SITE = "e6d27e90-4749-4720-9afe-0bbe91c1b3d3";
  const RADER = %s;
  const synlig = (h) => h.replace(/<[^>]+>/g, " ").replace(/\\s+/g, " ").trim();
  const hasha = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.codePointAt(0)) %% 1000000007; return h; };
  const ut = {};
  for (const r of RADER) {
    const g = await wix.request({ scope: "site", siteId: SITE, method: "GET",
      url: "https://www.wixapis.com/stores/v3/products/" + r.id + "?fields=PLAIN_DESCRIPTION" });
    const p = g.data.product;

    // ☠️ GRINDEN LIGGER FORE SKRIVNINGEN. Stammer inte texten mot facit
    //    skrivs ingenting — en felskriven produkt ska inte ga att publicera.
    const s = synlig(p.plainDescription ?? "");
    if (s.length !== r.langd || hasha(s) !== r.hash) {
      ut[r.kort] = { GRIND: "FALLER", langd: s.length, vantat: r.langd,
                     hash: hasha(s), vantatHash: r.hash };
      continue;
    }

    // Hela arrayen ekas ordagrant — en kapad array ger 428
    // MISSING_VARIANT_OPTION_CHOICE.
    const varianter = (p.variantsInfo?.variants ?? []).map((v) => ({ ...v, visible: true }));
    const w = await wix.request({ scope: "site", siteId: SITE, method: "PATCH",
      url: "https://www.wixapis.com/stores/v3/products/" + r.id,
      body: { product: { revision: p.revision, visible: true,
                         variantsInfo: { variants: varianter } },
              fieldMask: { paths: ["visible", "variantsInfo"] } } });

    // Aterlast i ett EGET anrop — svaret pa en skrivning ar inget kvitto.
    const v2 = await wix.request({ scope: "site", siteId: SITE, method: "GET",
      url: "https://www.wixapis.com/stores/v3/products/" + r.id });
    const q = v2.data.product;
    const vs = q.variantsInfo?.variants ?? [];
    ut[r.kort] = {
      status: (q.visible && vs.every((x) => x.visible)) ? "PUBLICERAD" : "EJ SYNLIG",
      slug: typeof q.slug === "string" ? q.slug : (q.slug?.name ?? ""),
      produktSynlig: q.visible, variantSynlig: vs.map((x) => x.visible),
      pris: vs[0]?.price?.actualPrice?.amount ?? null,
      sku: vs[0]?.sku ?? null, skuStammer: (vs[0]?.sku ?? "") === r.sku,
      revision: w.data.product.revision };
  }
  return ut;
}"""

js = HUVUD % json.dumps(rader, ensure_ascii=False)
open(os.path.join(HAR, "publicera.js"), "w", encoding="utf-8").write(js)
print("publicera.js  %d tecken, %d produkter" % (len(js), len(rader)))
