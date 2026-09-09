# -*- coding: utf-8 -*-
"""Runda 111 — sju faktakort (Leonards regel 2026-08-26).

☠️ SPEC-RADERNA HÄMTAS MEKANISKT UR SIDANS EGEN TEXT, aldrig omskrivna för
hand. `kortbygge.varde` kräver att kortets etikett finns i radens egen
etikett, så ett kort inte kan skriva "Vikt: vit".

☠️ OCH ETIKETTLISTAN ÄR PER PRODUKT, inte bara indexen. Runda 110 flyttade
indexuppslagningen från handskriven lista till etikettsökning, eftersom
spec-tabellerna var olika LÅNGA. Den här rundan går ett steg till: de är
olika i INNEHÅLL.

  99040238  har ingen `Mått hopfälld` alls — den viks inte ihop
  db70e38c  har `Hyllplan` och `Max last per hylla`, som ingen annan har
  79b349f7  har `Hjul`, som ingen annan har
  F-paren   har `Fotdjup` där de fem andra har `Panelens tjocklek`

En delad etikettlista hade alltså inte plockat fel rad — den hade KASTAT på
99040238 och tigit om det som gör de två särskilda produkterna särskilda.

⚠️ RUBRIKEN MÅSTE BÄRAS AV FOTOT. Alla sju går att RÄKNA eller SE i
studiobilden: panelantalet, hjulen under stolparna, hyllplanen tvärs över
panelerna, bågarna på topparna.

⚠️ Kickern säger `inomhus`. Fem av sju är trä eller papper, och de två
tygskärmarna har leverantörens EGEN inomhusbegränsning i spectabellen. Kortet
är det enda i galleriet som kan säga det utan brödtext.
"""
import re
import sys

BAS = "/home/user/fyndplats-cache-warmer/tools/polish-assets"
sys.path.insert(0, BAS)
import kortbygge                                                   # noqa: E402
sys.path.insert(0, BAS + "/runda-111")
import texter as T                                                 # noqa: E402
import matt                                                        # noqa: E402

HAR = BAS + "/runda-111"


def specrader(nyckel):
    block = re.search(r"<h2>Tekniska specifikationer</h2><ul>(.*?)</ul>",
                      T.PRODUKTER[nyckel]["html"], re.S).group(1)
    return [re.sub(r"<[^>]+>", "", li) for li in re.findall(r"<li>(.*?)</li>", block, re.S)]


KICKER = "Rumsavdelare för inomhusbruk"
RUBRIK = {
 "e858810e": "Fyra paneler med trägaller och tyg",
 "f641d190": "Tre paneler med trägaller och tyg",
 "1c1eb875": "Fyra paneler med palmbladsmönster",
 "23d20823": "Tre bågformade paneler i flätat rep",
 "db70e38c": "Fyra paneler med två hyllplan",
 "79b349f7": "Fem paneler på tolv hjul",
 "99040238": "Tre paneler i svart duk",
}

STANDARD = ["Mått utfälld", "Mått hopfälld", "Panel", "Material", "Vikt", "Montering"]
ETIKETTER = {
 "e858810e": STANDARD,
 "f641d190": STANDARD,
 "1c1eb875": STANDARD,
 "23d20823": STANDARD,
 # Hyllorna ÄR produkten — de får plats på bekostnad av panelmåttet.
 "db70e38c": ["Mått utfälld", "Hyllplan", "Max last per hylla", "Material",
              "Vikt", "Montering"],
 # Hjulen ÄR produkten.
 "79b349f7": ["Mått utfälld", "Panel", "Hjul", "Material", "Vikt", "Montering"],
 # ☠️ Viks inte ihop — ingen `Mått hopfälld` finns att hämta.
 "99040238": ["Mått utfälld", "Panel", "Antal paneler", "Material", "Vikt",
              "Montering"],
}


def rader(nyckel):
    spec = specrader(nyckel)
    ut = []
    for e in ETIKETTER[nyckel]:
        träffar = [i for i, r in enumerate(spec) if r.split(":")[0].strip() == e]
        if len(träffar) != 1:
            raise SystemExit(f"{nyckel}: etiketten {e!r} finns {len(träffar)} gånger")
        ut.append((e, träffar[0]))
    return ut


RADER = {k: rader(k) for k in matt.RUNDAN}

if __name__ == "__main__":
    produkter = [{"kort": k, "spec": specrader(k)} for k in matt.RUNDAN]
    kortdata = {k: (KICKER, RUBRIK[k], RADER[k]) for k in matt.RUNDAN}
    foton = {k: "%s/panelfoton/%s.jpg" % (HAR, k) for k in matt.RUNDAN}
    print("=== spec-rader som kommer på korten ===")
    for p in produkter:
        k = p["kort"]
        print("  %s  %s" % (k, RUBRIK[k]))
        for e, i in RADER[k]:
            print("        %-22s %s" % (e + ":", kortbygge.varde(p["spec"][i], e)))
    print("\n=== bygger ===")
    namn, facit = kortbygge.bygg(HAR, produkter, kortdata, foton=foton)
    print("  %d kort byggda" % len(namn))
