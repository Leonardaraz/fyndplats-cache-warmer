# -*- coding: utf-8 -*-
"""Runda 105 — åtta sköldpaddshus i fyra modeller.

☠️ TEXTEN SKRIVS I FIL FÖRST. Runda 64 mätte 9 fel mot 0: en sträng som går
   rakt in i ett API-anrop kan inte grepas innan den lämnar chatten, och
   PATCH-svaret ekar tillbaka exakt det man skrev.

Alla tal kommer ur leverantörens egna mått (lästa i Wix 2026-09-08) eller ur
SJVFS 2019:15 bilaga 1:7 tabell 1. Inget tal är härlett ur en bild.
"""

BAS = "https://www.fyndplats.se/produkt/"

L = lambda slug, text: f'<a href="{BAS}{slug}">{text}</a>'
P = lambda t: f"<p>{t}</p>"
H = lambda t: f"<h2>{t}</h2>"
LI = lambda t: f"<li>{t}</li>"
UL = lambda rader: "<ul>" + "".join(LI(f"<strong>{a}:</strong> {b}") for a, b in rader) + "</ul>"
F = lambda q, s: f"<p><strong>{q}</strong></p><p>{s}</p>"


def l80(yta, hojd, krav_yta, krav_hojd, skal, nasta_yta, nasta_skal):
    """Det positiva villkoret: vilken skallängd ytan räcker till.

    Formen är Steg 7:s — egen rubrik, positivt formulerat, med normen utskriven.
    Samma hållning som hundburarnas L102-stycke: en hård gräns som är en del av
    köpet, inte ett varningsblock.
    """
    return (
        H("Så stor sköldpadda räcker ytan till")
        + P(
            f"Golvytan är {yta} m² och den fria höjden {hojd} cm. Jordbruksverkets "
            f"föreskrifter för sällskapsdjur (SJVFS 2019:15, L80) kräver {krav_yta} m² "
            f"golvyta och {krav_hojd} cm höjd för en landsköldpadda med skallängd upp "
            f"till {skal} cm. Huset räcker alltså till en landsköldpadda på upp till "
            f"{skal} cm, mätt rakt från främre till bakre skalkant."
        )
        + P(
            f"En sköldpadda över {skal} cm ska enligt samma tabell ha {nasta_yta} m² — "
            f"då är det ett {nasta_skal}."
        )
    )


SKOTSEL_L80 = (
    P(
        "Landsköldpaddor ska enligt L80 ha ett löst, grävbart bottenmaterial i ett "
        "lager som är minst lika tjockt som skalets höjd — torv, täckbark, jord eller "
        "sand. De ska också ha vatten att vada i och något att söka skydd under."
    )
)


# ---------------------------------------------------------------- modell A ---
# 91 × 60,5 × 32 cm, BOTTENLÖS, skyddsdel 29 × 56 cm + öppen del 57 × 56 cm,
# 28 cm fri höjd, valv 21 × 20 cm, trälucka + nätlucka, 8,9 kg.
A_FARGER = {
    "a0bb5be8": ("gråbrunt", "gråbrun", "skoldpaddshus-91-grabrun", "gråbrun"),
    "4b089c02": ("blått", "blå", "skoldpaddshus-91-bla", "blå"),
    "27aa4c23": ("grått", "grå", "skoldpaddshus-91-gra", "grå"),
    "d4787641": ("i obehandlad furu", "obehandlad furu", "skoldpaddshus-91-natur", "furu"),
}

# ☠️ En korslänk får bara peka på en sida som FAKTISKT publiceras. De två
#    slutsålda utkasten poleras men publiceras inte — länkar dit vore döda
#    interna länkar, alltså sämre än ingen länk alls (runbookens redirect-regel).
PUBLICERAS = {"a0bb5be8", "4b089c02", "27aa4c23", "f55d9635", "1f6de209", "609bec0f"}


def modell_a(nyckel):
    adj, farg, slug, kortfarg = A_FARGER[nyckel]
    syskon = [(a, s) for k, (a, f, s, kf) in A_FARGER.items()
              if k != nyckel and k in PUBLICERAS]
    if len(syskon) > 1:
        lankar = (", ".join(L(s, a) for a, s in syskon[:-1])
                  + " och " + L(syskon[-1][1], syskon[-1][0]))
    else:
        lankar = L(syskon[0][1], syskon[0][0])
    kors = P(f"Samma modell finns också i {lankar}.") if syskon else ""
    return dict(
        namn=(f"Sköldpaddshus 91 cm utan botten, nätlock och sidoluckor {adj}"
              if nyckel == "d4787641" else
              f"Sköldpaddshus 91 cm utan botten med nätlock och sidoluckor, {adj}"),
        slug=slug,
        titel=f"Sköldpaddshus 91 cm utan botten, {kortfarg} | Fyndplats",
        meta=("Sköldpaddshus 91 × 60,5 cm utan botten — ställs på gräsmattan så "
              f"sköldpaddan går på riktig mark. 0,48 m², nätlock och skyddsdel. {farg.capitalize()}."),
        sokord=[("sköldpaddshus", True), ("sköldpaddsgård utomhus", False),
                ("hage landsköldpadda", False), ("reptilbur trä", False)],
        html=(
            P(f"Ett sköldpaddshus på 91 × 60,5 cm <strong>utan botten</strong> — det ställs "
              f"direkt på gräsmattan eller rabatten, så sköldpaddan går på riktig jord och "
              f"kan beta och gräva där den står. Den ena halvan är en skuggad skyddsdel med "
              f"trälucka, den andra en öppen del med nätlock och genomskinliga sidor. "
              f"Utförandet är {adj}.")
            + kors

            + H("Marken är golvet — därför fungerar den utomhus")
            + P("Botten saknas med flit. Sköldpaddan står på gräs, jord eller grus i stället "
                "för på en plastbricka, och det löser två saker på en gång: underlaget är "
                "grävbart av sig självt, och betet växer där djuret går. Ramen vilar på "
                "marken och går att flytta till en ny fläck när gräset behöver återhämta sig.")

            + H("Skyddsdel och solyta, med valv emellan")
            + P("Skyddsdelen är 29 × 56 cm och har en tät trälucka som håller regn och sol "
                "ute. Den öppna delen är 57 × 56 cm med nätlock, så ljuset kommer in och "
                "sköldpaddan kan värma sig. Mellan dem sitter ett valv på 21 × 20 cm som "
                "djuret går fritt igenom — det behöver aldrig lyftas mellan skugga och sol.")

            + H("Två lock som öppnas var för sig")
            + P("Både trälocket och nätlocket sitter på gångjärn och fälls upp var för sig. "
                "Du kommer åt att fylla på vatten, byta foderskål eller lyfta ut djuret utan "
                "att öppna hela huset. Sidopanelerna går att dra ut, så huset kan kopplas "
                "ihop med en större hage när sköldpaddan ska ha mer plats.")

            + l80("0,48", 28, "0,3", 25, 15, "0,5", "steg upp i storlek")

            + H("Tekniska specifikationer")
            + UL([
                ("Yttermått", "91 × 60,5 × 32 cm"),
                ("Inre golvyta", "0,48 m² (skyddsdel 29 × 56 cm, öppen del 57 × 56 cm)"),
                ("Fri höjd invändigt", "28 cm"),
                ("Botten", "ingen — huset ställs direkt på underlaget"),
                ("Valvöppning mellan delarna", "21 × 20 cm"),
                ("Lock", "trälucka över skyddsdelen, nätlock över den öppna delen"),
                ("Sidor", "genomskinliga paneler på den öppna delen, utdragbara"),
                ("Material", "massivt barrträ, ståltrådsnät"),
                ("Färg", farg),
                ("Vikt", "8,9 kg"),
                ("Paketmått", "99 × 65,5 × 8,5 cm"),
                ("Montering", "krävs, verktyg och anvisning medföljer"),
            ])

            + H("Användning och skötsel")
            + P("Ställ huset på en plan gräsyta där solen når nätlocket några timmar om "
                "dagen och skyddsdelen ligger i skugga. Flytta det till en ny fläck varannan "
                "vecka under betessäsongen — gräset under hinner då återhämta sig, och du "
                "slipper trampad jord.")
            + SKOTSEL_L80
            + P("Torka av trät med en fuktig trasa och låt det torka i luft; högtryckstvätt "
                "sliter på ytbehandlingen. Fäll upp båda locken efter regn så att träet "
                "torkar. Bär huset i ramen, inte i locken.")
            + P("Sköldpaddor är rymningsbenägna och gräver gärna längs kanten. Kontrollera "
                "att ramen ligger an mot marken hela vägen runt, och lägg vid behov en rand "
                "av stenplattor eller nedgrävt nät utmed insidan.")
            + P("Ta in huset eller ställ det under tak vintertid. Trä som står ute i väta "
                "hela året spricker, oavsett ytbehandling.")

            + H("Vanliga frågor")
            + F("Har huset någon botten?",
                "Nej, och det är avsikten. Det ställs direkt på gräs, jord eller grus. "
                "Vill du använda det inomhus lägger du ett underlägg eller en balja under.")
            + F("Hur stor sköldpadda passar?",
                "Golvytan 0,48 m² och den fria höjden 28 cm motsvarar L80:s krav för en "
                "landsköldpadda med skallängd upp till 15 cm.")
            + F("Kommer sköldpaddan själv mellan de två delarna?",
                "Ja. Valvet mellan skyddsdelen och den öppna delen är 21 cm brett och "
                "20 cm högt och står alltid öppet.")
            + F("Hur hålls locken stängda?",
                "Med hasp, och båda locken sitter på gångjärn. Det håller nätlocket nere "
                "när sköldpaddan kliver på det, och håller fåglar och katter ute.")
            + F("Kan huset byggas ihop med en hage?",
                "Ja. Sidopanelerna går att dra ut, och då öppnas huset mot en angränsande "
                "hage eller ett större inhägnat område.")
            + F("Vad väger det?",
                "8,9 kg. Det bärs av en person och går att flytta runt i trädgården.")
            + F("Vad ingår?",
                "Sköldpaddshuset i delar, monteringsbeslag och en monteringsanvisning. "
                "Värmelampa, bottenmaterial och vattenskål ingår inte.")
            + F("Kan det stå ute hela året?",
                "Nej. Ställ det under tak eller ta in det vintertid — trä som står i väta "
                "året runt spricker.")
        ),
    )


# ---------------------------------------------------------------- modell C ---
# 104 × 53 × 82 cm på ben, bo 41 × 53 + aktivitetsdel 59 × 53, invändigt
# 36 × 49 × 33 resp. 58 × 49 × 33, uttagbar mellanvägg, utdragbar botten
# 100 × 53 cm, dörr 18 × 18, lamphållare 20 × 3 × 20 och matskål ingår, 12,5 kg.
C_FARGER = {
    "f55d9635": ("orange", "orange", "skoldpaddshus-104-orange"),
    "1f9fe2c2": ("grått", "grå", "skoldpaddshus-104-gra"),
}


def modell_c(nyckel):
    adj, farg, slug = C_FARGER[nyckel]
    syskon = [(a, s) for k, (a, f, s) in C_FARGER.items() if k != nyckel and k in PUBLICERAS]
    kors = P(f"Samma modell finns också i {L(syskon[0][1], syskon[0][0])}.") if syskon else ""
    return dict(
        namn=f"Sköldpaddshus på ben 104 cm med utdragbar botten, {adj}",
        slug=slug,
        titel=f"Sköldpaddshus på ben 104 cm, {farg} | Fyndplats",
        meta=("Sköldpaddshus i barrträ på ben, 104 × 53 cm och 82 cm högt. Utdragbar "
              f"botten, uttagbar mellanvägg och lamphållare. 0,46 m² golvyta. {farg.capitalize()}."),
        sokord=[("sköldpaddshus", True), ("sköldpaddshus på ben", False),
                ("terrarium landsköldpadda", False), ("reptilbur trä", False)],
        html=(
            P(f"Ett sköldpaddshus i barrträ på egna ben — 104 × 53 cm stort och 82 cm högt, "
              f"så du sköter djuret i midjehöjd i stället för på golvet. Bakom den "
              f"genomskinliga fronten ligger en 0,46 m² stor yta som du kan dela i ett bo "
              f"och en aktivitetsdel, eller öppna till ett enda rum. Utförandet är {adj}.")
            + kors

            + H("Botten dras ut — hela ytan på en gång")
            + P("Bottenbrickan mäter 100 × 53 cm och dras ut helt ur stommen. Du behöver "
                "alltså varken lyfta djuret eller skrapa i en trång låda: brickan går ut, "
                "töms, sköljs och skjuts tillbaka. Det är den enskilt största skillnaden "
                "mot ett glasterrarium av samma storlek.")

            + H("En vägg du kan ta bort")
            + P("Mellanväggen delar huset i ett bo på 36 × 49 cm och en aktivitetsdel på "
                "58 × 49 cm, båda med 33 cm fri höjd och en 18 × 18 cm stor öppning emellan. "
                "Lyfter du ut väggen blir det en sammanhängande yta på 94 × 49 cm. En ung "
                "sköldpadda får trygghet av det delade läget; en större vill ha hela längden "
                "att gå på.")

            + H("Öppet ovanifrån, inte igenom glas")
            + P("Båda halvorna har egna uppfällbara lock, och det övre säkras med en hasp så "
                "att djuret inte trycker upp det. Fronten är genomskinlig så att du ser in, "
                "men skötseln sker uppifrån — sköldpaddor går rakt in i en glasruta de tror "
                "att de kan passera, och ett öppet lock ventilerar dessutom bättre än ett "
                "helt slutet glaskar.")

            + H("Lamphållare och matskål ingår")
            + P("Trähållaren på 20 × 3 × 20 cm skruvas fast i kanten och håller en värme- "
                "eller UV-lampa över solplatsen. En matskål följer också med. Själva lampan "
                "väljer du efter art och rumstemperatur och köps separat.")

            + l80("0,46", 33, "0,3", 25, 15, "0,5", "steg upp i storlek")

            + H("Tekniska specifikationer")
            + UL([
                ("Yttermått", "104 × 53 × 82 cm"),
                ("Inre golvyta", "0,46 m² (bo 36 × 49 cm, aktivitetsdel 58 × 49 cm)"),
                ("Fri höjd invändigt", "33 cm"),
                ("Utan mellanvägg", "en sammanhängande yta 94 × 49 cm"),
                ("Öppning mellan delarna", "18 × 18 cm"),
                ("Utdragbar botten", "100 × 53 cm"),
                ("Lock", "två uppfällbara, det övre med hasp"),
                ("Lamphållare", "20 × 3 × 20 cm, ingår"),
                ("Övrigt som ingår", "matskål"),
                ("Material", "massivt barrträ, genomskinlig PS-plast"),
                ("Färg", farg),
                ("Vikt", "12,5 kg"),
                ("Paketmått", "108 × 58 × 16,5 cm"),
                ("Montering", "krävs, verktyg och anvisning medföljer"),
            ])

            + H("Användning och skötsel")
            + P("Ställ huset där det inte står i drag och där du kommer åt båda locken "
                "ovanifrån. Benen gör det stabilt på ett plant golv; på en mjuk matta bör du "
                "lägga en skiva under så att det inte vaggar.")
            + SKOTSEL_L80
            + P("Dra ut bottenbrickan en gång i veckan, töm den och torka av med milt "
                "diskmedel. Låt den torka innan nytt bottenmaterial läggs i — fukt som "
                "stängs in under strö blir mögel.")
            + P("Torka av trät med en fuktig trasa. Låt inte vatten stå kvar i skarvarna, "
                "och montera lamphållaren så att lampan inte hänger an mot trä eller plast.")
            + P("Dra åt skruvarna efter någon månads användning. Trä sätter sig, och ett "
                "hus på ben blir vingligt av glappa förband långt innan något går sönder.")

            + H("Vanliga frågor")
            + F("Hur stor sköldpadda passar?",
                "Golvytan 0,46 m² och den fria höjden 33 cm motsvarar L80:s krav för en "
                "landsköldpadda med skallängd upp till 15 cm.")
            + F("Går mellanväggen att ta bort?",
                "Ja. Utan den blir ytan en sammanhängande rektangel på 94 × 49 cm.")
            + F("Hur högt står det?",
                "82 cm till överkant. Du sköter djuret stående, utan att böja dig ner.")
            + F("Ingår lampa?",
                "Nej. Trähållaren till lampan ingår, liksom en matskål, men själva "
                "värme- eller UV-lampan väljer du efter art och köper separat.")
            + F("Kan det stå utomhus?",
                "Under tak på en altan går bra sommartid. Det är inte byggt för att stå "
                "fritt i regn året runt.")
            + F("Hur rengörs det?",
                "Bottenbrickan på 100 × 53 cm dras ut helt, töms och sköljs. Stommen "
                "torkas av med en fuktig trasa.")
            + F("Vad väger det?",
                "12,5 kg monterat. Två personen bär det enkelt, en person klarar det på "
                "plant golv.")
            + F("Behövs montering?",
                "Ja. Huset levereras i delar med beslag och anvisning.")
        ),
    )


# ---------------------------------------------------------------- modell F ---
# 120 × 50 × 40 cm, ÖPPEN OVANSIDA, invändigt 116 × 46 cm, väggar 31 cm,
# hydda 41,5 × 41,5 cm, dörr 20 × 15 cm, fönster 70 × 31 cm, bricka 120 × 50,
# lamphållare, 13 kg.
def modell_f():
    return dict(
        namn="Sköldpaddshus 120 cm med öppen ovansida och lamphållare",
        slug="skoldpaddshus-120-oppet",
        titel="Sköldpaddshus 120 cm med öppen ovansida | Fyndplats",
        meta=("Öppet sköldpaddshus 120 × 50 cm i barrträ — 0,53 m² golvyta, 31 cm höga "
              "väggar, genomskinlig front och lamphållare. Ingen glaskupa över djuret."),
        sokord=[("sköldpaddshus", True), ("öppet sköldpaddshus", False),
                ("terrarium landsköldpadda", False), ("reptilbur trä", False)],
        html=(
            P("Ett öppet sköldpaddshus på 120 × 50 cm med 31 cm höga väggar och ingenting "
              "över djuret. Invändigt är ytan 116 × 46 cm, alltså 0,53 m², och i ena änden "
              "ligger en avskild hydda på 41,5 × 41,5 cm bakom en öppning på 20 × 15 cm. "
              "Fronten är genomskinlig, resten är massivt barrträ.")

            + H("Öppen ovansida ger luftväxling och en värmezon du styr")
            + P("Utan lock byts luften av sig själv, och värmen från en lampa ovanför sjunker "
                "ner i lådan i stället för att samlas under ett tak. Du får en varm ände och "
                "en sval, alltså ett spann sköldpaddan själv kan gå emellan. Väggarna är "
                "31 cm höga invändigt — en landsköldpadda klättrar inte över dem.")

            + H("En hydda att dra sig undan i")
            + P("Änden bakom skiljeväggen är 41,5 × 41,5 cm och har sidor i trä hela vägen "
                "runt, så där blir det mörkt och svalt. Öppningen på 20 × 15 cm står alltid "
                "fri. Resten av lådan har ett 70 × 31 cm stort genomskinligt fönster, så du "
                "ser vad som händer utan att stå och luta dig över djuret.")

            + H("Lamphållaren sitter på huset, inte på hyllan ovanför")
            + P("Hållaren skruvas fast i skiljeväggen och håller lampan över den öppna delen. "
                "Det ger en varm plats i ena änden och en sval i den andra — ett "
                "temperaturspann sköldpaddan själv kan välja mellan. Lampan köps separat och "
                "väljs efter art och rumstemperatur.")

            + l80("0,53", 31, "0,5", 30, 20, "1,1", "eget rum eller en utomhushage")

            + H("Tekniska specifikationer")
            + UL([
                ("Yttermått", "120 × 50 × 40 cm"),
                ("Inre golvyta", "116 × 46 cm, 0,53 m²"),
                ("Väggarnas höjd invändigt", "31 cm"),
                ("Ovansida", "öppen — inget lock och inget nät"),
                ("Avskild hydda", "41,5 × 41,5 cm"),
                ("Öppning till hyddan", "20 × 15 cm"),
                ("Fönster", "70 × 31 cm, genomskinligt"),
                ("Botten", "bricka 120 × 50 cm"),
                ("Lamphållare", "ingår"),
                ("Material", "massivt barrträ, genomskinlig plast"),
                ("Färg", "grå med vit ram"),
                ("Vikt", "13 kg"),
                ("Paketmått", "129 × 57 × 15,5 cm"),
                ("Montering", "krävs, verktyg och anvisning medföljer"),
            ])

            + H("Användning och skötsel")
            + P("Ställ huset på ett stadigt bord eller en bänk i rumshöjd, med hyddan bort "
                "från fönstret och den öppna delen mot ljuset. Eftersom ovansidan är öppen "
                "får lampan gärna hänga fritt över — men aldrig så nära att djuret kan nå "
                "den från en sten eller en hög med strö.")
            + SKOTSEL_L80
            + P("Ett par centimeter bottenmaterial i hela lådan gör den lättare att sköta än "
                "en bar botten: strö suger upp spill och går att byta i sektioner. Punktstäda "
                "dagligen och byt allt var tredje till fjärde vecka.")
            + P("Torka av trät med en fuktig trasa och håll skarvarna torra. Fönstret tvättas "
                "med mjuk trasa och milt diskmedel — repad plast blir grumlig och går inte "
                "att polera tillbaka.")

            + H("Vanliga frågor")
            + F("Hur stor sköldpadda passar?",
                "Golvytan 0,53 m² och väggarnas höjd 31 cm motsvarar L80:s krav för en "
                "landsköldpadda med skallängd upp till 20 cm.")
            + F("Finns det något lock?",
                "Nej, ovansidan är öppen. Väggarna är 31 cm höga invändigt, vilket en "
                "landsköldpadda inte klättrar över.")
            + F("Var sitter lampan?",
                "Hållaren skruvas fast i skiljeväggen och håller lampan över den öppna "
                "delen. Lampan ingår inte.")
            + F("Hur stor är hyddan?",
                "41,5 × 41,5 cm, med en öppning på 20 × 15 cm som alltid står fri.")
            + F("Måste huset stå på ett bord?",
                "Det står stadigt på vilken plan yta som helst. Ett bord gör bara skötseln "
                "bekvämare — huset har inga egna ben.")
            + F("Kan det stå utomhus?",
                "Sommartid under tak går bra. Ovansidan är öppen, så regn faller rakt ner "
                "i lådan om det står fritt.")
            + F("Vad väger det?",
                "13 kg monterat.")
            + F("Vad ingår?",
                "Huset i delar, lamphållare, beslag och monteringsanvisning. Lampa, "
                "bottenmaterial och skålar ingår inte.")
        ),
    )


# ---------------------------------------------------------------- modell G ---
# 81 × 48 × 31,5 cm, huvuddel 30 × 44 × 28 + löpdel 44,5 × 44 × 28, innerdörr
# 16 × 22,5, två plastbrickor 46,5 × 43,5 och 32 × 43,5, två lock med lås,
# akrylfönster, ståltrådsnät, lamphållare 25 × 4,5 × 26, 9,5 kg.
def modell_g():
    return dict(
        namn="Sköldpaddshus 81 cm med två rum, nätlock och akrylfönster",
        slug="skoldpaddshus-81-cm",
        titel="Sköldpaddshus 81 cm med två rum | Fyndplats",
        meta=("Sköldpaddshus 81 × 48 cm i lackat barrträ. Två rum med 0,33 m² golvyta, "
              "två plastbrickor, nätlock med lås, akrylfönster och lamphållare."),
        sokord=[("sköldpaddshus", True), ("litet sköldpaddshus", False),
                ("reptilbur trä", False), ("terrarium landsköldpadda", False)],
        html=(
            P("Ett sköldpaddshus på 81 × 48 cm för den som har begränsat med plats. Två rum "
              "med sammanlagt 0,33 m² golvyta och 28 cm fri höjd: ett slutet rum att sova i "
              "och ett med nätlock där solen kommer in. Trät är vattenfast lackat och båda "
              "locken har lås.")

            + H("Två rum, två klimat")
            + P("Huvuddelen är 30 × 44 cm och har tak — där är det mörkt och stilla. "
                "Löpdelen är 44,5 × 44 cm med ståltrådsnät över, så ljus och luft når ner. "
                "Mellan rummen sitter en öppning på 16 × 22,5 cm. Sköldpaddan väljer själv "
                "var den vill vara, vilket är precis det ett reptilutrymme ska erbjuda.")

            + H("Två brickor i stället för en")
            + P("Botten består av två separata plastbrickor, 46,5 × 43,5 cm och "
                "32 × 43,5 cm. Du kan alltså byta strö i det ena rummet utan att röra det "
                "andra, och en full bricka väger inte mer än att den lyfts med en hand.")

            + H("Lås på båda locken")
            + P("Både trälocket och nätlocket fälls upp och hålls stängda av lås. Det är "
                "avgörande om huset står i ett hem med hund eller katt, eller om det ibland "
                "flyttas ut på altanen — en sköldpadda som kliver på nätet ska inte kunna "
                "trycka upp det underifrån.")

            + H("Akrylfönster och lamphållare")
            + P("Fronten har ett akrylfönster så att du kan se in utan att öppna, och en "
                "trähållare på 25 × 4,5 × 26 cm skruvas fast i kanten för en värme- eller "
                "UV-lampa över löpdelen. Lampan ingår inte.")

            + l80("0,33", 28, "0,3", 25, 15, "0,5", "steg upp i storlek")

            + H("Tekniska specifikationer")
            + UL([
                ("Yttermått", "81 × 48 × 31,5 cm"),
                ("Inre golvyta", "0,33 m² (huvuddel 30 × 44 cm, löpdel 44,5 × 44 cm)"),
                ("Fri höjd invändigt", "28 cm"),
                ("Öppning mellan rummen", "16 × 22,5 cm"),
                ("Bottenbrickor", "två i plast, 46,5 × 43,5 cm och 32 × 43,5 cm"),
                ("Lock", "två uppfällbara med lås — trä över huvuddelen, nät över löpdelen"),
                ("Fönster", "akryl, i fronten"),
                ("Lamphållare", "25 × 4,5 × 26 cm, ingår"),
                ("Material", "massivt barrträ med vattenfast lack, stål, akryl"),
                ("Färg", "grå med vitt"),
                ("Vikt", "9,5 kg"),
                ("Paketmått", "89 × 55 × 19 cm"),
                ("Montering", "krävs, verktyg och anvisning medföljer"),
            ])

            + H("Användning och skötsel")
            + P("Ställ huset så att lampan värmer löpdelen och huvuddelen ligger i skugga — "
                "det är temperaturskillnaden mellan rummen som gör att djuret kan reglera sig "
                "själv. Undvik en plats i direkt eftermiddagssol bakom fönsterglas; "
                "temperaturen där stiger snabbare än under en lampa du styr.")
            + SKOTSEL_L80
            + P("Lyft ut brickorna var för sig, töm och skölj dem, och låt dem torka innan "
                "nytt bottenmaterial läggs i. Punktstäda dagligen — det är det som håller "
                "lukten borta, inte hur ofta allt byts.")
            + P("Lacken tål fukt men inte skurning. Torka av med en fuktig trasa och undvik "
                "slipande medel. Kontrollera låsen med jämna mellanrum, särskilt om huset "
                "flyttas mellan inne och ute.")

            + H("Vanliga frågor")
            + F("Hur stor sköldpadda passar?",
                "Golvytan 0,33 m² och den fria höjden 28 cm motsvarar L80:s krav för en "
                "landsköldpadda med skallängd upp till 15 cm.")
            + F("Vad är skillnaden mellan de två rummen?",
                "Huvuddelen på 30 × 44 cm har trälock och är mörk. Löpdelen på "
                "44,5 × 44 cm har nätlock som släpper in ljus och luft.")
            + F("Går locken att låsa?",
                "Ja, båda locken har lås. De hindrar både att djuret trycker upp nätet och "
                "att husdjur i hemmet kommer åt.")
            + F("Hur rengörs det?",
                "De två plastbrickorna lyfts ut var för sig, töms och sköljs. Stommen "
                "torkas av med en fuktig trasa.")
            + F("Ingår lampa?",
                "Nej. Trähållaren till lampan ingår, men lampan väljs efter art och "
                "köps separat.")
            + F("Kan det stå utomhus?",
                "Sommartid under tak går bra — trät är vattenfast lackat. Det ska inte stå "
                "fritt i regn eller ute vintertid.")
            + F("Vad väger det?",
                "9,5 kg. En person bär det utan hjälp.")
            + F("Vad ingår?",
                "Huset i delar, två plastbrickor, lamphållare, beslag och "
                "monteringsanvisning.")
        ),
    )


PRODUKTER = {}
for _k in A_FARGER:
    PRODUKTER[_k] = modell_a(_k)
for _k in C_FARGER:
    PRODUKTER[_k] = modell_c(_k)
PRODUKTER["1f6de209"] = modell_f()
PRODUKTER["609bec0f"] = modell_g()
