# -*- coding: utf-8 -*-
"""Runda 107 — sju tvåplansstall med löpgård, i fyra modeller.

☠️ TEXTEN SKRIVS I FIL FÖRST. Runda 64 mätte 9 fel mot 0: en sträng som går
   rakt in i ett API-anrop kan inte grepas innan den lämnar chatten, och
   PATCH-svaret ekar tillbaka exakt det man skrev.

Varje tal kommer ur leverantörens egna spec-block (lästa i Wix 2026-09-09, se
`matt.py`) eller ur SJVFS 2019:15 bilaga 1:3 och 1:4. Inget tal är härlett ur
en bild — och där leverantörens RITNING säger emot spec-texten (`079f2901`)
gäller texten, för syskonets ritning stämmer mot texten på varje tal.

☠️ INGEN AV DE SJU FÅR SÄLJAS SOM KANINBOSTAD, trots att fem heter Hasenstall,
   Kaninchenstall eller Zwergkaninchenstall. Det som fäller dem är KORTASTE
   SIDAN, inte ytan: L80 kräver 50 cm för en dvärgkanin och 60 cm för en kanin
   på 2–3,5 kg, och löpboxarna är 41 till 53 cm breda. Ytan räcker gott på fem
   av de sju. Texten säljer dem därför som marsvinsstall och skriver ut normen.
"""

BAS = "https://www.fyndplats.se/produkt/"

L = lambda slug, text: f'<a href="{BAS}{slug}">{text}</a>'
P = lambda t: f"<p>{t}</p>"
H = lambda t: f"<h2>{t}</h2>"
LI = lambda t: f"<li>{t}</li>"
UL = lambda rader: "<ul>" + "".join(LI(f"<strong>{a}:</strong> {b}") for a, b in rader) + "</ul>"
F = lambda q, s: f"<p><strong>{q}</strong></p><p>{s}</p>"


def l80(yta, antal, tillagg=""):
    """Det positiva villkoret: vad ytan räcker till, med normen utskriven."""
    return (
        H("Så många marsvin räcker ytan till")
        + P(f"Golvytan som räknas är {yta} m² — bara markplanet, inte huset ovanpå. "
            f"Jordbruksverkets föreskrifter för sällskapsdjur (SJVFS 2019:15, L80) "
            f"kräver 0,30 m² för ett ensamt marsvin och 0,15 m² per djur när flera "
            f"hålls tillsammans, med kortaste sidan minst 40 cm och höjden minst "
            f"25 cm. Stallet räcker alltså till {antal} marsvin. {tillagg}".strip())
        + P("Marsvin ska hållas i par eller grupp — de är flockdjur, och ett ensamt "
            "marsvin far illa. Räkna därför på minst två.")
    )


def kaninraden(nyckel):
    """☠️ Den rättsliga upplysningen — RÄKNAD, inte handskriven.

    Första utkastet skrev motiveringen för hand medan verdikten kom ur
    l80-grinden, och tre av fyra modeller fick fel skäl: texten påstod att
    "måttet nås inte" och citerade i samma mening 54,5 cm mot ett krav på
    50 cm. Slutsatsen var rätt, motiveringen självmotsägande — och en kund som
    mäter efter hade dragit slutsatsen att grinden är fel.

    Skälet härleds därför ur samma funktion som domen:

      · klarar INGEN delyta bredd- och höjdkravet -> det är BREDDEN som fäller
      · klarar någon det men ytan är för liten    -> det är YTAN som fäller

    Samma princip som prisgrinden: den som räknar domen ska räkna skälet.
    """
    import matt, importlib.util, os
    _spec = importlib.util.spec_from_file_location(
        "l80g", os.path.join(os.path.dirname(os.path.abspath(__file__)), "l80-grind.py"))
    _g = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(_g)

    delar = matt.UTKAST[nyckel][5]
    kyta, ksida, khojd, _per = dict(_g.DJUR)["dvärgkanin ≤2 kg"]
    ok, _osakra = _g.godkanda(delar, ksida, khojd)
    inled = ("Stallet säljs inte som kaninbostad. L80 kräver att kortaste sidan är "
             "minst 50 cm för en dvärgkanin på högst 2 kg och 60 cm för en kanin på "
             "2–3,5 kg. ")
    slut = (" För marsvin, degu och råtta ligger kravet på 30 till 40 cm i kortaste "
            "sida, och där räcker stallet med marginal.")
    if not ok:
        bredast = max(min(L, B) for _n, L, B, _h in delar)
        return P(inled + f"Ingen del av löpgården når dit — det bredaste måttet här är "
                 f"{_tal(bredast)} cm." + slut)
    y = _g.yta(ok)
    # ☠️ `yta()` returnerar KVADRATMETER redan. Ett första utkast gångade med 100
    #    och skrev "37,6 m²" om en löpgård på 0,38 — ett tal som är fysiskt
    #    orimligt och ändå passerade talgrinden, eftersom grinden bara frågar
    #    var talet KOMMER IFRÅN, inte om det är rimligt. Läsningen fångade det.
    # ☠️ Formatera TALET för sig. Ett `.replace(".", ",")` på hela meningen bytte
    #    också punkten som avslutar föregående mening — "…för en kanin, Kvar blir".
    yta_txt = f"{y:.2f}".replace(".", ",")
    return P(inled + "Bredden räcker i löpgården på sidan, men takhöjden gör det bara "
             "där: delen under huset är för låg för en kanin. Kvar blir "
             f"{yta_txt} m², mot kravets 0,5 m²." + slut)


def kaninfaq(nyckel):
    """FAQ-svaret om kanin — samma räkning som upplysningen, en gång skriven.

    ☠️ Första utkastet skrev de fyra svaren för hand och tre fick fel skäl:
    modell Q:s svar sa "kortaste sidan gör det inte" och citerade 54,5 cm mot
    ett krav på 50. Verdikten var rätt, motiveringen självmotsägande.
    """
    import matt, importlib.util, os
    _spec = importlib.util.spec_from_file_location(
        "l80g", os.path.join(os.path.dirname(os.path.abspath(__file__)), "l80-grind.py"))
    _g = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(_g)
    delar = matt.UTKAST[nyckel][5]
    _kyta, ksida, khojd, _per = dict(_g.DJUR)["dvärgkanin ≤2 kg"]
    ok, _osakra = _g.godkanda(delar, ksida, khojd)
    if not ok:
        bredast = max(min(L, B) for _n, L, B, _h in delar)
        return ("Nej. Kravet på kortaste sida är 50 cm för en dvärgkanin och 60 cm "
                f"för en kanin på 2–3,5 kg, och det bredaste måttet i löpgården är "
                f"{_tal(bredast)} cm.")
    yta_txt = f"{_g.yta(ok):.2f}".replace(".", ",")
    return ("Nej. Löpgården på sidan är bred nog, men den är också den enda delen "
            "som är hög nog för en kanin — den under huset är för låg. Ensam ger "
            f"den {yta_txt} m², mot kravets 0,5 m² för en dvärgkanin.")


def _tal(x):
    """Svensk decimalkomma, och heltal utan efterföljande nolla."""
    return (f"{x:.2f}".rstrip("0").rstrip(".") if x % 1 else f"{int(x)}").replace(".", ",")


SKOTSEL_TRA = P(
    "Gran som står ute grånar med tiden. Vill du behålla tonen stryker du stallet "
    "en gång om året med en djurvänlig träolja — utomhus, och torrt innan djuren "
    "släpps in. Skruvförband kan behöva efterdras efter första säsongen, för trä "
    "rör sig när det torkar."
)

VINTER = P(
    "Gnagare får enligt L80 inte hållas vid temperaturer under noll grader, och de "
    "ska alltid kunna nå en plats där de har det lagom varmt. Att huset står upphöjt "
    "på ben är precis vad samma föreskrift kräver av en utomhusbur vintertid, men "
    "upphöjningen ensam är inget värmeskydd: under den kalla delen av året behöver "
    "djuren ett hem där temperaturen håller sig över noll."
)

NATGOLV = P(
    "Gnagare får enligt L80 inte hållas på nätgolv. Undantaget är betesburar och "
    "andra utrymmen med direkt kontakt med marken — och det är just vad löpgården "
    "är när stallet står på gräs. Sovdelen har fast golv."
)


# ---------------------------------------------------------------- modell P ---
# 230 × 53 × 93,5. Hus i mitten, upphöjt, med markbox under och en löpbox på var
# sida. Innermått 70 × 41 genomgående. Ramp 61 × 14,8. Godkänd bottenyta 0,86 m².
P_FARGER = {
    #          namnets färg      slug                       vikt    paketmått            titelns kortform
    "a75fcfde": ("natur och vitt", "smadjursstall-230-natur", "32,2", "94 × 74,5 × 17,5", "natur"),
    "c0770388": ("grått",          "smadjursstall-230-gra",   "32,7", "97 × 76,5 × 17,5", "grått"),
}


def modell_p(nyckel):
    farg, slug, vikt, paket, kort = P_FARGER[nyckel]
    syskon = [(f, s) for k, (f, s, _v, _p, _kf) in P_FARGER.items() if k != nyckel]
    return dict(
        namn=f"Smådjursstall 230 cm med tre löpgårdar och ramp – {farg}",
        slug=slug,
        titel=f"Smådjursstall 230 cm med löpgård, {kort} | Fyndplats",
        meta=("Smådjursstall 230 cm med hus i mitten och tre löpgårdar på marken. "
              "0,86 m² bottenyta, ramp, asfalttak och fyra utdragbara brickor."),
        sokord=[("smådjursstall", True), ("marsvinsstall utomhus", False),
                ("stall med löpgård", False), ("tvåplansstall gnagare", False)],
        html=(
            P(f"Ett <strong>smådjursstall</strong> på 230 × 53 × 93,5 cm i {farg}, "
              "byggt som ett upphöjt hus i mitten med löpgård åt båda håll och en "
              "tredje yta under själva huset. Djuren rör sig mellan planen på en "
              "ramp, och hela markplanet hänger ihop.")
            + H("Tre löpgårdar, inte en")
            + P("Under huset finns en yta på 70 × 41 cm med 32 cm fri höjd, och på "
                "var sida om huset en till på 70 × 41 cm med 60 cm höjd. Att ytan är "
                "delad på tre gör den mer användbar än ett enda långt schakt: djuren "
                "kan gå undan från varandra, och det finns alltid en plats i skugga "
                "och en i sol.")
            + H("Fyra brickor som dras ut")
            + P("Varje avdelning har en egen bottenbricka som dras ut framifrån. Det "
                "är skillnaden mellan ett stall som blir rengjort varje vecka och ett "
                "som inte blir det — du behöver inte krypa in någonstans, och strö "
                "byts på några minuter.")
            + P("Huset är 70 × 41 cm invändigt med 48 cm i tak, och nås både genom en "
                "dörr på 30 × 26 cm och via rampen på 61 × 14,8 cm. Taket är klätt "
                "med asfaltpapp och skjuter ut över framkanten, så regn rinner av "
                "utanför öppningen.")
            + l80("0,86", "fyra",
                  "Måtten är innermått — det är den yta djuren faktiskt har.")
            + kaninraden(nyckel)
            + P(f"Samma stall finns också i {L(syskon[0][1], syskon[0][0])}.")
            + H("Tekniska specifikationer")
            + UL([
                ("Yttermått", "230 × 53 × 93,5 cm (L × B × H)"),
                ("Bottenyta som räknas", "0,86 m²"),
                ("Löpgård under huset", "70 × 41 cm, 32 cm fri höjd"),
                ("Löpgård på sidorna", "2 st, 70 × 41 cm, 60 cm fri höjd"),
                ("Hus invändigt", "70 × 41 × 48 cm"),
                ("Husdörr", "30 × 26 cm"),
                ("Ramp", "61 × 14,8 cm"),
                ("Bottenbrickor", "4 st, dras ut framifrån"),
                ("Material", "gran, stål och asfaltpapp"),
                ("Färg", farg),
                ("Vikt", f"{vikt} kg"),
                ("Paketmått", f"{paket} cm"),
                ("Montering", "krävs"),
                ("Lämplig för", "marsvin, degu och råtta"),
            ])
            + H("Användning och skötsel")
            + NATGOLV
            + SKOTSEL_TRA
            + P("Ställ stallet plant. Det är 230 cm långt, och står det snett tar "
                "rampen och dörrarna emot i stället för att falla på plats. Ett "
                "underlag som dränerar — gräs, grus eller plattor med fall — håller "
                "benen torra längre än en gräsmatta som blir stående i vatten.")
            + VINTER
            + H("Vanliga frågor")
            + F("Hur många marsvin får plats?",
                "Fyra, räknat på L80:s 0,30 m² för det första djuret och 0,15 m² för "
                "varje ytterligare. Marsvin ska hållas minst två tillsammans.")
            + F("Går det att hålla kanin i stallet?", kaninfaq(nyckel))
            + F("Är det tungt att flytta?",
                f"Stallet väger {vikt} kg och är 230 cm långt, så det är ett "
                "tvåpersonersjobb att flytta det monterat. Det är byggt för att stå "
                "kvar, inte för att flyttas som en betesbur.")
            + F("Kan djuren rymma under kanten?",
                "Ramen ligger an mot marken runt om. På ojämnt underlag kan det bli "
                "en glipa i en svacka — jämna av innan du ställer dit stallet.")
            + F("Vad är brickorna gjorda av?",
                "Vilket material brickorna är gjorda av framgår inte av produktdatan, "
                "så vi skriver inte ut det. Det som är säkert är att var och en dras "
                "ut framifrån.")
            + F("Skyddar stallet mot rovdjur?",
                "Nätet är stål och dörrarna går att stänga, vilket håller undan "
                "fåglar och katter. Löpgården har ingen botten, så mot grävande djur "
                "är den inget skydd — där hjälper bara ett nät under eller att "
                "djuren är inne i huset nattetid.")
            + F("Behöver det målas?",
                "Nej, men gran som står ute grånar. En djurvänlig träolja en gång "
                "om året håller tonen kvar.")
        ),
    )


# ---------------------------------------------------------------- modell Q ---
# 141 × 60 × 86. Hus upphöjt + markbox under (69 × 54,5 × 40) + löpgård på sidan
# (69 × 54,5 × 62). Ramp 60 × 14. Uppfällbart tak. Bottenfack 63 × 49. 16 kg.
def modell_q():
    return dict(
        namn="Smådjursstall 141 cm med löpgård och uppfällbart tak",
        slug="smadjursstall-141-natur",
        titel="Smådjursstall 141 cm med uppfällbart tak | Fyndplats",
        meta=("Smådjursstall 141 × 60 × 86 cm i gran med löpgård, ramp och "
              "uppfällbart tak. 0,75 m² bottenyta och utdragbart bottenfack."),
        sokord=[("smådjursstall", True), ("marsvinsstall med löpgård", False),
                ("stall uppfällbart tak", False), ("gnagarstall trä", False)],
        html=(
            P("Ett <strong>smådjursstall</strong> på 141 × 60 × 86 cm i gran, med ett "
              "upphöjt hus i ena änden och löpgård på marken både under huset och "
              "bredvid det. En ramp på 60 × 14 cm binder ihop planen.")
            + H("Taket fälls upp — hela sovdelen blir åtkomlig")
            + P("Husets tak är gångjärnsupphängt och fälls upp i sin helhet. Det är "
                "den skillnad som märks vid varje rengöring: i stället för att sträcka "
                "in armen genom en lucka på 29 × 33 cm står hela sovutrymmet öppet "
                "uppifrån. Dörren finns kvar för djurens egen väg in och ut.")
            + H("0,75 m² på marken, i två delar")
            + P("Under huset ligger en yta på 69 × 54,5 cm med 40 cm fri höjd, och "
                "bredvid en lika stor med 62 cm höjd. Båda räknas som golvyta, för "
                "båda klarar kravet på kortaste sida och höjd. Bottenfacket på "
                "63 × 49 cm dras ut för tömning.")
            + l80("0,75", "fyra")
            + kaninraden("2253c509")
            + H("Tekniska specifikationer")
            + UL([
                ("Yttermått", "141 × 60 × 86 cm (L × B × H)"),
                ("Bottenyta som räknas", "0,75 m²"),
                ("Löpgård under huset", "69 × 54,5 cm, 40 cm fri höjd"),
                ("Löpgård på sidan", "69 × 54,5 cm, 62 cm fri höjd"),
                ("Hus invändigt", "69 × 54,5 × 44 cm"),
                ("Husdörr", "29 × 33 cm"),
                ("Ramp", "60 × 14 cm"),
                ("Bottenfack", "63 × 49 cm, dras ut"),
                ("Tak", "fälls upp"),
                ("Material", "gran och asfaltpapp"),
                ("Färg", "natur"),
                ("Vikt", "16 kg"),
                ("Paketmått", "90 × 73 × 22,5 cm"),
                ("Montering", "krävs"),
                ("Lämplig för", "marsvin, degu och råtta"),
            ])
            + H("Användning och skötsel")
            + NATGOLV
            + SKOTSEL_TRA
            + P("Kontrollera att taket går att fälla upp helt där du ställer stallet "
                "— det behöver fri höjd ovanför sig, så tätt under en balkong eller "
                "en låg gren tappar du hela poängen med det.")
            + VINTER
            + H("Vanliga frågor")
            + F("Hur många marsvin får plats?",
                "Fyra, räknat på L80:s 0,30 m² för det första och 0,15 m² per djur "
                "därutöver. Marsvin ska hållas minst två tillsammans.")
            + F("Går det att hålla kanin här?", kaninfaq("2253c509"))
            + F("Kan taket stå öppet av sig självt?",
                "Något stöd som håller taket uppe finns inte angivet. Räkna med att "
                "hålla det med ena handen, eller stötta det mot något stadigt.")
            + F("Är stallet upphöjt?",
                "Huset är det — det står på ben med löpgården under. Just den "
                "upphöjningen är vad L80 kräver av en utomhusbur vintertid.")
            + F("Kommer regn in i sovdelen?",
                "Taket är klätt med asfaltpapp och skjuter ut över kanten. Slagregn "
                "kan nå in genom dörröppningen, så vänd den bort från väderstrecket "
                "regnet oftast kommer ifrån.")
            + F("Vad väger det?",
                "16 kg. En person kan flytta det tomt, men det är byggt för att stå "
                "kvar snarare än att flyttas ofta.")
        ),
    )


# ---------------------------------------------------------------- modell R ---
# 156 × 58 × 68. Hus 72 × 50 × 41,5 + markbox under (72 × 50 × 26,5) + löpgård
# på sidan (80 × 50 × 56). Ramp 63 × 15. Fodertråg 25 × 6,5 × 8. Bricka 67,5 × 48.
R_FARGER = {
    "2435c4d1": ("ljusgrått", "smadjursstall-156-gra"),
    "dcdf889d": ("natur",     "smadjursstall-156-natur"),
}


def modell_r(nyckel):
    farg, slug = R_FARGER[nyckel]
    syskon = [(f, s) for k, (f, s) in R_FARGER.items() if k != nyckel]
    return dict(
        namn=f"Smådjursstall 156 cm med fodertråg och löpgård – {farg}",
        slug=slug,
        titel=f"Smådjursstall 156 cm med fodertråg, {farg} | Fyndplats",
        meta=("Smådjursstall 156 × 58 × 68 cm med löpgård, ramp och inbyggt "
              "fodertråg. 0,76 m² bottenyta och utdragbar bricka."),
        sokord=[("smådjursstall", True), ("marsvinsstall utomhus", False),
                ("stall med fodertråg", False), ("lågt gnagarstall", False)],
        html=(
            P(f"Ett <strong>smådjursstall</strong> på 156 × 58 × 68 cm i {farg}, "
              "lägre och längre än de flesta i familjen. Huset sitter i ena änden "
              "med löpgård under och en längre löpgård bredvid — 1,56 meter från "
              "ände till ände på markplanet.")
            + H("Fodertråg inbyggt i huset")
            + P("I sovdelen sitter ett fodertråg på 25 × 6,5 × 8 cm fast monterat. "
                "Det låter enkelt och är det som gör mest skillnad i vardagen: fodret "
                "hamnar inte i ströet, och det går att fylla på utan att flytta djuren.")
            + H("Ett fönster och två låsbara dörrar")
            + P("Huset har en trälucka på 20 × 20 cm och en nätdörr på 38 × 20 cm, "
                "båda låsbara, plus ett fönster. Nätdörren släpper in ljus och luft "
                "när det är varmt; träluckan stänger för drag när det inte är det.")
            + l80("0,76", "fyra")
            + kaninraden(nyckel)
            + P(f"Samma stall finns också i {L(syskon[0][1], syskon[0][0])}.")
            + H("Tekniska specifikationer")
            + UL([
                ("Yttermått", "156 × 58 × 68 cm (L × B × H)"),
                ("Bottenyta som räknas", "0,76 m²"),
                ("Löpgård på sidan", "80 × 50 cm, 56 cm fri höjd"),
                ("Löpgård under huset", "72 × 50 cm, 26,5 cm fri höjd"),
                ("Hus invändigt", "72 × 50 × 41,5 cm"),
                ("Trälucka", "20 × 20 cm"),
                ("Nätdörr", "38 × 20 cm"),
                ("Fodertråg", "25 × 6,5 × 8 cm"),
                ("Ramp", "63 × 15 cm"),
                ("Bricka", "67,5 × 48 cm, dras ut"),
                ("Material", "gran och asfaltpapp"),
                ("Färg", farg),
                ("Vikt", "16 kg"),
                ("Paketmått", "88 × 58 × 24 cm"),
                ("Montering", "krävs"),
                ("Lämplig för", "marsvin och råtta"),
            ])
            + H("Användning och skötsel")
            + NATGOLV
            + SKOTSEL_TRA
            + P("Ytan under huset har 26,5 cm fri höjd. Det räcker för marsvin och "
                "råtta, men en degu kräver 40 cm och kan därför bara räkna med "
                "löpgården på sidan — det är skälet till att degu inte står i listan "
                "över lämpliga djur här, till skillnad från familjens högre stall.")
            + VINTER
            + H("Vanliga frågor")
            + F("Hur många marsvin får plats?",
                "Fyra, räknat på L80:s 0,30 m² för det första och 0,15 m² per djur "
                "därutöver. Marsvin ska hållas minst två tillsammans.")
            + F("Varför står inte degu med som lämpligt djur?",
                "Degu kräver 40 cm fri höjd. Löpgården på sidan har 56 cm och klarar "
                "det, men ytan under huset har 26,5 cm — och då blir den godkända "
                "ytan för liten för mer än ett djur.")
            + F("Går det att hålla kanin här?", kaninfaq(nyckel))
            + F("Sitter fodertråget fast?",
                "Ja, det är monterat i huset. Det går alltså inte att ta ut för "
                "diskning, utan torkas på plats.")
            + F("Hur högt är stallet?",
                "68 cm totalt, vilket är lågt nog att stå under ett fönster eller på "
                "en altan utan att skymma.")
            + F("Kan det stå ute året om?",
                "Träet tål väder, men djuren ska inte hållas där när det är minusgrader. "
                "L80 sätter noll grader som gräns för gnagare.")
        ),
    )


# ---------------------------------------------------------------- modell S ---
# 123,5 × 62,6 × 92,5. Hus upphöjt (54,5 × 53 × 63) + markbox under (54 × 53 × 32)
# + löpgård på sidan (53 × 61 × 58). Löpgården BOTTENLÖS, huset har utdragbar
# bricka. Husdörr 29 × 22,4. Innerdörr 21,5 × 22. Löpdörr 25,5 × 50.
S_FARGER = {
    #          namnets färg      slug                       titelns kortform
    "525e6acf": ("natur",          "smadjursstall-123-natur", "natur"),
    "079f2901": ("grått och vitt", "smadjursstall-123-gra",   "grått"),
}


def modell_s(nyckel):
    farg, slug, kort = S_FARGER[nyckel]
    syskon = [(f, s) for k, (f, s, _kf) in S_FARGER.items() if k != nyckel]
    return dict(
        namn=f"Smådjursstall 123,5 cm i två plan med bottenlös löpgård – {farg}",
        slug=slug,
        titel=f"Smådjursstall 123,5 cm i två plan, {kort} | Fyndplats",
        meta=("Smådjursstall 123,5 × 62,6 × 92,5 cm i två plan. Löpgården är "
              "bottenlös och står på gräset, huset har utdragbar bricka."),
        sokord=[("smådjursstall", True), ("marsvinsstall två plan", False),
                ("stall bottenlös löpgård", False), ("gnagarstall utomhus", False)],
        html=(
            P(f"Ett <strong>smådjursstall</strong> på 123,5 × 62,6 × 92,5 cm i {farg}, "
              "med ett upphöjt hus i ena änden och löpgård i den andra. Huset är den "
              "högsta delen — 63 cm invändigt — och nås både genom en dörr framifrån "
              "och via rampen inifrån löpgården.")
            + H("Löpgården är bottenlös, huset har bricka")
            + P("De två halvorna är byggda på var sitt sätt, och det är avsiktligt. "
                "Löpgården har ingen botten alls: ställd på gräs går djuren på riktig "
                "mark och betar själva. Sovdelen har däremot fast golv med en bricka "
                "som dras ut, så strö och spillning går att tömma utan att lyfta "
                "något.")
            + P("Det betyder också att stallet ska stå på gräs eller jord, inte på "
                "trall eller asfalt — halva golvytan är marken under det.")
            + H("Två plan, tre öppningar")
            + P("Husdörren är 29 × 22,4 cm, den inre öppningen mot rampen 21,5 × 22 cm "
                "och löpgårdens egen dörr 25,5 × 50 cm. Den sista är stor nog att lyfta "
                "in ett marsvin genom utan att böja sig runt hörn.")
            + l80("0,61", "tre")
            + kaninraden(nyckel)
            + P(f"Samma stall finns också i {L(syskon[0][1], syskon[0][0])}.")
            + H("Tekniska specifikationer")
            + UL([
                ("Yttermått", "123,5 × 62,6 × 92,5 cm (L × B × H)"),
                ("Bottenyta som räknas", "0,61 m²"),
                ("Löpgård på sidan", "53 × 61 cm, 58 cm fri höjd, utan botten"),
                ("Löpgård under huset", "54 × 53 cm, 32 cm fri höjd"),
                ("Hus invändigt", "54,5 × 53 × 63 cm"),
                ("Husdörr", "29 × 22,4 cm"),
                ("Inre öppning", "21,5 × 22 cm"),
                ("Löpgårdens dörr", "25,5 × 50 cm"),
                ("Botten", "bricka under huset, ingen i löpgården"),
                ("Material", "gran, ståltråd och asfaltpapp"),
                ("Färg", farg),
                ("Vikt", "16 kg"),
                ("Paketmått", "98 × 62 × 20 cm"),
                ("Montering", "krävs"),
                ("Lämplig för", "marsvin, degu och råtta"),
            ])
            + H("Användning och skötsel")
            + NATGOLV
            + P("Flytta stallet ett par meter med jämna mellanrum. Löpgården är öppen "
                "mot marken, så gräset under den blir avbetat och underlaget trampat "
                "— flyttar du det hinner gräset återhämta sig och marken torka upp.")
            + SKOTSEL_TRA
            + VINTER
            + H("Vanliga frågor")
            + F("Hur många marsvin får plats?",
                "Tre, räknat på L80:s 0,30 m² för det första och 0,15 m² per djur "
                "därutöver. Marsvin ska hållas minst två tillsammans.")
            + F("Går det att hålla kanin här?", kaninfaq(nyckel))
            + F("Kan det stå på en altan?",
                "Bara om du lägger något under löpgården. Den har ingen botten, så på "
                "trall eller sten står djuren på hårt underlag utan att komma åt mark.")
            + F("Hur tömmer man löpgården?",
                "Den har ingen bricka — du flyttar stallet i stället, och räfsar upp "
                "det som ligger kvar. Sovdelens bricka dras ut framifrån.")
            + F("Är huset tillräckligt högt?",
                "63 cm invändigt, vilket är den högsta delen i stallet. Ett marsvin "
                "kan stå upp på bakbenen där utan att nå taket.")
            + F("Vad väger det?",
                "16 kg. En person kan flytta det tomt, men lyft i ramen och inte i "
                "nätet.")
        ),
    )


PRODUKTER = {}
for _k in P_FARGER:
    PRODUKTER[_k] = modell_p(_k)
PRODUKTER["2253c509"] = modell_q()
for _k in R_FARGER:
    PRODUKTER[_k] = modell_r(_k)
for _k in S_FARGER:
    PRODUKTER[_k] = modell_s(_k)
