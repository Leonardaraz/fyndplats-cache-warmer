# -*- coding: utf-8 -*-
"""Bygger Steg 9:s media-nyttolast per produkt och skriver den till fil.

☠️ Samma regel som Steg 7: kroppen komponeras ALDRIG för hand i chatten.
   Den byggs här, grindas en sista gång, och skrivs till `media/<pid>.json`.

Fyra regler ur runbooken, alla inbyggda som `assert`:

1. `media.itemsInfo.items` ERSÄTTS I SIN HELHET — varje item måste därför
   bära `altText`, även de vi inte rör.
2. Skicka `id` för filer som redan ligger i Media Manager, ALDRIG `url`.
   `url` betyder "extern adress" för V3, och en wixstatic-adress importeras
   då om till en NY fil. Det var så halva medialagringen blev kopior.
3. Skicka INTE `media.main` — den är readOnly och sätts till första item:et.
   Inkluderas den ignorerar Wix TYST hela `media`-objektet.
4. Sätt `items[i].altText`, inte `items[i].image.altText`. `image` är
   readOnly; patchas bara den svarar Wix 200 och texten skrivs aldrig.
"""
import io
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import altgrind as A                                             # noqa: E402
import bilder as BI                                              # noqa: E402
import galleri as GA                                             # noqa: E402
import texter as T                                               # noqa: E402


def poster(pid):
    """Returnerar [(fil-id, alt-text)] i den NYA ordningen."""
    ut = []
    for p in BI.ORDNING[pid]:
        if p == "K":
            fil = BI.KORT[pid]
        else:
            fil = BI.ERSATT.get((pid, p)) or GA.G[pid][p - 1]
        ut.append((fil, BI.ALT[pid][p]))
    return ut


def kropp(pid, revision):
    rader = poster(pid)
    fil_id = [f for f, _ in rader]
    assert len(set(fil_id)) == len(fil_id), "%s: samma fil två gånger" % pid
    for f, a in rader:
        assert f.startswith("b379ce_"), "%s: %r ser inte ut som ett fil-id" % (pid, f)
        assert "http" not in f, "%s: en ADRESS smög in där ett fil-id ska stå" % pid
        assert a and a.strip(), "%s: item utan alt-text" % pid
    return {"product": {
        "id": None,          # fylls av anroparen
        "revision": revision,
        "media": {"itemsInfo": {"items": [
            {"id": f, "altText": a} for f, a in rader]}},
    }}


if __name__ == "__main__":
    fel = A.granska()
    assert not fel, "ALTGRINDEN FALLER: %r" % fel[:3]
    os.makedirs(os.path.join(HAR, "media"), exist_ok=True)
    allt = {}
    for pid in T.BATCH:
        rader = poster(pid)
        allt[pid] = [{"id": f, "altText": a} for f, a in rader]
        io.open(os.path.join(HAR, "media", "%s.json" % pid), "w",
                encoding="utf-8").write(
            json.dumps(allt[pid], ensure_ascii=False, indent=1))
        gammalt = set(GA.G[pid])
        nya = {f for f, _ in rader}
        print("%s  %d bilder  (behåller %d, lägger till %d, tar bort %d)"
              % (pid, len(rader), len(nya & gammalt),
                 len(nya - gammalt), len(gammalt - nya)))
    io.open(os.path.join(HAR, "media", "_allt.json"), "w",
            encoding="utf-8").write(json.dumps(allt, ensure_ascii=False))
    print("\ntotalt %d bilder över %d produkter"
          % (sum(len(v) for v in allt.values()), len(allt)))
