#!/usr/bin/env python3
"""bygg-hjaltar.py: komponerar rundans hjältefoton (orig/<kort>.jpg) ur `hjaltar.tsv`, för färgneutrala måttkort.

  python3 -P ../../polish-gates/bygg-hjaltar.py            (från rundans katalog, före bygg-kort.py)

hjaltar.tsv (tabbseparerat, en rad per kort):  <kort>  <rader>  <Wix fil-id>|<Wix fil-id>|…
  rader   antal bilder per rad uppifrån och ned, som komponera-hjalte.py: `2` två bredvid varandra, `2,1` två överst och en under.
  fil-id  `b379ce_<32 hex>~mv2.jpg` ur produktens galleri. Bilderna ska vara packshots på vit botten, en per färg.

Skriptet hämtar varje fil ur Wix CDN (`https://static.wixstatic.com/media/<fil-id>`, publik och utan nyckel) till `orig/src/` och anropar komponera-hjalte.py.
Källfilerna är leverantörens foton och checkas aldrig in (`orig/` är gitignorerad); det som checkas in är raden i hjaltar.tsv, som pekar på exakt vilka filer
hjälten byggdes av. Därför står hela fil-id:t där och inte en plats i galleriet: platserna flyttar sig när en bild tas bort.

☠️ Granska varje hjälte med ögonen. komponera-hjalte.py vitrensar varje bild med cardkits `hero_white`, som kräver vit botten; en vit eller ljus vara på vit botten
kan tappa tunna kanter, och en bild med en hund eller ett annat föremål behåller det.
"""
import os
import subprocess
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
KOMPONERA = os.path.join(HERE, "komponera-hjalte.py")


def hamta(fil):
    ut = os.path.join("orig", "src", fil.replace("~", "_"))
    if os.path.exists(ut) and os.path.getsize(ut) > 1000:
        return ut
    os.makedirs(os.path.dirname(ut), exist_ok=True)
    req = urllib.request.Request("https://static.wixstatic.com/media/" + fil, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read()
    if len(data) < 1000:
        sys.exit(f"[AVBRYT] {fil}: svaret är bara {len(data)} byte")
    open(ut, "wb").write(data)
    return ut


def main():
    if not os.path.exists("hjaltar.tsv"):
        sys.exit("[AVBRYT] hjaltar.tsv saknas, kör från rundans katalog")
    n = 0
    for rad in open("hjaltar.tsv", encoding="utf-8"):
        rad = rad.rstrip("\n")
        if not rad.strip() or rad.startswith("#"):
            continue
        d = rad.split("\t")
        if len(d) != 3:
            sys.exit(f"[AVBRYT] fel antal kolumner: {rad[:80]!r}")
        kort, rader, filer = d
        bilder = [hamta(f) for f in filer.split("|") if f.strip()]
        os.makedirs("orig", exist_ok=True)
        r = subprocess.run([sys.executable, "-P", KOMPONERA, f"orig/{kort}.jpg", rader] + bilder)
        if r.returncode != 0:
            sys.exit(f"[AVBRYT] {kort}: komponera-hjalte.py föll")
        n += 1
    print(f"{n} hjältar komponerade")


if __name__ == "__main__":
    main()
