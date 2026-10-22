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

DETALJKORT (2026-10-22). Står kortet i `paneler.tsv` blir det i stället ett
rutnät av utsnitt ur produktens egna foton (`card_grid`), och spec-raderna
blir panelernas etiketter, i samma ordning som filerna. Texten grindas alltså
av samma gate-kort.py som spec-korten. Byggt för gokartarna, där leverantörens
övriga bilder saknades och lagerfotot skulle bort.

  paneler.tsv     <kort>  <fil>|<fil>[|<fil>|<fil>]   (2–4, sökväg i rundan)
  → cards/<kort>-detalj.png

☠️ Varje utsnitt ska ha panelens proportion (`cardkit.PANEL`, grid2x2 för
fyra paneler), annars zoomar `cover` in. Och etiketten täcker panelens
nedre vänstra hörn: det etiketten påstår ska synas ovanför den.
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

PANELER = {}
if os.path.exists("paneler.tsv"):
    for rad in open("paneler.tsv", encoding="utf-8"):
        rad = rad.rstrip("\n")
        if not rad.strip() or rad.startswith("#"):
            continue
        kort, filer = rad.split("\t")
        PANELER[kort] = filer.split("|")

namn = []
for rad in open("kort.tsv", encoding="utf-8"):
    rad = rad.rstrip("\n")
    if not rad.strip() or rad.startswith("#"):
        continue
    kort, lage, kicker, titel, fotnot, spec = rad.split("\t")
    rader = [tuple(p.split("=", 1)) for p in spec.split("|") if "=" in p]
    if kort in PANELER:
        filer = PANELER.pop(kort)
        if not 2 <= len(filer) <= 4 or len(filer) != len(rader):
            sys.exit(f"[AVBRYT] {kort}: {len(filer)} paneler mot {len(rader)} etiketter "
                     f"(2–4, lika många)")
        saknas = [f for f in filer if not os.path.exists(f)]
        if saknas:
            sys.exit(f"[AVBRYT] {kort}: utsnitt saknas: {', '.join(saknas)}")
        ck.card_grid(f"{kort}-detalj", filer, [f"{k} {v}" for k, v in rader],
                     kicker, titel, "", note=fotnot, rows=2 if len(filer) > 2 else 1)
        namn.append(f"{kort}-detalj")
        continue
    if lage == "vit":
        ck.hero_white(f"orig/{kort}.jpg", f"out/{kort}-hjalte.jpg")
        foto = f"out/{kort}-hjalte.jpg"
    else:
        foto = f"orig/{kort}.jpg"
    ck.card_spec(f"{kort}-spec", foto, kicker, titel, rader, note=fotnot)
    namn.append(f"{kort}-spec")

# En rad i paneler.tsv utan kort i kort.tsv är ett kort som aldrig grindades.
if PANELER:
    sys.exit(f"[AVBRYT] paneler.tsv har kort som saknas i kort.tsv: {', '.join(PANELER)}")

print(ck.render(namn))
