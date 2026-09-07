# -*- coding: utf-8 -*-
"""Runda 97 — sex foderstationer. All text, alla tal, en enda sanning.

☠️ STEG 2-GRINDEN GÄLLER VARJE MENING HÄR. Fem av sex utkast säljer den
   upphöjda skålen på HÄLSA — "schont Nacken und Rücken", "für eine bessere
   Verdauung". Den största studien (Glickman m.fl., JAVMA 2000, ~1 600 stora
   och jättestora hundar) pekar åt MOTSATT håll: upphöjd skål var förknippad
   med FÖRHÖJD risk för magomvridning, ~20 % av fallen hos stora raser och
   52 % hos jätteraser. En senare studie fann ingen effekt. Läget är alltså
   motstridigt, och ett motstridigt läge är aldrig ett säljargument.

   Inget om magomvridning, uppblåsthet, matsmältning, nacke, rygg, leder,
   hållning eller "skonsam". Inte heller mjukat: "många väljer en upphöjd
   skål för att den är skonsammare" är samma påstående med en tvättsvamp
   framför. Vi beskriver MEKANIKEN och låter kunden dra slutsatsen.

   Det som ÄR sant och räcker: skålarna står stadigt, maten hamnar inte på
   golvet, rostfritt går i diskmaskin, förvaringen tar ingen extra golvyta,
   och höjden går att välja efter hunden.

☠️ MATERIALET SKRIVS SOM DET ÄR, INTE SOM IMPORTEN SÄGER. Spec-radens
   `Material` säger "Edelstahl" på fyra möbler byggda i MDF. Ett MDF-skåp
   sålt som rostfritt stål är ett falskt materialpåstående. Stomme och
   skålar anges därför var för sig, alltid.

⚠️ TALEN KOMMER UR `Gesamtabmessungen`, ALDRIG UR `Paketmått`. Runda 97:s
   egen första mätning läste paketet och grupperade fel åt båda hållen —
   #266 en gång till.
"""

BAS = "https://www.fyndplats.se/produkt/"

PRODUKTER = ["e8102582", "1fc55b3d", "2e2b2366", "868cc038", "7628983b", "75556831"]

# S = ställ utan förvaring · T = ställ med skåp · M = möbel, skålar i låda
GRUPP = {"e8102582": "S", "1fc55b3d": "S", "2e2b2366": "T",
         "868cc038": "T", "7628983b": "T", "75556831": "M"}

SLUGG = {
    "e8102582": "upphojd-matskal-hund-hojdjusterbar-11-33-cm",
    "1fc55b3d": "matskalsstall-hund-fyra-hojder-lutbart",
    "2e2b2366": "matplats-hund-tre-hojder-kaffebrun",
    "868cc038": "matskap-hund-34-cm-tva-dorrar",
    "7628983b": "matskap-hund-42-cm-30-liter",
    "75556831": "husdjursskap-82-cm-matplats-i-lada",
}

SOKORD = {
    "e8102582": "upphöjd matskål hund",
    "1fc55b3d": "matskålsställ hund",
    "2e2b2366": "matplats för hund",
    "868cc038": "matskåp hund",
    "7628983b": "matskåp hund",
    "75556831": "husdjursskåp förvaring",
}

SKU = {
    "e8102582": "FP-upphojd-matskal-11-33",
    "1fc55b3d": "FP-matskalsstall-fyra-hojder",
    "2e2b2366": "FP-matplats-tre-hojder-kaffebrun",
    "868cc038": "FP-matskap-34-cm-tva-dorrar",
    "7628983b": "FP-matskap-42-cm",
    "75556831": "FP-husdjursskap-82-cm",
}

NAMN = {
    "e8102582": "Upphöjd matskål för hund – höjdjusterbar 11–33 cm, två skålar 900 ml",
    "1fc55b3d": "Matskålsställ för hund – fyra höjder och tre lutningar, skålar 1,2 L",
    "2e2b2366": "Matplats för hund i kaffebrunt – tre höjder, skålar 2 L, med förvaring",
    "868cc038": "Matskåp för hund 60 × 30 × 34 cm – två dörrar och skålar 2 L",
    "7628983b": "Matskåp för hund 60 × 30 × 42 cm – 30 liter förvaring, skålar 2 L",
    "75556831": "Husdjursskåp 82 cm – matplats i utfällbar låda, hyllfack och krokar",
}


def lank(pid, text):
    return '<a href="%s%s">%s</a>' % (BAS, SLUGG[pid], text)


# ------------------------------------------------------------------ ingress

INGRESS = {
    "e8102582": (
        "Ett litet ställ i svart stål som håller två rostfria skålar ovanför "
        "golvet. Höjden ställs steglöst mellan 11 och 33 cm, så samma ställ "
        "fungerar till en valp som växer och till en fullvuxen hund. Skålarna "
        "rymmer 900 ml var och lyfts ur för diskning."),
    "1fc55b3d": (
        "Ett matskålsställ med brun skiva på svart stålstativ, för två "
        "rostfria skålar på 1,2 liter. Skivan sitter i fyra höjder mellan 13 "
        "och 31,5 cm och kan dessutom vinklas i tre lägen. Gummikuddar under "
        "skålarna håller dem på plats."),
    "2e2b2366": (
        "En matplats i kaffebrun träfiberskiva med två rostfria skålar på "
        "cirka 2 liter. Skålplanet flyttas mellan tre höjder — 16,9, 29,7 "
        "och 42,5 cm — och under det finns ett öppet utrymme. Urtagna handtag "
        "i sidorna gör den lätt att flytta."),
    "868cc038": (
        "Ett lågt matskåp på 60 × 30 × 34 cm i kaffebrun träfiberskiva, med "
        "två rostfria skålar på 2 liter infällda i skivan. Bakom de två "
        "dörrarna finns ett utrymme på 55 × 25,5 × 21 cm för foder, "
        "koppel och godis."),
    "7628983b": (
        "Ett matskåp på 60 × 30 × 42 cm med vit stomme och grå skiva, där två "
        "rostfria skålar på 2 liter är infällda i ovansidan. Förvaringen är en "
        "låda på 30 liter som dras ut från kortsidan, så fodret står där "
        "maten serveras i stället för i ett annat rum."),
    "75556831": (
        "Ett vitt förvaringsskåp på 82 cm för allt som hör husdjuret till: "
        "foder, koppel, leksaker och skålar. Matplatsen sitter i en låda "
        "nedtill som fälls ut när det är dags att äta och skjuts in igen "
        "efteråt. Ovanpå finns en arbetsyta, och på sidan tre krokar."),
}

# --------------------------------------------------------------- egenskaper

EGENSKAPER = {
    "e8102582": [
        "Två rostfria skålar på 900 ml, Ø 17 cm och 6 cm djupa",
        "Skålhöjden ställs steglöst mellan 11 och 33 cm över golvet",
        "Stativ i stålrör och stålplåt, svart",
        "Skålarna lyfts ur och tål maskindisk",
        "Namnbricka i metall, 15 × 6 cm, att märka platsen med",
        "Väger 1,8 kg — lätt att flytta undan vid städning",
        "Passar hundar med mankhöjd 25–60 cm",
        "Monteras",
    ],
    "1fc55b3d": [
        "Två rostfria skålar på 1,2 liter, Ø 20 cm och 6 cm djupa",
        "Fyra höjder: 13, 19,5, 25,5 och 31,5 cm",
        "Tre lutningar: 0, 7,5 och 15 grader",
        "Skiva 43,5 × 25,5 cm på stativ av stål",
        "Gummikuddar under skålarna håller dem stilla",
        "Brun skiva, svart stativ",
        "Väger 2,8 kg",
        "Monteras",
    ],
    "2e2b2366": [
        "Två rostfria skålar på cirka 2 liter, Ø 24 cm och 7 cm djupa",
        "Tre höjder på skålplanet: 16,9, 29,7 och 42,5 cm",
        "Stomme i träfiberskiva, skålar i rostfritt stål",
        "Urtagna handtag i sidorna, 12,5 × 3 cm",
        "Skålarna lyfts ur för påfyllning och diskning",
        "Kaffebrun",
        "Väger 7 kg",
    ],
    "868cc038": [
        "Två rostfria skålar på 2 liter, Ø 24 cm och 7 cm djupa",
        "Skålarna är infällda i skivan och lyfts ur för diskning",
        "Två dörrar på gångjärn, dörröppning 25 × 24 cm",
        "Förvaring invändigt 55 × 25,5 × 21 cm",
        "Tål 15 kg på ovansidan och 15 kg inuti",
        "Stomme i träfiberskiva, skålar i rostfritt stål",
        "Kaffebrun",
        "Väger 9,8 kg",
        "Monteras",
    ],
    "7628983b": [
        "Två rostfria skålar på 2 liter, Ø 24 cm och 7 cm djupa",
        "30 liter förvaring i en utdragbar låda, 50 × 21,5 × 28 cm",
        "Tål 20 kg på ovansidan och 10 kg inuti",
        "Stomme i träfiberskiva och stål, skålar i rostfritt stål",
        "Vit stomme med grå skiva",
        "Passar hundar med mankhöjd 60–75 cm",
        "Väger 14,5 kg",
        "Monteras",
    ],
    "75556831": [
        "Två uttagbara skålar på 1 500 ml, Ø 17,8 cm och 7,8 cm djupa",
        "Skålarna sitter i en utfällbar låda nedtill",
        "Stängt skåp 55,8 × 32,5 × 15,2 cm",
        "Öppet hyllfack 48,3 × 23,5 × 24 cm",
        "Arbetsyta överst, tål 20 kg",
        "Tre krokar på sidan för koppel",
        "Stomme i träfiberskiva, vit",
        "Väger 22,1 kg",
        "Monteras",
    ],
}

# ------------------------------------------------------------------- specar

SPEC = {
    "e8102582": [
        ("Mått", "40,5 × 22 × 39 cm"),
        ("Skålhöjd över golv", "11–33 cm, steglöst"),
        ("Skålar", "2 st, 900 ml, Ø 17 × 6 cm"),
        ("Stomme", "stålrör och stålplåt"),
        ("Skålarnas material", "rostfritt stål"),
        ("Namnbricka", "15 × 6 cm"),
        ("Färg", "svart"),
        ("Mankhöjd", "25–60 cm"),
        ("Vikt", "1,8 kg"),
        ("Ingår", "ställ, två skålar och monteringsanvisning"),
    ],
    "1fc55b3d": [
        ("Mått", "48 × 26 × 36,5 cm"),
        ("Skiva", "43,5 × 25,5 cm"),
        ("Höjdlägen", "13, 19,5, 25,5 och 31,5 cm"),
        ("Lutningslägen", "0, 7,5 och 15 grader"),
        ("Skålar", "2 st, 1,2 liter, Ø 20 × 6 cm"),
        ("Stomme", "stål med laminerad skiva"),
        ("Skålarnas material", "rostfritt stål"),
        ("Färg", "brun skiva, svart stativ"),
        ("Vikt", "2,8 kg"),
        ("Ingår", "ställ, två skålar och bruksanvisning"),
    ],
    "2e2b2366": [
        ("Mått", "54 × 31,5 × 47 cm"),
        ("Skålplanets mått", "51 × 30 cm"),
        ("Höjdlägen", "16,9, 29,7 och 42,5 cm"),
        ("Skålar", "2 st, cirka 2 liter, Ø 24 × 7 cm"),
        ("Stomme", "träfiberskiva"),
        ("Skålarnas material", "rostfritt stål"),
        ("Handtag", "urtagna i sidorna, 12,5 × 3 cm"),
        ("Färg", "kaffebrun"),
        ("Vikt", "7 kg"),
        ("Ingår", "matplats och två skålar"),
    ],
    "868cc038": [
        ("Mått", "60 × 30 × 34 cm"),
        ("Förvaring invändigt", "55 × 25,5 × 21 cm"),
        ("Dörröppning", "25 × 24 cm"),
        ("Skålar", "2 st, 2 liter, Ø 24 × 7 cm"),
        ("Maxlast", "15 kg på ovansidan, 15 kg inuti"),
        ("Stomme", "träfiberskiva"),
        ("Skålarnas material", "rostfritt stål"),
        ("Färg", "kaffebrun"),
        ("Vikt", "9,8 kg"),
        ("Ingår", "skåp, två skålar och monteringsanvisning"),
    ],
    "7628983b": [
        ("Mått", "60 × 30 × 42 cm"),
        ("Förvaring invändigt", "50 × 21,5 × 28 cm, 30 liter"),
        ("Skålar", "2 st, 2 liter, Ø 24 × 7 cm"),
        ("Maxlast", "20 kg på ovansidan, 10 kg inuti"),
        ("Stomme", "träfiberskiva och stål"),
        ("Skålarnas material", "rostfritt stål"),
        ("Färg", "vit stomme, grå skiva"),
        ("Mankhöjd", "60–75 cm"),
        ("Vikt", "14,5 kg"),
        ("Ingår", "skåp, två skålar och monteringsanvisning"),
    ],
    "75556831": [
        ("Mått", "61 × 35,5 × 82 cm"),
        ("Stängt skåp", "55,8 × 32,5 × 15,2 cm"),
        ("Öppet hyllfack", "48,3 × 23,5 × 24 cm"),
        ("Skålar", "2 st, 1 500 ml, Ø 17,8 × 7,8 cm"),
        ("Maxlast", "20 kg arbetsytan, 10 kg hyllfacket, 10 kg skåpet"),
        ("Krokar", "3 st på sidan"),
        ("Stomme", "träfiberskiva"),
        ("Skålarnas material", "rostfritt stål"),
        ("Färg", "vit"),
        ("Vikt", "22,1 kg"),
        ("Ingår", "skåp, två skålar och monteringsanvisning"),
    ],
}


# ------------------------------------------------------ avsnitt två: syskon

RUBRIK2 = {
    "S": "Andra matplatser i sortimentet",
    "T": "Tre matskåp i olika höjd",
    "M": "Vill du hellre ha bara matplatsen?",
}

STALL = ["e8102582", "1fc55b3d"]
SKAP = ["2e2b2366", "868cc038", "7628983b"]


def rakna_upp(bitar):
    if len(bitar) == 1:
        return bitar[0]
    return ", ".join(bitar[:-1]) + " och " + bitar[-1]


def stycken2(pid):
    g = GRUPP[pid]
    if g == "S":
        annan = [p for p in STALL if p != pid][0]
        vad = ("ett ställ med fyra fasta höjder och tre lutningslägen"
               if annan == "1fc55b3d"
               else "ett mindre ställ med steglös höjd mellan 11 och 33 cm")
        return [
            "Det här är ett öppet ställ utan förvaring. Vill du ha %s finns "
            "%s." % (vad, lank(annan, "det andra stället")),
            "Behöver du förvaring för fodret på samma ställe som skålarna "
            "finns tre matskåp: " + rakna_upp(
                [lank(p, "%s cm" % h) for p, h in
                 (("868cc038", "34"), ("7628983b", "42"), ("2e2b2366", "47"))])
            + " höga.",
        ]
    if g == "T":
        andra = [p for p in SKAP if p != pid]
        hojd = {"2e2b2366": "47", "868cc038": "34", "7628983b": "42"}
        return [
            "Skåpen finns i tre höjder och skiljer sig också i annat än "
            "höjden. Det här är %s cm; de andra två är %s."
            % (hojd[pid], rakna_upp(
                [lank(p, "%s cm-modellen" % hojd[p]) for p in andra])),
            "Vill du ha bara skålarna på ett öppet ställ, utan skåp under, "
            "finns " + lank("e8102582", "ett höjdjusterbart ställ") + " och "
            + lank("1fc55b3d", "ett med fyra fasta höjder") + ".",
        ]
    return [
        "Det här är en möbel för förvaring där matplatsen är en av delarna. "
        "Behöver du bara skålarna finns " + lank("7628983b", "matskåpet på 42 cm")
        + ", som har 30 liter förvaring och samma yta att stå på.",
        "Vill du ha ett öppet ställ utan förvaring alls finns "
        + lank("e8102582", "ett höjdjusterbart ställ") + ".",
    ]


# ------------------------------------------------------------------ skötsel

SKOTSEL = {
    "e8102582": [
        "Mät hunden innan du väljer höjd. Ställ skålens överkant där hunden "
        "når den utan att sträcka sig, och prova dig fram — höjden ändras på "
        "några sekunder och sitter kvar när du dragit åt.",
        "Diska skålarna som andra husgeråd. Rostfritt stål tål maskindisk "
        "och tar inte åt sig lukt, till skillnad från plast som repas och "
        "håller kvar smaken av gammal mat i reporna.",
        "Torka av stativet med en fuktig trasa. Blöt inte ner det i onödan "
        "och låt det inte stå i väta — lackerat stål rostar där lacken "
        "skadats.",
    ],
    "1fc55b3d": [
        "Välj höjd först och lutning sedan. Skivan har fyra höjder och tre "
        "vinklar, och de ställs var för sig, så prova en höjd i taget innan "
        "du börjar med lutningen.",
        "Kontrollera att gummikuddarna sitter kvar under skålarna. Det är de "
        "som håller skålarna stilla på skivan, och de går att skjuta på plats "
        "igen om de hamnat snett.",
        "Diska skålarna i maskin och torka av skivan för hand. Den är "
        "laminerad och tål avtorkning, men inte att stå i vatten.",
    ],
    "2e2b2366": [
        "Flytta skålplanet med båda händerna. Handtagen i sidorna är urtagna "
        "i skivan och är gjorda för att lyfta hela möbeln, inte för att dra "
        "den över golvet.",
        "Lyft ur skålarna vid varje diskning. Rostfritt stål tål maskindisk; "
        "träfiberskivan gör det inte, så torka den med en väl urvriden trasa "
        "och låt inget vatten bli stående på ytan.",
        "Torka upp spill direkt. Träfiberskiva som får dra åt sig fukt "
        "sväller i kanterna, och det går inte att pressa tillbaka.",
    ],
    "868cc038": [
        "Lyft ur skålarna vid diskning. De sitter infällda i skivan och lyfts "
        "rakt upp; de tål maskindisk.",
        "Torka av skåpet med en väl urvriden trasa. Träfiberskiva tål "
        "avtorkning men inte blöta, och spill vid skålarna ska torkas upp "
        "innan det hinner ligga.",
        "Håll dig till maxlasten: 15 kg på ovansidan och 15 kg inuti. En "
        "fodersäck på 15 kg är alltså gränsen, inte en rekommendation.",
        "Dörrarna sitter på gångjärn och slås ut åt sidorna, så skåpet "
        "behöver fritt utrymme framför sig. Torka av gångjärnen när du "
        "dammar — foderdamm som får ligga gör dem tröga.",
    ],
    "7628983b": [
        "Lyft ur skålarna vid diskning. De är infällda i skivan och tål "
        "maskindisk.",
        "Dra ut lådan och fyll den med fodret, inte med det tyngsta du har. "
        "Invändigt tål "
        "det 10 kg, och ovansidan 20 kg — de två talen är olika av en "
        "anledning.",
        "Torka av med en väl urvriden trasa. Träfiberskiva tål avtorkning "
        "men inte att stå i väta.",
        "Håll fodret torrt. Ett stängt skåp håller undan damm, men en öppnad "
        "säck ska ändå vikas ihop eller hällas i en behållare.",
    ],
    "75556831": [
        "Fäll ut lådan när det är dags att äta och skjut in den efteråt. Det "
        "är hela poängen med den här möbeln: skålarna är framme när de "
        "behövs och undanstoppade resten av dygnet.",
        "Lyft ur skålarna för diskning. De är i rostfritt stål och tål "
        "maskindisk.",
        "Fördela vikten efter de tre talen: 20 kg på arbetsytan, 10 kg i "
        "hyllfacket och 10 kg i det stängda skåpet. Möbeln är hög och smal, "
        "så det tyngsta hör hemma längst ned.",
        "Torka av med en väl urvriden trasa och torka upp spill direkt. "
        "Träfiberskiva sväller av stående fukt.",
    ],
}

# ---------------------------------------------------------------------- FAQ

def faq(pid):
    g = GRUPP[pid]
    ut = [("Ingår skålarna?",
           "Ja. Två skålar i rostfritt stål följer med, och de lyfts ur för "
           "diskning.")]
    if pid == "e8102582":
        ut.append(("Hur ställer jag höjden?",
                   "Skålplanet glider steglöst mellan 11 och 33 cm över "
                   "golvet och låses i det läge du valt."))
    if pid == "1fc55b3d":
        ut.append(("Vad är lutningen till för?",
                   "Skivan kan sättas i 0, 7,5 eller 15 grader. Vinkeln "
                   "flyttar skålens öppning närmare hunden utan att hela "
                   "stället blir högre."))
    if pid == "2e2b2366":
        ut.append(("Går höjden att ändra i efterhand?",
                   "Ja. Skålplanet sitter i tre lägen — 16,9, 29,7 och "
                   "42,5 cm — och flyttas mellan dem."))
    if g == "T":
        ut.append(("Hur mycket får plats inuti?",
                   {"2e2b2366": "Utrymmet under skålplanet är öppet och "
                                "rymmer foderburkar och tillbehör.",
                    "868cc038": "Utrymmet är 55 × 25,5 × 21 cm och tål "
                                "15 kg.",
                    "7628983b": "30 liter, alltså 50 × 21,5 × 28 cm, i en "
                                "låda som dras ut från kortsidan. Den tål "
                                "10 kg."}[pid]))
    if pid == "75556831":
        ut.append(("Står skålarna upphöjt?",
                   "Nej. Skålarna sitter i en låda nedtill som fälls ut, och "
                   "de 82 centimetrarna är skåpets höjd — inte skålens."))
        ut.append(("Vad rymmer skåpet?",
                   "Ett stängt fack på 55,8 × 32,5 × 15,2 cm, ett öppet på "
                   "48,3 × 23,5 × 24 cm och en arbetsyta överst."))
    ut.append(("Vilket material är det?",
               {"e8102582": "Stativet är av stålrör och stålplåt, skålarna "
                            "av rostfritt stål.",
                "1fc55b3d": "Stativet är av stål med en laminerad skiva, "
                            "skålarna av rostfritt stål.",
                "2e2b2366": "Stommen är av träfiberskiva och skålarna av "
                            "rostfritt stål. Möbeln är alltså byggd i "
                            "skivmaterial, och det är skålarna som är av "
                            "metall.",
                "868cc038": "Stommen är av träfiberskiva och skålarna av "
                            "rostfritt stål.",
                "7628983b": "Stommen är av träfiberskiva och stål, skålarna "
                            "av rostfritt stål.",
                "75556831": "Stommen är av träfiberskiva och skålarna av "
                            "rostfritt stål."}[pid]))
    ut.append(("Tål skålarna maskindisk?",
               "Ja. De är i rostfritt stål och lyfts ur, så de kan diskas "
               "som vilket husgeråd som helst."))
    if pid != "2e2b2366":
        ut.append(("Kommer den monterad?",
                   "Nej, den monteras hemma. Monteringsanvisning följer med."))
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
    d += ["<p>%s</p>" % s for s in SKOTSEL[pid]]
    d.append("<h2>Vanliga frågor</h2>")
    for f, s in faq(pid):
        d.append("<p><strong>%s</strong></p><p>%s</p>" % (f, s))
    return "".join(d)


def namn(pid):
    return NAMN[pid]


SEO_TITEL = {
    "e8102582": "Upphöjd matskål hund – höjdjusterbar 11–33 cm, 900 ml",
    "1fc55b3d": "Matskålsställ hund – fyra höjder, lutbart, skålar 1,2 L",
    "2e2b2366": "Matplats för hund – tre höjder, kaffebrun, skålar 2 L",
    "868cc038": "Matskåp hund 34 cm – två dörrar och två skålar 2 L",
    "7628983b": "Matskåp hund 42 cm – 30 liter förvaring, skålar 2 L",
    "75556831": "Husdjursskåp 82 cm – matplats i låda, hylla och krokar",
}

SEO_BESKRIVNING = {
    "e8102582": ("Upphöjd matskål för hund med steglös höjd mellan 11 och "
                 "33 cm. Två rostfria skålar på 900 ml som lyfts ur och tål "
                 "maskindisk. Svart stålstativ, 1,8 kg, monteras."),
    "1fc55b3d": ("Matskålsställ för hund med fyra höjder mellan 13 och "
                 "31,5 cm och tre lutningslägen. Två rostfria skålar på "
                 "1,2 liter. Brun skiva på svart stativ, 2,8 kg."),
    "2e2b2366": ("Matplats för hund i kaffebrun träfiberskiva med tre "
                 "höjdlägen — 16,9, 29,7 och 42,5 cm. Två rostfria skålar på "
                 "cirka 2 liter och öppet utrymme under. 7 kg."),
    "868cc038": ("Matskåp för hund 60 × 30 × 34 cm med två dörrar på gångjärn "
                 "och "
                 "55 × 25,5 × 21 cm förvaring. Två rostfria skålar på 2 liter "
                 "infällda i skivan. Kaffebrun, 9,8 kg."),
    "7628983b": ("Matskåp för hund 60 × 30 × 42 cm med 30 liter förvaring "
                 "inuti och två rostfria skålar på 2 liter i ovansidan. Vit "
                 "stomme med grå skiva, 14,5 kg."),
    "75556831": ("Husdjursskåp på 82 cm med matplats i en utfällbar låda, "
                 "stängt skåp, öppet hyllfack, arbetsyta och tre krokar. Två "
                 "skålar på 1 500 ml. Vitt, 22,1 kg."),
}


def seo_titel(pid):
    return SEO_TITEL[pid]


def seo_beskrivning(pid):
    return SEO_BESKRIVNING[pid]


def beskrivning(pid):
    return bygg(pid)
