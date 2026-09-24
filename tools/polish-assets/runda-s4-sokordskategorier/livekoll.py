#!/usr/bin/env python3
"""Live-kontroll av de 16 kategorisidorna mot källfilerna (runda S4+S5).
Läser sidan, jämför <title>, metabeskrivning, brödtext och FAQ mot <slug>-text.json,
och rapporterar cache-huvudena så en gammal ISR-rendering syns i stället för att se rätt ut."""
import json, re, html, sys, subprocess, os, tempfile
# Kör från var som helst: källfilerna ligger bredvid skriptet, sidorna sparas i en temporär katalog.
SRC = os.path.dirname(os.path.abspath(__file__))
OUT = tempfile.mkdtemp(prefix="livekoll-")
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
SLUGS = ["elbilar-for-barn","klostrad","kattlador","katthus","hundkojor","redskapsbodar-forrad",
         "sparkcyklar-for-barn","leksakskok","sandlador","gunghastar-gungdjur","hundbaddar-hundsoffor",
         "hundburar","garagetalt","lek-tillbehor-for-husdjur","leksaker-spel","baby-smabarn"]
if len(sys.argv) > 1: SLUGS = sys.argv[1:]
def norm(s): return re.sub(r"\s+"," ",html.unescape(re.sub(r"<[^>]+>"," ",s))).strip()
fel = 0
for slug in SLUGS:
    src = json.load(open(f"{SRC}/{slug}-text.json"))
    url = f"https://www.fyndplats.se/kategori/{slug}"
    hdr = subprocess.run(["curl","-sS","-A",UA,"-D","-","-o",f"{OUT}/{slug}.html",url],capture_output=True,text=True).stdout
    code = re.search(r"HTTP/\S+ (\d+)", hdr).group(1)
    cache = (re.search(r"(?im)^x-vercel-cache: (\S+)", hdr) or [None,"-"])[1]
    age = (re.search(r"(?im)^age: (\S+)", hdr) or [None,"-"])[1]
    t = open(f"{OUT}/{slug}.html", encoding="utf-8", errors="replace").read()
    title = html.unescape((re.search(r"<title>(.*?)</title>", t, re.S) or [None,""])[1])
    desc = html.unescape((re.search(r'<meta name="description" content="([^"]*)"', t) or [None,""])[1])
    body = re.sub(r"<script.*?</script>", "", t, flags=re.S)
    plain = html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", body)))
    n = re.search(r'"@type":"CollectionPage".*?"numberOfItems":(\d+)', t)
    ok_t = title == src["seo"]["title"] + " | Fyndplats"
    ok_d = desc == src["seo"]["description"]
    intro = sum(1 for p in src["content"]["intro"] if norm(p) in plain)
    fq = sum(1 for q in src["content"]["faq"] if norm(q["q"]) in plain and norm(q["a"]) in plain)
    ldq = len(re.findall(r'"@type":"Question"', t))
    bra = ok_t and ok_d and intro == len(src["content"]["intro"]) and fq == len(src["content"]["faq"]) and ldq == len(src["content"]["faq"]) and code == "200"
    if not bra: fel += 1
    print(f"{'OK ' if bra else 'FEL'} {slug:26} {code} cache={cache:6} age={age:>5} n={n.group(1) if n else '?':>4} "
          f"title={'LIKA' if ok_t else 'AVVIK:'+title[:60]} desc={'LIKA' if ok_d else 'AVVIK'} "
          f"intro={intro}/{len(src['content']['intro'])} faq={fq}/{len(src['content']['faq'])} ld={ldq}")
print(f"\n{len(SLUGS)-fel} av {len(SLUGS)} rätt")
