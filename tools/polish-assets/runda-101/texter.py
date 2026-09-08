# -*- coding: utf-8 -*-
"""Runda 101 – åtta massagefåtöljer i fyra modeller.

Fakta kommer UTESLUTANDE ur STEG2-4-5.md, som i sin tur bara bär det
leverantörens text, spec-kolumnerna eller måttritningen faktiskt säger.
Inget tal här är härlett, uppskattat eller lånat från ett syskon.
"""

BAS = "https://www.fyndplats.se/produkt/"

# modell -> gemensamma fakta
# A = vridbar fåtölj + vridbar fotpall, svart rund stålfot, konstläder
# B = träram, fotpall MED FÖRVARING
# C = 160 kg, 105 cm hög rygg
# D = linnelook, kromad fot, 8 punkter, 135°

PRODUKTER = ["cd7e9036", "7062dc79", "9c8a7a80",
             "1932abe1", "89fead7d",
             "54d25930", "c50fa916",
             "b8b6fee1"]

MODELL = {"cd7e9036": "A", "7062dc79": "A", "9c8a7a80": "A",
          "1932abe1": "B", "89fead7d": "B",
          "54d25930": "C", "c50fa916": "C",
          "b8b6fee1": "D"}

FARG = {"cd7e9036": "brun", "7062dc79": "cremevit", "9c8a7a80": "svart",
        "1932abe1": "svart", "89fead7d": "svart",
        "54d25930": "cremevit", "c50fa916": "mörkgrå",
        "b8b6fee1": "svart"}

# Klädsel – avgjord på ZOOM, inte på spec-kolumnen (se STEG2-4-5.md)
KLADSEL = {"cd7e9036": "konstläder", "7062dc79": "konstläder", "9c8a7a80": "konstläder",
           "1932abe1": "konstläder", "89fead7d": "tyg",
           "54d25930": "konstläder", "c50fa916": "konstläder",
           "b8b6fee1": "tyg"}

# Fotpallens maxlast. None = leverantörens data anger ingen. Skriv då INGEN.
PALLAST = {"A": None, "B": 100, "C": 20, "D": 60}

# Mikrolåsningsnoten finns i A, B och C:s källor – INTE i D:s.
MIKROLAS = {"A": True, "B": True, "C": True, "D": False}

SLUGG = {
    "cd7e9036": "massagefatolj-brun-vridbar-fotpall",
    "7062dc79": "massagefatolj-cremevit-vridbar-fotpall",
    "9c8a7a80": "massagefatolj-svart-vridbar-fotpall",
    "1932abe1": "massagefatolj-konstlader-fotpall-forvaring",
    "89fead7d": "massagefatolj-tyg-fotpall-forvaring",
    "54d25930": "massagefatolj-160-kg-cremevit",
    "c50fa916": "massagefatolj-morkgra-160-kg",
    "b8b6fee1": "massagefatolj-156-cm-utfalld-svart",
}

SKU = {
    "cd7e9036": "FP-massagefatolj-brun",
    "7062dc79": "FP-massagefatolj-cremevit",
    "9c8a7a80": "FP-massagefatolj-svart",
    "1932abe1": "FP-massagefatolj-konstlader",
    "89fead7d": "FP-massagefatolj-tyg",
    "54d25930": "FP-massagefatolj-160-kg",
    "c50fa916": "FP-massagefatolj-morkgra",
    "b8b6fee1": "FP-massagefatolj-156-cm",
}

NAMN = {
    "cd7e9036": "Massagefåtölj brun med vridbar fotpall – tio lägen, fälls till 145°",
    "7062dc79": "Massagefåtölj cremevit med vridbar fotpall – tio lägen, fälls till 145°",
    "9c8a7a80": "Massagefåtölj svart med vridbar fotpall – tio lägen, fälls till 145°",
    "1932abe1": "Massagefåtölj i konstläder – fotpall med förvaring som bär 100 kg",
    "89fead7d": "Massagefåtölj i tyg – fotpall med förvaring som bär 100 kg",
    "54d25930": "Massagefåtölj för 160 kg, cremevit – 105 cm hög rygg och fotpall",
    "c50fa916": "Massagefåtölj mörkgrå för 160 kg – 105 cm hög rygg och fotpall",
    "b8b6fee1": "Massagefåtölj i linnelook, svart – 156 cm utfälld med kromad fot",
}

SEO_TITEL = {
    "cd7e9036": "Massagefåtölj brun med vridbar fotpall | Fyndplats",
    "7062dc79": "Massagefåtölj cremevit med fotpall | Fyndplats",
    "9c8a7a80": "Massagefåtölj svart med vridbar fotpall | Fyndplats",
    "1932abe1": "Massagefåtölj konstläder, fotpall med förvaring",
    "89fead7d": "Massagefåtölj i tyg, fotpall med förvaring",
    "54d25930": "Massagefåtölj cremevit för 160 kg | Fyndplats",
    "c50fa916": "Massagefåtölj mörkgrå för 160 kg | Fyndplats",
    "b8b6fee1": "Massagefåtölj svart, 156 cm utfälld | Fyndplats",
}

SEO_BESKRIVNING = {
    "cd7e9036": "Brun massagefåtölj i konstläder med tio vibrationslägen och handkontroll. Ryggen fälls till 145°, både fåtöljen och fotpallen snurrar. Bär 120 kg.",
    "7062dc79": "Cremevit massagefåtölj i konstläder med tio vibrationslägen och handkontroll. Ryggen fälls till 145°, både fåtöljen och fotpallen snurrar. Bär 120 kg.",
    "9c8a7a80": "Svart massagefåtölj i konstläder med tio vibrationslägen och handkontroll. Ryggen fälls till 145°, både fåtöljen och fotpallen snurrar. Bär 120 kg.",
    "1932abe1": "Massagefåtölj i svart konstläder på träram, med tio massagepunkter i fem lägen. Fotpallen har ett förvaringsutrymme under locket och bär 100 kg.",
    "89fead7d": "Massagefåtölj i svart tyg på träram, med tio massagepunkter i fem lägen. Fotpallen har ett förvaringsutrymme under locket och bär 100 kg.",
    "54d25930": "Cremevit massagefåtölj som bär 160 kg, med 105 cm hög rygg och tio massagepunkter. Sitsen snurrar 360°, ryggen fälls till 145°, fotpall ingår.",
    "c50fa916": "Mörkgrå massagefåtölj som bär 160 kg, med 105 cm hög rygg och tio massagepunkter. Sitsen snurrar 360°, ryggen fälls till 145°, fotpall ingår.",
    "b8b6fee1": "Svart massagefåtölj i linnelook med kromad fot och åtta vibrationspunkter. Fälls ut till 156 cm, ottomanen bär 60 kg och sitsen snurrar 360°.",
}

SOKORD = {
    "A": ["massagefåtölj", "massagefåtölj med fotpall", "vilstol med massage", "tv-fåtölj"],
    "B": ["massagefåtölj", "massagefåtölj med förvaring", "fotpall med förvaring", "tv-fåtölj"],
    "C": ["massagefåtölj", "massagefåtölj 160 kg", "vilstol med massage", "fåtölj med hög rygg"],
    "D": ["massagefåtölj", "massagefåtölj med ottoman", "reclinerfåtölj", "vilfåtölj"],
}

KORTNAMN = {
    "cd7e9036": "Massagefåtölj brun",
    "7062dc79": "Massagefåtölj cremevit",
    "9c8a7a80": "Massagefåtölj svart",
    "1932abe1": "Massagefåtölj i konstläder",
    "89fead7d": "Massagefåtölj i tyg",
    "54d25930": "Massagefåtölj cremevit, 160 kg",
    "c50fa916": "Massagefåtölj mörkgrå, 160 kg",
    "b8b6fee1": "Massagefåtölj svart, 156 cm",
}

SYSKONTEXT = {
    "cd7e9036": "brun, vridbar fotpall",
    "7062dc79": "cremevit, vridbar fotpall",
    "9c8a7a80": "svart, vridbar fotpall",
    "1932abe1": "konstläder, fotpall med förvaring",
    "89fead7d": "tyg, fotpall med förvaring",
    "54d25930": "cremevit, bär 160 kg",
    "c50fa916": "mörkgrå, bär 160 kg",
    "b8b6fee1": "linnelook, 156 cm utfälld",
}

INGRESS = {
    "A": ("Massagefåtölj i {kladsel} där både fåtöljen och fotpallen vrider sig på "
          "varsin rund stålfot. Tio vibrationslägen styrs från handkontrollen, och "
          "ryggen fälls bakåt till 145° när du vill luta dig tillbaka framför tv:n. "
          "Handkontrollen har en egen sidoficka på fåtöljen, så den ligger kvar där "
          "du la den."),
    "B": ("Massagefåtölj i {kladsel} på en stomme av trä, med tio massagepunkter i "
          "fem lägen och två styrkor. Fotpallen är samtidigt en förvaringslåda: "
          "lyft på locket så finns det plats för filten, tidningarna eller "
          "fjärrkontrollerna. Ryggen fälls till 145°."),
    "C": ("Massagefåtölj med extra hög rygg – 105 cm från golvet – som bär upp till "
          "160 kg. Tio massagepunkter styrs från fjärrkontrollen, sitsen snurrar "
          "360° och ryggen fälls bakåt till 145°. Fotpallen står separat och kan "
          "flyttas dit du vill ha den."),
    "D": ("Massagefåtölj i luftig linnelook på en kromad fot, med åtta "
          "vibrationspunkter i ryggen, ländryggen, sitsen och ottomanen. Fälld helt "
          "bakåt blir ekipaget 156 cm långt, alltså nästan en hel liggplats. Sitsen "
          "snurrar 360° och ottomanen står fritt på en egen kromad fot."),
}

EGENSKAPER = {
    "A": [
        "Tio vibrationslägen som väljs från handkontrollen",
        "Ryggen fälls bakåt till 145°",
        "Både fåtöljen och fotpallen vrider sig",
        "Sidoficka på fåtöljen för handkontrollen",
        "Klädsel i konstläder som torkas av med en fuktig trasa",
        "Rund stålfot, 55 cm i diameter under fåtöljen och 40 cm under fotpallen",
        "Bär 120 kg",
    ],
    "B": [
        "Tio massagepunkter i fem lägen: puls, tryck, våg, auto och normal",
        "Två styrkor att välja mellan",
        "Fotpallen har ett förvaringsutrymme under locket",
        "Ryggen fälls bakåt till 145°",
        "Stomme av trä och stoppning i högdensitetsskum",
        "Korsformad fot i trä",
        "Fjärrkontroll ingår",
        "Fåtöljen bär 120 kg och fotpallen 100 kg",
    ],
    "C": [
        "Tio massagepunkter som väljs från fjärrkontrollen",
        "Bär 160 kg",
        "Ryggen är 105 cm hög och 54 × 71 cm stor",
        "Sitsen snurrar 360°",
        "Ryggen fälls bakåt till 145°",
        "Sidoficka för fjärrkontrollen",
        "Armstöden ligger 58 cm över golvet",
    ],
    "D": [
        "Åtta vibrationspunkter i ryggen, ländryggen, sitsen och ottomanen",
        "Fem lägen och två styrkor",
        "Fälls ut till 156 cm längd och 80 cm höjd",
        "Sitsen snurrar 360° på en kromad fot",
        "Ottomanen står fritt på en egen kromad fot",
        "Sidoficka för handkontrollen",
        "Fåtöljen bär 120 kg och ottomanen 60 kg",
    ],
}

# Spec-tabellen. Varje rad är belagd i STEG2-4-5.md.
SPEC = {
    "A": [
        ("Mått", "77 × 84 × 95 cm (B × D × H)"),
        ("Mått utfälld", "105 cm djup och 90 cm hög"),
        ("Sits", "50 × 52 cm, sitthöjd 45 cm"),
        ("Ryggstöd", "52 cm brett och 72 cm högt"),
        ("Fotpall", "43 × 43 × 41 cm"),
        ("Fot", "Ø 55 cm (fåtölj), Ø 40 cm (fotpall)"),
        ("Ryggvinkel", "Upp till 145°"),
        ("Massage", "Tio vibrationslägen"),
        ("Maxlast", "120 kg"),
        ("Ström", "100–240 V in, 12 V / 1,2 A ut"),
        ("Material", "Konstläder, skum och stål"),
    ],
    "B": [
        ("Mått", "80 × 86 × 99 cm (B × D × H)"),
        ("Mått utfälld", "118 cm djup och 83 cm hög"),
        ("Sits", "50 × 52 cm, sitthöjd 43 cm"),
        ("Armstödshöjd", "56 cm"),
        ("Fotpall", "47 × 42 × 45 cm, med förvaring"),
        ("Ryggvinkel", "Upp till 145°"),
        ("Massage", "Tio punkter, fem lägen, två styrkor"),
        ("Maxlast", "120 kg (fåtölj), 100 kg (fotpall)"),
        ("Ström", "100–240 V in, 12 V ut"),
        ("Material", "{kladselstor}, skum och trä"),
    ],
    "C": [
        ("Mått", "76 × 81 × 105 cm (B × D × H)"),
        ("Mått utfälld", "81 cm bred, 112 cm djup och 91 cm hög"),
        ("Sits", "50 × 51,5 cm, sitthöjd 45 cm"),
        ("Ryggstöd", "54 cm brett och 71 cm högt"),
        ("Armstödshöjd", "58 cm över golvet"),
        ("Fotpall", "47 × 40 × 43 cm"),
        ("Ryggvinkel", "Upp till 145°"),
        ("Massage", "Tio punkter med fjärrkontroll"),
        ("Maxlast", "160 kg (fåtölj), 20 kg (fotpall)"),
        ("Material", "Konstläder, stål och skum"),
    ],
    "D": [
        ("Mått", "78 × 95 × 88 cm (B × D × H)"),
        ("Mått utfälld", "156 cm lång och 80 cm hög"),
        ("Sits", "50 × 52 cm, sitthöjd 41 cm"),
        ("Armstöd", "19 cm över sitsen"),
        ("Ottoman", "47 × 48 × 44 cm"),
        ("Ryggvinkel", "Upp till 135°"),
        ("Massage", "Åtta punkter, fem lägen, två styrkor"),
        ("Maxlast", "120 kg (fåtölj), 60 kg (ottoman)"),
        ("Sladdlängd", "1,2 m"),
        ("Material", "Linnetyg av 100 % polyester, skum och stål"),
    ],
}

RUBRIK2 = {
    "A": "Så tar den plats i rummet",
    "B": "Fotpallen är också en förvaringslåda",
    "C": "Byggd för att bära mer",
    "D": "Från fåtölj till liggplats",
}

STYCKEN2 = {
    "A": [
        "Uppfälld mäter fåtöljen 77 cm bred, 84 cm djup och 95 cm hög. Fäller du "
        "ryggen hela vägen till 145° växer djupet till 105 cm och höjden sjunker "
        "till 90 cm – räkna alltså med drygt en meter fritt bakåt från väggen om "
        "du vill kunna luta dig ända ner.",
        "Sitsen är 50 × 52 cm och sitter 45 cm över golvet, och ryggstödet är 52 cm "
        "brett och 72 cm högt. Fotpallen är 43 × 43 cm och 41 cm hög, alltså några "
        "centimeter lägre än sitsen – benen får en svag lutning nedåt när du lägger "
        "upp dem.",
        "Båda delarna står på var sin runda stålfot: 55 cm i diameter under "
        "fåtöljen och 40 cm under fotpallen. Foten gör att både fåtöljen och pallen "
        "går att vrida runt utan att du reser dig, vilket är praktiskt om tv:n och "
        "fönstret inte sitter åt samma håll.",
    ],
    "B": [
        "Det som skiljer den här från en vanlig fåtölj med pall är locket. "
        "Fotpallen mäter 47 × 42 cm och är 45 cm hög, och under sitsen finns ett "
        "utrymme där filten, fjärrkontrollerna eller kvällens tidningar får plats. "
        "Pallen bär 100 kg, så den fungerar lika bra som extra sittplats när det "
        "kommer folk.",
        "Fåtöljen själv är 80 cm bred, 86 cm djup och 99 cm hög, och sitsen ligger "
        "43 cm över golvet med armstöden på 56 cm. Fälld bakåt till 145° blir djupet "
        "118 cm och höjden 83 cm.",
        "Stommen är av trä och stoppningen av högdensitetsskum. Massagen har tio "
        "punkter och fem lägen – puls, tryck, våg, auto och normal – i två styrkor, "
        "och allt styrs från fjärrkontrollen som ingår.",
    ],
    "C": [
        "Den här modellen bär 160 kg. Ryggen är också hög: 105 cm från golvet, med "
        "ett ryggstöd på 54 × 71 cm som räcker upp bakom nacken på de flesta.",
        "Sitsen är 50 × 51,5 cm och ligger 45 cm över golvet, och armstöden 58 cm. "
        "Hela fåtöljen mäter 76 × 81 × 105 cm uppfälld; fälld bakåt till 145° blir "
        "den 81 cm bred, 112 cm djup och 91 cm hög. Sitsen snurrar 360° på foten.",
        "Fotpallen mäter 47 × 40 cm och är 43 cm hög. Den är gjord som fotstöd och "
        "bär 20 kg – lägg upp benen på den, men sätt dig inte på den. Behöver du en "
        "pall som också tål att sitta på finns modellen med förvaringslock längre "
        "ned på sidan.",
    ],
    "D": [
        "Ryggen fälls till 135° och ottomanen står separat, så när du lägger ihop "
        "dem blir liggytan 156 cm lång och 80 cm hög i ryggen – tillräckligt för en "
        "ordentlig eftermiddagslur utan att du behöver flytta dig till soffan.",
        "Uppfälld tar fåtöljen 78 × 95 × 88 cm. Sitsen är 50 × 52 cm och ligger "
        "lågt, 41 cm över golvet, med armstöden 19 cm ovanför sitsen. Ottomanen är "
        "47 × 48 cm och 44 cm hög och bär 60 kg.",
        "Klädseln är ett linnevävt tyg av 100 % polyester, och både fåtöljen och "
        "ottomanen står på blanka kromade fötter i stål. Åtta vibrationspunkter "
        "sitter i ryggen, ländryggen, sitsen och ottomanen, med fem lägen och två "
        "styrkor. Sladden är 1,2 m.",
    ],
}

SKOTSEL = {
    "konstläder": [
        "Torka av klädseln med en fuktig trasa och lite milt diskmedel, och torka "
        "efter med en torr trasa. Konstläder tål inte lösningsmedel, blekmedel "
        "eller skurmedel.",
        "Ställ fåtöljen en bit från element och direkt sol – ihållande värme gör "
        "konstläder styvt över tid.",
        "Dra ur kontakten när fåtöljen inte används under en längre period, och "
        "låt sladden ligga fritt så att den inte kläms under foten.",
    ],
    "tyg": [
        "Dammsug klädseln med möbelmunstycke och ta fläckar med en fuktad trasa och "
        "lite milt rengöringsmedel. Låt tyget torka helt innan du sätter dig igen.",
        "Ställ fåtöljen en bit från element och direkt sol så att tyget behåller "
        "färgen.",
        "Dra ur kontakten när fåtöljen inte används under en längre period, och "
        "låt sladden ligga fritt så att den inte kläms under foten.",
    ],
}

MONTERING = ("Fåtöljen levereras i delar och sätts ihop hemma. Räkna med en "
             "stund på golvet med kartongen som underlag, och ta hjälp av någon "
             "när ryggen ska på plats.")

FAQ = {
    "A": [
        ("Går fotpallen att vrida också?",
         "Ja. Både fåtöljen och fotpallen står på var sin runda stålfot och går att "
         "vrida runt, så du kan flytta blicken mellan tv:n och fönstret utan att "
         "resa dig."),
        ("Hur mycket plats behöver jag bakom fåtöljen?",
         "Uppfälld är fåtöljen 84 cm djup. Fälls ryggen ända ner till 145° blir "
         "djupet 105 cm, så drygt en meter från väggen räcker."),
        ("Låser ryggen i valfritt läge?",
         "Ryggen har en mikrolåsning och låser inte helt fast i varje vinkel – den "
         "ger efter något när du lutar dig bakåt. Det är så konstruktionen är gjord."),
        ("Hur mycket bär den?",
         "Fåtöljen bär 120 kg."),
        ("Hur styrs massagen?",
         "Från handkontrollen, som har tio vibrationslägen och får plats i sidofickan "
         "på fåtöljens sida."),
    ],
    "B": [
        ("Vad får plats i fotpallen?",
         "Lyft på locket så finns ett utrymme under sitsen. Filten, tidningarna och "
         "fjärrkontrollerna är det den brukar användas till. Pallen mäter 47 × 42 cm "
         "utvändigt och är 45 cm hög."),
        ("Går det att sitta på fotpallen?",
         "Ja, den bär 100 kg och fungerar som extra sittplats."),
        ("Hur många massagelägen finns det?",
         "Tio punkter i fem lägen – puls, tryck, våg, auto och normal – och två "
         "styrkor. Du kan också ställa in punkterna var för sig."),
        ("Låser ryggen i valfritt läge?",
         "Ryggen har en mikrolåsning och låser inte helt fast i varje vinkel – den "
         "ger efter något när du lutar dig bakåt. Det är så konstruktionen är gjord."),
        ("Vad är stommen gjord av?",
         "Trä, med stoppning av högdensitetsskum."),
    ],
    "C": [
        ("Hur mycket bär den?",
         "Fåtöljen bär 160 kg. Fotpallen är gjord som fotstöd och bär 20 kg, så lägg "
         "upp benen på den men sätt dig inte."),
        ("Hur hög är ryggen?",
         "Ryggstödet är 54 cm brett och 71 cm högt, och hela fåtöljen mäter 105 cm "
         "från golvet till ryggens överkant."),
        ("Snurrar sitsen?",
         "Ja, 360° på foten."),
        ("Låser ryggen i valfritt läge?",
         "Ryggen har en mikrolåsning och låser inte helt fast i varje vinkel – den "
         "ger efter något när du lutar dig bakåt. Det är så konstruktionen är gjord."),
        ("Var ligger fjärrkontrollen?",
         "I sidofickan på fåtöljens vänstra sida."),
    ],
    "D": [
        ("Hur lång blir den utfälld?",
         "156 cm när ryggen är fälld till 135° och ottomanen står framför. Höjden "
         "blir då 80 cm."),
        ("Var sitter vibrationspunkterna?",
         "Åtta punkter fördelade på ryggen, ländryggen, sitsen och ottomanen. Fem "
         "lägen och två styrkor väljs från handkontrollen."),
        ("Hur mycket bär ottomanen?",
         "60 kg. Fåtöljen själv bär 120 kg."),
        ("Vilket material är klädseln?",
         "Ett linnevävt tyg av 100 % polyester. Fötterna är kromat stål."),
        ("Hur lång är sladden?",
         "1,2 m."),
    ],
}


def _lista(rader):
    return "<ul>" + "".join(f"<li>{r}</li>" for r in rader) + "</ul>"


def _spec(m, pid):
    ut = []
    for etikett, varde in SPEC[m]:
        v = varde.replace("{kladselstor}", KLADSEL[pid].capitalize())
        ut.append(f"<p><strong>{etikett}:</strong> {v}</p>")
    return "".join(ut)


def _faq(m):
    ut = []
    for fraga, svar in FAQ[m]:
        ut.append(f"<p><strong>{fraga}</strong></p><p>{svar}</p>")
    return "".join(ut)


def _syskon(pid):
    rader = []
    for annan in PRODUKTER:
        if annan == pid:
            continue
        rader.append(
            f'<li><a href="{BAS}{SLUGG[annan]}">{KORTNAMN[annan]}</a> '
            f"– {SYSKONTEXT[annan]}</li>")
    return ("<h2>Fler massagefåtöljer hos oss</h2>"
            "<p>Vi säljer åtta massagefåtöljer i fyra modeller. Så här skiljer de sig:</p>"
            + "<ul>" + "".join(rader) + "</ul>")


def bygg(pid):
    m = MODELL[pid]
    delar = [
        f"<p>{INGRESS[m].format(kladsel=KLADSEL[pid])}</p>",
        "<p><strong>Egenskaper</strong></p>",
        _lista(EGENSKAPER[m]),
        f"<h2>{RUBRIK2[m]}</h2>",
        "".join(f"<p>{s}</p>" for s in STYCKEN2[m]),
        "<h2>Tekniska specifikationer</h2>",
        _spec(m, pid),
        "<h2>Användning och skötsel</h2>",
        "".join(f"<p>{s}</p>" for s in SKOTSEL[KLADSEL[pid]]),
        f"<p>{MONTERING}</p>",
        "<h2>Vanliga frågor</h2>",
        _faq(m),
        _syskon(pid),
    ]
    return "".join(delar)


if __name__ == "__main__":
    for pid in PRODUKTER:
        h = bygg(pid)
        print(f"{pid}  {MODELL[pid]}  {len(h):5d} tecken  namn {len(NAMN[pid]):2d}  "
              f"titel {len(SEO_TITEL[pid]):2d}  meta {len(SEO_BESKRIVNING[pid]):3d}")
