# -*- coding: utf-8 -*-
"""Runda 98 — sex matskåp för hund. All text, alla tal, en enda sanning.

☠️ RUNDA 97:s STEG 2-GRIND GÄLLER ORDAGRANT VIDARE. Alla sex utkast säljer
   den upphöjda skålen på HÄLSA — "entlastet Hals und Nacken", "reduziert die
   Nackenbelastung", och på 18b9ec99 dessutom en hel engelsk infografik med
   "Reduces excessive bending / Supports a more natural eating posture".
   Den största studien (Glickman m.fl., JAVMA 2000, ~1 600 stora och
   jättestora hundar) pekar åt MOTSATT håll: upphöjd skål var förknippad med
   FÖRHÖJD risk för magomvridning. En senare studie fann ingen effekt.
   Motstridigt läge är aldrig ett säljargument.

   Inget om magomvridning, uppblåsthet, matsmältning, nacke, rygg, leder,
   hållning eller "skonsam" — inte heller mjukat. Vi beskriver MEKANIKEN.
   Det som ÄR sant och räcker: skålarna sitter i utskurna hål och kan inte
   knuffas runt, maten hamnar inte på golvet, rostfritt går i diskmaskin,
   förvaringen tar ingen extra golvyta, och mankhöjdsspannet står i klartext
   så kunden kan mäta sin egen hund.

☠️ DÖRRTYPEN ÄR MÄTT PÅ BILDEN, INTE ÄRVD FRÅN SYSKONET. 143bef7b har
   SKJUTDÖRRAR — bottenskena, två överlappande akrylpaneler och en knopp i
   var ytterände. Modell A och B har GÅNGJÄRN. Runda 97:s 868cc038 var samma
   fel åt andra hållet.

☠️ MATERIALET SKRIVS SOM DET ÄR. Importens spec-rad säger
   "Holzwerkstoff/Edelstahl" på alla sex — ett tyskt ord i en svenskmärkt
   rad, och på 143bef7b dessutom ofullständigt: fronten är AKRYL. Stomme,
   front och skålar anges var för sig. MDF är träfiberskiva, aldrig
   "massivt trä" (#259).

⚠️ TALEN KOMMER UR `Gesamtabmessungen`/`Maße`, ALDRIG UR `Paketmått` (#266).
   Modell B:s alt-text säger 35,5 × 60 × 30 cm; både spec-raden och
   måttritningen säger 60 × 30 × 43. Alt-texten bär modell A:s höjd.
"""

BAS = "https://www.fyndplats.se/produkt/"

PRODUKTER = ["9cfc2f50", "18b9ec99", "f8594223", "d362f9b3", "9a600fda", "143bef7b"]

# A = 44 L, två panelluckor med magnetstängning
# B = 37 L, två gallerluckor med regel
# C = 50 L, två skjutdörrar i akryl
GRUPP = {"9cfc2f50": "A", "18b9ec99": "A", "f8594223": "A",
         "d362f9b3": "B", "9a600fda": "B", "143bef7b": "C"}

FARG = {"9cfc2f50": "vitt", "18b9ec99": "grått", "f8594223": "svart",
        "d362f9b3": "vitt", "9a600fda": "grått", "143bef7b": "grått"}

SLUGG = {
    "9cfc2f50": "matskap-hund-35-5-cm-44-liter-vitt",
    "18b9ec99": "matskap-hund-35-5-cm-44-liter-gratt",
    "f8594223": "matskap-hund-35-5-cm-44-liter-svart",
    "d362f9b3": "matskap-hund-43-cm-gallerluckor-vitt",
    "9a600fda": "matskap-hund-43-cm-gallerluckor-gratt",
    "143bef7b": "matskap-hund-46-cm-skjutdorrar-50-liter",
}

SOKORD = {pid: "matskåp hund" for pid in PRODUKTER}

SKU = {
    "9cfc2f50": "FP-matskap-35-5-44l-vit",
    "18b9ec99": "FP-matskap-35-5-44l-gra",
    "f8594223": "FP-matskap-35-5-44l-svart",
    "d362f9b3": "FP-matskap-43-galler-vit",
    "9a600fda": "FP-matskap-43-galler-gra",
    "143bef7b": "FP-matskap-46-skjutdorrar",
}

NAMN = {
    "9cfc2f50": "Matskåp för hund 60 × 30 × 35,5 cm i vitt – 44 liter bakom två luckor",
    "18b9ec99": "Matskåp för hund 60 × 30 × 35,5 cm i grått – 44 liter bakom två luckor",
    "f8594223": "Matskåp för hund 60 × 30 × 35,5 cm i svart – 44 liter bakom två luckor",
    "d362f9b3": "Matskåp för hund 60 × 30 × 43 cm i vitt – 37 liter bakom gallerluckor",
    "9a600fda": "Matskåp för hund 60 × 30 × 43 cm i grått – 37 liter bakom gallerluckor",
    "143bef7b": "Matskåp för hund 60 × 30 × 46 cm – skjutdörrar och 50 liter förvaring",
}

INGRESS = {
    "9cfc2f50": ("Ett matskåp för hund där de två rostfria skålarna sitter "
                 "infällda i skivan och hela foderförrådet ryms under dem. "
                 "Skåpet mäter 60 × 30 × 35,5 cm, rymmer 44 liter bakom två "
                 "luckor som dras igen av magneter, och står vitt mot väggen "
                 "utan att se ut som husdjursutrustning."),
    "18b9ec99": ("Ett matskåp för hund där de två rostfria skålarna sitter "
                 "infällda i skivan och hela foderförrådet ryms under dem. "
                 "Skåpet mäter 60 × 30 × 35,5 cm, rymmer 44 liter bakom två "
                 "luckor som dras igen av magneter, och håller en dämpad grå "
                 "ton som tål att stå framme i vardagsrummet."),
    "f8594223": ("Ett matskåp för hund där de två rostfria skålarna sitter "
                 "infällda i skivan och hela foderförrådet ryms under dem. "
                 "Skåpet mäter 60 × 30 × 35,5 cm, rymmer 44 liter bakom två "
                 "luckor som dras igen av magneter, och är helsvart – "
                 "smulor och tassavtryck syns minst på den ytan."),
    "d362f9b3": ("Ett matskåp för hund i vitt med två gallerluckor som "
                 "stängs med ett svart regelbeslag. Skåpet är 43 cm högt, "
                 "rymmer 37 liter under skålarna och står på fötter, så "
                 "sopborsten kommer under kanten."),
    "9a600fda": ("Ett matskåp för hund i grått med två gallerluckor som "
                 "stängs med ett svart regelbeslag. Skåpet är 43 cm högt, "
                 "rymmer 37 liter under skålarna och står på fötter, så "
                 "sopborsten kommer under kanten."),
    "143bef7b": ("Ett matskåp för hund med två skjutdörrar i räfflad akryl – "
                 "de glider åt sidan i stället för att svänga ut, vilket "
                 "räcker när skåpet står i en passage. Bakstycket är förhöjt "
                 "med en urtagning formad som ett ben, och den ena skålen är "
                 "en antihastighetsskål med ribbor i botten."),
}

EGENSKAPER = {
    "9cfc2f50": [
        "Två rostfria skålar på 2 liter, infällda i skivan och löstagbara",
        "44 liter förvaring bakom två luckor med magnetstängning",
        "Skåpet är 60 × 30 × 35,5 cm, skålarnas hål är Ø22 cm",
        "Stomme i MDF med vit yta, skålar i rostfritt stål",
        "Maxlast 15 kg på ovansidan och 15 kg inuti",
        "6,2 cm fri höjd under skåpet",
        "Avsett för hundar med mankhöjd 55–65 cm",
    ],
    "18b9ec99": [
        "Två rostfria skålar på 2 liter, infällda i skivan och löstagbara",
        "44 liter förvaring bakom två luckor med magnetstängning",
        "Skåpet är 60 × 30 × 35,5 cm, skålarnas hål är Ø22 cm",
        "Stomme i MDF med grå yta, skålar i rostfritt stål",
        "Maxlast 15 kg på ovansidan och 15 kg inuti",
        "6,2 cm fri höjd under skåpet",
        "Avsett för hundar med mankhöjd 55–65 cm",
    ],
    "f8594223": [
        "Två rostfria skålar på 2 liter, infällda i skivan och löstagbara",
        "44 liter förvaring bakom två luckor med magnetstängning",
        "Skåpet är 60 × 30 × 35,5 cm, skålarnas hål är Ø22 cm",
        "Stomme i MDF med svart yta, skålar i rostfritt stål",
        "Maxlast 15 kg på ovansidan och 15 kg inuti",
        "6,2 cm fri höjd under skåpet",
        "Avsett för hundar med mankhöjd 55–65 cm",
    ],
    "d362f9b3": [
        "Två rostfria skålar på 2 liter, infällda i skivan och löstagbara",
        "37 liter förvaring bakom två gallerluckor med regelbeslag",
        "Skåpet är 60 × 30 × 43 cm, förvaringen 55 × 25 × 27 cm",
        "Stomme i MDF med vit yta, beslag i svart metall",
        "Maxlast 20 kg på ovansidan och 10 kg inuti",
        "Står på fyra fötter",
        "Avsett för hundar med mankhöjd 60–75 cm",
    ],
    "9a600fda": [
        "Två rostfria skålar på 2 liter, infällda i skivan och löstagbara",
        "37 liter förvaring bakom två gallerluckor med regelbeslag",
        "Skåpet är 60 × 30 × 43 cm, förvaringen 55 × 25 × 27 cm",
        "Stomme i MDF med grå yta, beslag i svart metall",
        "Maxlast 20 kg på ovansidan och 10 kg inuti",
        "Står på fyra fötter",
        "Avsett för hundar med mankhöjd 60–75 cm",
    ],
    "143bef7b": [
        "Två rostfria skålar på 2,1 liter, varav en med ribbor i botten",
        "50 liter förvaring bakom två skjutdörrar i räfflad akryl",
        "Skåpet är 60 × 30 × 46 cm, skivan ligger på 36 cm",
        "Förhöjt bakstycke på 10 cm och kanter på 5 cm runt skivan",
        "Stomme i MDF, dörrar i akryl, skålar i rostfritt stål",
        "Maxlast 15 kg på ovansidan och 30 kg inuti",
        "Avsett för hundar med mankhöjd 50–60 cm",
    ],
}

SPEC = {
    "9cfc2f50": [
        ("Mått", "60 × 30 × 35,5 cm"),
        ("Förvaring invändigt", "57 × 28 × 28 cm, 44 liter"),
        ("Luckor", "2 st, 28 × 27 cm, magnetstängning"),
        ("Skålar", "2 st, 2 liter, Ø 24 × 7 cm"),
        ("Hål i skivan", "Ø 22 cm"),
        ("Fri höjd under skåpet", "6,2 cm"),
        ("Maxlast", "15 kg på ovansidan, 15 kg inuti"),
        ("Mankhöjd hund", "55–65 cm"),
        ("Stomme", "MDF, träfiberskiva"),
        ("Skålmaterial", "rostfritt stål"),
        ("Färg", "vit"),
        ("Vikt", "8,8 kg"),
        ("Montering", "krävs, anvisning ingår"),
    ],
    "18b9ec99": [
        ("Mått", "60 × 30 × 35,5 cm"),
        ("Förvaring invändigt", "57 × 28 × 28 cm, 44 liter"),
        ("Luckor", "2 st, 28 × 27 cm, magnetstängning"),
        ("Skålar", "2 st, 2 liter, Ø 24 × 7 cm"),
        ("Hål i skivan", "Ø 22 cm"),
        ("Fri höjd under skåpet", "6,2 cm"),
        ("Maxlast", "15 kg på ovansidan, 15 kg inuti"),
        ("Mankhöjd hund", "55–65 cm"),
        ("Stomme", "MDF, träfiberskiva"),
        ("Skålmaterial", "rostfritt stål"),
        ("Färg", "grå"),
        ("Vikt", "8,8 kg"),
        ("Montering", "krävs, anvisning ingår"),
    ],
    "f8594223": [
        ("Mått", "60 × 30 × 35,5 cm"),
        ("Förvaring invändigt", "57 × 28 × 28 cm, 44 liter"),
        ("Luckor", "2 st, 28 × 27 cm, magnetstängning"),
        ("Skålar", "2 st, 2 liter, Ø 24 × 7 cm"),
        ("Hål i skivan", "Ø 22 cm"),
        ("Fri höjd under skåpet", "6,2 cm"),
        ("Maxlast", "15 kg på ovansidan, 15 kg inuti"),
        ("Mankhöjd hund", "55–65 cm"),
        ("Stomme", "MDF, träfiberskiva"),
        ("Skålmaterial", "rostfritt stål"),
        ("Färg", "svart"),
        ("Vikt", "8,8 kg"),
        ("Montering", "krävs, anvisning ingår"),
    ],
    "d362f9b3": [
        ("Mått", "60 × 30 × 43 cm"),
        ("Förvaring invändigt", "55 × 25 × 27 cm, 37 liter"),
        ("Luckor", "2 st gallerluckor, 24,5 × 28,5 cm, regelbeslag"),
        ("Skålar", "2 st, 2 liter, Ø 24 × 7 cm"),
        ("Hål i skivan", "Ø 22 cm"),
        ("Maxlast", "20 kg på ovansidan, 10 kg inuti"),
        ("Mankhöjd hund", "60–75 cm"),
        ("Stomme", "MDF, träfiberskiva"),
        ("Beslag", "svart metall"),
        ("Skålmaterial", "rostfritt stål"),
        ("Färg", "vit"),
        ("Vikt", "9 kg"),
        ("Montering", "krävs, anvisning ingår"),
    ],
    "9a600fda": [
        ("Mått", "60 × 30 × 43 cm"),
        ("Förvaring invändigt", "55 × 25 × 27 cm, 37 liter"),
        ("Luckor", "2 st gallerluckor, 24,5 × 28,5 cm, regelbeslag"),
        ("Skålar", "2 st, 2 liter, Ø 24 × 7 cm"),
        ("Hål i skivan", "Ø 22 cm"),
        ("Maxlast", "20 kg på ovansidan, 10 kg inuti"),
        ("Mankhöjd hund", "60–75 cm"),
        ("Stomme", "MDF, träfiberskiva"),
        ("Beslag", "svart metall"),
        ("Skålmaterial", "rostfritt stål"),
        ("Färg", "grå"),
        ("Vikt", "9 kg"),
        ("Montering", "krävs, anvisning ingår"),
    ],
    "143bef7b": [
        ("Mått", "60 × 30 × 46 cm"),
        ("Skivans höjd över golv", "36 cm"),
        ("Förvaring invändigt", "57 × 28,5 × 33,5 cm, 50 liter"),
        ("Dörrar", "2 st skjutdörrar, 29,5 och 36 cm breda, 33,5 cm höga"),
        ("Skålar", "2 st, 2,1 liter, Ø 24 × 7 cm"),
        ("Bakstycke", "10 cm högt"),
        ("Sidokanter", "5 cm höga"),
        ("Maxlast", "15 kg på ovansidan, 30 kg inuti"),
        ("Mankhöjd hund", "50–60 cm"),
        ("Stomme", "MDF, träfiberskiva"),
        ("Dörrmaterial", "räfflad akryl"),
        ("Skålmaterial", "rostfritt stål"),
        ("Färg", "grå"),
        ("Vikt", "8 kg"),
        ("Montering", "krävs, anvisning ingår"),
    ],
}

RUBRIK2 = {
    "A": "Så mycket får plats under skålarna",
    "B": "Gallerluckorna och vad som ryms bakom dem",
    "C": "Skjutdörrarna och den räfflade fronten",
}


# ------------------------------------------------------- brödtext, del två

def stycken2(pid):
    g = GRUPP[pid]
    if g == "A":
        return [
            ("Utrymmet bakom luckorna är 57 × 28 × 28 cm, alltså 44 liter. "
             "En femkilossäck torrfoder står upprätt där inne med marginal, "
             "och bredvid den får koppel, godispåsar och en hopvikt filt "
             "plats. Skåpet ersätter alltså både matplatsen och den där "
             "kassen i hallen."),
            ("Luckorna hålls stängda av magneter i stället för lås. De går "
             "att dra upp med en hand full av matskål, och de faller igen "
             "av sig själva när man släpper – det är den detaljen som gör "
             "att skåpet faktiskt står stängt i vardagen."),
            ("Skålarna ligger i två utskurna hål med Ø 22 cm och kan inte "
             "knuffas runt medan hunden äter. Hela skålen lyfts ur uppifrån "
             "när den ska diskas; skivan runt omkring torkas av på plats."),
        ]
    if g == "B":
        return [
            ("Bakom de två gallerluckorna finns ett enda öppet utrymme på "
             "55 × 25 × 27 cm, alltså 37 liter. Där ryms fodersäcken, "
             "skopan och det som annars ligger löst. Luckorna slår ut helt "
             "åt sidorna, så man kommer åt hela djupet utan att böja sig in "
             "runt en kant."),
            ("Regelbeslaget mitt fram är den egentliga stängningen. Det är "
             "ett vridbart svart beslag av samma typ som sitter på en "
             "trädgårdsgrind – enkelt att öppna med en hand, men inte något "
             "en nos petar upp av misstag."),
            ("Skåpet står på fyra fötter i stället för direkt på golvet. Det "
             "märks när man sopar: borsten går in under kanten, och spill "
             "hamnar inte i en springa som är omöjlig att nå."),
        ]
    return [
        ("De två dörrarna glider i en skena längs framkanten i stället för "
         "att svängas ut. Skillnaden märks där skåpet oftast hamnar – i en "
         "passage, mot en köksö eller intill en dörrkarm, där en utsvängd "
         "lucka hade tagit halva gången."),
        ("Fronten är räfflad akryl, inte trä. Ljuset bryts i räfflorna, så "
         "man ser att det står något där inne utan att se exakt vad. "
         "Utrymmet bakom är 57 × 28,5 × 33,5 cm och rymmer 50 liter – mest "
         "av de tre skåpen i den här serien, och tåligast: 30 kg invändigt."),
        ("Skivan ligger på 36 cm och har ett förhöjt bakstycke på 10 cm samt "
         "5 cm höga kanter runt sidorna. Vatten som skvätter ur skålen "
         "stannar alltså på skivan i stället för att rinna ner bakom skåpet. "
         "I bakstycket sitter en urtagning formad som ett ben, som också "
         "fungerar som handtag när skåpet ska flyttas."),
    ]


SKOTSEL = {
    "A": [
        ("Skålarna lyfts rakt upp ur hålen och tål maskindisk. Rostfritt "
         "stål tar varken smak eller lukt, och ytan blir inte repad av en "
         "diskborste på samma sätt som plast."),
        ("Stommen är MDF med målad yta. Torka av med en fuktig trasa och "
         "torka torrt efteråt – låt inte vatten stå kvar mot kanterna, det "
         "är där en träfiberskiva tar skada först."),
        ("Skåpet levereras omonterat med anvisning. Det är en rak "
         "skruvmontering av sex sidor och två luckor."),
    ],
    "B": [
        ("Skålarna lyfts rakt upp ur hålen och tål maskindisk. Rostfritt "
         "stål tar varken smak eller lukt, och ytan blir inte repad av en "
         "diskborste på samma sätt som plast."),
        ("Gallerluckornas spalter samlar damm över tid. En torr borste eller "
         "dammsugarens fogmunstycke går snabbare än en trasa mellan varje "
         "ribba."),
        ("Skåpet levereras omonterat med anvisning. Gångjärn och regelbeslag "
         "sitter förmonterade på luckorna."),
    ],
    "C": [
        ("Skålarna lyfts rakt upp ur hålen och tål maskindisk. Den ena har "
         "ribbor i botten som delar upp fodret i flera fickor – de går att "
         "nå med en diskborste, och skålen är lika lätt att skölja som den "
         "släta."),
        ("Akryldörrarna torkas med en mjuk trasa och milt diskmedel. "
         "Använd inte fönsterputs med ammoniak eller en skursvamp: akryl "
         "repas lättare än glas och mattas av starka lösningsmedel."),
        ("Håll skenan i framkanten fri från foderspill. Ett par korn i "
         "spåret är hela skillnaden mellan en dörr som glider och en som "
         "kärvar; borsta ur den när du ändå torkar av skivan."),
    ],
}


def faq(pid):
    g = GRUPP[pid]
    mank = {"A": "55 till 65 cm", "B": "60 till 75 cm", "C": "50 till 60 cm"}[g]
    hojd = {"A": "35,5 cm", "B": "43 cm", "C": "46 cm"}[g]
    liter = {"A": "44 liter", "B": "37 liter", "C": "50 liter"}[g]
    ut = [
        ("Vilken hundstorlek passar skåpet?",
         "Skåpet är avsett för hundar med mankhöjd %s. Mät från golvet till "
         "skulderbladets överkant medan hunden står, och jämför med det talet – "
         "det är höjden på hunden som avgör, inte vikten." % mank),
        ("Hur högt står skålen över golvet?",
         "Skåpet är %s högt och skålarna ligger infällda i ovansidan, så "
         "skålkanten hamnar i praktiken i jämnhöjd med skivan." % hojd),
        ("Ingår skålarna?",
         "Ja, två skålar i rostfritt stål ingår och sitter i utskurna hål i "
         "skivan. De lyfts ur för disk."),
        ("Hur mycket får plats i förvaringen?",
         "%s. En femkilossäck torrfoder står upprätt där inne, och det finns "
         "utrymme kvar bredvid." % liter),
    ]
    if g == "A":
        ut.append(("Går luckorna att låsa?",
                   "Nej. De hålls stängda av magneter, inte av ett lås. Det "
                   "räcker mot en nyfiken nos men är inte ett barnlås."))
    if g == "B":
        ut.append(("Är gallerluckorna en liggplats för hunden?",
                   "Nej. Utrymmet bakom dem är 55 × 25 × 27 cm och är byggt "
                   "för foder och tillbehör – gallret är en formdetalj, inte "
                   "en bur."))
    if g == "C":
        ut.append(("Hur mycket plats behövs framför skåpet?",
                   "Bara det som hunden själv tar. Dörrarna glider i sidled "
                   "längs framkanten och svänger inte ut, så skåpet kan stå "
                   "i en passage."))
    ut.append(("Kommer det monterat?",
               "Nej, det monteras hemma. Monteringsanvisning följer med."))
    return ut


# ------------------------------------------------------------------- bygget

def bygg(pid):
    d = ["<p>%s</p>" % INGRESS[pid]]
    d.append("<p><strong>Egenskaper</strong></p><ul>")
    d += ["<li>%s</li>" % e for e in EGENSKAPER[pid]]
    d.append("</ul>")
    d.append("<h2>Tekniska specifikationer</h2><ul>")
    d += ["<li><strong>%s:</strong> %s</li>" % (k, v) for k, v in SPEC[pid]]
    d.append("</ul>")
    d.append("<h2>%s</h2>" % RUBRIK2[GRUPP[pid]])
    d += ["<p>%s</p>" % s for s in stycken2(pid)]
    d.append("<h2>Användning och skötsel</h2>")
    d += ["<p>%s</p>" % s for s in SKOTSEL[GRUPP[pid]]]
    d.append("<h2>Vanliga frågor</h2>")
    for f, s in faq(pid):
        d.append("<p><strong>%s</strong></p><p>%s</p>" % (f, s))
    d.append("<h2>Fler matskåp för hund</h2><ul>")
    for annan in SYSKON[pid]:
        d.append('<li><a href="%s%s">%s</a></li>' % (BAS, annan[0], annan[1]))
    d.append("</ul>")
    return "".join(d)


def namn(pid):
    return NAMN[pid]


SEO_TITEL = {
    "9cfc2f50": "Matskåp hund 35,5 cm vitt – 44 liter, skålar 2 liter",
    "18b9ec99": "Matskåp hund 35,5 cm grått – 44 liter, skålar 2 liter",
    "f8594223": "Matskåp hund 35,5 cm svart – 44 liter, skålar 2 liter",
    "d362f9b3": "Matskåp hund 43 cm vitt – gallerluckor och 37 liter",
    "9a600fda": "Matskåp hund 43 cm grått – gallerluckor och 37 liter",
    "143bef7b": "Matskåp hund 46 cm – skjutdörrar och 50 liter förvaring",
}

SEO_BESKRIVNING = {
    "9cfc2f50": ("Matskåp för hund 60 × 30 × 35,5 cm i vitt med 44 liter "
                 "förvaring bakom två luckor med magnetstängning. Två "
                 "rostfria skålar på 2 liter. MDF, 8,8 kg."),
    "18b9ec99": ("Matskåp för hund 60 × 30 × 35,5 cm i grått med 44 liter "
                 "förvaring bakom två luckor med magnetstängning. Två "
                 "rostfria skålar på 2 liter. MDF, 8,8 kg."),
    "f8594223": ("Matskåp för hund 60 × 30 × 35,5 cm i svart med 44 liter "
                 "förvaring bakom två luckor med magnetstängning. Två "
                 "rostfria skålar på 2 liter. MDF, 8,8 kg."),
    "d362f9b3": ("Matskåp för hund 60 × 30 × 43 cm i vitt med två "
                 "gallerluckor, regelbeslag och 37 liter förvaring. Två "
                 "rostfria skålar på 2 liter. MDF med svarta beslag, 9 kg."),
    "9a600fda": ("Matskåp för hund 60 × 30 × 43 cm i grått med två "
                 "gallerluckor, regelbeslag och 37 liter förvaring. Två "
                 "rostfria skålar på 2 liter. MDF med svarta beslag, 9 kg."),
    "143bef7b": ("Matskåp för hund 60 × 30 × 46 cm med två skjutdörrar i "
                 "räfflad akryl och 50 liter förvaring. Två rostfria skålar "
                 "på 2,1 liter, varav en med ribbor. Grått, 8 kg."),
}

# ---------------------------------------------------------------- syskonen
# ☠️ Korslänkarna byggs MEKANISKT ur SLUGG + KORTNAMN, aldrig för hand.
#    Runda 97 mätte att transkriptionshashen är BLIND för länkar: en href
#    som pekar fel ger identisk hash före och efter.

KORTNAMN = {
    "9cfc2f50": "Matskåp 35,5 cm i vitt, 44 liter",
    "18b9ec99": "Matskåp 35,5 cm i grått, 44 liter",
    "f8594223": "Matskåp 35,5 cm i svart, 44 liter",
    "d362f9b3": "Matskåp 43 cm i vitt med gallerluckor",
    "9a600fda": "Matskåp 43 cm i grått med gallerluckor",
    "143bef7b": "Matskåp 46 cm med skjutdörrar, 50 liter",
}

# Publicerade syskon ur runda 97, samma möbeltyp och samma kategorilöv.
PUBLICERADE = [
    ("matskap-hund-34-cm-tva-dorrar", "Matskåp 34 cm med två dörrar"),
    ("matskap-hund-42-cm-30-liter", "Matskåp 42 cm med 30 liter förvaring"),
]

SYSKON = {
    pid: [(SLUGG[a], KORTNAMN[a]) for a in PRODUKTER if a != pid] + PUBLICERADE
    for pid in PRODUKTER
}


def beskrivning(pid):
    return bygg(pid)


def seo_titel(pid):
    return SEO_TITEL[pid]


def seo_beskrivning(pid):
    return SEO_BESKRIVNING[pid]
