# -*- coding: utf-8 -*-
"""Bygger JS-anropen för Steg 7 och facit för verifieringen.

☠️ SEX AV ÅTTA SIDOR ÄR LIVE. Runda 108:s PATCH satte `visible: false` fast —
   rätt när alla åtta var utkast, och en AVPUBLICERING av sex säljande sidor
   här. `visible` sätts därför per produkt ur matt.RUNDAN, och verifieringen
   prövar mot samma värde i stället för mot en konstant. Runbookens regel är
   att varje PATCH ska BÄRA `visible` uttryckligen; den säger inget om vilket
   värde, och det är precis den halvan som är lätt att missa i en blandad
   batch.

☠️ Kvittot är normalisering + EXAKT hash, inte en längdformel. Runbookens
   formel saknade `<li>`-termen och gav +105 till +140 tecken fel i runda 47.

☠️ KROPPEN HETER `body`, INTE `data` — uppmätt 2026-09-09 med A/B i samma
   anrop. `data:` skickas inte alls, och felet syns bara om anropet HAR en
   kropp: en PATCH svarar `revision must not be empty` (kroppen försvann), men
   en `products/query` svarar **200 med femtio orelaterade rader** — filtret
   föll bort och frågan blev ett osorterat helsvep. En sluggkrockskoll hade
   alltså sagt "ingen krock" och sett bemängd ut medan den inte frågat något.

☠️ Hashen räknas med `h*31 % 1e9+7` — exakt i BÅDA språken. FNV-1a:s
   `h*16777619` överstiger 2^53 i JavaScripts float64 och gav åtta avvikelser
   av åtta där varenda längd stämde: felet låg i hashen, inte i datan.
"""
import json, os, re, sys

sys.path.insert(0, os.path.dirname(__file__))
import texter as T                                       # noqa: E402
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import grindar as G                                       # noqa: E402

# Fulla id ur matt.py, så de inte kan glida isär.
import matt                                               # noqa: E402
FULLA = {k: v[6] for k, v in matt.ALLA.items()}
# Rundans två är utkast; runda 108:s sex är publicerade och ska FÖRBLI det.
SYNLIG = {k: (k not in matt.RUNDAN) for k in matt.ALLA}


def normalisera(h):
    h = re.sub(r">\s*\n\s*<", "><", h)
    h = h.replace("<strong>", '<span style="font-weight: 700">')
    h = h.replace("</strong>", "</span>")
    h = re.sub(r'(<a href="[^"]+")>', r'\1 target="_self">', h)
    h = re.sub(r"<li>(?!<p>)(.*?)</li>", r"<li><p>\1</p></li>", h, flags=re.S)
    return h


def hasha(s):
    h = 0
    for ch in s:
        h = (h * 31 + ord(ch)) % 1000000007
    return str(h)


if __name__ == "__main__":
    facit, poster = {}, []
    for k, d in T.PRODUKTER.items():
        n = normalisera(d["html"])
        facit[k] = {"langd": len(n), "hash": hasha(n)}
        poster.append({
            "k": k, "id": FULLA[k], "namn": d["namn"], "slug": d["slug"],
            "titel": d["titel"], "meta": d["meta"],
            "sokord": [{"term": t, "isMain": m} for t, m in d["sokord"]],
            "html": d["html"], "synlig": SYNLIG[k],
            "langd": facit[k]["langd"], "hash": facit[k]["hash"],
        })
    json.dump(facit, open("facit.json", "w"), ensure_ascii=False, indent=1)
    for i in range(0, len(poster), 2):
        del_ = poster[i:i + 2]
        namn = "js-" + "-".join(p["k"] for p in del_) + ".txt"
        js = """async function() {
  const P = %s;
  const ut = [];
  for (const p of P) {
    const g = await wix.request({ scope: "site", method: "GET", url: `https://www.wixapis.com/stores/v3/products/${p.id}` });
    const gp = (g.data && g.data.product) || g.product || g;\n    const rev = gp.revision;
    await wix.request({
      scope: "site", method: "PATCH",
      url: `https://www.wixapis.com/stores/v3/products/${p.id}`,
      body: { product: {
        id: p.id, revision: rev, name: p.namn, slug: p.slug, visible: p.synlig,
        plainDescription: p.html,
        seoData: { tags: [
          { type: "title", children: p.titel, custom: false, disabled: false },
          { type: "meta", props: { name: "description", content: p.meta },
            children: "", custom: true, disabled: false } ],
          settings: { preventAutoRedirect: false,
            keywords: p.sokord.map((s) => ({ term: s.term, isMain: s.isMain, origin: "USER" })) } },
      } },
    });
    const r = await wix.request({
      scope: "site", method: "GET",
      url: `https://www.wixapis.com/stores/v3/products/${p.id}?fields=PLAIN_DESCRIPTION` });
    const q = (r.data && r.data.product) || r.product || r;
    const lagrad = q.plainDescription || "";
    const hasha = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) %% 1000000007; return String(h); };
    const tagg = (t) => ((q.seoData && q.seoData.tags) || []).find((x) => x.type === t);
    const mt = ((q.seoData && q.seoData.tags) || []).find((x) => x.props && x.props.name === "description");
    ut.push([p.k,
      lagrad.length === p.langd ? "LEN ok" : `LEN ${lagrad.length} != ${p.langd}`,
      hasha(lagrad) === p.hash ? "HASH ok" : `HASH ${hasha(lagrad)} != ${p.hash}`,
      q.name === p.namn ? "namn ok" : `namn FEL: ${q.name}`,
      (typeof q.slug === "string" ? q.slug : q.slug && q.slug.name) === p.slug ? "slug ok" : "slug FEL",
      (tagg("title") || {}).children === p.titel ? "titel ok" : "titel FEL",
      (mt && mt.props.content) === p.meta ? "meta ok" : "meta FEL",
      q.visible === p.synlig ? (p.synlig ? "live ok" : "utkast ok") : `visible=${q.visible} != ${p.synlig}`,
    ].join(" | "));
  }
  return ut;
}""" % json.dumps(del_, ensure_ascii=False)
        open(namn, "w").write(js)
        print("%s  %d tecken" % (namn, len(js)))
    print("facit.json skrivet")
