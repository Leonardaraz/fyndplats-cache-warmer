# -*- coding: utf-8 -*-
"""Återinför varje fynd rundan gjorde och kräver att RÄTT grind fäller.

☠️ En mutation måste ta bort VARJE bärare av faktumet, annars provar den
   bara en av kanalerna. Och den måste kräva RÄTT etikett — "någon brist"
   bevisar inte grinden man tror.

Rundans mutationer speglar Steg 5:s nio fynd, ett i taget.
"""
import importlib
import io
import sys

KALLA = io.open("texter.py", encoding="utf-8").read()

MUTATIONER = [
    ('parlasten: 1 160 kg blir per bock i stället för för paret',
     [('"580 kilo per bock, alltså 1 160 kilo när du använder båda två",', '"1 160 kilo per bock",'),
      ('("Bärförmåga", "580 kg per bock, 1 160 kg för paret"),', '("Bärförmåga", "1 160 kg per bock"),'),
      ('("Är 1 160 kilo per bock eller för båda?",', '("Hur mycket tål en bock?",'),
      ('"För båda. Varje bock tål 580 kilo, och paret alltså 1 160 kilo tillsammans."', '"1 160 kilo."'),
      ('"ovansida och sidokrokar för reglar. 580 kilo per bock.",', '"ovansida och sidokrokar för reglar. 1 160 kilo per bock.",'),
      ('"Arbetsbockar 2-pack röda – sju höjdlägen och 580 kg per bock"', '"Arbetsbockar 2-pack röda – sju höjdlägen och 1 160 kg per bock"'),
      ('"Arbetsbockar 2-pack röda – sju lägen, 580 kg | Fyndplats"', '"Arbetsbockar 2-pack röda – sju lägen, 1 160 kg | Fyndplats"'),
      ('"Två röda arbetsbockar byggda för det tunga: 580 kilo per bock, sju "', '"Två röda arbetsbockar byggda för det tunga: 1 160 kilo per bock, sju "')],
     'ed44170a', 'PARLASTGRINDEN'),

    ('höjdlägen: sju blir fyra på ed44170a',
     [('"Sju höjdlägen mellan 64 och 81 centimeter",', '"Fyra höjdlägen mellan 64 och 81 centimeter",'),
      ('("Höjdlägen", "7 st mellan 64 och 81 cm"),', '("Höjdlägen", "4 st mellan 64 och 81 cm"),'),
      ('"Sju, mellan 64 och 81 centimeter."', '"Fyra, mellan 64 och 81 centimeter."'),
      ('"Två röda arbetsbockar med sju höjdlägen 64–81 centimeter, EVA-klädd "', '"Två röda arbetsbockar med fyra höjdlägen 64–81 centimeter, EVA-klädd "'),
      ('"Arbetsbockar 2-pack röda – sju höjdlägen och 580 kg per bock"', '"Arbetsbockar 2-pack röda – fyra höjdlägen och 580 kg per bock"'),
      ('"Arbetsbockar 2-pack röda – sju lägen, 580 kg | Fyndplats"', '"Arbetsbockar 2-pack röda – fyra lägen, 580 kg | Fyndplats"'),
      ('"Två röda arbetsbockar byggda för det tunga: 580 kilo per bock, sju "', '"Två röda arbetsbockar byggda för det tunga: 580 kilo per bock, fyra "')],
     'ed44170a', 'HÖJDLÄGEN'),

    ('hopfällning: den fasta bänken 9e9c78b9 påstås vikas ihop',
     [('"Nej. Den här är en fast bänk som monteras en gång och står kvar."', '"Ja, den viks ihop på ett par sekunder."')],
     '9e9c78b9', 'HOPFÄLLNINGSGRINDEN'),

    ('rost: lacken kvalificeras inte på 9e9c78b9',
     [('"Stålet är pulverlackerat, och lacken håller vatten borta så länge den är hel. "', '"Nej, stålrören tål väta utan åtgärd. "'),
      ('"Ett djupt jack ner till plåten kan börja rosta, så bättra på det."', '"De behöver ingen tillsyn."'),
      ('"Stålet är pulverlackerat, och lacken skyddar så länge den är hel — får "', '"Stålrören klarar en fuktig verkstad utan åtgärd. Dessutom: "'),
      ('"den ett djupt jack ner till plåten kan rost börja där, så bättra på med "', '"de behöver ingen "'),
      ('"en droppe lackfärg. Lägg det tyngsta på det nedre hyllplanet, inte på "', '"tillsyn alls. Lägg det tyngsta på det nedre hyllplanet, inte på "')],
     '9e9c78b9', 'ROSTGRINDEN'),

    ('kapsågsnoten: 4 cm-varningen stryks',
     [('"Dra ut den nedre rullbasen cirka 4 centimeter innan du fäller ihop "', '""'),
      ('"stativet, annars kan den falla ner när du viker det. Kontrollera att "', '"Kontrollera att "')],
     '4a8e7f21', 'KAPSÅGSNOTEN'),

    ('färg: orange blir blått i namn, titel och meta',
     [('"Sågbockar 2-pack orange – fyra höjdlägen 71–85,5 cm, 250 kg per bock"', '"Sågbockar 2-pack blå – fyra höjdlägen 71–85,5 cm, 250 kg per bock"'),
      ('"Sågbockar 2-pack orange – 71–85,5 cm, 250 kg | Fyndplats"', '"Sågbockar 2-pack blå – 71–85,5 cm, 250 kg | Fyndplats"'),
      ('"Två orange sågbockar med fyra höjdlägen mellan 71 och 85,5 centimeter. "', '"Två blå sågbockar med fyra höjdlägen mellan 71 och 85,5 centimeter. "')],
     '17e683e0', 'FÄRGGRINDEN'),

    ('montering: beskedet stryks från 4a8e7f21',
     [('"Stomme i legerat stål — stativet tål 150 kilo",\n        "Kräver montering",', '"Stomme i legerat stål — stativet tål 150 kilo",'),
      ('("Montering", "Krävs"),\n        ("Ingår", "Sågstativ och bruksanvisning"),', '("Ingår", "Sågstativ och bruksanvisning"),')],
     '4a8e7f21', 'MONTERINGSGRINDEN'),

    ('artikelnummer: leverantörens rad följer med in i spec-blocket',
     [('("Montering", "Krävs inte"),\n        ("Ingår", "Två sågbockar och bruksanvisning"),', '("Montering", "Krävs inte"),\n        ("Artikelnummer", "X99-000Q00ZZ"),\n        ("Ingår", "Två sågbockar och bruksanvisning"),')],
     '17e683e0', 'ARTIKELNUMMER'),

    ('tvåpack: 3afe7275 slutar säga att man får två bockar',
     [('"Två bockar med teleskopben som låses med sprint i sex lägen mellan 80 "', '"En bock med teleskopben som låses med sprint i sex lägen mellan 80 "'),
      ('"Levereras som ett par, alltså två bockar",', '"Levereras i kartong",'),
      ('("Ingår", "Två stödbockar"),', '("Ingår", "Stödbock"),'),
      ('("Hur många bockar får jag?",\n         "Två. Priset gäller paret."),', '("Hur stor är den?",\n         "68 centimeter lång."),'),
      ('"Två stödbockar med teleskopben som går från 80 till 130 centimeter i "', '"En stödbock med teleskopben som går från 80 till 130 centimeter i "'),
      ('("Hur mycket tål de?",\n         "200 kilo per bock. Talet gäller', '("Hur mycket tål den?",\n         "200 kilo. Talet gäller'),
      ('"lastar — det är den som bär, inte friktionen i teleskopet. Ställ båda "', '"lastar — det är den som bär, inte friktionen i teleskopet. Ställ bocken "'),
      ('"bockarna i samma läge när de ska bära samma planka, annars hamnar hela "', '"i rätt läge innan du lastar, annars hamnar hela "')],
     '3afe7275', 'TVÅPACKSGRINDEN'),

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
                #    brist. Kravet är att RÄTT grind fyrar; övriga
                #    rapporteras men fäller inte testet.
                extra.append(f"{namn}: även {[f.split(':')[0] for f in ovriga]}")
        finally:
            io.open("texter.py", "w", encoding="utf-8").write(KALLA)
            for m in ("texter", "grind"):
                if m in sys.modules:
                    del sys.modules[m]
    for rad in extra:
        print("  ⚠️ ", rad)
    return fel


if __name__ == "__main__":
    f = kor()
    print(f"mutation.kor(): {len(MUTATIONER)} mutationer, {len(f)} fel")
    for rad in f:
        print("  ", rad)
    sys.exit(1 if f else 0)
