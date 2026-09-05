# -*- coding: utf-8 -*-
"""Runda 61 — galleriplanen: (produkt, [(bild, alt)]) i visningsordning.
Spec-kortet ligger på plats 3, efter hjälte och miljöbild.

☠️ Bilder med UTLÄNDSK text inbränd är uppräknade i SPARRADE och avvisas av
grinden, inte av mitt minne. Tretton av trettiofem är sådana — och i den här
familjen är fem av dem ENGELSKA, inte tyska.
☠️ Provenienskontrollen är mekanisk: varje bildnummer måste tillhöra den
produkt den placeras på. Ögat kan inte skilja tre svarta set åt.
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

KALLA = [l.split() for l in open("bilder.txt") if l.strip()]
NR = {i + 1: KALLA[i][1] for i in range(len(KALLA))}
FIL = {i + 1: "img/%s_%s.jpg" % (KALLA[i][0], KALLA[i][1]) for i in range(len(KALLA))}
KORT = {}
if os.path.exists("uppladdat.txt"):
    for l in open("uppladdat.txt"):
        if l.strip():
            k, f = l.split()
            KORT[k] = f

# bilder med utländsk text inbränd — får aldrig nå kund
SPARRADE = {3, 4, 5, 8, 9, 10, 13, 23, 24, 28, 29, 34, 35}

PLAN = {
 "f523b18d": [
  (1, "Grå vattenkokare med mönstrad yta bredvid en brödrost med fyra fack"),
  (2, "Det grå setet på en köksbänk med rostat bröd, bräda och burkar"),
  ("f523b18d_spec", "Specifikationer för det grå frukostsetet: 1,7 liter, fyra rostfack, sju rostlägen, brödrost 1560–1860 W och 4060 W tillsammans"),
  ("f523b18d_foto", "Brödrostens fyra fack i två rader med fyra skivor på en gång")],
 "83d2db1a": [
  (6, "Gräddvit vattenkokare med termometer på sidan bredvid en brödrost för två skivor"),
  (7, "Det gräddvita setet på en träbänk framför vita köksluckor"),
  ("83d2db1a_spec", "Specifikationer för det gräddvita frukostsetet: 1,7 liter, 1850–2200 W, sju rostlägen, brödrost 780–930 W och 3130 W tillsammans"),
  ("83d2db1a_foto", "Brödrostens breda fack med två skivor bröd i")],
 "e7f69e8a": [
  (11, "Svart vattenkokare med termometer på sidan bredvid en svart brödrost för två skivor"),
  (12, "Person som häller upp hett vatten ur den svarta kokaren i en kopp"),
  ("e7f69e8a_spec", "Specifikationer för det svarta frukostsetet: 1,7 liter, 1850–2200 W, sju rostlägen, 2,98 kg och 3130 W tillsammans"),
  (14, "Hand som lyfter en rostad skiva med sylt ur den svarta brödrosten"),
  (15, "Det svarta setet på en marmorbänk med två personer och kaffekoppar bakom")],
 "375bb3c8": [
  (16, "Gräddfärgad vattenkokare med lysande temperaturdisplay bredvid en brödrost för två skivor"),
  (17, "Setet vid ett köksfönster med rostat bröd i facken och ånga ur kokaren"),
  ("375bb3c8_spec", "Specifikationer för frukostsetet med display: temperaturval 40–100 °C, varmhållning upp till 3 timmar, 1,7 liter, sex rostlägen och 3100 W tillsammans"),
  (18, "Måttskiss över setet: brödrosten 28,7 × 17 × 19,1 cm och kokaren 23,2 × 15,9 × 24,8 cm"),
  (19, "Person som lägger bröd i den gräddfärgade brödrosten"),
  (20, "Person som häller upp hett vatten ur den gräddfärgade kokaren")],
 "7805b8bc": [
  (21, "Svart vattenkokare med temperaturdisplay bredvid en svart brödrost för två skivor"),
  (22, "Det svarta setet på en köksbänk med limpa, skivat bröd och smörgåsar"),
  ("7805b8bc_spec", "Specifikationer för det svarta frukostsetet: varmhållning upp till 3 timmar, minnesfunktion 300 sekunder, 1,7 liter, sex rostlägen och 3100 W tillsammans"),
  (25, "Närbild på den svarta brödrostens vred och knappar")],
 "2f2c1c88": [
  (26, "Gräddvit vattenkokare bredvid en brödrost i rostfritt stål med fyra fack"),
  (27, "Det rostfria setet på en stenbänk med fyra skivor i rosten"),
  ("2f2c1c88_spec", "Specifikationer för det rostfria frukostsetet: fyra rostfack, sju rostlägen per fackpar, 1,7 liter, 4,4 kg och 4060 W tillsammans"),
  (30, "Setet på en ljus träskänk i ett kök")],
 "0ab3483a": [
  (31, "Rosa vattenkokare med bikakemönster bredvid en rosa brödrost för två skivor"),
  (32, "Det rosa setet på ett dukat bord med kaffe, smör och rostat bröd"),
  ("0ab3483a_spec", "Specifikationer för det rosa frukostsetet: 1,7 liter, 1850–2200 W, sju rostlägen, brödrost 780–930 W och 3130 W tillsammans"),
  (33, "Måttskiss över setet: brödrosten 27,4 × 17,7 × 18,8 cm och kokaren 24,2 × 19,5 × 23,4 cm")],
}

def bygg():
    fel, ut = [], {}
    sedda = set()
    for pid, rader in PLAN.items():
        poster, iprod = [], set()
        for nyckel, alt in rader:
            if isinstance(nyckel, int):
                if nyckel in SPARRADE:
                    fel.append("%s: bild %d bär utländsk text och får inte visas" % (pid, nyckel)); continue
                if NR.get(nyckel) != pid:
                    fel.append("%s: bild %d hör till %s, inte hit" % (pid, nyckel, NR.get(nyckel))); continue
                fid = None   # fylls i av anroparen via wixstatic-id:t
                poster.append({"nr": nyckel, "altText": alt})
            else:
                if not nyckel.startswith(pid + "_"):
                    fel.append("%s: kortet %r hör till en annan produkt" % (pid, nyckel)); continue
                if nyckel not in KORT:
                    fel.append("%s: kortet %r är inte uppladdat än" % (pid, nyckel)); continue
                poster.append({"id": KORT[nyckel], "altText": alt})
            if alt in sedda:
                fel.append("%s: alt-texten upprepas ordagrant — %r" % (pid, alt[:50]))
            sedda.add(alt)
            for ord_ in ("Tyskland", "tysk", "HOMCOM", "Aosom", "Outsunny"):
                if ord_.lower() in alt.lower():
                    fel.append("%s: alt-texten nämner %r" % (pid, ord_))
        if len(poster) < 4:
            fel.append("%s: bara %d bilder — minst fyra krävs" % (pid, len(poster)))
        ut[pid] = poster
    return ut, fel

if __name__ == "__main__":
    ut, fel = bygg()
    for f in fel:
        print("FEL:", f)
    for pid, poster in ut.items():
        print("%-10s %d bilder" % (pid, len(poster)))
    print()
    print("Bildplan: %d produkter, %d bilder." % (len(ut), sum(len(v) for v in ut.values()))
          if not fel else "BILDPLANEN FÄLLER: %d fel" % len(fel))
    if not fel:
        json.dump(ut, open("bildplan.json", "w"), ensure_ascii=False, indent=1)
    raise SystemExit(1 if fel else 0)
