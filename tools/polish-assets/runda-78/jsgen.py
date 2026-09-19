# -*- coding: utf-8 -*-
"""Runda 78 — genererar JS-kroppen till Steg 7 + 9 + 10 i ETT anrop per produkt.

☠️ FACITET LIGGER INNE I ANROPET. Batch 64 mätte att en text skriven inline i
   API-anropet inte går att grinda innan den lämnar chatten, och att svaret
   ekar tillbaka exakt det man skrev — det ser rätt ut för att det ÄR det man
   skrev. Skriptet bygger därför JS:en ur de FILER linten redan godkänt, och
   lägger en längd- och hashkontroll i själva koden.

☠️ `variantsInfo`-PATCH PUBLICERAR ett utkast. Ingen av skrivningarna nedan
   rör varianter, och `visible` skickas aldrig — produkterna ska förbli
   utkast tills Steg 12.

☠️ SLUGGEN ÄR EN NAKEN STRÄNG PÅ PATCH. Formen `{name: "…"}` är den GET
   returnerar, och en skrivning byggd ur ett läst svar väljer därför fel.
   Uppmätt i den här rundan: `400 "Unexpected value for StringValue"` —
   ett fel som varken nämner fältet eller formen. Samma familj som runda
   76:s bildpost, där läsformen och skrivformen också skiljer sig.

⚠️ MEDIA SKRIVS I ETT EGET ANROP (`mediajs.py`), inte i den här PATCHen.
   Runda 76 och 77 gjorde likadant, och skälet är att ett PATCH-eko
   utelämnar media: läggs de i samma anrop går det inte att se på svaret
   vilken av de två skrivningarna som tog.
"""
import json, os, re, sys
HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HAR)
import texter, media                                                  # noqa: E402

BILDER = json.load(open(os.path.join(HAR, "bilder.json"), encoding="utf-8"))
FACIT = json.load(open(os.path.join(HAR, "facit.json"), encoding="utf-8"))
MFACIT = json.load(open(os.path.join(HAR, "media-facit.json"), encoding="utf-8"))
plan = media.plan()

data = {}
for p in texter.PRODUKTER:
    k = p["kort"]
    data[k] = {
        "id": BILDER[k]["id"], "name": p["name"], "slug": p["slug"],
        "title": p["title"], "meta": p["meta"], "html": texter.bygg(p),
        "media": plan[k],
        "langd": FACIT[k]["synligLangd"], "hash": FACIT[k]["synligHash"],
        "altHash": MFACIT[k]["altHash"], "antal": MFACIT[k]["antal"],
    }

JS = """async function () {
  const D = %s;
  const ut = {};
  const synlig = function (h) {
    return h.replace(/<[^>]+>/g, " ").replace(/\\s+/g, " ").trim();
  };
  const hasha = function (s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) %% 1000000007;
    return h;
  };
  for (const k of Object.keys(D)) {
    const d = D[k];
    // ☠️ FACITGRINDEN LIGGER FÖRE SKRIVNINGEN. Stämmer inte längd och hash
    //    är strängen inte den lint godkände, och då skrivs ingenting.
    const s = synlig(d.html);
    if (s.length !== d.langd || hasha(s) !== d.hash) {
      ut[k] = { fel: "FACIT", langd: s.length, vantat: d.langd };
      continue;
    }
    const g = await wix.request({
      method: "get",
      url: "https://www.wixapis.com/stores/v3/products/" + d.id,
    });
    const rev = g.data.product.revision;
    const r = await wix.request({
      method: "patch",
      url: "https://www.wixapis.com/stores/v3/products/" + d.id,
      body: {
        product: {
          revision: rev,
          name: d.name,
          slug: d.slug,
          plainDescription: d.html,
          seoData: { tags: [
            { type: "title", children: d.title, custom: false, disabled: false },
            { type: "meta", props: { name: "description", content: d.meta },
              custom: false, disabled: false },
          ] },
        },
        fieldMask: ["name", "slug", "plainDescription", "seoData"],
      },
    });
    const rs = r.data.product.slug;
    ut[k] = { revision: r.data.product.revision,
              slug: typeof rs === "string" ? rs : (rs && rs.name) };
  }
  return ut;
}""" % json.dumps(data, ensure_ascii=False)

def js_for(nycklar):
    d = dict((k, data[k]) for k in nycklar)
    return JS.replace(json.dumps(data, ensure_ascii=False),
                      json.dumps(d, ensure_ascii=False))


if __name__ == "__main__":
    # ⚠️ Delat i två halvor. ExecuteWixAPI har 60 s och gör två anrop per
    #    produkt (läs revision, skriv); åtta produkter ligger för nära taket.
    halvor = [["5646a8ff", "f18dfc3b", "239e68b8", "15ff0d64"],
              ["d348bf64", "fa078e03", "87de04ad", "28532aab"]]
    for i, h in enumerate(halvor, 1):
        js = js_for(h)
        namn = os.path.join(HAR, "skrivning-%d.js" % i)
        open(namn, "w", encoding="utf-8").write(js)
        print("skrivning-%d.js: %d byte, %s" % (i, len(js), ", ".join(h)))
