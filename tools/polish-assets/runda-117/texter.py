# -*- coding: utf-8 -*-
"""Runda 117 Steg 7 — namn, slug, SEO och brödtext för åtta köksvagnar.

☠️ TEXTEN SKRIVS TILL EN FIL, ALDRIG INLINE I API-ANROPET. Batch 64 mätte
   skillnaden: fem produkter skrivna inline gav NIO fel som nådde Wix, tre
   skrivna via fil + grep-grind gav NOLL. En sträng i ett JSON-anrop kan inte
   granskas innan den lämnar chatten, och svaret ekar tillbaka exakt det man
   skrev — det ser rätt ut för att det ÄR det man skrev.

Alla tal importeras från matt.py. Ingen siffra skrivs för hand här.
"""
import matt as M

BAS = "https://www.fyndplats.se/produkt/"

# ── Namn (H1, ≤ 80 tecken) ─────────────────────────────────────────────────
NAMN = {
    "63235957": "Köksvagn 106 cm med utfällbar skiva – vit, låda och skåp, 50 kg",
    "37fb1ce1": "Köksvagn 106 cm med utfällbar skiva – grå, låda och skåp, 50 kg",
    "4d044b44": "Köksvagn 106 cm med utfällbar skiva – svart, låda och skåp, 50 kg",
    "e16c1515": "Köksvagn 80 cm med utdragsfack och öppna hyllor – vit, 40 kg",
    "d4db4bbc": "Köksvagn 80 cm med utdragsfack och öppna hyllor – svart, 40 kg",
    "4ab392f7": "Köksvagn 109 cm med massiv gummiträskiva – vit, låda och skåp",
    "0af14e23": "Köksvagn 109 cm med massiv gummiträskiva – svart, låda och skåp",
    "41d31478": "Köksvagn 82 cm med kryddhylla i tre plan – vit, låda och skåp",
}

SLUG = {
    "63235957": "koksvagn-106-cm-utfallbar-skiva-vit",
    "37fb1ce1": "koksvagn-106-cm-utfallbar-skiva-gra",
    "4d044b44": "koksvagn-106-cm-utfallbar-skiva-svart",
    "e16c1515": "koksvagn-80-cm-utdragsfack-oppna-hyllor-vit",
    "d4db4bbc": "koksvagn-80-cm-utdragsfack-oppna-hyllor-svart",
    "4ab392f7": "koksvagn-109-cm-gummitraskiva-vit",
    "0af14e23": "koksvagn-109-cm-gummitraskiva-svart",
    "41d31478": "koksvagn-82-cm-kryddhylla-tre-plan-vit",
}

# ☠️ TITELN FÅR ALDRIG VARA IDENTISK MED NAMNET — då renderar butiken mallen
#    "{name} | Fyndplats" i stället, alltså namnet plus tolv tecken.
TITEL = {
    "63235957": "Köksvagn 106 cm med utfällbar skiva, vit | Fyndplats",
    "37fb1ce1": "Köksvagn 106 cm med utfällbar skiva, grå | Fyndplats",
    "4d044b44": "Köksvagn 106 cm med utfällbar skiva, svart | Fyndplats",
    "e16c1515": "Köksvagn 80 cm med utdragsfack, vit | Fyndplats",
    "d4db4bbc": "Köksvagn 80 cm med utdragsfack, svart | Fyndplats",
    "4ab392f7": "Köksvagn 109 cm i gummiträ, vit | Fyndplats",
    "0af14e23": "Köksvagn 109 cm i gummiträ, svart | Fyndplats",
    "41d31478": "Köksvagn 82 cm med kryddhylla, vit | Fyndplats",
}

META = {
    "63235957": "Köksvagn 106 × 42 × 87 cm i vitt med ekfärgad skiva som fälls "
                "ut till 68 cm djup. Låda, skåp, kryddhylla och 50 kg maxlast.",
    "37fb1ce1": "Köksvagn 106 × 42 × 87 cm i grått med ekfärgad skiva som fälls "
                "ut till 68 cm djup. Låda, skåp, kryddhylla och 50 kg maxlast.",
    "4d044b44": "Köksvagn 106 × 42 × 87 cm i svart med ekfärgad skiva som fälls "
                "ut till 68 cm djup. Låda, skåp, kryddhylla och 50 kg maxlast.",
    "e16c1515": "Köksvagn 80 × 40 × 82 cm i vitt med utdragsfack, två öppna "
                "hyllplan och skåp med justerbar hylla. Bär 40 kg totalt.",
    "d4db4bbc": "Köksvagn 80 × 40 × 82 cm i svart med utdragsfack, två öppna "
                "hyllplan och skåp med justerbar hylla. Bär 40 kg totalt.",
    "4ab392f7": "Köksvagn 109 × 40 × 89 cm i vitt med skiva i massivt gummiträ, "
                "låda, skåp, kryddhylla och handduksstång. Bär 40 kg.",
    "0af14e23": "Köksvagn 109 × 40 × 89 cm i svart med skiva i massivt gummiträ, "
                "låda, skåp, kryddhylla och handduksstång. Bär 40 kg.",
    "41d31478": "Köksvagn 82 × 38 × 86,5 cm i vitt med kryddhylla i tre plan, "
                "låda och skåp med justerbar hylla. Bär 35 kg totalt.",
}

SOKORD = {
    "A": ["köksvagn", "köksvagn med utfällbar skiva", "rullbar köksvagn"],
    "B": ["köksvagn", "köksvagn med hyllor", "köksvagn på hjul"],
    "C": ["köksvagn", "köksvagn i massivt trä", "köksvagn med skåp"],
    "D": ["köksvagn", "köksvagn med kryddhylla", "smal köksvagn"],
}

# Syskon inom modellgruppen. En sida länkar bara till sidor i samma grupp —
# det är de som verkligen är samma möbel i en annan färg.
SYSKON = {p: [q for q in M.GRUPP if M.GRUPP[q] == M.GRUPP[p] and q != p]
          for p in M.GRUPP}


# ── Byggstenar ─────────────────────────────────────────────────────────────
INGRESS = {
    "A": "Köksvagnen ger dig en extra arbetsyta där den behövs, och tar bort "
         "den när den inte gör det. Skivan mäter {skiva_fald} ihopfälld och "
         "fälls ut till {skiva_utfalld} på metallkonsoler under kanten. Under "
         "skivan sitter en låda på utdragsskenor och ett skåp med två dörrar, "
         "och på gaveln en kryddhylla och en handduksstång. Fyra hjul gör att "
         "vagnen följer med dit du lagar mat; två av dem har broms.",
    "B": "En köksvagn på {yttermatt} som samlar fyra sorters förvaring i en "
         "möbel: arbetsskivan högst upp, ett utdragsfack för skärbrädor och "
         "folie, två öppna hyllplan på sidan och ett stängt skåp längst ned. "
         "Skåpets hyllplan sitter i tre höjdlägen, så en hög gryta får plats "
         "lika bra som två låga formar. Dörrarna öppnas i urskurna grepp och "
         "har alltså inga handtag som fastnar i förklädet.",
    "C": "Skivan är massivt gummiträ, {skiva} stor, och tål att du skär och "
         "knådar direkt på den. "
         "Resten av köksvagnen är byggd runt den: en bred låda, ett skåp med "
         "två dörrar och höjdjusterbart hyllplan, en kryddhylla på ena gaveln "
         "och en handduksstång på den andra. Stålhandtagen och de fyra "
         "länkhjulen gör den lika hemma vid spisen som intill matbordet.",
    "D": "En smal köksvagn på {yttermatt} för kök där bänkytan tagit slut men "
         "golvytan inte har det. Arbetsskivan mäter {skiva}, och på sidan "
         "sitter en kryddhylla i tre plan där burkarna står synliga i stället "
         "för att gömmas längst in i ett skåp. Handduksstången är samtidigt "
         "det handtag du skjuter vagnen med. Under skivan finns en låda och "
         "ett skåp med hyllplan i tre höjdlägen.",
}

EGENSKAPER = {
    "A": [
        "Skivan fälls ut från {skiva_fald} till {skiva_utfalld} på metallkonsoler",
        "Låda på utdragsskenor, invändigt {lada_inuti}",
        "Skåp med två dörrar och ett hyllplan i tre höjdlägen, invändigt {skap_inuti}",
        "Kryddhylla {kryddhylla} och handduksstång på gaveln",
        "Dörrarna hålls stängda av magneter",
        "{hjul_punkt}",
        "Melaminbelagd yta som torkas av med en fuktig trasa",
        "Bär {maxlast}",
        "Levereras omonterad med anvisning",
    ],
    "B": [
        "Utdragsfack för skärbrädor, bakplåtspapper och folie",
        "Två öppna hyllplan på sidan, {hylla_hoger} och {hylla_vanster}",
        "Skåp med två dörrar och hyllplan i tre höjdlägen, invändigt {skap_inuti}",
        "Urskurna grepp i dörrarna i stället för utstickande handtag",
        "{hjul_punkt}",
        "Bär {maxlast}",
        "Levereras omonterad med anvisning",
    ],
    "C": [
        "Arbetsskiva i massivt gummiträ, {skiva}",
        "Bred låda, invändigt {lada_inuti}",
        "Skåp med två dörrar och höjdjusterbart hyllplan, invändigt {skap_inuti}",
        "Kryddhylla på ena gaveln och handduksstång på den andra",
        "Stålhandtag på båda dörrarna",
        "{hjul_punkt}",
        "{golvfritt} fri höjd under vagnen, så golvmoppen kommer under",
        "Bär {maxlast}",
        "Levereras omonterad med anvisning",
    ],
    "D": [
        "Kryddhylla i tre plan på sidan, {kryddhylla} per plan",
        "Handduksstång som samtidigt är skjuthandtag",
        "Låda invändigt {lada_inuti}",
        "Skåp med två dörrar och hyllplan i tre höjdlägen, invändigt {skap_inuti}",
        "Dörrarna hålls stängda av magneter",
        "{hjul_punkt}",
        "Melaminbelagd yta som torkas av med en fuktig trasa",
        "Bär {maxlast}",
        "Levereras omonterad med anvisning",
    ],
}

SPEC = {
    "A": [("Yttermått", "{yttermatt}"), ("Arbetsskiva", "{skiva_fald} ihopfälld, {skiva_utfalld} utfälld"),
          ("Låda invändigt", "{lada_inuti}"), ("Skåp invändigt", "{skap_inuti}"),
          ("Kryddhylla", "{kryddhylla}"), ("Maxlast", "{maxlast}"),
          ("Material", "{material}"), ("Färg", "{farg}"), ("Hjul", "{hjul}"),
          ("Vikt", "{vikt}"), ("Montering", "Krävs")],
    "B": [("Yttermått", "{yttermatt}"), ("Hyllplan", "{hylla_hoger} och {hylla_vanster}"),
          ("Skåp invändigt", "{skap_inuti}"), ("Maxlast", "{maxlast}"),
          ("Material", "{material}"), ("Färg", "{farg}"), ("Hjul", "{hjul}"),
          ("Vikt", "{vikt}"), ("Montering", "Krävs")],
    "C": [("Yttermått", "{yttermatt}"), ("Arbetsskiva", "{skiva}"),
          ("Låda invändigt", "{lada_inuti}"), ("Skåp invändigt", "{skap_inuti}"),
          ("Fri höjd under vagnen", "{golvfritt}"), ("Maxlast", "{maxlast}"),
          ("Material", "{material}"), ("Färg", "{farg}"), ("Hjul", "{hjul}"),
          ("Vikt", "{vikt}"), ("Montering", "Krävs")],
    "D": [("Yttermått", "{yttermatt}"), ("Arbetsskiva", "{skiva}"),
          ("Låda invändigt", "{lada_inuti}"), ("Skåp invändigt", "{skap_inuti}"),
          ("Kryddhylla", "{kryddhylla_spec}"), ("Maxlast", "{maxlast}"),
          ("Material", "{material}"), ("Färg", "{farg}"), ("Hjul", "{hjul}"),
          ("Vikt", "{vikt}"), ("Montering", "Krävs")],
}

SKOTSEL = {
    "A": "Lås bromsarna innan du lastar skivan eller fäller ut klaffen, och "
         "fäll ned den igen när vagnen ska genom en dörr. Melaminytan torkas "
         "av med en fuktig trasa och lite diskmedel; skurpulver och stålull "
         "repar den. Dra åt skruvarna en gång efter de första veckornas "
         "användning — en möbel som rullar arbetar mer än en som står stilla.",
    "B": "Lås bromsarna innan du lastar vagnen. Fördela vikten så att det "
         "tyngsta står i skåpet längst ned — där sitter tyngdpunkten lägst "
         "och vagnen står stadigast. Torka av ytorna med en "
         "fuktig trasa och lite diskmedel. Dra åt skruvarna en gång efter de "
         "första veckornas användning.",
    "C": "Träskivan mår bäst av att torkas av och torkas torr direkt — låt "
         "inte vatten bli stående på den, och ställ inte blöta kastruller att "
         "rinna av där. Lås bromsarna innan du skär eller knådar på skivan. "
         "Skåp och dörrar torkas av med en fuktig trasa och lite diskmedel. "
         "Dra åt skruvarna en gång efter de första veckornas användning.",
    "D": "Lås bromsarna innan du lastar skivan. Kryddhyllan sitter på utsidan, "
         "så torka av den lika ofta som bänken bredvid. Melaminytan tål "
         "fuktig trasa och diskmedel men inte skurpulver. Dra åt skruvarna en "
         "gång efter de första veckornas användning.",
}

FAQ = {
    "A": [("Hur mycket större blir arbetsytan när klaffen är uppe?",
           "Skivan går från {skiva_fald} till {skiva_utfalld}. Djupet ökar "
           "alltså med 29 cm, vilket räcker för en skärbräda och en skål "
           "bredvid varandra."),
          ("Går skåpets hyllplan att flytta?",
           "Ja, det sitter i tre höjdlägen. Skåpet är {skap_inuti} invändigt."),
          ("Står vagnen stilla när jag arbetar på den?",
           "Ja. {hjul_svar} Lås dem innan du lastar skivan."),
          ("Hur mycket tål vagnen?",
           "{maxlast}."),
          ("Vad ligger i kartongen?",
           "Köksvagnen i delar och en monteringsanvisning.")],
    "B": [("Vad är utdragsfacket till?",
           "Det är ett grunt fack som dras ut under skivan, gjort för "
           "skärbrädor, bakplåtspapper och folierullar — sådant som är för "
           "platt för att stå i ett skåp och för långt för en låda."),
          ("Går skåpets hyllplan att flytta?",
           "Ja, det sitter i tre höjdlägen. Skåpet är {skap_inuti} invändigt."),
          ("Hur mycket tål vagnen?",
           "{maxlast}."),
          ("Står vagnen stilla när jag arbetar på den?",
           "Ja. {hjul_svar} Lås dem innan du lastar skivan."),
          ("Vad ligger i kartongen?",
           "Köksvagnen i delar och en monteringsanvisning.")],
    "C": [("Går det att skära direkt på skivan?",
           "Ja, den är massivt gummiträ och {skiva} stor. Torka av den och "
           "torka den torr efteråt så håller ytan sig jämn."),
          ("Hur stort är skåpet invändigt?",
           "{skap_inuti}, och hyllplanet är höjdjusterbart."),
          ("Kommer man åt att göra rent under vagnen?",
           "Det är {golvfritt} fritt mellan golvet och underkanten, så en "
           "vanlig golvmopp går under."),
          ("Hur mycket tål vagnen?",
           "{maxlast}."),
          ("Vad ligger i kartongen?",
           "Köksvagnen i delar och en monteringsanvisning.")],
    "D": [("Hur många kryddburkar får plats i hyllan?",
           "Hyllan sitter på vagnens sida och har tre plan, vart och ett "
           "{kryddhylla}. Hur många burkar som får plats beror på deras storlek."),
          ("Vad är handduksstången till för?",
           "Två saker: att hänga handduken på, och att hålla i när du skjuter "
           "vagnen."),
          ("Går skåpets hyllplan att flytta?",
           "Ja, det sitter i tre höjdlägen. Skåpet är {skap_inuti} invändigt."),
          ("Hur mycket tål vagnen?",
           "{maxlast}."),
          ("Vad ligger i kartongen?",
           "Köksvagnen i delar och en monteringsanvisning.")],
}


def _falt(pid):
    g = M.GRUPP[pid]
    d = dict(M.MATT[g])
    d["farg"] = M.FARG[pid]
    return d


def _syskonrad(pid):
    ids = SYSKON[pid]
    if not ids:
        return ""
    lankar = [f'<a href="{BAS}{SLUG[q]}">{M.FARG_KORT[q]}</a>' for q in ids]
    if len(lankar) == 1:
        text = lankar[0]
    else:
        text = ", ".join(lankar[:-1]) + " och " + lankar[-1]
    return (f"<p>Samma köksvagn finns också i {text}.</p>")


def bygg(pid):
    g = M.GRUPP[pid]
    d = _falt(pid)
    ut = [f"<p>{INGRESS[g].format(**d)}</p>",
          "<p><strong>Egenskaper</strong></p><ul>"]
    ut += [f"<li>{rad.format(**d)}</li>" for rad in EGENSKAPER[g]]
    ut.append("</ul>")
    syskon = _syskonrad(pid)
    if syskon:
        ut.append(syskon)
    ut.append("<h2>Tekniska specifikationer</h2><ul>")
    ut += [f"<li><strong>{etikett}:</strong> {varde.format(**d)}</li>"
           for etikett, varde in SPEC[g]]
    ut.append("</ul>")
    ut.append("<h2>Användning och skötsel</h2>")
    ut.append(f"<p>{SKOTSEL[g].format(**d)}</p>")
    ut.append("<h2>Vanliga frågor</h2>")
    for fraga, svar in FAQ[g]:
        ut.append(f"<p><strong>{fraga}</strong></p><p>{svar.format(**d)}</p>")
    return "".join(ut)
