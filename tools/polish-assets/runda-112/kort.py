# -*- coding: utf-8 -*-
"""Runda 112 — nio faktakort (Leonards regel 2026-08-26).

☠️ SPEC-RADERNA HÄMTAS MEKANISKT UR SIDANS EGEN TEXT, aldrig omskrivna för
hand. `kortbygge.varde` kräver att kortets etikett finns i radens egen
etikett, så ett kort inte kan skriva "Vikt: vit".

☠️ OCH ETIKETTLISTAN ÄR PER PRODUKT — här av ett skäl rundan inte hade förut:
   TVÅ RADER KAN BÄRA SAMMA TAL. Tumtalet räknas på DUKEN, och sju av nio har
   en synlig bildyta som är 3–6 cm mindre per sida. Tre har den inte:

     1b87909f  duk 263 × 148  =  bildyta 263 × 148   (spänd i ram, ingen kant)
     623b6504  duk 171 × 130  =  bildyta 171 × 130
     77e4a558  duk 171 × 130  =  bildyta 171 × 130

   På dem hade `Dukstorlek` och `Synlig bildyta` blivit två rader med exakt
   samma värde — vilket LÄSER som ett fel även när det är sant. De tre får
   `Yttermått` på den platsen i stället, och det är också det tal deras köpare
   faktiskt saknar: hur mycket vägg respektive golv produkten tar.

⚠️ RUBRIKEN MÅSTE BÄRAS AV FOTOT. Alla nio går att SE i bilden under: de två
   stativen, kassetten med sin väggpanel och fjärrkontroll, draghandtaget i
   nederkant, det trebenta golvstativet, väggfästena.

☠️ OCH B-PARETS TVÅ HJÄLTEBILDER ÄR SAMMA RENDER I TVÅ STORLEKAR. Uppmätt på
   ett zoomark: samma surfare, samma kassett, samma väggpanel, samma
   fjärrkontroll. De får därför SAMMA rubrik. En rubrik som skilde dem åt hade
   varit påhittad — skillnaden är storleken, och den bär raderna.

⚠️ Kickern säger `inomhus` på åtta av nio. Bara 1b87909f är byggd för att stå
   ute (markankare och linor ingår, `Användning: utomhus och inomhus` i
   spec-tabellen). Kortet är det enda i galleriet som kan säga det utan
   brödtext.
"""
import re
import sys

BAS = "/home/user/fyndplats-cache-warmer/tools/polish-assets"
sys.path.insert(0, BAS)
import kortbygge                                                   # noqa: E402
sys.path.insert(0, BAS + "/runda-112")
import texter as T                                                 # noqa: E402
import matt                                                        # noqa: E402

HAR = BAS + "/runda-112"


def specrader(nyckel):
    html = T.bygg(nyckel)["html"]
    block = re.search(r"<h2>Tekniska specifikationer</h2><ul>(.*?)</ul>",
                      html, re.S).group(1)
    return [re.sub(r"<[^>]+>", "", li) for li in re.findall(r"<li>(.*?)</li>", block, re.S)]


KICKER = {k: ("Projektorduk för ute och inne" if matt.GRUPPER[k] == "A"
              else "Projektorduk för inomhusbruk") for k in matt.RUNDAN}

RUBRIK = {
 "1b87909f": "Duk spänd i ram på två stativ",
 "422ab1bd": "Motorkassett med väggpanel och fjärrkontroll",
 "a8c82049": "Motorkassett med väggpanel och fjärrkontroll",
 "ddca577d": "Draghandtag i nederkant, duk i 4:3",
 "77d2b35c": "Draghandtag i nederkant, kvadratisk duk",
 "0370673c": "Svart hölje på trebent stativ",
 "fe11166f": "Vitt hölje på trebent stativ",
 "623b6504": "Svart hölje med väggpanel och fjärrkontroll",
 "77e4a558": "Vitt hölje monterat på väggen",
}

# ☠️ `Synlig bildyta` står bara där den SÄGER något annat än `Dukstorlek`.
ETIKETTER = {
 "1b87909f": ["Dukstorlek", "Bildformat", "Ramöppning", "Yttermått", "Vikt",
              "Användning"],
 "422ab1bd": ["Dukstorlek", "Synlig bildyta", "Bildformat", "Anslutning",
              "Vikt", "Montering"],
 "a8c82049": ["Dukstorlek", "Synlig bildyta", "Bildformat", "Anslutning",
              "Vikt", "Montering"],
 "ddca577d": ["Dukstorlek", "Synlig bildyta", "Bildformat", "Material",
              "Vikt", "Montering"],
 "77d2b35c": ["Dukstorlek", "Synlig bildyta", "Bildformat", "Material",
              "Vikt", "Montering"],
 "0370673c": ["Dukstorlek", "Synlig bildyta", "Bildformat", "Färg",
              "Vikt", "Montering"],
 "fe11166f": ["Dukstorlek", "Synlig bildyta", "Bildformat", "Färg",
              "Vikt", "Montering"],
 "623b6504": ["Dukstorlek", "Bildformat", "Yttermått", "Anslutning",
              "Vikt", "Montering"],
 "77e4a558": ["Dukstorlek", "Bildformat", "Yttermått", "Anslutning",
              "Vikt", "Montering"],
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


def kontroll():
    """☠️ Två rader med samma värde läser som ett fel. Grinden, inte ögat."""
    fel = []
    for k in matt.RUNDAN:
        spec = specrader(k)
        varden = [kortbygge.varde(spec[i], e) for e, i in rader(k)]
        if len(set(varden)) != len(varden):
            fel.append("%s: två rader bär samma värde %s" % (k, varden))
        etiketter = ETIKETTER[k]
        if "Synlig bildyta" in etiketter:
            duk = "%s × %s cm" % (T.tal(matt.RUNDAN[k][2]), T.tal(matt.RUNDAN[k][3]))
            bild = "%s × %s cm" % (T.tal(matt.BILDYTA[k][0]), T.tal(matt.BILDYTA[k][1]))
            if duk == bild:
                fel.append("%s: `Synlig bildyta` upprepar `Dukstorlek` (%s)" % (k, duk))
        else:
            duk = (matt.RUNDAN[k][2], matt.RUNDAN[k][3])
            if duk != matt.BILDYTA[k]:
                fel.append("%s: bildytan SKILJER sig (%s mot %s) och saknas på kortet"
                           % (k, duk, matt.BILDYTA[k]))
    return fel


RADER = {k: rader(k) for k in matt.RUNDAN}

if __name__ == "__main__":
    fel = kontroll()
    if fel:
        raise SystemExit("KORTGRINDEN FALLER:\n  " + "\n  ".join(fel))
    print("kortgrinden: 0 fel")
    produkter = [{"kort": k, "spec": specrader(k)} for k in matt.RUNDAN]
    kortdata = {k: (KICKER[k], RUBRIK[k], RADER[k]) for k in matt.RUNDAN}
    foton = {k: "%s/panelfoton/%s.jpg" % (HAR, k) for k in matt.RUNDAN}
    print("\n=== spec-rader som kommer på korten ===")
    for p in produkter:
        k = p["kort"]
        print("  %s  %s | %s" % (k, KICKER[k], RUBRIK[k]))
        for e, i in RADER[k]:
            print("        %-18s %s" % (e + ":", kortbygge.varde(p["spec"][i], e)))
    print("\n=== bygger ===")
    namn, facit = kortbygge.bygg(HAR, produkter, kortdata, foton=foton)
    print("  %d kort byggda" % len(namn))
