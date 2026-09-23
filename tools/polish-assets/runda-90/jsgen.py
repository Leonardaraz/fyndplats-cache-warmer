# -*- coding: utf-8 -*-
"""Runda 90 — genererar Steg 7-skrivningen som JavaScript.

☠️ GRINDEN LIGGER INNE I ANROPET, FÖRE PATCH:EN. En text som skrivs direkt i
   ett API-anrop kan inte läsas av en grind innan den lämnar chatten, och
   svaret ekar tillbaka exakt det man skrev — det ser rätt ut för att det ÄR
   det man skrev. Här räknas facit i JS på det som FAKTISKT ska skickas.

☠️ `for (const ch of s)` itererar KODPUNKTER i JS, precis som Pythons
   `for ch in s`. `charCodeAt` hade gett UTF-16-kodenheter och ett annat tal
   på allt utanför BMP.
"""
import json

plan = json.load(open("skrivplan.json"))
SITE = "e6d27e90-4749-4720-9afe-0bbe91c1b3d3"

js = """async () => {
  const SITE = %s;
  const PLAN = %s;

  const P = 1000000007;
  const synlig = (h) => h.replace(/<[^>]+>/g, " ").replace(/\\s+/g, " ").trim();
  const hasha = (t) => { let h = 0; for (const ch of t) h = (h * 31 + ch.codePointAt(0)) %% P; return h; };

  const ut = [];
  for (const [pid, p] of Object.entries(PLAN)) {
    // ☠️ GRINDEN: facit räknas på det som faktiskt ska skickas, INTE på det
    // som kommer tillbaka. Stämmer det inte skrivs ingenting för produkten.
    const s = synlig(p.html);
    if (s.length !== p.facitLangd || hasha(s) !== p.facitHash) {
      ut.push({ pid, skrivet: false, fel: "FACIT STÄMMER INTE",
                langd: s.length, vantad: p.facitLangd,
                hash: hasha(s), vantadHash: p.facitHash });
      continue;
    }

    // Färsk revision omedelbart före PATCH
    const g = await wix.request({ method: "GET",
      url: "https://www.wixapis.com/stores/v3/products/" + p.id,
      siteId: SITE });
    const fore = (g.data || g).product || (g.data || g);

    const body = { product: {
      id: p.id,
      revision: fore.revision,
      name: p.namn,
      slug: p.slug,
      brand: null,
      plainDescription: p.html,
      seoData: {
        tags: [
          { type: "title", children: p.titel, custom: false, disabled: false },
          { type: "meta", props: { name: "description", content: p.meta },
            children: "", custom: true, disabled: false }
        ],
        settings: {
          preventAutoRedirect: false,
          keywords: p.sokord.map((t, i) => ({ term: t, isMain: i === 0, origin: "USER" }))
        }
      }
    } };

    const r = await wix.request({ method: "PATCH",
      url: "https://www.wixapis.com/stores/v3/products/" + p.id,
      siteId: SITE, body });
    const efter = (r.data || r).product || (r.data || r);
    ut.push({ pid, skrivet: true, revision: efter.revision,
              namn: efter.name, slug: efter.slug,
              namnLangd: (efter.name || "").length,
              synlig: fore.visible });
  }
  return ut;
}"""  % (json.dumps(SITE), json.dumps(plan, ensure_ascii=False))

open("skrivning.js", "w").write(js)
print("skrivning.js:", len(js), "tecken,", len(plan), "produkter")
