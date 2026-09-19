# -*- coding: utf-8 -*-
"""Runda 143 — rundans DATA för spec-korten. Reglerna bor i `kortrunda.py`.

⚠️ RUBRIKEN MÅSTE BÄRAS AV BILD 1, och det avgörs med ögon, inte av kod. Varje
   rubrik nedan är vald mot kontaktarket `steg9-hjaltar.jpg`, där alla sjutton
   hjältebilder ligger bredvid varandra — kommentaren över varje rad säger vad
   man FAKTISKT ser.

☠️ Ingen rubrik nämner HOMCOM eller SPORTNOW, trots att märket är tryckt på sju
   av varorna och syns i flera hjältebilder. Leonards regel: sitter märket
   fysiskt på varan rör vi inte bilden — men ordet får aldrig nå namn, titel,
   meta, slug eller kort.

☠️ Ingen rubrik lovar en SÄCK på de fyra sidor som säljs utan (`f8d974b3`,
   `d307632a`, `b6c4c619` och `87ec8a16`). Två av dem har tvärtom fått sin
   rubrik av att kroken är TOM i bilden — det är sidans viktigaste besked.

☠️ Ingen rubrik lovar FYLLNING. Elva av sjutton har en fot som ska fyllas, och
   sanden följer inte med; en kortrubrik har lika lite plats för brasklappen
   som en alt-text.
"""
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import grind as GR                                               # noqa: E402
import kortrunda as KR                                           # noqa: E402
import galleri as GA                                             # noqa: E402
import texter as T                                               # noqa: E402
import spec as S                                                 # noqa: E402

# ☠️ Spec-tabellen LÄSES ur brödtextens HTML (`spec.py`) — kortet och sidan
#    kan alltså inte bära olika tal. `kortrunda.kor` vill ha den på `T`.
T.SPEC = S.SPEC

# pid -> (kicker, rubrik)
KORT = {
    # Bild 1: naket ställ, kroken HÄNGER TOM. Rundans tydligaste bild på att
    # säcken inte ingår — och sidans viktigaste besked.
    "f8d974b3": ("Boxsäcksställ 182–225 cm", "Kroken hänger tom — säcken är din"),
    # Bild 1: den röda speedballen hänger i sin lina, säckkroken är tom.
    "d307632a": ("Boxsäcksställ 175–220 cm", "Speedballen hänger, säckkroken är tom"),
    # Bild 1: röd säck i kedja på trekantsfoten. Rundans enda röda säck.
    "49d6d56f": ("Boxsäcksställ 185–231 cm", "Röd segelduksäck i kedjan"),
    # Bild 1: gummirepet böjer sig i en synlig båge från säckens undersida
    # ner till U-foten. Det är det som skiljer den från 49d6d56f.
    "6f603856": ("Boxsäcksställ 220 cm", "Gummirepet spänner säcken mot foten"),
    # Bild 1: grå säck till höger, orange boll under en skiva till vänster —
    # båda på samma ram.
    "c00988e3": ("Boxsäcksställ 221 cm", "Säck och boll på var sin sida av ramen"),
    # Bild 1: sex röda cirklar med vita siffror 1-6 på säckens överdel.
    "7eeb7497": ("Boxningssäck 165 cm", "Sex numrerade träffytor på slagytan"),
    # Bild 1: hög smal svart säck på en slät rund fot. Sugpropparna sitter
    # UNDER foten och syns inte — rubriken tar det man ser.
    "1409d762": ("Boxningssäck 170 cm", "Hög, smal säck på en rund fot"),
    # Bild 1: en tjock dyna sitter som en krage runt säckens mitt.
    "0deb6901": ("Boxningssäck 175 cm", "Slagdynan sitter som en krage om säcken"),
    # Bild 1: röd överdel, svart underdel, och en mönstrad fot som ser ut som
    # ett däckmönster. Fjädrarna sitter inuti och syns inte.
    "74602345": ("Boxningssäck 180 cm, röd", "Mönstrad fot som griper mot golvet"),
    # Bild 1: helsvart säck, och fotens kant har en rad synliga proppar runt om.
    "702c7795": ("Boxningssäck 180 cm, tung fot", "Propparna sticker ut runt fotens kant"),
    # Bild 1: brun slagyta över en blank teleskopstång i metall. Rundans enda
    # tvåfärgade säck och enda synliga teleskopstång.
    "c5c228ab": ("Boxningssäck 158–186 cm", "Brun slagyta över en teleskopstång"),
    # Bild 1: en formad kropp med ljusa fält — inte en cylinder.
    "9119599f": ("Boxdocka 178–207 cm", "Ljusa träffytor på en formad kropp"),
    # Bild 1: röd kickdyna, röd-vit boll överst och en mindre boll på sidoarmen.
    "86f2cb63": ("Boxställ 140–205 cm, rött", "Röd kickdyna och två bollar på stången"),
    # Bild 1: samma ställ i blått — blå dyna, blå-vita bollar.
    "57986794": ("Boxställ 140–205 cm, blått", "Blå kickdyna och två bollar på stången"),
    # Bild 1: samma ställ i svart — svart dyna, svarta bollar.
    "438295ae": ("Boxställ 140–205 cm, svart", "Svart kickdyna och två bollar på stången"),
    # Bild 1: röd stång på tvären, blå rund dyna och en röd-vit boll överst —
    # tre olika redskap på EN stolpe.
    "87ec8a16": ("Boxställ 163–205 cm", "Stång, dyna och boll på samma stolpe"),
    # Bild 1: bara stålarmen och väggplattan. Ingen säck i bild.
    "b6c4c619": ("Väggfäste för boxsäck", "Armen går 80 cm ut från väggplattan"),
}

# pid -> fem spec-etiketter, ORDAGRANT ur spec-tabellen (`spec.py`).
# ☠️ Första posten måste vara måttraden — kortet ska bära VARANS eget mått.
RADER = {
    "f8d974b3": ["Mått", "Hopfällt", "Krokhöjd", "Bär säck på", "Viktstänger"],
    "d307632a": ["Mått", "Krokhöjd", "Speedball", "Förstärkningssträvor", "Bär säck på"],
    "49d6d56f": ["Mått", "Andra höjdläget", "Lägen på övre stången", "Säck", "Bär säck på"],
    "6f603856": ["Mått", "Säck", "Bär säck på", "Hantelskivehållare", "Kedja"],
    "c00988e3": ["Mått", "Säck", "Punchingboll", "Bär säck på", "Vikt"],
    "7eeb7497": ["Mått", "Säck", "Träffytor", "Material", "Vikt"],
    "1409d762": ["Mått", "Säck", "Fot", "Sugproppar", "Vikt"],
    "0deb6901": ["Mått", "Säck", "Slagdyna", "Fot", "Foten rymmer"],
    "74602345": ["Mått", "Säck", "Fot", "Foten rymmer", "Fjädrar"],
    "702c7795": ["Mått", "Säck", "Fot", "Foten rymmer", "Sugproppar"],
    "c5c228ab": ["Mått", "Slagyta", "Fot", "Kopplingsstång", "Vikt"],
    "9119599f": ["Mått", "Kropp", "Fot", "Foten rymmer", "Vikt"],
    "86f2cb63": ["Mått", "Fot", "Kickdyna", "Speedballs", "Boxstång"],
    "57986794": ["Mått", "Fot", "Kickdyna", "Speedballs", "Boxstång"],
    "438295ae": ["Mått", "Fot", "Kickdyna", "Speedballs", "Boxstång"],
    "87ec8a16": ["Mått", "Reflexstång", "Slagdyna", "Speedball", "Foten rymmer"],
    "b6c4c619": ["Mått", "Stödstång", "Vinklar", "Bär säck på", "Underlag"],
}

if __name__ == "__main__":
    KR.kor(HAR, T, KORT, RADER,
           {pid: GA.G[pid][0] for pid in T.BATCH},
           forbjudet=[(__import__("re").compile(m, __import__("re").I), e)
                      for e, m in GR.FORBJUDET])
