# -*- coding: utf-8 -*-
"""Runda 60 — galleriplanen: (produkt, [(bild, alt)]) i visningsordning.
Spec-kortet ligger på plats 3, efter hjälte och miljöbild.

☠️ Bilder med tysk text INBRÄND är uppräknade i TYSKA och avvisas av grinden,
inte av mitt minne. Tretton av fyrtio bilder är sådana.
☠️ Provenienskontrollen är mekanisk: varje bildnummer måste tillhöra den
produkt den placeras på. Ögat kan inte skilja fem svarta kokare åt.
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

KALLA = [l.split() for l in open("bilder.txt") if l.strip()]
NR = {i + 1: KALLA[i][1] for i in range(len(KALLA))}
KORT = {}
if os.path.exists("uppladdat.txt"):
    for l in open("uppladdat.txt"):
        if l.strip():
            k, f = l.split()
            KORT[k] = f            # nyckel: "<id8>_spec" / "<id8>_foto"

# bilder med tysk text inbränd — får aldrig nå kund
TYSKA = {4, 9, 18, 19, 20, 28, 29, 30, 33, 34, 38, 39, 40}

PLAN = {
 "4ac902ed": [
  (1, "Svart miniugn på 30 liter med luckan nedfälld, med frallor på gallret och friterat i korgen"),
  (2, "Miniugnen på en köksbänk med frukost uppdukad bredvid"),
  ("4ac902ed_spec", "Specifikationer för miniugnen: 30 liter, 1600 W, 90–230 °C, innermått 34,5 × 31,8 × 25,6 cm och fyra falsar"),
  (3, "Måttskiss över miniugnen: 43 cm bred, 39 cm djup och 39 cm hög"),
  (5, "Närbild på miniugnens ventilerade sida i svart")],
 "0ceeb412": [
  (6, "Torkapparat med fem genomskinliga plan staplade på en grå bas"),
  (7, "Torkapparaten på en köksö med frukt och grönsaker runt omkring"),
  ("0ceeb412_spec", "Specifikationer för torkapparaten: fem plan, Ø32 × 3,5 cm, 35–70 °C, 245 W och 5 kg maxlast"),
  (8, "Måttskiss över torkapparaten: 32 cm bred, 27 cm hög och plan på 3,5 cm"),
  (10, "Torkapparaten med kiwiskivor och citrusklyftor på planen")],
 "d8c2dec6": [
  (11, "Grå vattenkokare med bikakemönstrad yta och kopparfärgade detaljer"),
  (12, "Vattenkokaren på en köksbänk bredvid gifflar och sylt"),
  ("d8c2dec6_spec", "Specifikationer för vattenkokaren: 1,7 liter, 2200 W, en kopp på 50 sekunder och 24,2 × 19,5 × 23,4 cm med bas"),
  (13, "Måttskiss över vattenkokaren: 24,2 cm bred, 19,5 cm djup och 23,4 cm hög"),
  (14, "Vattenkokaren på en träbyrå med tekopp och bakverk"),
  (15, "Person som häller upp hett vatten ur vattenkokaren i en kopp")],
 "1121b59a": [
  (16, "Svart vattenkokare och svart brödrost för två skivor, sedda framifrån"),
  (17, "Frukostsetet på en köksbänk med två färdigrostade skivor i brödrosten"),
  ("1121b59a_spec", "Specifikationer för frukostsetet: kokare 1,7 liter, en kopp på 42 sekunder, sju rostlägen och 3280 W tillsammans"),
  ("1121b59a_foto", "Frukostsetet i svart, där brödrosten tar två skivor åt gången")],
 "b330de9c": [
  (21, "Svart vattenkokare och brödrost med bikakemönster och kopparfärgade detaljer"),
  (22, "Setet på en köksbänk med två rostade skivor uppe i brödrosten"),
  ("b330de9c_spec", "Specifikationer för frukostsetet: kokare 1,7 liter, 1850–2200 W, sju rostlägen och 3130 W tillsammans"),
  (24, "Närbild på vattenkokarens handtag och den upplysta strömbrytaren"),
  (25, "Närbild på det avtagbara pipfiltret innanför kokarens pip"),
  (23, "Måttskiss över setet: kokaren 24,2 × 19,5 × 23,4 cm och brödrosten 27,4 × 17,7 × 18,8 cm")],
 "106eafc5": [
  (26, "Svart vattenkokare och brödrost med räfflad yta, sedda framifrån"),
  (27, "Setet på en köksbänk med rostat bröd i brödrosten"),
  ("106eafc5_spec", "Specifikationer för frukostsetet: 1,7 liter kokar på 3 minuter 15 sekunder, sju rostlägen och 3100 W tillsammans"),
  ("106eafc5_foto", "Vattenkokaren och brödrosten står som ett par på bänken")],
 "70b6bfe2": [
  (31, "Svart vattenkokare med pekskärm och matchande brödrost med display"),
  (32, "Setet på en köksbänk med bröd och rostade skivor bredvid"),
  ("70b6bfe2_spec", "Specifikationer för frukostsetet: sex temperaturer 55/60/80/85/90/100 °C, varmhållning upp till tre timmar och 3130 W tillsammans"),
  (35, "Vattenkokarens display visar vald temperatur medan brödrosten rostar två skivor")],
 "6edbe425": [
  (36, "Brödrost för fyra skivor i stål och svart, med en svart vattenkokare med bygelhandtag"),
  (37, "Setet på en köksbänk med kastrull och skål i bakgrunden"),
  ("6edbe425_spec", "Specifikationer: brödrost med fyra fack och sju rostlägen, kokare 1,7 liter och 4060 W tillsammans"),
  ("6edbe425_foto", "Brödrostens fyra fack i två rader, med vattenkokaren bredvid")],
}

FORBJUDNA = ("Tyskland", "tysk", "Kina", "Polen", "Spanien", "HOMCOM", "Outsunny",
             "PawHut", "Aiyaplay", "Vinsetto", "Aosom", "EU-lager", "Otter", "Strix")

def bygg():
    fel, ut, sett = [], {}, {}
    for pid, rader in PLAN.items():
        poster = []
        for nr, alt in rader:
            if isinstance(nr, str):                     # ett av våra egna kort
                if nr not in KORT:
                    fel.append("%s: kortet %r är inte uppladdat än" % (pid, nr))
                    continue
                if not nr.startswith(pid):
                    fel.append("%s: kortet %r tillhör en annan produkt" % (pid, nr))
                poster.append({"id": KORT[nr], "altText": alt})
                continue
            if nr in TYSKA:
                fel.append("%s: bild %02d bär tysk text inbränd" % (pid, nr))
            agare = KALLA[nr - 1][0]
            if agare != pid:
                fel.append("%s: bild %02d tillhör %s" % (pid, nr, agare))
            poster.append({"id": NR[nr], "altText": alt})
        for p in poster:
            if not p["altText"].strip():
                fel.append("%s: tom alt-text" % pid)
            for o in FORBJUDNA:
                if o.lower() in p["altText"].lower():
                    fel.append("%s: alt-texten nämner %r" % (pid, o))
        if len({p["id"] for p in poster}) != len(poster):
            fel.append("%s: samma fil två gånger i galleriet" % pid)
        for p in poster:
            if p["id"] in sett:
                fel.append("%s och %s delar filen %s" % (sett[p["id"]], pid, p["id"]))
            sett[p["id"]] = pid
        ut[pid] = poster
    return ut, fel

if __name__ == "__main__":
    ut, fel = bygg()
    for pid, poster in ut.items():
        print("%-10s %d bilder" % (pid, len(poster)))
    print()
    for f in fel:
        print("FEL:", f)
    if not fel:
        json.dump(ut, open("galleri.json", "w"), ensure_ascii=False, indent=1)
        print("Galleriplan OK: %d produkter, %d bilder."
              % (len(ut), sum(len(v) for v in ut.values())))
    raise SystemExit(1 if fel else 0)
