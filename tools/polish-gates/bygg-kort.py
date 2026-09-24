#!/usr/bin/env python3
"""Renderar en rundas Fyndplats-kort UR `kort.tsv`.

☠️ BYGGAREN LÄSER SAMMA FIL SOM GRINDEN. Det är hela poängen. Tre rundor
(F2, G1, G2) bar var sin kopia av en kortgrind som `exec`:ade byggarens
KÄLLKOD med strängdelning för att komma åt kortdefinitionen — alltså tre
tvillingar som kontrollerade olika saker, och en definition som bara gick att
grinda genom att köra skriptet. Med definitionen i en datafil grindas det som
byggs, och byggaren kan inte ha en egen mening om innehållet.

Samma regel som redan gäller brödtexten, `seo.tsv` och `namn.tsv`: bygg
nyttolasten ur filen med ett skript, skriv den aldrig av.

ANVÄNDNING (från rundans katalog, EFTER gate-kort.py):
  python3 ../../polish-gates/bygg-kort.py

  kort.tsv        kortdefinitionerna (se gate-kort.py för formatet)
  orig/<kort>.jpg hjältefotot, ohanterat
  → out/<kort>-hjalte.jpg   vitrensat hjältefoto (bara läge `vit`)
  → cards/<kort>-spec.png   kortet

⚠️ Läget `foto` hoppar över vitrensningen. `hero_white` kräver en redan vit
botten; ett foto på mörk botten blir förstört av den, så produkter som
fotograferats mot mörkt (t.ex. stål mot svart) renderas som de är.
"""
import os
import subprocess
import sys

sys.path.insert(0, os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "scripts"))
import cardkit as ck  # noqa: E402

KOLUMNER = 6

if not os.path.exists("kort.tsv"):
    sys.exit("[AVBRYT] kort.tsv saknas — kör från rundans katalog.")

# ☠️ GRINDEN KÖRS FÖRST, OCH DEN FÄLLER BYGGET. Ett kort som renderats innan
# det grindats är ett kort någon kan hinna ladda upp. Samma ordning som
# transkriberingsspärren: kontrollen ligger i samma steg som handlingen.
grind = os.path.join(os.path.dirname(os.path.abspath(__file__)), "gate-kort.py")
if subprocess.run([sys.executable, grind]).returncode != 0:
    sys.exit("[AVBRYT] gate-kort.py fäller — ingenting renderat.")

os.makedirs("out", exist_ok=True)

namn = []
for rad in open("kort.tsv", encoding="utf-8"):
    rad = rad.rstrip("\n")
    if not rad.strip() or rad.startswith("#"):
        continue
    kort, lage, kicker, titel, fotnot, spec = rad.split("\t")
    rader = [tuple(p.split("=", 1)) for p in spec.split("|") if "=" in p]
    if lage == "vit":
        ck.hero_white(f"orig/{kort}.jpg", f"out/{kort}-hjalte.jpg")
        foto = f"out/{kort}-hjalte.jpg"
    else:
        foto = f"orig/{kort}.jpg"
    ck.card_spec(f"{kort}-spec", foto, kicker, titel, rader, note=fotnot)
    namn.append(f"{kort}-spec")

print(ck.render(namn))
