# -*- coding: utf-8 -*-
"""Runda 124 Steg 14 — grindar den PUBLICERADE sidan, inte utkastet.

Alla elva publicerades: saldo över noll och EU-lager på varenda en
(STEG2-5.md, Steg 3). Ingen hålls tillbaka.

☠️ FÄRGGRINDEN SLÄPPER IN SYSKONETS FÄRG, precis som källgrinden gör.
   Sju av elva jämför sig med sitt färgsyskon i klartext ("Vad skiljer den
   från den helröda?"), och det är sidans EGNA mening, inte en ankartext —
   `egna_meningar` kan alltså inte skilja ut den. En grind som förbjöd
   varje främmande färgord hade fällt sju korrekta sidor.

   Den farliga riktningen är stängd på annat håll: `grind.granska` kräver
   att NAMN, TITEL och META bär exakt produktens egen färg.

☠️ Grannstrykningen är obligatorisk. Butikens rekommendationsrad bär
   GRANNARNAS namn i två serialiseringar, och rundans korslänkar bär
   grannens färg i ankartexten.
"""
import re
import sys

sys.path.insert(0, "..")

import grindar as G          # noqa: E402
import grind as GR           # noqa: E402
import texter as T           # noqa: E402

FORBJUDET = [m for m, _ in GR.FORBJUDET if m is not G.ARTNR] + [G.ARTNR]
ETIKETT = {m: e for m, e in GR.FORBJUDET}

# ☠️ TVÄTTEN BOR I `grindar.butikstvatt`, INTE HÄR (uppgift #452).
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

    tillatna = GR.FARG[pid] | GR.SYSKONFARG.get(pid, set())
    for ord_ in G.FARGORD:
        if re.search(rf"\b{ord_}\w*\b", egna, re.I) and ord_ not in tillatna:
            fel.append(f"FÄRGORD {ord_!r} — uppmätt är {sorted(GR.FARG[pid])}")

    # ☠️ LÅSGRINDEN på den LIVE sidan. Rundans farligaste påstående: sex av
    #    elva säger något om låsning, och de två grupperna säger MOTSATT sak.
    if pid in GR.GRUPP_A:
        if not re.search(r"hänglås", egna, re.I):
            fel.append("LÅSGRINDEN: hänglåsbeskedet saknas på den live sidan")
        if re.search(r"\bcylinderlås|\bnyckellås", egna, re.I):
            fel.append("LÅSGRINDEN: gruppen har varken cylinder eller nyckel")
    elif pid in GR.GRUPP_C:
        if not re.search(r"\bcylinderlås\b", egna, re.I):
            fel.append("LÅSGRINDEN: cylinderlåset saknas på den live sidan")
        if re.search(r"hänglås", egna, re.I):
            fel.append("LÅSGRINDEN: den här har cylinderlås, inte hänglåsögla")

    # Namn, titel och meta ska stå på sidan.
    for falt, varde in (("namn", T.NAMN[pid]), ("titel", T.TITEL[pid])):
        if varde not in html:
            fel.append(f"{falt.upper()} saknas på sidan")
    if T.META[pid] not in html:
        fel.append("METAN saknas på sidan")

    # ☠️ Introt ska stå EXAKT en gång.
    intro = T.INTRO[pid][:60]
    n = egna.count(intro)
    if n != 1:
        fel.append(f"INTROT står {n} gånger, väntade 1")
    return fel


if __name__ == "__main__":
    import json
    d = json.load(open("skrivning.json"))
    totalt = 0
    # ☠️ Grinden prövar SIG SJÄLV innan den prövar sidorna (uppgift #452).
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
