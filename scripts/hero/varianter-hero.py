#!/usr/bin/env python3
"""Variantbilder för CarPlay-adaptern — en per färg, identiska så när som på färgen.

Tre fel i de gamla:

1. **Grå gloria.** Bakgrunden låg på 254 i stället för 255 och kanten tonade
   ut över ett tiotal pixlar (249 → 242 → …). Leverantörens original är rent:
   255 rakt in, sedan en 6 px mjuk kant, sedan produkten på 3. Glorian kom
   alltså av bearbetningen, inte av källan.
2. **Oskärpa.** Bilderna var uppskalade till 1400 px från källor på 336–479 px.
3. **Varianterna hoppade.** Silver låg på 823 px bredd, orange på 858 — byter
   kunden färg flyttar och skalar produkten om sig.

Alla tre byggs därför om ur samma slags källa (a6/a7/a8), med SAMMA måltal och
SAMMA placering. Kontroll som körs varje gång: källornas rutor ska vara
kvadratiska och lika stora efter normering — annars är det inte samma pose och
då får de inte skalas efter varandra.
"""
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

KALLOR = [("silver", "ae/a6.webp"), ("orange", "ae/a7.webp"), ("svart", "ae/a8.webp")]
SIDA = 1600
VARANS_HOJD = 1120          # px på duken; silver skalas mest (~3,3×)


def plocka(fil: str):
    im = Image.open(fil).convert("RGB")
    a = np.asarray(im).astype(float)

    kropp = ndimage.binary_opening(a.min(axis=2) < 238, iterations=2)
    lab, n = ndimage.label(kropp)
    sz = ndimage.sum(kropp, lab, range(1, n + 1))
    kropp = ndimage.binary_fill_holes(lab == (int(np.argmax(sz)) + 1))

    # källkanten är ren (bakgrund 255), så mjuk alfa direkt ur luminansen
    mjuk = np.clip((250.0 - a.min(axis=2)) / 12.0, 0, 1)
    alfa = mjuk * ndimage.binary_dilation(kropp, iterations=3)

    ys, xs = np.where(kropp)
    box = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    return im, alfa, box


def main() -> None:
    rutor = {}
    for namn, fil in KALLOR:
        im, alfa, box = plocka(fil)
        b, h = box[2] - box[0], box[3] - box[1]
        rutor[namn] = (b, h)
        print("%-7s källruta %3d × %3d  kvot %.3f  uppskalning %.1f×" % (namn, b, h, b / h, VARANS_HOJD / h))

        kvoter = [w / hh for w, hh in rutor.values()]
        if max(kvoter) - min(kvoter) > 0.04:
            raise SystemExit("källornas rutor har olika kvot – inte samma pose, skala inte efter varandra")

        rgb = np.asarray(im).astype(float)
        bl = np.clip(alfa, 0, 1)[:, :, None]
        ren = rgb * bl + 255.0 * (1 - bl)
        vara = Image.fromarray(np.clip(ren, 0, 255).astype(np.uint8)).crop(box)

        mal_h = VARANS_HOJD
        mal_b = int(round(vara.width * mal_h / vara.height))
        vara = vara.resize((mal_b, mal_h), Image.LANCZOS)
        vara = vara.filter(ImageFilter.UnsharpMask(radius=1.6, percent=60, threshold=3))

        duk = Image.new("RGB", (SIDA, SIDA), (255, 255, 255))
        duk.paste(vara, ((SIDA - mal_b) // 2, (SIDA - mal_h) // 2))
        duk.save(f"hero_{namn}.png")
        print("        -> hero_%s.png  vara %d × %d" % (namn, mal_b, mal_h))


if __name__ == "__main__":
    main()
