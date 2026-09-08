# -*- coding: utf-8 -*-
"""Bygger JS-anropen för Steg 7 och facit för verifieringen.

☠️ Kvittot är normalisering + EXAKT hash, inte en längdformel. Runbookens
   formel saknade `<li>`-termen och gav +105 till +140 tecken fel i runda 47.

☠️ Hashen räknas med `h*31 % 1e9+7` — exakt i BÅDA språken. FNV-1a:s
   `h*16777619` överstiger 2^53 i JavaScripts float64 och gav åtta avvikelser
   av åtta där varenda längd stämde: felet låg i hashen, inte i datan.
"""
import json, os, re, sys

sys.path.insert(0, os.path.dirname(__file__))
import texter as T                                       # noqa: E402
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import grindar as G                                       # noqa: E402

FULLA = {
    "a4c0595f": "a4c0595f-2f9b-43c9-85ed-313995e90a86",
    "7eebd0eb": "7eebd0eb-39cb-487b-835b-438d3f88b5af",
    "b54e7a23": "b54e7a23-b032-4ecb-a455-2053fe8f7f18",
    "1f7ebf33": "1f7ebf33-0719-468d-887b-5a94ef211510",
    "edc81021": "edc81021-b262-4546-806e-87bb80119105",
    "117691b5": "117691b5-ccf1-466f-80c0-c880a2e31f3f",
}


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
            "html": d["html"],
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
    const g = await wix.request({ method: "GET", url: `/stores/v3/products/${p.id}` });
    const rev = g.data.product.revision;
    await wix.request({
      method: "PATCH", url: `/stores/v3/products/${p.id}`,
      body: { product: {
        id: p.id, revision: rev, name: p.namn, slug: p.slug, visible: false,
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
      method: "GET", url: `/stores/v3/products/${p.id}?fields=PLAIN_DESCRIPTION` });
    const q = r.data.product;
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
      q.visible === false ? "utkast ok" : `visible=${q.visible}`,
    ].join(" | "));
  }
  return ut;
}""" % json.dumps(del_, ensure_ascii=False)
        open(namn, "w").write(js)
        print("%s  %d tecken" % (namn, len(js)))
    print("facit.json skrivet")
