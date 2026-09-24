"""Lägger in rundans kategoriposter i butikens lib/category-seo.ts och
lib/category-content.ts, i bokstavsordning bland underkategorierna.

    python3 infoga.py <sökväg till headless-site> [slug ...]

Posterna genereras ur <slug>-text.json här bredvid, så inget skrivs av för hand.
Kör sedan jamfor.mts, som importerar båda filerna och jämför dem mot källan.
"""
import json, re, sys, os
KALLA = os.path.dirname(os.path.abspath(__file__))
BUTIK = sys.argv[1]  # sökväg till en utcheckning av headless-site
# Slugar att lägga in; utan argument rundans elva sökordskategorier plus de två omtitlarna.
NYA = sys.argv[2:] or ["badrumsskap","golvlampor","elkaminer","varmeflaktar","verktygsvagnar-verktygslador",
                       "baddfatoljer","massagestolar","tv-bankar","skoskap-skobankar","koksoar-koksvagnar","boxningssackar"]
# Två befintliga sidor byter sökord, så att ingen konkurrerar med en ny sida.
ERSATT = ["belysning","forvaring-organisering"] if len(sys.argv) <= 2 else []
data = {s: json.load(open(f"{KALLA}/{s}-text.json", encoding="utf-8")) for s in NYA + ERSATT}
for s,d in data.items():
    assert d["slug"] == s, s

def nyckel(s):
    return s if re.fullmatch(r"[a-z]+", s) else json.dumps(s)
def js(t):
    return json.dumps(t, ensure_ascii=False)

def seo_block(s):
    d = data[s]["seo"]
    return (f"  {nyckel(s)}: {{\n    title: {js(d['title'])},\n    description:\n      {js(d['description'])},\n  }},\n")

def content_block(s):
    c = data[s]["content"]
    ut = [f"  {nyckel(s)}: {{", "    intro: ["]
    ut += [f"      {js(p)}," for p in c["intro"]]
    ut += ["    ],", "    faq: ["]
    for f in c["faq"]:
        ut += ["      {", f"        q: {js(f['q'])},", f"        a: {js(f['a'])},", "      },"]
    ut += ["    ],", "  },", ""]
    return "\n".join(ut) + "\n"

def las_block(text, s):
    """Hitta blocket för nyckeln s: från '  <nyckel>: {' till och med raden '  },' (+ ev. tom rad)."""
    rader = text.split("\n")
    start = None
    for i, r in enumerate(rader):
        if r.startswith(f"  {nyckel(s)}: {{"):
            start = i; break
    assert start is not None, s
    j = start
    while rader[j] != "  },":
        j += 1
    slut = j + 1
    return start, slut, rader

def uppdatera(fil, block_fn, har_tomrad):
    text = open(fil, encoding="utf-8").read()
    # 1. Ersätt de två befintliga
    for s in ERSATT:
        start, slut, rader = las_block(text, s)
        nytt = block_fn(s).rstrip("\n").split("\n")
        if har_tomrad and nytt and nytt[-1] == "":
            nytt = nytt[:-1]
        rader[start:slut] = nytt
        text = "\n".join(rader)
    # 2. Infoga nya i bokstavsordning bland underkategorierna (från baby-smabarn)
    rader = text.split("\n")
    nyckelrader = [(i, r) for i, r in enumerate(rader) if re.match(r'^  ("?[a-z-]+"?): \{$', r)]
    namn = [(i, r.split(":")[0].strip().strip('"')) for i, r in nyckelrader]
    idx_baby = [i for i,(radnr,n) in enumerate(namn) if n == "baby-smabarn"][0]
    # underkategoriblocket slutar före kontorsstolar (möbelgrenen) i content, eller vid filens slut
    sub = namn[idx_baby:]
    for s in sorted(NYA, reverse=True):
        rader = text.split("\n")
        nyckelrader = [(i, r) for i, r in enumerate(rader) if re.match(r'^  ("?[a-z-]+"?): \{$', r)]
        namn = [(i, r.split(":")[0].strip().strip('"')) for i, r in nyckelrader]
        assert s not in [n for _,n in namn], f"{s} finns redan i {fil}"
        idx_baby = [k for k,(radnr,n) in enumerate(namn) if n == "baby-smabarn"][0]
        kandidater = [(radnr, n) for (radnr, n) in namn[idx_baby:] if n > s]
        # stanna inom den alfabetiska underkategorisviten: bryt vid första nyckel som inte följer ordningen
        sviten = []
        prev = ""
        for radnr, n in namn[idx_baby:]:
            if n < prev: break
            sviten.append((radnr, n)); prev = n
        efter = [(radnr, n) for (radnr, n) in sviten if n > s]
        if efter:
            ins = efter[0][0]
        else:
            sista = sviten[-1][0]
            _, slut, _ = las_block(text, sviten[-1][1])
            ins = slut + (1 if har_tomrad else 0)
        blk = block_fn(s).rstrip("\n").split("\n")
        if har_tomrad:
            blk = blk + [] if blk[-1] == "" else blk + [""]
        rader[ins:ins] = blk
        text = "\n".join(rader)
    open(fil, "w", encoding="utf-8").write(text)

uppdatera(f"{BUTIK}/lib/category-seo.ts", seo_block, False)
uppdatera(f"{BUTIK}/lib/category-content.ts", content_block, True)
print("klart")
