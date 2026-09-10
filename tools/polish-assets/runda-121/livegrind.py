# -*- coding: utf-8 -*-
"""Runda 121 Steg 14 — grindar den PUBLICERADE sidan, inte utkastet.

Flikkontrollen ärvs från `grindar.flikfel` (uppgift #450): den läser
`<summary>`, inte texten, och räknar FÖREKOMSTER — så en dubblerad
beskrivning fälls i samma hämtning.

☠️ Grannstrykningen är obligatorisk. Butikens rekommendationsrad bär
   GRANNARNAS namn i två serialiseringar, och rundans egna korslänkar bär
   grannens FÄRG i ankartexten. Utan `egna_meningar` fäller färggrinden
   varje korrekt färgsyskonpar — mätt i Steg 7 samma dag.
"""
import re
import sys

sys.path.insert(0, "..")

import grindar as G          # noqa: E402
import grind as GR           # noqa: E402
import texter as T           # noqa: E402

FORBJUDET = [m for m, _ in GR.FORBJUDET if m is not G.ARTNR] + [G.ARTNR]
ETIKETT = {m: e for m, e in GR.FORBJUDET}


def _tvatta(html):
    """Stryker bildadresser, srcset-bredder och butikens ribbon.

    ⚠️ `1080w` i en srcset är en BILDBREDD, inte ett tal i vår text
       (uppgift #403). Och `Skickas från EU-lager` är butikens chrome-rad,
       inte vår mening (uppgift #434)."""
    html = re.sub(r"https?://\S+", " ", html)
    html = re.sub(r"\b\d{2,4}w\b", " ", html)
    html = re.sub(r"Skickas från[^<.,]{0,20}", " ", html, flags=re.I)
    return html


def granska(pid, html, slug):
    fel = G.flikfel(html)
    egna, kors = G.egna_meningar(html, slug, T.NAMN[pid], _tvatta)

    for m in FORBJUDET:
        for t in m.finditer(egna):
            fel.append(f"{ETIKETT.get(m, 'FÖRBJUDET')}: …{G.mening_kring(egna, t.start())}…")
    for m, e in GR.TONGRINDAR:
        for t in m.finditer(egna):
            fel.append(f"{e}: …{G.mening_kring(egna, t.start())}…")

    for ord_ in G.FARGORD:
        if re.search(rf"\b{ord_}\w*\b", egna, re.I) and ord_ not in GR.FARG[pid]:
            fel.append(f"FÄRGORD {ord_!r} — uppmätt är {sorted(GR.FARG[pid])}")

    # Namn, titel och meta ska stå på sidan.
    for falt, varde in (("namn", T.NAMN[pid]), ("titel", T.TITEL[pid])):
        if varde not in html:
            fel.append(f"{falt.upper()} saknas på sidan")
    if T.META[pid] not in html:
        fel.append("METAN saknas på sidan")

    # ☠️ Introt ska stå EXAKT en gång. Fångar en dubblerad beskrivning även
    #    när flikräkningen råkar gå ihop.
    intro = T.INTRO[pid][:60]
    n = egna.count(intro)
    if n != 1:
        fel.append(f"INTROT står {n} gånger, väntade 1")
    return fel


if __name__ == "__main__":
    import json
    d = json.load(open("skrivning.json"))
    totalt = 0
    for pid, v in d.items():
        url = f"https://www.fyndplats.se/produkt/{v['slug']}"
        try:
            html, _ = G.hamta_isr(url)
        except Exception as e:
            print(f"FEL  {pid}  hämtning: {e}")
            totalt += 1
            continue
        fel = granska(pid, html, v["slug"])
        totalt += len(fel)
        print(f"{'FEL ' if fel else 'OK  '}{pid}  {v['slug']}")
        for f in fel:
            print("      ☠️", f)
    print(f"\n{len(d)} sidor, {totalt} fel")
    sys.exit(1 if totalt else 0)
