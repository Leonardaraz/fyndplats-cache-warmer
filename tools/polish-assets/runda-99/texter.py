# -*- coding: utf-8 -*-
"""Runda 99 — sju matplatser för hund. All text, alla tal, en enda sanning.

☠️ RUNDA 97:s STEG 2-GRIND GÄLLER ORDAGRANT VIDARE. Alla sju utkast säljer den
   upphöjda skålen på HÄLSA — modell C med "Hundenäpfe mit Standfuß, um den
   Hals des Tieres nicht zu belasten", modell D med "Erhöhtes Design, um den
   Körper Ihres Haustieres zu schonen" och "für größere und ältere Hunde, die
   sich nicht auf den Boden bücken können".
   Den största studien (Glickman m.fl., JAVMA 2000, ~1 600 stora och
   jättestora hundar) pekar åt MOTSATT håll: upphöjd skål var förknippad med
   FÖRHÖJD risk för magomvridning. En senare studie fann ingen effekt.
   Motstridigt läge är aldrig ett säljargument.

   Inget om magomvridning, uppblåsthet, matsmältning, nacke, rygg, leder,
   hållning eller "skonsam" — inte heller mjukat. Vi beskriver MEKANIKEN, och
   mankhöjdsspannet står i klartext så kunden kan mäta sin egen hund.

☠️ MEKANIKEN ÄR MÄTT PÅ BILDEN, INTE ÄRVD UR SYSKONETS TEXT. Modell D:s
   "Deckel" är ingen uppfällbar lucka: hela skivan med båda skålhålen LYFTS AV
   i ett stycke (a8e376e7-2 visar den på golvet, edd89684-5 uppifrån). Modell C
   har en enda utdragbar LÅDA på metallskenor (5eb270ed-5 visar skenan).
   Ingen text får blanda ihop de två.

☠️ MODELL D:s INVÄNDIGA MÅTT PUBLICERAS INTE. Leverantören anger 58 × 28 × 39
   respektive 52 × 26 × 37 cm i ett hölje som är 41 cm högt — och skålarna är
   7 cm djupa och hänger ner i just det utrymmet. Talet motsäger sig självt,
   och ingen av de tre måttritningarna har en invändig siffra att stämma av
   mot. Vi skriver yttermått, skålmått och belastbarhet i stället.

☠️ TVÅ AV MODELL C ÄR TVÅFÄRGADE och leverantörens färgfält namnger bara
   stommen: 8c1d08c5 är GRÅ stomme med VIT skiva, 31d6a3df är VIT stomme med
   GRÅ skiva. Båda ytorna skrivs ut. 8c1d08c5:s alt-text säger dessutom
   "60 x 30 x 42 cm, Weiß" — fel höjd och fel färg. Alt-texten är aldrig källa.

⚠️ MANKHÖJDEN 40–65 cm FÖR MODELL D FINNS BARA I PIXLARNA, i den tyska
   HINWEIS-ruta som kapades bort ur 5d7aab1b-3. Den står i ingen brödtext och
   på ingen annan ritning. Alla tre delar mått exakt, så den gäller alla tre.

⚠️ MATERIALET SKRIVS SOM DET ÄR. Modell C:s spec-rad säger
   "Edelstahl/Holzwerkstoff" i ett svenskmärkt fält; 5d7aab1b:s säger bara
   "Edelstahl" trots att brödtexten säger MDF. Stomme och skålar anges var för
   sig. MDF är träfiberskiva, aldrig "massivt trä" (#259).
"""

BAS = "https://www.fyndplats.se/produkt/"

PRODUKTER = ["8c1d08c5", "3710a0c3", "5eb270ed", "31d6a3df",
             "a8e376e7", "5d7aab1b", "edd89684"]

# C = lådskåp 60 × 30 × 36 cm, en låda på metallskenor, 21 liter
# D = matstation 60 × 30 × 41 cm, hela skivan lyfts av
GRUPP = {"8c1d08c5": "C", "3710a0c3": "C", "5eb270ed": "C", "31d6a3df": "C",
         "a8e376e7": "D", "5d7aab1b": "D", "edd89684": "D"}

FARG = {"8c1d08c5": "grått med vit skiva", "3710a0c3": "mörkbrunt",
        "5eb270ed": "svart", "31d6a3df": "vitt med grå skiva",
        "a8e376e7": "vitt", "5d7aab1b": "grått", "edd89684": "mörkbrunt"}

SLUGG = {
    "8c1d08c5": "matskap-hund-36-cm-lada-21-liter-gratt",
    "3710a0c3": "matskap-hund-36-cm-lada-21-liter-brunt",
    "5eb270ed": "matskap-hund-36-cm-lada-21-liter-svart",
    "31d6a3df": "matskap-hund-36-cm-lada-21-liter-vitt",
    "a8e376e7": "matstation-hund-41-cm-lyftbar-skiva-vitt",
    "5d7aab1b": "matstation-hund-41-cm-lyftbar-skiva-gratt",
    "edd89684": "matstation-hund-41-cm-lyftbar-skiva-brunt",
}

SOKORD = {pid: ("matskåp hund" if GRUPP[pid] == "C" else "matstation hund")
          for pid in PRODUKTER}

# ☠️ Skrivs för hand. Husets SKU-regel kapar vid 24 tecken och sluggarna är
#    identiska långt bortom det — fyra färgsyskon hade fått samma SKU (#272).
SKU = {
    "8c1d08c5": "FP-matskap-36-lada-gra",
    "3710a0c3": "FP-matskap-36-lada-brun",
    "5eb270ed": "FP-matskap-36-lada-svart",
    "31d6a3df": "FP-matskap-36-lada-vit",
    "a8e376e7": "FP-matstation-41-vit",
    "5d7aab1b": "FP-matstation-41-gra",
    "edd89684": "FP-matstation-41-brun",
}

NAMN = {
    "8c1d08c5": "Matskåp för hund 60 × 30 × 36 cm, grått med vit skiva – låda 21 liter",
    "3710a0c3": "Matskåp för hund 60 × 30 × 36 cm i mörkbrunt – låda på 21 liter",
    "5eb270ed": "Matskåp för hund 60 × 30 × 36 cm i svart – låda på 21 liter",
    "31d6a3df": "Matskåp för hund 60 × 30 × 36 cm, vitt med grå skiva – låda 21 liter",
    "a8e376e7": "Matstation för hund 60 × 30 × 41 cm i vitt – löstagbar skiva och förvaring",
    "5d7aab1b": "Matstation för hund 60 × 30 × 41 cm i grått – löstagbar skiva och förvaring",
    "edd89684": "Matstation för hund 60 × 30 × 41 cm i mörkbrunt – löstagbar skiva",
}

INGRESS = {
    "8c1d08c5": ("Ett matskåp för hund med en enda stor låda under skålarna. "
                 "Lådan går på metallskenor och dras ut i ett drag i "
                 "kuphandtaget, så hela foderförrådet kommer fram på en gång "
                 "i stället för att grävas ut ur ett skåp. Skåpet har grå stomme "
                 "och vit skiva – de två ytorna har olika kulör."),
    "3710a0c3": ("Ett matskåp för hund med en enda stor låda under skålarna. "
                 "Lådan går på metallskenor och dras ut i ett drag i "
                 "kuphandtaget, så hela foderförrådet kommer fram på en gång "
                 "i stället för att grävas ut ur ett skåp. Skåpet är "
                 "genomgående mörkbrunt med ett mässingsfärgat handtag."),
    "5eb270ed": ("Ett matskåp för hund med en enda stor låda under skålarna. "
                 "Lådan går på metallskenor och dras ut i ett drag i "
                 "kuphandtaget, så hela foderförrådet kommer fram på en gång "
                 "i stället för att grävas ut ur ett skåp. Skåpet är helsvart "
                 "med förkromat handtag – smulor och tassavtryck syns minst "
                 "på den ytan."),
    "31d6a3df": ("Ett matskåp för hund med en enda stor låda under skålarna. "
                 "Lådan går på metallskenor och dras ut i ett drag i "
                 "kuphandtaget, så hela foderförrådet kommer fram på en gång "
                 "i stället för att grävas ut ur ett skåp. Skåpet har vit stomme "
                 "och grå skiva – de två ytorna har olika kulör."),
    "a8e376e7": ("En matstation för hund där hela skivan med båda skålarna "
                 "lyfts av i ett stycke. Under den ligger hela förrådet öppet, "
                 "så en fodersäck går ner utan att tryckas förbi en lucka. "
                 "Stationen är vit, 41 cm hög och har ett handtag på var "
                 "kortsida."),
    "5d7aab1b": ("En matstation för hund där hela skivan med båda skålarna "
                 "lyfts av i ett stycke. Under den ligger hela förrådet öppet, "
                 "så en fodersäck går ner utan att tryckas förbi en lucka. "
                 "Stationen är grå, 41 cm hög och har ett handtag på var "
                 "kortsida."),
    "edd89684": ("En matstation för hund där hela skivan med båda skålarna "
                 "lyfts av i ett stycke. Under den ligger hela förrådet öppet, "
                 "så en fodersäck går ner utan att tryckas förbi en lucka. "
                 "Stationen är mörkbrun, 41 cm hög och har ett handtag på var "
                 "kortsida."),
}

_C_GEMENSAMT = [
    "Två rostfria skålar på 2 liter, infällda i skivan och löstagbara",
    "En utdragbar låda på 21 liter, 50 × 21,5 × 20 cm, på metallskenor",
    "Skåpet är 60 × 30 × 36 cm och skålarna mäter Ø 24 × 7 cm",
    "Förhöjd bakkant på skivan, så skålen inte knuffas ut baktill",
    "Maxlast 15 kg på ovansidan och 15 kg i lådan",
    "Avsett för hundar med mankhöjd 50–60 cm",
]
_D_GEMENSAMT = [
    "Två rostfria skålar på cirka 2 liter, löstagbara för disk",
    "Hela skivan på 60 × 30 cm lyfts av – förrådet under ligger helt öppet",
    "Stationen är 60 × 30 × 41 cm och skålarna mäter Ø 24 × 7 cm",
    "Handtag på var kortsida, 10 × 2,5 cm",
    "Belastbarhet 30 kg",
    "Avsett för hundar med mankhöjd 40–65 cm",
]

EGENSKAPER = {
    "8c1d08c5": _C_GEMENSAMT + [
        "Stomme i MDF med grå yta och vit skiva, handtag i mässingsfärgad metall"],
    "3710a0c3": _C_GEMENSAMT + [
        "Stomme i MDF med mörkbrun yta, handtag i mässingsfärgad metall"],
    "5eb270ed": _C_GEMENSAMT + [
        "Stomme i MDF med svart yta, handtag i förkromad metall"],
    "31d6a3df": _C_GEMENSAMT + [
        "Stomme i MDF med vit yta och grå skiva, handtag i mässingsfärgad metall"],
    "a8e376e7": _D_GEMENSAMT + ["Stomme i MDF med vit yta, skålar i rostfritt stål"],
    "5d7aab1b": _D_GEMENSAMT + ["Stomme i MDF med grå yta, skålar i rostfritt stål"],
    "edd89684": _D_GEMENSAMT + ["Stomme i MDF med mörkbrun yta, skålar i rostfritt stål"],
}

_C_SPEC_SLUT = [
    ("Maxlast", "15 kg på ovansidan, 15 kg i lådan"),
    ("Mankhöjd hund", "50–60 cm"),
    ("Stomme", "MDF, träfiberskiva"),
    ("Skålmaterial", "rostfritt stål"),
    ("Vikt", "12 kg"),
    ("Montering", "krävs, anvisning ingår"),
]
_C_SPEC_START = [
    ("Mått", "60 × 30 × 36 cm"),
    ("Låda", "50 × 21,5 × 20 cm, 21 liter"),
    ("Lådans upphängning", "metallskenor med kuphandtag"),
    ("Skålar", "2 st, 2 liter, Ø 24 × 7 cm"),
]
_D_SPEC_START = [
    ("Mått", "60 × 30 × 41 cm"),
    ("Skiva", "60 × 30 cm, lyfts av i ett stycke"),
    ("Skålar", "2 st, cirka 2 liter, Ø 24 × 7 cm"),
    ("Handtag", "1 st på var kortsida, 10 × 2,5 cm"),
]
_D_SPEC_SLUT = [
    ("Belastbarhet", "30 kg"),
    ("Mankhöjd hund", "40–65 cm"),
    ("Stomme", "MDF, träfiberskiva"),
    ("Skålmaterial", "rostfritt stål"),
    ("Vikt", "9,3 kg"),
    ("Montering", "krävs"),
]

SPEC = {
    "8c1d08c5": _C_SPEC_START + [("Färg", "grå stomme, vit skiva"),
                                 ("Handtag", "mässingsfärgad metall")] + _C_SPEC_SLUT,
    "3710a0c3": _C_SPEC_START + [("Färg", "mörkbrun"),
                                 ("Handtag", "mässingsfärgad metall")] + _C_SPEC_SLUT,
    "5eb270ed": _C_SPEC_START + [("Färg", "svart"),
                                 ("Handtag", "förkromad metall")] + _C_SPEC_SLUT,
    "31d6a3df": _C_SPEC_START + [("Färg", "vit stomme, grå skiva"),
                                 ("Handtag", "mässingsfärgad metall")] + _C_SPEC_SLUT,
    "a8e376e7": _D_SPEC_START + [("Färg", "vit")] + _D_SPEC_SLUT,
    "5d7aab1b": _D_SPEC_START + [("Färg", "grå")] + _D_SPEC_SLUT,
    "edd89684": _D_SPEC_START + [("Färg", "mörkbrun")] + _D_SPEC_SLUT,
}

RUBRIK2 = {
    "C": "Lådan och vad som ryms i den",
    "D": "Så kommer du åt förrådet under skivan",
}


# ------------------------------------------------------- brödtext, del två

def stycken2(pid):
    if GRUPP[pid] == "C":
        return [
            ("Lådan mäter 50 × 21,5 × 20 cm och rymmer 21 liter. En "
             "femkilossäck torrfoder får plats liggande, och bredvid den "
             "ryms skopan, godispåsen och kopplet. Skåpet står på 60 × 30 cm "
             "golvyta och är 36 cm högt, alltså ungefär en pall — och "
             "förvaringen tar ingen extra plats i rummet."),
            ("Skillnaden mot ett skåp med dörrar märks vid påfyllningen. "
             "Lådan går på metallskenor och kommer ut i sin helhet, så man "
             "ser hela innehållet uppifrån i stället för att famla in bakom "
             "en lucka. Kuphandtaget mitt fram tar hela handen, vilket "
             "hjälper när den andra håller en matskål."),
            ("Skålarna ligger i två utskurna hål i skivan och kan inte "
             "knuffas runt medan hunden äter. Bakkanten på skivan är förhöjd "
             "med en list, så en skål som får en knuff bakåt stannar kvar på "
             "skivan i stället för att åka ner bakom skåpet. Hela skålen "
             "lyfts ur uppifrån när den ska diskas."),
        ]
    return [
        ("Hela skivan med båda skålhålen lyfts av i ett stycke. Det är alltså "
         "inget lock på gångjärn: skivan lyfts rakt upp och läggs åt sidan, "
         "och då ligger utrymmet under helt öppet i hela stationens bredd. "
         "En fodersäck går ner utan att behöva tryckas förbi en kant."),
        ("Priset för den lösningen är att skivan behöver en plats att ligga "
         "på under tiden, och att båda händerna behövs för att lyfta av den. "
         "Det gör den lämpligare för veckans påfyllning än för dagens matning – "
         "till matningen står skålarna ju redan uppe i skivan."),
        ("Stationen mäter 60 × 30 × 41 cm och tål 30 kg. Handtagen på "
         "kortsidorna är 10 × 2,5 cm och sitter där man ändå tar när "
         "stationen ska flyttas för att sopa under. Skålarna lyfts ur "
         "uppifrån och är Ø 24 × 7 cm, vilket rymmer runt två liter var."),
    ]


SKOTSEL = {
    "C": [
        ("Skålarna lyfts rakt upp ur hålen och tål maskindisk. Rostfritt "
         "stål tar varken smak eller lukt, och ytan blir inte repad av en "
         "diskborste på samma sätt som plast."),
        ("Håll lådskenorna fria från foderspill. Ett par korn i skenan är "
         "hela skillnaden mellan en låda som glider och en som kärvar; "
         "torka ur dem när du ändå torkar av skivan."),
        ("Stommen är MDF med målad yta. Torka med en fuktig trasa och torka "
         "torrt efteråt – låt inte vatten stå kvar mot kanterna, det är där "
         "en träfiberskiva tar skada först. Skåpet levereras omonterat med "
         "anvisning."),
    ],
    "D": [
        ("Skålarna lyfts rakt upp ur hålen och tål maskindisk. Rostfritt "
         "stål tar varken smak eller lukt, och ytan blir inte repad av en "
         "diskborste på samma sätt som plast."),
        ("Skivan torkas av på plats, men lyft av den och torka undersidan "
         "med jämna mellanrum. Det är där kondens och damm samlas, och det "
         "är samtidigt den yta som ligger direkt över fodret."),
        ("Stommen är MDF med målad yta. Torka med en fuktig trasa och torka "
         "torrt efteråt – låt inte vatten stå kvar mot kanterna. Stationen "
         "levereras omonterad och skruvas ihop hemma."),
    ],
}


def faq(pid):
    g = GRUPP[pid]
    mank = {"C": "50 till 60 cm", "D": "40 till 65 cm"}[g]
    hojd = {"C": "36 cm", "D": "41 cm"}[g]
    ut = [
        ("Vilken hundstorlek passar den?",
         "Den är avsedd för hundar med mankhöjd %s. Mät från golvet till "
         "skulderbladets överkant medan hunden står, och jämför med det talet "
         "– det är höjden på hunden som avgör, inte vikten." % mank),
        ("Hur högt står skålen över golvet?",
         "Möbeln är %s hög och skålarna ligger infällda i ovansidan, så "
         "skålkanten hamnar i praktiken i jämnhöjd med skivan." % hojd),
        ("Ingår skålarna?",
         "Ja, två skålar i rostfritt stål ingår och sitter i utskurna hål i "
         "skivan. De lyfts ur för disk."),
    ]
    if g == "C":
        ut += [
            ("Hur mycket får plats i lådan?",
             "21 liter, alltså 50 × 21,5 × 20 cm. En femkilossäck torrfoder "
             "får plats liggande, med utrymme kvar bredvid."),
            ("Går lådan att låsa?",
             "Nej. Den dras ut i handtaget och har varken lås eller spärr. "
             "Det räcker mot en nyfiken nos men är inte ett barnlås."),
            ("Måste skålarna lyftas ur för att komma åt lådan?",
             "Nej. Lådan dras ut framifrån och skivan sitter kvar, så "
             "skålarna kan stå fyllda medan du fyller på foder."),
        ]
    else:
        ut += [
            ("Hur öppnar man förvaringen?",
             "Hela skivan med båda skålarna lyfts av i ett stycke och läggs "
             "åt sidan. Det är inget lock på gångjärn, så räkna med två "
             "händer och en plats att lägga skivan på."),
            ("Hur mycket får plats under skivan?",
             "Utrymmet är hela stationens invändiga volym, alltså allt under "
             "skivan på en yta av 60 × 30 cm. Vi anger inget invändigt mått: "
             "leverantörens siffra går inte ihop med yttermåttet, och vi "
             "publicerar hellre ingen siffra än en som inte stämmer."),
            ("Tål ovansidan att man ställer något på den?",
             "Stationen tål 30 kg. Skivan är ändå inte fastsatt, så ställ "
             "inget tungt eller ostadigt på den – den lyfts av."),
        ]
    ut.append(("Kommer den monterad?",
               "Nej, den monteras hemma."))
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
    d.append("<h2>Fler matplatser för hund</h2><ul>")
    for annan in SYSKON[pid]:
        d.append('<li><a href="%s%s">%s</a></li>' % (BAS, annan[0], annan[1]))
    d.append("</ul>")
    return "".join(d)


def namn(pid):
    return NAMN[pid]


SEO_TITEL = {
    "8c1d08c5": "Matskåp hund 36 cm grått – låda 21 liter, skålar 2 L",
    "3710a0c3": "Matskåp hund 36 cm mörkbrunt – låda 21 liter, skålar 2 L",
    "5eb270ed": "Matskåp hund 36 cm svart – låda 21 liter, skålar 2 L",
    "31d6a3df": "Matskåp hund 36 cm vitt – låda 21 liter, skålar 2 L",
    "a8e376e7": "Matstation hund 41 cm vitt – löstagbar skiva, förvaring",
    "5d7aab1b": "Matstation hund 41 cm grått – löstagbar skiva, förvaring",
    "edd89684": "Matstation hund 41 cm brunt – löstagbar skiva, förvaring",
}

SEO_BESKRIVNING = {
    "8c1d08c5": ("Matskåp för hund 60 × 30 × 36 cm med grå stomme och vit "
                 "skiva. En utdragbar låda på 21 liter och två rostfria "
                 "skålar på 2 liter. MDF, 12 kg, mankhöjd 50–60 cm."),
    "3710a0c3": ("Matskåp för hund 60 × 30 × 36 cm i mörkbrunt med en "
                 "utdragbar låda på 21 liter och två rostfria skålar på "
                 "2 liter. MDF, 12 kg, mankhöjd 50–60 cm."),
    "5eb270ed": ("Matskåp för hund 60 × 30 × 36 cm i svart med en utdragbar "
                 "låda på 21 liter och två rostfria skålar på 2 liter. MDF "
                 "med förkromat handtag, 12 kg, mankhöjd 50–60 cm."),
    "31d6a3df": ("Matskåp för hund 60 × 30 × 36 cm med vit stomme och grå "
                 "skiva. En utdragbar låda på 21 liter och två rostfria "
                 "skålar på 2 liter. MDF, 12 kg, mankhöjd 50–60 cm."),
    "a8e376e7": ("Matstation för hund 60 × 30 × 41 cm i vitt där hela skivan "
                 "lyfts av och förrådet under ligger öppet. Två rostfria "
                 "skålar, 30 kg belastbarhet, MDF, mankhöjd 40–65 cm."),
    "5d7aab1b": ("Matstation för hund 60 × 30 × 41 cm i grått där hela skivan "
                 "lyfts av och förrådet under ligger öppet. Två rostfria "
                 "skålar, 30 kg, MDF, mankhöjd 40–65 cm."),
    "edd89684": ("Matstation för hund 60 × 30 × 41 cm i mörkbrunt där skivan "
                 "lyfts av och förrådet under ligger öppet. Två rostfria "
                 "skålar, 30 kg, MDF, mankhöjd 40–65 cm."),
}

# ---------------------------------------------------------------- syskonen
# ☠️ Korslänkarna byggs MEKANISKT ur SLUGG + KORTNAMN, aldrig för hand.
#    Runda 97 mätte att transkriptionshashen är BLIND för länkar: en href
#    som pekar fel ger identisk hash före och efter.

KORTNAMN = {
    "8c1d08c5": "Matskåp 36 cm, grått med vit skiva",
    "3710a0c3": "Matskåp 36 cm i mörkbrunt, låda 21 liter",
    "5eb270ed": "Matskåp 36 cm i svart, låda 21 liter",
    "31d6a3df": "Matskåp 36 cm, vitt med grå skiva",
    "a8e376e7": "Matstation 41 cm i vitt, löstagbar skiva",
    "5d7aab1b": "Matstation 41 cm i grått, löstagbar skiva",
    "edd89684": "Matstation 41 cm i mörkbrunt, löstagbar skiva",
}

# Publicerade syskon ur runda 97 och 98, samma möbeltyp och kategorilöv.
PUBLICERADE = [
    ("husdjursskap-82-cm-matplats-i-lada", "Husdjursskåp 82 cm med matplats i utfällbar låda"),
    ("matplats-hund-tre-hojder-kaffebrun", "Matplats i tre höjder, kaffebrun"),
    ("matskap-hund-46-cm-skjutdorrar-50-liter", "Matskåp 46 cm med skjutdörrar, 50 liter"),
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
