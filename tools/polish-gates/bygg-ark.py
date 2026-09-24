#!/usr/bin/env python3
"""Bygger rundans KONTAKTARK — ett blad per produkt, alla bilder i ett rutnät.

☠️ ARKET BYGGS FÖRE BRÖDTEXTEN, inte efter. Arbetsgången var länge: läs den
tyska källan, skriv svenskan, ta fram arket för alt-texterna. Runda J1 visade
varför det är fel ordning — källan för golvlampan `13a53d52` listar TVÅ
skärmmått och texten beskrev följaktligen två skärmar. Fotot visar EN, med
Ø24 som det inre, osynliga lagret. Ingen siffergrind kunde fånga det: båda
talen står i källan. Det var en riktig utsaga om en produkt som inte finns.

Arket kostar ingenting extra — bilderna ska ändå hämtas för alt-texterna —
och det flyttar granskningen till INNAN felet är skrivet.

☠️ UPPLÖSNINGEN ÄR MÄTT, INTE VALD. Cellen är 600 px bred, arket 1860 × 1292
för fem bilder — samma mått som runda N7:s ark, där tysk inbränd text i
pixlarna gick att läsa och två bilder därför kunde plockas bort. Ett mindre
ark gör regeln till en vana: grinden är påslagen men kan inte SE, samma klass
som alt-svepet som bar en för smal ordlista.

⚠️ Bilderna hämtas i FULL upplösning från wixstatic och nedskalas här. En
hämtning via Wix egen `/v1/fill/`-transform hade gett en komprimerad kopia där
just den inbrända texten är det första som suddas.

ANVÄNDNING (från rundans katalog):
  python3 ../../polish-gates/bygg-ark.py
  bilder.tsv   "kort  position  wix-fil-id"
  -> orig/<kort>-<pos>.jpg   (gitignorerad — hämtad data, inget källmaterial)
  -> ark/<kort>.jpg
"""
import collections, io, os, subprocess, sys
from PIL import Image, ImageDraw

CELL = 600           # px per bild — mätt läsbar för inbränd text
MARGINAL = 20
TEXTHOJD = 32
KOLUMNER = 3

def hamta(fid, mal):
    if os.path.exists(mal) and os.path.getsize(mal) > 1000:
        return True
    url = "https://static.wixstatic.com/media/" + fid
    r = subprocess.run(["curl", "-sS", "--max-time", "60", "-o", mal, url],
                       capture_output=True, text=True)
    return r.returncode == 0 and os.path.exists(mal) and os.path.getsize(mal) > 1000

rader = collections.OrderedDict()
for r in io.open("bilder.tsv", encoding="utf-8"):
    if not r.strip():
        continue
    kort, pos, fid = r.rstrip("\n").split("\t")
    rader.setdefault(kort, []).append((pos, fid))

os.makedirs("orig", exist_ok=True)
os.makedirs("ark", exist_ok=True)

fel = []
for kort, bilder in rader.items():
    rutor = []
    for pos, fid in bilder:
        mal = f"orig/{kort}-{pos}.jpg"
        if not hamta(fid, mal):
            fel.append(f"{kort} pos {pos}: hämtningen föll")
            continue
        try:
            im = Image.open(mal).convert("RGB")
        except Exception as e:
            fel.append(f"{kort} pos {pos}: går inte att öppna ({e})")
            continue
        im.thumbnail((CELL, CELL), Image.LANCZOS)
        rutor.append((pos, im))

    if not rutor:
        fel.append(f"{kort}: inga läsbara bilder")
        continue

    rad_antal = (len(rutor) + KOLUMNER - 1) // KOLUMNER
    bredd = MARGINAL + KOLUMNER * (CELL + MARGINAL)
    hojd = MARGINAL + rad_antal * (CELL + TEXTHOJD + MARGINAL)
    ark = Image.new("RGB", (bredd, hojd), (245, 245, 245))
    rit = ImageDraw.Draw(ark)
    for i, (pos, im) in enumerate(rutor):
        kol, rad = i % KOLUMNER, i // KOLUMNER
        x = MARGINAL + kol * (CELL + MARGINAL)
        y = MARGINAL + rad * (CELL + TEXTHOJD + MARGINAL)
        ark.paste(im, (x + (CELL - im.width) // 2, y + (CELL - im.height) // 2))
        rit.text((x + 6, y + CELL + 8), f"{kort}  position {pos}", fill=(20, 20, 20))
    ark.save(f"ark/{kort}.jpg", quality=92)
    print(f"{kort}  {len(rutor)} bilder  ark {ark.width} x {ark.height}")

if fel:
    # ☠️ EN UTEBLIVEN BILD TIGS INTE IHJÄL. Ett ark med fyra rutor där fem
    # väntades ser ut som en produkt med fyra bilder, och då granskas den
    # femte aldrig.
    print("\nMISSAR:\n" + "\n".join("  " + f for f in fel))
    sys.exit(1)
