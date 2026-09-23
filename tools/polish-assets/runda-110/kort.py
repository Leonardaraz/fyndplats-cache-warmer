# -*- coding: utf-8 -*-
"""Runda 110 — sex faktakort (Leonards regel 2026-08-26).

☠️ SPEC-RADERNA HÄMTAS MEKANISKT UR SIDANS EGEN TEXT, aldrig omskrivna för
hand. `kortbygge.varde` kräver dessutom att kortets etikett finns i radens
egen etikett, så ett kort inte kan skriva "Vikt: vit".

☠️ OCH RADINDEXEN SÖKS UPP PÅ ETIKETT, inte handskrivna som i runda 109.
Skälet är den här rundan: spec-tabellen är INTE lika lång för alla sex.
`d72bde5e` saknar både `Gångjärn` och `Fothöjd`, grupp A och B har fothöjd men
olika gångjärnsrader — en delad indexlista hade tyst plockat fel rad. Runda
109:s kommentar sa att indexen "skrivs ändå ut per produkt, för en delad lista
hade tystnat om en enda sida någon gång får en rad till". Den sidan finns nu.

⚠️ RUBRIKEN MÅSTE BÄRAS AV FOTOT. Alla sex rubriker går att RÄKNA eller SE i
studiobilden:

  a999f2b1 / c35f9d4f  bågformad ovankant, fyra fält   (grupp A)
  d72bde5e / 316f9945  rak ovankant, fin spjälväv      (grupp B)
  f8fd1b62 / 309076e2  bred korgflätning, 4 mot 3 fält (grupp C)

Ett alternativ prövades och valdes bort: enbart panelantalet, som runda 109
använde. Det fungerade där för att familjen var EN modell i tre storlekar.
Här är fem av sex fyrpanelsskärmar, så panelantalet hade sagt samma sak om
fem kort av sex — och just ingenting om vad som skiljer dem.

⚠️ Kickern säger `inomhus`. Ramen är obehandlad och väven saknar UV-skydd, och
det är den vanligaste felanvändningen av en vikskärm. Kortet är det enda i
galleriet som kan säga det utan text.

☠️ FOTOT ÄR FÖRBEHANDLAT, se `bygg-panelfoton.py`.
"""
import re
import sys

BAS = "/home/user/fyndplats-cache-warmer/tools/polish-assets"
sys.path.insert(0, BAS)
import kortbygge                                                   # noqa: E402
sys.path.insert(0, BAS + "/runda-110")
import texter as T                                                 # noqa: E402
import matt                                                        # noqa: E402

HAR = BAS + "/runda-110"


def specrader(nyckel):
    """<li>-raderna ur produktens EGEN spec-tabell, ordagrant."""
    block = re.search(r"<h2>Tekniska specifikationer</h2><ul>(.*?)</ul>",
                      T.PRODUKTER[nyckel]["html"], re.S).group(1)
    return [re.sub(r"<[^>]+>", "", li) for li in re.findall(r"<li>(.*?)</li>", block, re.S)]


KICKER = "Rumsavdelare för inomhusbruk"
RUBRIK = {
 "a999f2b1": "Fyra paneler med bågformad kant",
 "c35f9d4f": "Fyra paneler med bågformad kant",
 "d72bde5e": "Fyra paneler i spjälvävd bambu",
 "316f9945": "Fyra paneler i svartmålad ram",
 "f8fd1b62": "Fyra paneler i flätad bambu",
 "309076e2": "Tre paneler i flätad bambu",
}
# Etiketterna kortet ska bära, i ordning. Indexet SÖKS UPP per produkt.
ETIKETTER = ["Mått utfälld", "Mått hopfälld", "Panel", "Material", "Vikt", "Montering"]


def rader(nyckel):
    spec = specrader(nyckel)
    ut = []
    for e in ETIKETTER:
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
            print("        %-16s %s" % (e + ":", kortbygge.varde(p["spec"][i], e)))

    print("\n=== bygger ===")
    namn, facit = kortbygge.bygg(HAR, produkter, kortdata, foton=foton)
    print("  %d kort byggda" % len(namn))
