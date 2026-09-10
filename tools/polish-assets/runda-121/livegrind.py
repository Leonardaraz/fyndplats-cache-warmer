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


# ☠️ TVÄTTEN BOR I `grindar.butikstvatt`, INTE HÄR. Rundans första Steg 14
#    skrev en egen och fällde tolv gånger på åtta KORREKTA sidor: den breda
#    `https?://\S+` dödade korslänkarnas `href` (och ankartexten, som namnger
#    grannens färg, föll ned bland sidans egna meningar), och den handskrivna
#    chrome-strykningen missade sidfotslänken `EU-lager &amp; tull`.
#
#    Båda felen fanns redan lagade i `grindar.py` — de återuppstod bara för att
#    tvätten skrevs om per runda. Den ägs numera av modulen, prövas av åtta
#    egna självtestfall och vaktas av `tvillingsvep`.
_tvatta = G.butikstvatt


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
    # ☠️ Grinden prövar SIG SJÄLV innan den prövar sidorna. Tvättens två fel
    #    såg ut som produktfel på åtta korrekta sidor; ett självtest som körs
    #    först är skillnaden mellan "sidan är trasig" och "grinden är trasig".
    sjalvfel, antal = G._sjalvtest()
    print(f"grindar._sjalvtest(): {antal} fall, {len(sjalvfel)} fel")
    for f in sjalvfel + G.tvillingsvep():
        print("  ☠️ GRIND:", f)
        totalt += 1
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
