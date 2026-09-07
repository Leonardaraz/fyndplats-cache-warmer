# -*- coding: utf-8 -*-
"""Runda 88 — Fyndplats eget faktakort, ett per sparkcykel.

⚠️ RADERNA SLÅS UPP PÅ HELA ETIKETTEN, inte på första ordet. Familjen har
   BÅDE `Rekommenderad ålder` och `Rekommenderad längd`, och runda 87:s
   uppslag (som matchade på ordet före första blanksteget) hade träffat två
   rader och fällt bygget — eller värre, om det bara funnits en av dem:
   skrivit rätt värde under fel etikett.

☠️ `Montering krävs` SAKNAR KOLON och är därför ingen kortrad. Den står i
   spec-tabellen och i en vanlig fråga, där den hör hemma.

☠️ HJÄLTEBILDEN ÄR VITBOTTENSBILDEN (`<id>-0.jpg`), inte livsstilsbilden.
   Två skäl, båda mätta. Kortet är ett FAKTAKORT, och vitbottensbilden är
   den som visar hela sparkcykeln — ram, styre, hjul, korg — utan att en
   park skymmer den. Och de åtta livsstilsbilderna är utomhusfoton med
   gräs och lövverk: alla åtta sprängde 215 kB-taket vid q=85, och en
   framsökning av oskärpan landade på radie 4,8–5,7 utan att ens vara
   klar. Att sudda sönder fotot för att få plats är fel svar när det
   finns ett bättre foto. Vitbottensbilderna klarar taket utan oskärpa.

   `kortbygge.kalla()` slår upp `<har>/rawbilder/<id>-1.jpg`, så vald
   hjälte kopieras till `kortkalla/rawbilder/` och DEN katalogen skickas
   som `har`. Råbilderna rörs aldrig.

☠️ RUBRIKERNA ÄR VALDA MOT HJÄLTEBILDEN, inte mot texten.
   Modell A och B skiljs på TVÅ CENTIMETER i specen men är omedelbart olika
   i bild — A har BMX-styre med tvärstag och helsvarta hjul, B ett rakt
   styre med maghjul och handtag i accentfärgen. Korten säger just det.

⚠️ MÅTTET LIGGER FÖRST PÅ VARJE KORT. Familjen skiljs på hur stor
   sparkcykeln är i förhållande till barnet, och det är den axeln kunden
   jämför på. Modell I bär dessutom längden i sitt namn.
"""
import json
import os
import shutil
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

from kortbygge import bygg                                            # noqa: E402
from texter import PRODUKTER                                          # noqa: E402

KORTPLAN = {
    # Bild 1: barn med hjälm på blå sparkcykel, tvärstaget syns i styret.
    "b1dcd424": ("Sparkcykel barn, 12 tum", "Blå ram och styre med tvärstag",
                 ["Mått", "Hjul", "Broms", "Maxlast", "Rekommenderad ålder",
                  "Färg"]),
    # Vitbotten: vinröd ram med SVARTA hjul — det som skiljer den från
    # e9cfa7bf, som också har vinröd ram men RÖDA maghjul. Precis den
    # förväxling Steg 4 varnade för, uttryckt i en rubrik.
    "41269686": ("Sparkcykel barn, 12 tum", "Vinröd ram och svarta hjul",
                 ["Mått", "Hjul", "Broms", "Maxlast", "Rekommenderad ålder",
                  "Färg"]),
    # Bild 1: barn i park, allt svart från styre till fälg.
    "82b5a517": ("Sparkcykel barn, 12 tum", "Helsvart ram, styre och hjul",
                 ["Mått", "Hjul", "Broms", "Maxlast", "Rekommenderad ålder",
                  "Färg"]),
    # Bild 1: röda maghjul och röda handtag mot vinröd ram.
    "e9cfa7bf": ("Sparkcykel barn, Ø30 cm hjul", "Röda maghjul och röda handtag",
                 ["Mått", "Hjul", "Broms", "Maxlast", "Rekommenderad längd",
                  "Vikt"]),
    "2b8297df": ("Sparkcykel barn, Ø30 cm hjul", "Blå maghjul och blå handtag",
                 ["Mått", "Hjul", "Broms", "Maxlast", "Rekommenderad längd",
                  "Vikt"]),
    "9941383e": ("Sparkcykel barn, Ø30 cm hjul", "Gröna maghjul och gröna handtag",
                 ["Mått", "Hjul", "Broms", "Maxlast", "Rekommenderad längd",
                  "Vikt"]),
    # Bild 1: korgen och båda skärmarna syns rakt av — familjens enda.
    "e4e5a8ef": ("Sparkcykel barn, 139 cm", "Korg fram och skärmar över båda hjulen",
                 ["Mått", "Hjul", "Bromsar", "Korg", "Maxlast",
                  "Rekommenderad längd"]),
    "b03784dc": ("Sparkcykel barn, 139 cm", "Vit korg och vita skärmar på rosa ram",
                 ["Mått", "Hjul", "Bromsar", "Korg", "Maxlast",
                  "Rekommenderad längd"]),
}


def index_for(spec, etikett):
    """Radens index, uppslaget på HELA etiketten. Kastar hellre än gissar."""
    traff = [i for i, r in enumerate(spec)
             if ": " in r and r.split(": ", 1)[0].lower() == etikett.lower()]
    if len(traff) != 1:
        raise SystemExit("%r matchar %d rader i specen — tvetydigt"
                         % (etikett, len(traff)))
    return traff[0]


kortdata = {}
for p in PRODUKTER:
    kicker, rubrik, etiketter = KORTPLAN[p["kort"]]
    kortdata[p["kort"]] = (kicker, rubrik,
                           [(e, index_for(p["spec"], e)) for e in etiketter])

# Vitbottensbilden kopieras dit kortbygget letar efter sin hjälte.
KALLA = os.path.join(HAR, "kortkalla")
os.makedirs(os.path.join(KALLA, "rawbilder"), exist_ok=True)
for p in PRODUKTER:
    shutil.copyfile(os.path.join(HAR, "rawbilder", p["kort"] + "-0.jpg"),
                    os.path.join(KALLA, "rawbilder", p["kort"] + "-1.jpg"))

namn, facit = bygg(KALLA, PRODUKTER, kortdata)
json.dump(facit, open(os.path.join(HAR, "kort-facit.json"), "w",
                      encoding="utf-8"), ensure_ascii=False, indent=1)
print("kort-facit.json skriven")
