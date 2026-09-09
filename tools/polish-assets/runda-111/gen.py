# -*- coding: utf-8 -*-
"""Runda 111 Steg 7 — bygger PATCH-anropen och facit för verifieringen.

☠️ ALLA SJU ÄR UTKAST. `visible: false` skickas uttryckligen på varje PATCH —
   runbookens regel är att varje PATCH ska BÄRA `visible`, och runda 109 mätte
   upp att den halvan som är lätt att missa är VÄRDET, inte fältet. Här är
   värdet detsamma på alla sju, men det läses ur Wix strax före skrivningen
   och prövas mot det lästa värdet, inte mot en konstant.

☠️ KVITTOT ÄR NORMALISERING + EXAKT HASH, inte en längdformel. Wix skriver om
   markupen (`<strong>` → `<span style="font-weight: 700">`, `<li>text` →
   `<li><p>text</p>`, `href` → `href target="_self"`), och runbookens
   längdformel saknade `<li>`-termen.

☠️ HASHEN RÄKNAS MED `h*31 % 1e9+7` — exakt i BÅDA språken. FNV-1a:s
   `h*16777619` överstiger 2^53 i JavaScripts float64.

☠️ KROPPEN HETER `body`, INTE `data`.
"""
import json, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import texter as T                                            # noqa: E402
import matt                                                   # noqa: E402


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
    for k in matt.RUNDAN:
        d = T.PRODUKTER[k]
        n = normalisera(d["html"])
        facit[k] = {"langd": len(n), "hash": hasha(n), "slug": d["slug"]}
        poster.append({
            "k": k, "id": matt.WIX[k], "namn": d["namn"], "slug": d["slug"],
            "titel": d["titel"], "meta": d["meta"],
            "sokord": [{"term": t, "isMain": m} for t, m in d["sokord"]],
            "html": d["html"], "langd": facit[k]["langd"], "hash": facit[k]["hash"],
        })
    json.dump(facit, open("facit.json", "w"), ensure_ascii=False, indent=1)
    for i in range(0, len(poster), 3):
        del_ = poster[i:i + 3]
        namn = "js-%d.txt" % (i // 3 + 1)
        js = """async function() {
  const P = %s;
  const ut = [];
  for (const p of P) {
    const g = await wix.request({ scope: "site", method: "GET", url: `https://www.wixapis.com/stores/v3/products/${p.id}` });
    const gp = (g.data && g.data.product) || g.product || g;
    const rev = gp.revision;
    const varForeVisible = gp.visible;
    const prisFore = ((gp.actualPriceRange || {}).minValue || {}).amount;
    await wix.request({
      scope: "site", method: "PATCH",
      url: `https://www.wixapis.com/stores/v3/products/${p.id}`,
      body: { product: {
        id: p.id, revision: rev, name: p.namn, slug: p.slug, visible: varForeVisible,
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
    const prisEfter = ((q.actualPriceRange || {}).minValue || {}).amount;
    ut.push([p.k,
      lagrad.length === p.langd ? "LEN ok" : `LEN ${lagrad.length} != ${p.langd}`,
      hasha(lagrad) === p.hash ? "HASH ok" : `HASH ${hasha(lagrad)} != ${p.hash}`,
      q.name === p.namn ? "namn ok" : `namn FEL: ${q.name}`,
      (typeof q.slug === "string" ? q.slug : q.slug && q.slug.name) === p.slug ? "slug ok" : "slug FEL",
      (tagg("title") || {}).children === p.titel ? "titel ok" : "titel FEL",
      (mt && mt.props.content) === p.meta ? "meta ok" : "meta FEL",
      q.visible === varForeVisible ? (q.visible ? "live ok" : "utkast ok") : `visible ANDRAD: ${q.visible}`,
      prisEfter === prisFore ? "pris orort" : `PRIS ANDRAT ${prisFore} -> ${prisEfter}`,
    ].join(" | "));
  }
  return ut;
}""" % json.dumps(del_, ensure_ascii=False)
        open(namn, "w").write(js)
        print("%s  %d produkter  %d tecken" % (namn, len(del_), len(js)))
    print("facit.json skrivet")
