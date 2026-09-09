# -*- coding: utf-8 -*-
"""Runda 114 — nio faktakort (Leonards regel 2026-08-26).

☠️ SPEC-RADERNA HÄMTAS MEKANISKT UR SIDANS EGEN TEXT, aldrig omskrivna för
   hand. `kortbygge.varde` kräver att kortets etikett finns i radens egen
   etikett, så ett kort inte kan skriva "Vikt: rosa".

⚠️ RUBRIKEN MÅSTE BÄRAS AV FOTOT UNDER DEN. Kortet är ett bildlöfte: läsaren
   ser rubriken och fotot i samma ögonkast. Alla nio rubriker här går att SE i
   hjältebilden — underhyllan, spegeldörren, konstläderhandtaget, spännlåsen,
   hjulen, den släta fronten, ventilationsgallret.

☠️ FÄRGRADEN LIGGER PÅ BÅDA FÄRGTVILLINGARNA. Utan den hade de fyra kortens
   rader varit ORDAGRANT identiska — samma modell, samma mått, samma volym —
   och två kort som säger exakt samma sak om två sidor är samma dubblett som
   måttgrinden finns för att hitta.
"""
import re
import sys

BAS = "/home/user/fyndplats-cache-warmer/tools/polish-assets"
sys.path.insert(0, BAS)
import kortbygge                                                   # noqa: E402
sys.path.insert(0, BAS + "/runda-114")
import matt                                                        # noqa: E402
import texter as T                                                 # noqa: E402

HAR = BAS + "/runda-114"


def specrader(nyckel):
    html = T.bygg(nyckel)["html"]
    block = re.search(r"<h2>Tekniska specifikationer</h2><ul>(.*?)</ul>",
                      html, re.S).group(1)
    return [re.sub(r"<[^>]+>", "", li)
            for li in re.findall(r"<li>(.*?)</li>", block, re.S)]


KICKER = {
    "397b845e": "Kylvagn utan ström",
    "412c9f43": "Kosmetikkyl med spegel",
    "d754d015": "Kosmetikkyl med spegel",
    "758f0a80": "Minikyl som kyler och värmer",
    "d5cc9efa": "Minikyl som kyler och värmer",
    "b3e3aac8": "Passiv kylbox",
    "b815de72": "Passiv kylbox på hjul",
    "e6d2e70b": "Kylskåp med frysfack",
    "ef0fa603": "Dryckeskyl",
}

RUBRIK = {
    "397b845e": "Underhylla under kylboxen",
    "412c9f43": "Spegeln är hela dörren",
    "d754d015": "Spegeln är hela dörren",
    "758f0a80": "Handtag i konstläder på ovansidan",
    "d5cc9efa": "Handtag i konstläder på ovansidan",
    "b3e3aac8": "Två spännlås och sidhandtag",
    # ⚠️ RÄTTAD EFTER KONTAKTARKET. Rubriken löd först "Hjul och greppbygel i
    #    bakkanten" — men fotot visar hjulet i ENA änden och bygeln i den
    #    ANDRA. Rubriken är ett bildlöfte, och det höll inte. Felet syns på en
    #    sekund i ett kontaktark och aldrig i ett API-svar.
    "b815de72": "Hjul i ena änden, greppbygel i den andra",
    "e6d2e70b": "Slät vit front, inget handtag utanpå",
    "ef0fa603": "Svart front, ventilation längs sidan",
}

ETIKETTER = {
    "397b845e": ["Yttermått", "Volym", "Invändigt", "Max belastning",
                 "Vikt", "Montering"],
    "412c9f43": ["Yttermått", "Volym", "Kyler till", "Ljudnivå", "Effekt", "Färg"],
    "d754d015": ["Yttermått", "Volym", "Kyler till", "Ljudnivå", "Effekt", "Färg"],
    "758f0a80": ["Yttermått", "Volym", "Kyler till", "Värmer till",
                 "Ljudnivå", "Färg"],
    "d5cc9efa": ["Yttermått", "Volym", "Kyler till", "Värmer till",
                 "Ljudnivå", "Färg"],
    "b3e3aac8": ["Yttermått", "Volym", "Invändigt", "Max belastning",
                 "Vikt", "Material"],
    "b815de72": ["Yttermått", "Volym", "Invändigt", "Max belastning",
                 "Vikt", "Material"],
    "e6d2e70b": ["Yttermått", "Volym", "Kyler till", "Energiklass",
                 "Ljudnivå", "Vikt"],
    "ef0fa603": ["Yttermått", "Volym", "Kyler till", "Energiklass",
                 "Energiförbrukning", "Ljudnivå"],
}


def rader(nyckel):
    spec = specrader(nyckel)
    ut = []
    for e in ETIKETTER[nyckel]:
        träffar = [i for i, r in enumerate(spec) if r.split(":")[0].strip() == e]
        if len(träffar) != 1:
            raise SystemExit("%s: etiketten %r finns %d gånger"
                             % (nyckel, e, len(träffar)))
        ut.append((e, träffar[0]))
    return ut


def kontroll():
    """☠️ Grinden, inte ögat. Två rader med samma värde läser som ett fel."""
    fel = []
    for k in matt.WIX:
        spec = specrader(k)
        varden = [kortbygge.varde(spec[i], e) for e, i in rader(k)]
        if len(set(varden)) != len(varden):
            fel.append("%s: två rader bär samma värde %s" % (k, varden))
        # ☠️ LAGKRAVET ska stå på KORTET också — men BARA på de två som har en
        #    klass. Ett kort som skriver "Energiklass" på en passiv kylbox
        #    påstår att (EU) 2019/2016 gäller den.
        har = "Energiklass" in ETIKETTER[k]
        if har != (k in matt.ENERGIKLASS):
            fel.append("%s: energiklassraden är %s på kortet"
                       % (k, "med" if har else "borta"))
    # Färgtvillingarnas kort måste skilja sig åt på minst EN rad.
    for a, b in (("412c9f43", "d754d015"), ("758f0a80", "d5cc9efa")):
        va = [kortbygge.varde(specrader(a)[i], e) for e, i in rader(a)]
        vb = [kortbygge.varde(specrader(b)[i], e) for e, i in rader(b)]
        if va == vb:
            fel.append("%s och %s får ORDAGRANT identiska kort" % (a, b))
    # Samma rubrik får bara delas av färgtvillingar, aldrig av två modeller.
    for a in matt.WIX:
        for b in matt.WIX:
            if a < b and RUBRIK[a] == RUBRIK[b] and matt.GRUPPER[a] != matt.GRUPPER[b]:
                fel.append("%s och %s delar rubrik men är olika konstruktioner"
                           % (a, b))
    return fel


RADER = {k: rader(k) for k in matt.WIX}

if __name__ == "__main__":
    fel = kontroll()
    if fel:
        raise SystemExit("KORTGRINDEN FALLER:\n  " + "\n  ".join(fel))
    print("kortgrinden: 0 fel")
    produkter = [{"kort": k, "spec": specrader(k)} for k in matt.WIX]
    kortdata = {k: (KICKER[k], RUBRIK[k], RADER[k]) for k in matt.WIX}
    foton = {k: "%s/panelfoton/%s.jpg" % (HAR, k) for k in matt.WIX}
    print("\n=== spec-rader som kommer på korten ===")
    for p in produkter:
        k = p["kort"]
        print("  %s  %s | %s" % (k, KICKER[k], RUBRIK[k]))
        for e, i in RADER[k]:
            print("        %-20s %s" % (e + ":", kortbygge.varde(p["spec"][i], e)))
    print("\n=== bygger ===")
    namn, facit = kortbygge.bygg(HAR, produkter, kortdata, foton=foton)
    print("  %d kort byggda" % len(namn))
