# -*- coding: utf-8 -*-
"""Runda 118 Steg 9 — galleriets ordning och svenska alt-texter.

Kortet läggs på PLATS 3, alltså efter hjälte- och livsstilsbilden och före
måttritningen. Alt-texten skrivs på ITEM-nivå (`items[].altText`), aldrig
inuti `image` — där LÄSER man den på en oputsad produkt, och en PATCH som
skickar den dit släpps TYST.
"""
ALT = {
 "764a3efc": [
  "Vit rullvagn med fyra utdragslådor och skiva i träeffekt, sedd snett framifrån",
  "Rullvagnen utdragen ur springan mellan köksskåpen",
  None,
  "Måttritning: 39,5 × 24 × 82 cm, lådorna 39,5 × 19,5 × 6,5 cm och 10 kg maxlast",
  "Rullvagnen bredvid ett skrivbord med redskap i lådorna",
  "Rullvagnen i ett badrum bredvid ett badkar",
 ],
 "820d076b": [
  "Hopfällbar barvagn i bambu med två brickor och tre flaskplatser, sedd snett framifrån",
  "Barvagnen dukad framför ett köksskåp",
  None,
  "Måttritning: 66 × 40 × 70 cm, brickorna 54 × 33 cm och 12 kg maxlast",
  "Barvagnen med flaskor stående i det undre planet",
  "Barvagnen mot en vägg med köksredskap på översta brickan",
 ],
 "15d6fcef": [
  "Köksvagn med fyra utdragskorgar och arbetsyta i ljus stenlook, sedd snett framifrån",
  "Köksvagnen fylld med burkar och flaskor bredvid en köksbänk",
  None,
  "Måttritning: 49,5 × 31 × 91 cm, arbetsytan 43 × 31 cm och 22 kg maxlast",
  "Köksvagnen med korgarna fyllda, bredvid ett kylskåp",
  "Närbild på arbetsytan i ljus stenlook och handtagsbygeln",
 ],
 "0fd65541": [
  "Köksvagn med fyra utdragskorgar och ekfärgad arbetsyta, sedd snett framifrån",
  "Köksvagnen fylld med burkar och flaskor bredvid en köksbänk",
  None,
  "Måttritning: 49,5 × 31 × 91 cm, arbetsytan 43 × 31 cm och 22 kg maxlast",
  "Köksvagnen med korgarna fyllda, i ett kök med vita skåp",
  "Närbild på den ekfärgade arbetsytan och handtagsbygeln",
 ],
 "2e292a70": [
  "Rund grönsaksvagn i svart med fyra vridbara trådkorgar, sedd framifrån",
  "Grönsaksvagnen med korgarna vridna åt olika håll i ett kök",
  None,
  "Måttritning: 33 × 33 × 77 cm med korgarnas innermått",
  "Närbild på en trådkorg med burkar i",
  "Närbild på den översta hyllan med skål och flaska",
 ],
 "a4ee97c1": [
  "Svart rullbord med utdragslåda och undre hylla i nät, sett snett framifrån",
  "Rullbordet dukat med glas och tallrikar framför en köksö",
  None,
  "Måttritning: 61 × 32,6 × 58,5 cm och lådan 9 cm djup",
  "Närbild på hängkorgen som sitter på sidopanelen",
  "Närbild på sidopanelen med en handduk på en krok",
 ],
 "8a73caf4": [
  "Barvagn i gran med svart stålram, fyra flaskhållare och två korgar, sedd snett framifrån",
  "Barvagnen dukad med fat och glas inomhus",
  None,
  "Måttritning: 97,5 × 65 × 81 cm och arbetsytan 88 × 61 cm",
  "Barvagnen dukad på en uteplats med korgar i det undre planet",
  "Barvagnen bredvid en loungegrupp i en trädgård",
 ],
 "fcb86875": [
  "Rund barvagn i naturfärgad konstrotting med svart metallbricka, sedd snett framifrån",
  "Barvagnen med flaskor i det undre planet på en uteplats",
  None,
  "Måttritning: Ø 50 × 66 cm, övre planet Ø 45 cm och undre planet Ø 50 cm",
  "Barvagnen bredvid en utesoffa",
  "Närbild på den flätade konstrottingen och den svarta brickan",
 ],
 "ca20d60e": [
  "Serveringsvagn i gran med svart stålram och två lamellagda hyllplan, sedd snett framifrån",
  "Serveringsvagnen på en uteplats med en korg i det undre planet",
  None,
  "Måttritning: 107 × 65 × 80 cm, hyllorna 97 × 65 cm och 97 × 58,5 cm",
  "Närbild på den lamellagda övre hyllan",
  "Närbild på gaveln med tre krokar",
 ],
}

KORTALT = {
 "764a3efc": "Faktaruta: rullvagn 39,5 × 24 × 82 cm med fyra lådor och 10 kg maxlast",
 "820d076b": "Faktaruta: hopfällbar barvagn 66 × 40 × 70 cm med två brickor och 12 kg maxlast",
 "15d6fcef": "Faktaruta: köksvagn 49,5 × 31 × 91 cm med fyra korgar och 22 kg maxlast",
 "0fd65541": "Faktaruta: köksvagn 49,5 × 31 × 91 cm med fyra korgar och 22 kg maxlast",
 "2e292a70": "Faktaruta: grönsaksvagn 33 × 33 × 77 cm med fyra korgar och 13 kg maxlast",
 "a4ee97c1": "Faktaruta: rullbord 61 × 32,6 × 58,5 cm med låda, hylla och 10,6 kg maxlast",
 "8a73caf4": "Faktaruta: barvagn 97,5 × 65 × 81 cm i gran med 50 kg per hylla",
 "fcb86875": "Faktaruta: rund barvagn Ø 50 × 66 cm i konstrotting med 30 kg maxlast",
 "ca20d60e": "Faktaruta: serveringsvagn 107 × 65 × 80 cm i gran med 50 kg per plan",
}


def kontroll():
    """Alt-texten är kundtext och grindas som sådan."""
    import re
    import sys
    sys.path.insert(0, ".."); sys.path.insert(0, ".")
    import grindar as G
    import grind as GR
    import matt as M
    fel = []
    for pid in M.ALLA:
        rader = [x for x in ALT[pid] if x] + [KORTALT[pid]]
        if len(ALT[pid]) != 6:
            fel.append(f"{pid}: {len(ALT[pid])} alt-rader, ska vara 6")
        if ALT[pid][2] is not None:
            fel.append(f"{pid}: plats 3 är inte kortets plats")
        txt = ". ".join(rader)
        for monster, etikett in GR.FORBJUDET + GR.TONGRINDAR:
            m = monster.search(txt)
            if m:
                fel.append(f"{pid} ALT, {etikett}: {m.group(0)!r}")
        # Egenskaper som bara vissa har får inte krypa in i alt-texten heller.
        for monster, agare, etikett in GR.ENSKILDA:
            m = monster.search(txt)
            if m and pid not in agare:
                fel.append(f"{pid} ALT, {etikett}: {m.group(0)!r}")
        # Varje tal måste gå att spåra till matt.py.
        kallor = " ".join(str(v) for v in M.M[pid].values())
        tillatna = set(re.findall(r"\d+(?:,\d+)?", kallor))
        for t in re.findall(r"\d+(?:,\d+)?", txt):
            if t not in tillatna:
                fel.append(f"{pid} ALT, OSPÅRAT TAL {t!r}")
        if len(set(rader)) != len(rader):
            fel.append(f"{pid} ALT: två identiska alt-texter")
    return fel


if __name__ == "__main__":
    f = kontroll()
    print(f"alt.kontroll: 9 produkter, 54 alt-texter, {len(f)} fel")
    for x in f:
        print("  ✗", x)
