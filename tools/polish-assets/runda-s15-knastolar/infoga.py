"""Lägger in Knästolar och den nya Kontorsstolar-texten i butikens
lib/category-seo.ts och lib/category-content.ts, och nämner Knästolar i
Möbler-sidans uppräkning av Kontor & gaming.

    python3 infoga.py <sökväg till headless-site>

Posterna genereras ur <slug>-text.json här bredvid, så inget skrivs av för hand.
Kör sedan jamfor.mts, som importerar båda filerna och jämför dem mot källan.
"""
import json
import os
import re
import sys

KALLA = os.path.dirname(os.path.abspath(__file__))
BUTIK = sys.argv[1]
NY = "knastolar"
ERSATT = "kontorsstolar"
EFTER = "klostrad"  # knastolar sorteras in direkt efter klösträden

data = {s: json.load(open(f"{KALLA}/{s}-text.json", encoding="utf-8")) for s in (NY, ERSATT)}
for s, d in data.items():
    assert d["slug"] == s, s


def nyckel(s):
    return s if re.fullmatch(r"[a-z]+", s) else json.dumps(s)


def js(t):
    return json.dumps(t, ensure_ascii=False)


def seo_block(s):
    d = data[s]["seo"]
    return f"  {nyckel(s)}: {{\n    title: {js(d['title'])},\n    description:\n      {js(d['description'])},\n  }},"


def content_block(s):
    c = data[s]["content"]
    ut = [f"  {nyckel(s)}: {{", "    intro: ["]
    ut += [f"      {js(p)}," for p in c["intro"]]
    ut += ["    ],", "    faq: ["]
    for f in c["faq"]:
        ut += ["      {", f"        q: {js(f['q'])},", f"        a: {js(f['a'])},", "      },"]
    ut += ["    ],", "  },"]
    return "\n".join(ut)


def blockets_rader(rader, s):
    """Raderna för nyckeln s: från '  <nyckel>: {' till och med '  },'."""
    start = [i for i, r in enumerate(rader) if r == f"  {nyckel(s)}: {{"]
    assert len(start) == 1, (s, len(start))
    j = start[0]
    while rader[j] != "  },":
        j += 1
    return start[0], j + 1


def uppdatera(fil, block_fn):
    text = open(fil, encoding="utf-8").read()
    rader = text.split("\n")
    assert not any(r == f"  {nyckel(NY)}: {{" for r in rader), f"{NY} finns redan i {fil}"
    a, b = blockets_rader(rader, ERSATT)
    rader[a:b] = block_fn(ERSATT).split("\n")
    a, b = blockets_rader(rader, EFTER)
    # Blocken i category-content.ts skiljs av en tom rad, i category-seo.ts inte.
    tomrad = b < len(rader) and rader[b] == ""
    ny = block_fn(NY).split("\n")
    rader[b:b] = ([""] + ny) if tomrad else ny
    open(fil, "w", encoding="utf-8").write("\n".join(rader))


uppdatera(f"{BUTIK}/lib/category-seo.ts", seo_block)
uppdatera(f"{BUTIK}/lib/category-content.ts", content_block)

# Möbler räknar upp underkategorierna per rubrik, i menyns ordning.
fil = f"{BUTIK}/lib/category-content.ts"
text = open(fil, encoding="utf-8").read()
gammal = "under Kontor & gaming finns Kontorsstolar, Gamingstolar, Skrivbord och Hörnskrivbord"
ny = "under Kontor & gaming finns Kontorsstolar, Knästolar, Gamingstolar, Skrivbord och Hörnskrivbord"
assert text.count(gammal) == 1, "Möbler-meningen hittades inte exakt en gång"
open(fil, "w", encoding="utf-8").write(text.replace(gammal, ny))
print("klart: knastolar inlagd efter", EFTER, "och kontorsstolar ersatt i båda filerna")
