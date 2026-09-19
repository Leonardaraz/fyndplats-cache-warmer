# -*- coding: utf-8 -*-
"""Återinför varje fynd rundan gjorde och kräver att RÄTT grind fäller.

☠️ En mutation måste ta bort VARJE bärare av faktumet, annars provar den
   bara en av kanalerna. Och den måste kräva RÄTT etikett — "någon brist"
   bevisar inte grinden man tror.
"""
import importlib
import io
import sys

KALLA = io.open("texter.py", encoding="utf-8").read()

MUTATIONER = [
    ("lådantalet: sju blir fem på bc698424",
     [("Sju lådor i mattsvart stål", "Fem lådor i mattsvart stål"),
      ('"Sju lådor: två grunda på 51 × 29 × 4 cm och fem djupa på 51 × 29 × 8,5 cm",\n'
       '        "Alla lådor går på kullagerskenor med oljeupptagande matta i botten",\n'
       '        "Bänkskiva på 61,6 × 33 cm med halkskyddande yta",\n'
       '        "Cylinderlås som stänger kistan — två nycklar ingår",\n'
       '        "Tål 15 kg per låda och 150 kg totalt",\n'
       '        "Fyra hjul, två med broms, och ett handtag på kortsidan",\n'
       '        "69 × 33 × 75 cm, väger 25,7 kg — verktygen på bilderna ingår inte",\n'
       '    ],\n'
       '    "f4fabca6"',
       '"Fem lådor: två grunda på 51 × 29 × 4 cm och fem djupa på 51 × 29 × 8,5 cm",\n'
       '        "Alla lådor går på kullagerskenor med oljeupptagande matta i botten",\n'
       '        "Bänkskiva på 61,6 × 33 cm med halkskyddande yta",\n'
       '        "Cylinderlås som stänger kistan — två nycklar ingår",\n'
       '        "Tål 15 kg per låda och 150 kg totalt",\n'
       '        "Fyra hjul, två med broms, och ett handtag på kortsidan",\n'
       '        "69 × 33 × 75 cm, väger 25,7 kg — verktygen på bilderna ingår inte",\n'
       '    ],\n'
       '    "f4fabca6"'),
      ('("Antal lådor", "7"),\n        ("Grunda lådor", "2 st, 51 × 29 × 4 cm"),\n'
       '        ("Djupa lådor", "5 st, 51 × 29 × 8,5 cm"),\n'
       '        ("Bärförmåga", "15 kg per låda, 150 kg totalt"),\n'
       '        ("Material", "Stål"),\n        ("Färg", "Mattsvart"),',
       '("Antal lådor", "5"),\n        ("Grunda lådor", "2 st, 51 × 29 × 4 cm"),\n'
       '        ("Djupa lådor", "5 st, 51 × 29 × 8,5 cm"),\n'
       '        ("Bärförmåga", "15 kg per låda, 150 kg totalt"),\n'
       '        ("Material", "Stål"),\n        ("Färg", "Mattsvart"),'),
      ('"Sju: två grunda på fyra centimeter överst och fem djupa på 8,5 centimeter under."),\n'
       '        ("Går den att låsa?",\n'
       '         "Ja, med cylinderlås. Två nycklar ingår."),\n'
       '        ("Vad skiljer den från den röda?"',
       '"Fem: två grunda på fyra centimeter överst och fem djupa på 8,5 centimeter under."),\n'
       '        ("Går den att låsa?",\n'
       '         "Ja, med cylinderlås. Två nycklar ingår."),\n'
       '        ("Vad skiljer den från den röda?"'),
      ("Mattsvart verktygsvagn 69 cm med sju lådor",
       "Mattsvart verktygsvagn 69 cm med fem lådor"),
      ("Verktygsvagn 69 cm med sju lådor och nyckellås – mattsvart",
       "Verktygsvagn 69 cm med fem lådor och nyckellås – mattsvart"),
      ("Verktygsvagn svart 69 cm – sju lådor och nyckellås",
       "Verktygsvagn svart 69 cm – fem lådor och nyckellås"),
      ('"svart verktygsvagn", "verktygsvagn sju lådor"',
       '"svart verktygsvagn", "verktygsvagn fem lådor"')],
     "bc698424", "FEL LÅDANTAL"),

    ("leveranslöftet: bdd01b5f lovar nycklar leveransen inte har",
     [("Två lådor på 58 × 32 × 5,5 cm, båda stängda av samma centrallås",
       "Två lådor på 58 × 32 × 5,5 cm, båda stängda av samma centrallås — två nycklar ingår")],
     "bdd01b5f", "LEVERANSLÖFTE"),

    ("färgen: 5910cd6f tappar sitt 'Rött' ur namn, titel och meta",
     [("Rött verktygsskåp 131 cm i tre delar – sex lådor och två skåp",
       "Verktygsskåp 131 cm i tre delar – sex lådor och två skåp"),
      ("Rött verktygsskåp 131 cm – tre delar, sex lådor | Fyndplats",
       "Verktygsskåp 131 cm – tre delar, sex lådor | Fyndplats"),
      ('"5910cd6f": "Rött verktygsskåp 131 cm i tre delar som går att dela: överkista med "',
       '"5910cd6f": "Verktygsskåp 131 cm i tre delar som går att dela: överkista med "')],
     "5910cd6f", "FÄRGGRINDEN"),

    ("låset: 3659a7eb säger inte HUR den låses",
     [("Nyckellås i skåpdörren, som har hålplåt och krokar på insidan",
       "Låsbar skåpdörr med hålplåt och krokar på insidan"),
      ('("Lås", "Nyckellås i skåpdörren och två spärrar över lådorna, två nycklar ingår"),',
       '("Lås", "Låsbar dörr och två spärrar över lådorna, två nycklar ingår"),'),
      ("Skåpdörren har nyckellås och två nycklar ingår.",
       "Skåpdörren går att låsa och två nycklar ingår.")],
     "3659a7eb", "LÅSGRINDEN"),

    ("materialet: 5745c3cb säljs som plast",
     [('"Stålstomme med repfast lackering och stållås på varje kista",',
       '"Plaststomme med repfast lackering och lås på varje kista",'),
      ('("Material", "Stål med plastdetaljer"),', '("Material", "Plast"),'),
      ('"Vilket material är den i?",\n'
       '         "Stål med plastdetaljer. Ytan är lackerad och tål repor från verktyg."',
       '"Vilket material är den i?",\n'
       '         "Plast. Ytan är lackerad och tål repor från verktyg."')],
     "5745c3cb", "MATERIALGRINDEN"),

    ("utdraget: bdd01b5f varnar inte för tyngdpunkten",
     [('"bdd01b5f": "Dra ut arbetsytan först när vagnen står stilla och bromsarna är låsta — "\n'
       '                "utdragen flyttar sig tyngdpunkten långt utanför hjulen. Belasta den "\n'
       '                "utdragna halvan lättare än den fasta. ',
       '"bdd01b5f": "Dra ut arbetsytan när du behöver mer plats. ')],
     "bdd01b5f", "UTDRAGSGRINDEN"),
]


def kor():
    fel, extra = [], []
    for namn, ersattningar, pid, etikett in MUTATIONER:
        muterad = KALLA
        for gammal, ny in ersattningar:
            if muterad.count(gammal) != 1:
                fel.append(f"MUTATION {namn!r}: hittade "
                           f"{muterad.count(gammal)} av {gammal[:50]!r} — "
                           f"mutationen muterade inte")
                muterad = None
                break
            muterad = muterad.replace(gammal, ny)
        if muterad is None:
            continue
        if muterad == KALLA:
            fel.append(f"MUTATION {namn!r}: texten är oförändrad")
            continue
        io.open("texter.py", "w", encoding="utf-8").write(muterad)
        try:
            for m in ("texter", "grind"):
                if m in sys.modules:
                    del sys.modules[m]
            grind = importlib.import_module("grind")
            traffar = grind.granska(pid)
            ratt = [f for f in traffar if etikett in f]
            ovriga = [f for f in traffar if etikett not in f]
            if not ratt:
                fel.append(f"MUTATION {namn!r}: {etikett} fyrade INTE. "
                           f"Fick: {traffar}")
            elif ovriga:
                # ⚠️ ATT FLERA GRINDAR FÅNGAR SAMMA DEFEKT ÄR STYRKA, inte
                #    brist — `bdd01b5f`s nyckellöfte fälls av BÅDE
                #    leveranslöftet och låsgrinden. Kravet är att RÄTT grind
                #    fyrar; övriga rapporteras men fäller inte testet.
                extra.append(f"{namn}: även {[f.split(':')[0] for f in ovriga]}")
        finally:
            io.open("texter.py", "w", encoding="utf-8").write(KALLA)
            for m in ("texter", "grind"):
                if m in sys.modules:
                    del sys.modules[m]
    for rad in extra:
        print("   (även)", rad)
    return fel


if __name__ == "__main__":
    f = kor()
    print(f"mutation.kor(): {len(MUTATIONER)} mutationer, {len(f)} fel")
    for rad in f:
        print("  ", rad)
