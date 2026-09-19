# -*- coding: utf-8 -*-
"""Runda 134 — tvätta bort leverantörens tyska `Produktinformation`-panel.

☠️ TVÅ måttritningar bär TYSK TEXT i pixlarna: `668e0e0c` och `38022bcb` har en
   påklistrad panel längst ned — "Produktinformation / Rasse --- Britisch
   Kurzhaar / Gewicht --- 3,5 Kg". Uppgift #401:s klass, två nya förekomster.

Metod T-B ur `bildmetoder.md`: täck textregionen med bakgrundsfärgen. Den
fungerar här och bara här därför att panelen ligger på REN VIT studiobotten och
är helt skild från ritningen — ingen pixel av varan rörs, vilket är Leonards
gräns ("bildpolering rör bakgrunden, aldrig varan").

☠️ VITMÅLA, BESKÄR INTE. Runbooken: "En MÅTTRITNING måste paddas, inte
   beskäras" — etiketterna sitter per definition i kanterna, och PDP:ns
   centrumbeskärning tar dem först. Båda ritningarna är redan 2000 × 2000,
   alltså kvadratiska, så PDP-beskärningen är en no-op. En beskärning av
   underkanten hade gjort bilden ICKE-kvadratisk och därmed återinfört exakt
   det felet.

Panelens överkant DETEKTERAS, den gissas inte: panelen är en bred rektangel med
ram, så den första raden underifrån som är helt vit över hela bredden är dess
gräns.
"""
import os
import sys

import numpy as np
from PIL import Image

HAR = os.path.dirname(os.path.abspath(__file__))
R133 = os.path.join(os.path.dirname(HAR), "runda-133")
sys.path.insert(0, R133)
import bilder as B                                               # noqa: E402

MAPP = os.path.join(R133, "bytebilder")
UT = os.path.join(HAR, "tvattade")

# Bilder vars enda innehåll är leverantörens panel/reklam — de tvättas inte,
# de TAS BORT ur galleriet (Steg 9). Här bara för att listan ska stå på ett
# ställe.
BORT = {
    "d0b80807": [5],   # PawHut-reklam, "Ihre Welt, ihre Regeln" — känd sedan runda 133
    "f6857ca0": [5],   # närbild vars ENDA motiv är PawHut-plattan, förstorad
}

PANEL = ["668e0e0c", "38022bcb"]

# Uppladdningsstorlek — se kommentaren i `tvatta`.
SIDA = 1600


def panelgrans(a, marginal=6):
    """Första raden UNDERIFRÅN som är vit hela vägen ⇒ panelens överkant."""
    vit = (a.min(axis=2) > 244).all(axis=1)          # helvit rad
    h = a.shape[0]
    # gå uppåt från botten tills vi passerat panelen och hittar vitt
    sett_ickevit = False
    for y in range(h - 1, -1, -1):
        if not vit[y]:
            sett_ickevit = True
        elif sett_ickevit:
            return max(0, y - marginal)
    return None


def tvatta(pid, nr):
    f = B.GALLERI[pid][nr - 1].replace("~", "_")
    bild = Image.open(os.path.join(MAPP, f)).convert("RGB")
    a = np.asarray(bild)
    y = panelgrans(a)
    if y is None:
        raise SystemExit("%s bild %d: hittade ingen panelgräns" % (pid, nr))
    ren = a.copy()
    ren[y:, :, :] = 255                              # vitt, samma som botten
    os.makedirs(UT, exist_ok=True)
    vag = os.path.join(UT, "%s-%d-utan-tysk-panel.jpg" % (pid, nr))
    # ☠️ 1600², INTE 2000². `UploadImageToWixSite` svarar `success: true` med
    #    `operationStatus: "PENDING"` och kan sedan hamna i FAILED — och ett
    #    fileId i FAILED utelämnas TYST ur media-PATCHen, så galleriet går
    #    från sex bilder till fem utan ett enda fel. Runbokens mätning:
    #    1600² på ~200 kB går igenom där 2000² på 380 kB föll.
    # ⚠️ RITNINGEN ÄR FORTFARANDE KVADRATISK. PDP:n centrumbeskär till kvadrat
    #    och måttetiketterna sitter i kanterna; en nedskalning bevarar dem,
    #    en beskärning hade tagit dem först.
    Image.fromarray(ren).resize((SIDA, SIDA), Image.LANCZOS).save(
        vag, quality=85, optimize=True)
    return vag, y, bild.size


if __name__ == "__main__":
    for pid in PANEL:
        vag, y, storlek = tvatta(pid, 3)
        print("%s bild 3: panel från y=%d av %d  ->  %s"
              % (pid, y, storlek[1], os.path.basename(vag)))
