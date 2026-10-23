#!/usr/bin/env python3
"""komponera-hjalte.py <ut.jpg> <rader> <bild> [<bild> ...] [--fyll 0.88] [--trosk 245]: ett hjältefoto av flera packshots för ett färgneutralt kort.

  python3 -P tools/polish-gates/komponera-hjalte.py orig/91f5c078-205.jpg 2,2 ark/gron.jpg ark/ljusgra.jpg ark/svart.jpg ark/morkgra.jpg

`rader` är antalet bilder per rad, uppifrån och ned: `2,2` är två rader med två bilder, `2,1` två överst och en nederst (centrerad), `1` en enda bild.
Bilderna ska ha vit bakgrund (packshots). Varje bild vitrensas med cardkits `hero_white` (bakgrunden som hänger ihop med bildkanten blir ren vit,
produkten rörs inte), beskärs till produktens ram, skalas så att den ryms i sin ruta (`--fyll` av rutans mått) och läggs mitt i rutan på en vit duk
med korts hjältepanels proportion (card_spec: 1416 × 776, i 2× = 2832 × 1552).

Varför: ett kort som gäller en storlek ska inte visa EN färg när varan finns i flera (2026-10-23, Leonards fråga om hammockens och kantskyddens
storlekar). Soptunnans storlekskort visar svart och silver sida vid sida; här görs samma sak för fyra färger. Hjälten hamnar i `orig/<kort>.jpg`, som
`bygg-kort.py` läser i läget `foto` (rundans `orig/` är gitignorerad: leverantörens foton checkas aldrig in).

☠️ Granska resultatet med ögonen. `hero_white` kräver en vit bakgrund; en bild på mörk eller rörig botten blir förstörd. Skriptet avbryter hellre än gissar:
en ruta där produkten inte går att hitta (hela bilden är bakgrund) fäller körningen.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(HERE)), "scripts"))
import cardkit as ck  # noqa: E402
import numpy as np  # noqa: E402
from PIL import Image  # noqa: E402

BREDD, HOJD = 2832, 1552  # 2 × hjältepanelen i card_spec (1416 × 776)


def argument(namn, standard):
    if namn in sys.argv:
        return float(sys.argv[sys.argv.index(namn) + 1])
    return standard


def produkt(src, trosk):
    """Vitrensad produkt beskuren till sin ram, som PIL-bild."""
    tmp = "/tmp/komponera-hjalte-%d.jpg" % os.getpid()
    ck.hero_white(src, tmp, trosk=int(trosk))
    a = np.asarray(Image.open(tmp).convert("RGB"))
    os.remove(tmp)
    ej_vit = a.min(axis=2) < 250
    if not ej_vit.any():
        sys.exit(f"[AVBRYT] ingen produkt hittades i {src}")
    ys, xs = np.where(ej_vit)
    pad = 6
    y0, y1 = max(0, ys.min() - pad), min(a.shape[0], ys.max() + pad + 1)
    x0, x1 = max(0, xs.min() - pad), min(a.shape[1], xs.max() + pad + 1)
    return Image.fromarray(a[y0:y1, x0:x1])


def main():
    pos = [x for x in sys.argv[1:] if not x.startswith("--") and not _ar_flaggvarde(x)]
    if len(pos) < 3:
        sys.exit(__doc__)
    ut, rader, bilder = pos[0], [int(x) for x in pos[1].split(",")], pos[2:]
    if sum(rader) != len(bilder):
        sys.exit(f"[AVBRYT] raderna {rader} ger {sum(rader)} bilder, men {len(bilder)} angavs")
    fyll = argument("--fyll", 0.88)
    trosk = argument("--trosk", 245)
    duk = Image.new("RGB", (BREDD, HOJD), "white")
    radhojd = HOJD / len(rader)
    i = 0
    for r, n in enumerate(rader):
        cellbredd = BREDD / n
        for c in range(n):
            p = produkt(bilder[i], trosk)
            i += 1
            skala = min(cellbredd * fyll / p.width, radhojd * fyll / p.height)
            p = p.resize((max(1, round(p.width * skala)), max(1, round(p.height * skala))), Image.LANCZOS)
            x = round(c * cellbredd + (cellbredd - p.width) / 2)
            y = round(r * radhojd + (radhojd - p.height) / 2)
            duk.paste(p, (x, y))
    os.makedirs(os.path.dirname(ut) or ".", exist_ok=True)
    duk.save(ut, quality=95)
    print(f"{ut}: {len(bilder)} bilder i raderna {rader}, {BREDD} × {HOJD}")


def _ar_flaggvarde(x):
    """Ett tal direkt efter --fyll eller --trosk är flaggans värde, inte en bild."""
    i = sys.argv.index(x)
    return i > 0 and sys.argv[i - 1] in ("--fyll", "--trosk")


if __name__ == "__main__":
    main()
