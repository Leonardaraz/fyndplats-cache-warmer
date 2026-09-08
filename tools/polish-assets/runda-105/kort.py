# -*- coding: utf-8 -*-
"""Runda 105 — ett eget Fyndplats-kort per sköldpaddshus (Leonards regel 2026-08-26).

Spec-raderna nedan är HÄMTADE UR SIDANS EGEN spec-tabell — mekaniskt ur
`texter.py`, aldrig omskrivna för hand. `kortbygge.varde` tar det som står efter
kolonet och kräver att kortets etikett finns i radens egen etikett, så ett kort
inte kan skriva "Vikt: grå".

⚠️ RUBRIKEN MÅSTE BÄRAS AV FOTOT. Granskad mot varje hjältebild i kontaktark:

  A (91 cm)   båda locken syns i samma bild — den täta träluckan över
              skyddsdelen och nätlocket över den öppna delen
              -> "Trälucka på ena halvan, nätlock på den andra"
  C (104 cm)  står på fyra vita ben i bordshöjd, med lamparmen tydligt uppe
              -> "På egna ben, med lamphållare"
  F (120 cm)  ingen ovansida alls i bilden, och lamparmen sitter i mitten
              -> "Öppen ovansida och lamphållare"
  G (81 cm)   nätlocket över löpdelen, trälocket över huvuddelen, lamparm
              -> "Två rum under var sitt lock"

☠️ Samma sex etiketter inom varje modell, med flit: korten är syskon och ska gå
   att jämföra rad för rad. Golvytan står först efter måtten — det är rundans
   avgörande tal (L80-grinden) och ska inte ligga längst ned.
"""
import importlib.util, os, sys

BAS = "/home/user/fyndplats-cache-warmer/tools/polish-assets"
HAR = BAS + "/runda-105"
sys.path.insert(0, BAS)
sys.path.insert(0, HAR)
import kortbygge                                                   # noqa: E402
spec = importlib.util.spec_from_file_location("texter", HAR + "/texter.py")
T = importlib.util.module_from_spec(spec); spec.loader.exec_module(T)
sys.path.insert(0, HAR)
_pf = importlib.util.spec_from_file_location("panelfoton", HAR + "/bygg-panelfoton.py")
PF = importlib.util.module_from_spec(_pf); _pf.loader.exec_module(PF)

import re


def specrader(nyckel):
    """Sidans EGNA <li>-rader, ordagrant ur den text som skrevs till Wix."""
    block = re.search(r"<h2>Tekniska specifikationer</h2><ul>(.*?)</ul>",
                      T.PRODUKTER[nyckel]["html"], re.S).group(1)
    ut = []
    for li in re.findall(r"<li>(.*?)</li>", block, re.S):
        ut.append(re.sub(r"<[^>]+>", "", li).replace("&amp;", "&"))
    return ut


KORT = {
    # nyckel: (kicker, rubrik, [(etikett, radindex)])
    "A": ("Sköldpaddshus 91 cm", "Trälucka på ena halvan, nätlock på den andra",
          [("Yttermått", 0), ("Golvyta", 1), ("Fri höjd", 2),
           ("Botten", 3), ("Valvöppning", 4), ("Vikt", 9)]),
    "C": ("Sköldpaddshus 104 cm", "På egna ben, med lamphållare",
          [("Yttermått", 0), ("Golvyta", 1), ("Fri höjd", 2),
           ("Utdragbar", 5), ("Lamphållare", 7), ("Vikt", 11)]),
    "F": ("Sköldpaddshus 120 cm", "Öppen ovansida och lamphållare",
          [("Yttermått", 0), ("Golvyta", 1), ("Väggarnas", 2),
           ("Ovansida", 3), ("Avskild", 4), ("Vikt", 11)]),
    "G": ("Sköldpaddshus 81 cm", "Två rum under var sitt lock",
          [("Yttermått", 0), ("Golvyta", 1), ("Fri höjd", 2),
           ("Öppning", 3), ("Lamphållare", 7), ("Vikt", 10)]),
}
MODELL = {"a0bb5be8": "A", "4b089c02": "A", "27aa4c23": "A", "d4787641": "A",
          "f55d9635": "C", "1f9fe2c2": "C", "1f6de209": "F", "609bec0f": "G"}

if __name__ == "__main__":
    os.chdir(HAR)
    produkter, kortdata, foton = [], {}, {}
    for k, m in MODELL.items():
        produkter.append({"kort": k, "spec": specrader(k)})
        kortdata[k] = KORT[m]
        foton[k] = PF.panel(k)[0]
    namn, facit = kortbygge.bygg(HAR, produkter, kortdata, foton=foton)
    for n in namn:
        print("%-22s %7d byte" % (n, os.path.getsize("jpg/%s.jpg" % n)))
    for k in MODELL:
        print("\n" + k, "->", facit[k]["rubrik"])
        for r in facit[k]["rader"]:
            print("   %-14s %s" % (r["etikett"], r["varde"]))
