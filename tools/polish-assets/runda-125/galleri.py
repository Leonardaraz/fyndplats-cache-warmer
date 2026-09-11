# -*- coding: utf-8 -*-
"""Runda 125 Steg 9 — alt-texter och bildborttagning.

☠️ ALT-TEXTEN PASSERAR INGEN TEXTGRIND av sig själv — den skrivs rakt in i
   Wix media och finns aldrig i `texter.py`. Den här filen kör därför RUNDANS
   EGEN förbjudna-ord-lista (`grind.FORBJUDET` + `TONGRINDAR`) mot varje
   alt-text innan något skrivs.

☠️ TRE BILDER PLOCKAS BORT — alla bär TYSK TEXT inbränd i pixlarna:
     bdd01b5f pos 4  "FREI BEWEGLICH · Bequem überallhin verschieben ·
                      Seitenhandgriff · 4 Universal-Rollen (2 mit Bremse)"
     5910cd6f pos 4  "Kugelgelagerte Schienen · EVA-Schutzeinlagen · Seitengriffe"
     5910cd6f pos 5  "Autowerkstatt · Lager · Garage · Werkstätten"
   `5910cd6f` behåller därmed tre bilder: hjälte, livsstil och måttritning.

⚠️ BESKRIV VARAN, INTE STAJLINGEN. Verkstadsscenens verktyg, cyklar och
   ryggsäckar är leverantörens rekvisita och ingår inte — de nämns inte.

☠️ MEDIA-ITEM TAR `id`, ALDRIG en wixstatic-`url`, och `media.main` är
   read-only och får inte skickas tillbaka.
"""
import re
import sys

sys.path.insert(0, "..")

import grindar as G          # noqa: E402
import grind as GR           # noqa: E402

# Bilder som INTE ska ligga kvar (produkt, position 1-baserad).
BORT = {("bdd01b5f", 4), ("5910cd6f", 4), ("5910cd6f", 5)}

ALT = {
 "6c9d7288": [
  "Blå verktygsvagn 82 cm i stål med tre öppna plan och en svart utdragslåda",
  "Blå verktygsvagn med lådan utdragen, mejslar i hålremsan och ett nedre plan",
  "Måttritning av verktygsvagnen: 82 cm bred, 35 cm djup och 76 cm hög",
  "Närbild på hålremsan i svart plåt med hål i olika storlekar för mejselskaft",
  "Närbild på den svarta lådan utdragen ur den blå vagnen, med perforerad sida",
 ],
 "3659a7eb": [
  "Svart verktygsvagn med röda lådor, avtagbar överkista och öppen röd skåpdörr",
  "Verktygsvagnen med överkistan på plats och skåpdörren stängd",
  "Måttritning: överkistan 45 × 24 × 33 cm och rullskåpet 60 × 28 × 72 cm",
  "Vagnen med lockets kista uppfälld och de fyra lådorna utdragna i trappa",
  "Närbild på överkistans bärhandtag och de två spärrarna som håller locket",
 ],
 "bdd01b5f": [
  "Svart verkstadsvagn med utdragbar arbetsyta, två lådor och undre bricka",
  "Verkstadsvagnen sedd snett framifrån med locket stängt och lådorna instängda",
  "Måttritning: arbetsytan 70 cm hopskjuten och 130 cm utdragen, 80 cm hög",
  "Vagnen med arbetsytan utdragen och lådorna öppna i en verkstad",
 ],
 "5745c3cb": [
  "Tre röda verktygslådor i stål staplade på varandra med teleskophandtag",
  "De tre kistorna isärtagna: organiser, mellankista med lådor och bottenkista",
  "Måttritning: stapeln 52 × 32 × 72 cm, kisthöjder 23 cm, 18 cm och 34 cm",
  "Stapeln hopsatt med utdraget teleskophandtag och stora hjul i bottenkistan",
  "Bottenkistan med uppfällt lock bredvid den mellersta kistans två lådor",
 ],
 "35b4fba0": [
  "Röd verktygsvagn 69 cm med fem lika djupa lådor och svart halkmatta på toppen",
  "Den röda vagnen med två lådor utdragna och lock uppfällt över överfacket",
  "Måttritning: 69 cm bred, 33 cm djup, 75 cm hög och bänkskivan 61,6 cm",
  "Närbild på den svarta halkmattan på vagnens bänkskiva och det röda draghandtaget",
  "Närbild på ett av de fyra hjulen under den röda plåtkanten",
 ],
 "bc698424": [
  "Mattsvart verktygsvagn med sju lådor, fyra av dem utdragna i trappa",
  "Den mattsvarta vagnen med stängda lådor och verktygsinsats i övre facket",
  "Måttritning: 69 × 33 × 75 cm, grunda lådor 4 cm och djupa lådor 8,5 cm",
  "Närbild på ett svängbart hjul under vagnens svarta plåtkant",
  "Närbild på den räfflade svarta ovansidan och det infällda draghandtaget",
 ],
 "f4fabca6": [
  "Röd verktygsvagn 69 cm med sju lådor och svart halkmatta på bänkskivan",
  "Den röda sjulådiga vagnen med stängda lådor och verktyg i övre facket",
  "Måttritning av den röda sjulådiga vagnen: 69 × 33 × 75 cm, bänkskiva 61,6 cm",
  "Närbild på de röda lådfronterna, låscylindern och de smala grunda lådorna",
  "Närbild på hjulet och den infällda greppfördjupningen i vagnens sida",
 ],
 "1b534b0e": [
  "Blått verktygsskåp 82,5 cm på hjul med tre grunda och två djupa lådor",
  "Det blå skåpet med stängda lådor och en verktygsväska ovanpå",
  "Måttritning: 61,5 cm brett, 33 cm djupt och 82,5 cm högt",
  "Det blå skåpets fyra lådor utdragna i trappa med kullagerskenorna synliga",
  "Närbild på den svarta halkmattan, låscylindern och skåpets blå kant",
 ],
 "5447468e": [
  "Svart verktygsskåp 82,5 cm på hjul med fem lådor utdragna i trappa",
  "Det svarta skåpet med stängda lådor och en verktygsväska på ovansidan",
  "Måttritning av det svarta skåpet: 61,5 cm brett, 33 cm djupt, 82,5 cm högt",
  "Det svarta skåpet framför en hålplanksvägg med lådorna stängda",
  "Det svarta skåpet sett snett framifrån med draghandtaget på kortsidan",
 ],
 "5910cd6f": [
  "Rött verktygsskåp 131 cm i tre delar: överkista, mellankista och rullskåp",
  "Skåpet med överkistans lock uppfällt och lådorna utdragna i trappa",
  "Måttritning: stapeln 131 cm hög, rullskåpet 76 cm och skåpluckan 66 cm inuti",
 ],
}


def granska():
    """Kör rundans EGNA förbjudna mönster mot varje alt-text."""
    fel = []
    for pid, rader in ALT.items():
        kvar = 5 - sum(1 for (p, _) in BORT if p == pid)
        if len(rader) != kvar:
            fel.append(f"{pid}: {len(rader)} alt-texter men {kvar} bilder kvar")
        for i, txt in enumerate(rader, 1):
            for monster, etikett in GR.FORBJUDET + GR.TONGRINDAR:
                if monster.search(txt):
                    fel.append(f"{pid} alt{i} {etikett}: {txt!r}")
            for c, namn, _ in G.homoglyfer(txt):
                fel.append(f"{pid} alt{i} HOMOGLYF {c} ({namn}): {txt!r}")
            if len(txt) > 125:
                fel.append(f"{pid} alt{i} FÖR LÅNG ({len(txt)} tecken)")
            # ☠️ Alt-texten ska beskriva VARAN — den måste nämna produkttypen.
            if not re.search(r"verktygs(vagn|skåp|låd)|verkstadsvagn|kist|"
                             r"måttritning|närbild|stapeln|skåpet|vagnen",
                             txt, re.I):
                fel.append(f"{pid} alt{i} NÄMNER INTE VARAN: {txt!r}")
    # Ingen alt-text får vara identisk med en annan — inte ens mellan syskon.
    alla = [(p, i, t) for p, r in ALT.items() for i, t in enumerate(r, 1)]
    sett = {}
    for p, i, t in alla:
        if t in sett:
            fel.append(f"{p} alt{i} IDENTISK med {sett[t]}: {t!r}")
        sett[t] = f"{p} alt{i}"
    return fel


if __name__ == "__main__":
    f = granska()
    n = sum(len(v) for v in ALT.values())
    print(f"galleri.granska(): {n} alt-texter, {len(BORT)} borttagna bilder, "
          f"{len(f)} fel")
    for rad in f:
        print("  ", rad)
