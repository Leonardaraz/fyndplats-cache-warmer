# -*- coding: utf-8 -*-
"""Runda 87 — åtta garagetält och förrådstält på stålstomme.

☠️ Batch 64 mätte skillnaden: fem produkter skrivna inline i API-anropet gav
NIO fel som nådde Wix, tre skrivna via fil gav noll. Texten skrivs därför HÄR.

☠️ RUNDANS GRIND ÄR SNÖN, OCH DEN FÅR INTE SKRIVAS BORT. Bara två av åtta
   anger en snölast: `0f5e3fea` 5 kg/m² och paret `5f6592ad`/`20c0942e`
   10 kg/m². Husets egen publicerade plåtbod bär texten "30 kg/m² är inte
   mycket i fjällvärlden, men det är en siffra" — tälten ligger på en
   sjättedel respektive en tredjedel av det.

   Tyskan kallar `0f5e3fea` en "winterfeste Lösung" och `95a9d7cc` ett
   "winterfestes Lagerzelt". ORDEN "VINTERKLAR", "VINTERSÄKER" OCH
   "VINTERFAST" FÅR INTE FÖREKOMMA PÅ NÅGON AV DE ÅTTA SIDORNA. Det som
   skrivs i stället är husets etablerade formulering: den angivna snölasten
   är en gräns och inte en garanti, och snön ska bort från taket.

☠️ SNÖLASTEN FÅR INTE HELLER LÅNAS MELLAN SYSKON. Fem av åtta anger ingen
   siffra alls, och att kopiera grannens tal är rundans naturligaste fel.
   En uppgift källan inte ger får inte uppstå i vår text — samma regel som
   runda 86:s maxlast och runda 84:s batteristorlek.

☠️ FÖRANKRINGEN VARIERAR, OCH `8bdba748` HAR INGEN ALLS. Leveransinnehållet
   skiljer sig radikalt: `0f5e3fea` får 16 markankare, 12 expanderskruvar,
   4 spännlinor och 12 gummispännare; `95a9d7cc` får 20 jordspett och 28
   gummiband; `72051417`/`a165b178` får 6 ankare, 6 skruvar och 15
   spännlinor; `6a419d8b` får 4 jordspett och 4 linor. `8bdba748`:s
   Lieferumfang innehåller BARA tältet och anvisningen. Ett duktält utan
   förankring är det farligaste i hela rundan att beskriva slarvigt.

☠️ BILDEN FÄLLDE EN TAKFORM TYSKAN HAR FEL OM. `20c0942e`/`5f6592ad` heter
   `Satteldach` i namnet men brödtexten säger "Schrägdach bietet mehr
   Kopffreiheit" — pulpettak. Zoomen visar ett symmetriskt sadeltak med nock
   på mitten. Namnet har rätt, brödtexten fel.

☠️ `6a419d8b` LOVAR ETT FÖNSTER SOM INGEN BILD VISAR. `Fensterabmessungen:
   47L x 40B cm` står i Technische Daten och ingressen säger "mit Fenster",
   men fem bilder från fyra vinklar visar inget fönster. Det som syns är att
   dörrens övre del rullas upp — tyskan kallar det "Türfenster". Sidan
   beskriver den upprullbara dörrdelen och lovar inget separat fönster, och
   nämner inte heller de "aufrollbare Seitenlüftungen" som ingen bild visar.
   `95a9d7cc`:s fönster är motsatsen: det syns på tre bilder OCH står i
   måttritningen, så det får stå i texten.

☠️ `0f5e3fea` SÄGER EMOT SIG SJÄLV OM VATTENTÄTHETEN. Namnet säger
   `Wasserabweisend`, brödtexten `wasserdichte` och `Wasserfeste`. Sidan
   säger VATTENAVVISANDE — det svagare av de två. Ett för starkt löfte om en
   duk är ett löfte om allt som står under den.

☠️ MÅTTEN LÄSES UR `Technische Daten`, ALDRIG UR DEN SVENSKA RADEN. Den
   maskinsatta raden har kastat om bredd och djup: tyskans `190B x 230T`
   har blivit `Mått: 190L x 230B`. En kund som väljer plats efter "190 lång"
   ställer tältet tvärtom.

☠️ `Vikt` I DEN MASKINSATTA FLIKEN ÄR PAKETVIKT (runda 86:s fynd). Feedens
   kolumn heter `Weight (incl. Package)`. Raden heter `Vikt med emballage`
   på varenda sida.

⚠️ INGEN SIDA SÄGER NÅGOT OM BYGGLOV. Var gränsen går är en fråga om tomt,
   kommun och avstånd till granne, och ett påstående i en produkttext blir
   juridisk rådgivning vi inte kan stå för. Måtten står i specen;
   bedömningen är kundens.

⚠️ VINDTÅLIGHETEN ÄR ETT ANVÄNDNINGSVILLKOR, INTE EN SÄLJPUNKT. Paret
   `5f6592ad`/`20c0942e` anger "Windresistenz bis zu Stufe 5" — Beaufort 5,
   frisk bris. Tre av de åtta säger uttryckligen att tältet ska stå mot en
   vägg för att tåla vind bättre. Det står som det villkor det är.

⚠️ PRISET NÄMNS ALDRIG, och färgsyskonen får INTE påstås kosta lika mycket:
   `5f6592ad` och `20c0942e` skiljer 280 kr trots identiska mått. Texten
   nämner färgen och länkar, inget mer.
"""

BAS = "https://www.fyndplats.se/produkt/"


def lank(slug, text):
    return '<a href="%s%s">%s</a>' % (BAS, slug, text)


def egenskaper(rader):
    return ("<p><strong>Egenskaper</strong></p><ul>"
            + "".join("<li>%s</li>" % r for r in rader) + "</ul>")


def rubrikblock(rubrik, stycken):
    return "<h2>%s</h2>" % rubrik + "".join("<p>%s</p>" % s for s in stycken)


def spec(rader):
    return ("<h2>Tekniska specifikationer</h2><ul>"
            + "".join("<li>%s</li>" % r for r in rader) + "</ul>")


def faq(rader):
    # ☠️ Wix STRIPPAR <br>. Fråga och svar måste vara TVÅ <p>.
    ut = ["<h2>Vanliga frågor</h2>"]
    for f, s in rader:
        ut.append("<p><strong>%s</strong></p><p>%s</p>" % (f, s))
    return "".join(ut)


def bygg(p):
    return "".join([p["ingress"], egenskaper(p["eg"]), spec(p["spec"]),
                    rubrikblock(p["villkor"][0], p["villkor"][1]),
                    rubrikblock("Användning och skötsel", p["skotsel"]),
                    faq(p["faq"])])


# ── Delade stycken ─────────────────────────────────────────────────────────
# ⚠️ Skötseln av en PE- eller polyesterduk på galvaniserad stomme är
#    densamma för alla åtta, och att skriva åtta varianter av samma råd hade
#    varit åtta tillfällen att skriva ett fel. Det som SKILJER — snölast,
#    förankring, takform — står per produkt.
DUK_SKOTSEL = ("Spola av duken med trädgårdsslang ett par gånger om året och "
               "borsta bort mossa och löv i skarvarna. Använd inte "
               "högtryckstvätt: strålen kan öppna sömmarna och tvätta bort "
               "dukens ytbehandling.")
STOMME_SKOTSEL = ("Se över stommen varje vår. Galvaniserat stål rostar inte "
                  "av sig självt, men rören skavs mot varandra där de möts, "
                  "och det är i de punkterna ytbehandlingen släpper först.")
SPANN_SKOTSEL = ("Efterspänn duken när den blivit slak. En duk som fladdrar "
                 "sliter på sig själv vid varje vindstöt, och en slak duk "
                 "samlar dessutom vatten i en ficka som väger mer än man tror.")


PRODUKTER = [
    # ══ 1. 72051417 — 120 × 179, ljusgrå ══════════════════════════════════
    {
        "kort": "72051417",
        "sku": "FP-garagetalt-120x179-ljusgra",
        "name": "Garagetält 120 × 179 cm i ljusgrått – sadeltak och 15 spännlinor",
        "slug": "garagetalt-120x179-cm-ljusgra",
        "title": "Garagetält 120 × 179 cm, ljusgrått | Fyndplats",
        "meta": ("Litet garagetält på galvaniserad stålstomme, 120 × 179 × "
                 "165 cm. Sadeltak, dragkedjedörr 106 × 126 cm, sex "
                 "markankare och femton spännlinor ingår."),
        "ingress":
            "<p><strong>120 × 179 cm på marken — familjens minsta.</strong> "
            "Det tar ungefär den plats en soffa gör och står mot husväggen, "
            "vid gaveln eller i ett hörn av tomten där ett fast förråd inte "
            "får plats.</p>"
            "<p><strong>Angiven kapacitet är två cyklar, en "
            "motorcykel eller trädgårdsredskap.</strong> Dörren är 106 cm "
            "bred och 126 cm hög, så en skottkärra rullar in men du går inte "
            "in stående: nocken sitter på 165 cm och takfoten på 134 cm.</p>"
            "<p><strong>Duken är PE och stommen galvaniserat stål.</strong> "
            "Sex markankare, sex skruvar och femton spännlinor följer med, "
            "och de är avsedda att användas — ett tält som väger fjorton kilo "
            "står inte kvar av sin egen tyngd.</p>"
            "<p>Samma tält finns "
            + lank("garagetalt-120x179-cm-morkgra", "i mörkgrått")
            + ", och behöver du större yta finns "
            + lank("garagetalt-162x222-cm-ljusgra",
                   "162 × 221,5 cm i samma ljusa ton")
            + ".</p>",
        "eg": [
            "120 × 179 cm på marken, 165 cm i nock",
            "Takfot 134 cm — det är höjden längs väggarna",
            "Sadeltak som leder av regn åt två håll",
            "Dörr 106 × 126 cm med dragkedja",
            "Galvaniserad stålstomme, duk i PE",
            "Angiven kapacitet: två cyklar",
            "Sex markankare, sex skruvar och femton spännlinor ingår",
            "Monteras, verktyg ingår inte",
        ],
        "spec": [
            "Yttermått (B × D × H): 120 × 179 × 165 cm",
            "Grundyta: 2,1 m²",
            "Takfotshöjd: 134 cm",
            "Dörr (B × H): 106 × 126 cm",
            "Tak: sadeltak",
            "Stomme: galvaniserat stål",
            "Duk: PE",
            "Färg: ljusgrå",
            "Snölast: anges inte",
            "Vikt med emballage: 14 kg",
            "Paketmått: 119,5 × 23 × 20 cm",
            "Montering: krävs",
            "Ingår: tält, 6 markankare, 6 skruvar, 15 spännlinor, monteringsanvisning",
        ],
        "villkor": ("Snö, vind och var tältet ska stå", [
            "Det finns ingen angiven snölast för det här tältet, och vi "
            "gissar inte fram en. Det praktiska rådet är detsamma oavsett: "
            "låt inte snön ligga kvar på duken. Sadeltaket leder av en del "
            "själv, men blötsnö fastnar, och ett duktak bär inte som ett "
            "plåttak.",
            "Monteringsanvisningen säger uttryckligen att tältet ska stå mot "
            "en vägg för att tåla vind bättre. Det är ett användningsvillkor, "
            "inte ett tips — femton spännlinor följer med just därför.",
            "Marken avgör hur mycket förankringen hjälper. På gräs går "
            "ankarna hela vägen ner; på asfalt eller plattor gör de det inte, "
            "och då är väggen och tyngder i hörnen det som håller tältet på "
            "plats.",
        ]),
        "skotsel": [DUK_SKOTSEL, STOMME_SKOTSEL, SPANN_SKOTSEL],
        "faq": [
            ("Kan jag gå in i tältet?",
             "Inte stående. Nocken sitter på 165 cm och takfoten på 134 cm, "
             "så du kliver in böjd. Dörröppningen är 106 × 126 cm."),
            ("Går det att låsa?",
             "Dörren stängs med dragkedja. Det finns inget lås och inget "
             "beslag för hänglås."),
            ("Hur många cyklar får plats?",
             "Angiven kapacitet är två cyklar, en motorcykel eller "
             "trädgårdsredskap. Golvytan är 120 × 179 cm."),
            ("Ingår markpinnar?",
             "Ja — sex markankare, sex skruvar och femton spännlinor. "
             "Verktyg för monteringen ingår inte."),
            ("Vad är skillnaden mot det mörkgrå?",
             "Färgen på duken. Måtten, dörren, stommen och leveransinnehållet "
             "är identiska."),
        ],
    },

    # ══ 2. a165b178 — 120 × 179, mörkgrå ══════════════════════════════════
    {
        "kort": "a165b178",
        "sku": "FP-garagetalt-120x179-morkgra",
        "name": "Garagetält 120 × 179 cm i mörkgrått – sadeltak och 15 spännlinor",
        "slug": "garagetalt-120x179-cm-morkgra",
        "title": "Garagetält 120 × 179 cm, mörkgrått | Fyndplats",
        "meta": ("Litet garagetält på galvaniserad stålstomme, 120 × 179 × "
                 "165 cm i mörkgrått. Sadeltak, dörr 106 × 126 cm, sex "
                 "markankare och femton spännlinor ingår."),
        "ingress":
            "<p><strong>Den mörka duken syns mindre mot ett plank.</strong> "
            "Det är hela skillnaden mot det ljusa syskonet — måtten, dörren "
            "och stommen är desamma, och 120 × 179 cm är fortfarande "
            "familjens minsta fotavtryck.</p>"
            "<p><strong>Två cyklar eller en motorcykel är den angivna "
            "kapaciteten.</strong> Dörren mäter 106 × 126 cm, nocken sitter "
            "på 165 cm och takfoten på 134 cm, så det är ett tält du "
            "sträcker in saker i snarare än går in i.</p>"
            "<p><strong>Sex markankare, sex skruvar och femton spännlinor "
            "ingår.</strong> Stommen är galvaniserat stål och duken PE, och "
            "monteringsanvisningen säger att tältet ska stå mot en vägg för "
            "att tåla vind bättre.</p>"
            "<p>Vill du hellre ha den ljusa tonen finns "
            + lank("garagetalt-120x179-cm-ljusgra", "samma tält i ljusgrått")
            + ". Ska det rymma mer än två cyklar är "
            + lank("cykelgarage-245-cm-brett-bagformat-tak",
                   "cykelgaraget på 245 cm")
            + " byggt bredare i stället för djupare.</p>",
        "eg": [
            "120 × 179 cm på marken, 165 cm i nock",
            "Takfot 134 cm",
            "Sadeltak som leder av regn åt två håll",
            "Dörr 106 × 126 cm med dragkedja",
            "Galvaniserad stålstomme, duk i PE",
            "Mörkgrå duk",
            "Sex markankare, sex skruvar och femton spännlinor ingår",
            "Monteras, verktyg ingår inte",
        ],
        "spec": [
            "Yttermått (B × D × H): 120 × 179 × 165 cm",
            "Grundyta: 2,1 m²",
            "Takfotshöjd: 134 cm",
            "Dörr (B × H): 106 × 126 cm",
            "Tak: sadeltak",
            "Stomme: galvaniserat stål",
            "Duk: PE",
            "Färg: mörkgrå",
            "Snölast: anges inte",
            "Vikt med emballage: 14 kg",
            "Paketmått: 119,5 × 23 × 20 cm",
            "Montering: krävs",
            "Ingår: tält, 6 markankare, 6 skruvar, 15 spännlinor, monteringsanvisning",
        ],
        "villkor": ("Snö, vind och var tältet ska stå", [
            "Ingen snölast anges för det här tältet, och vi gissar inte fram "
            "en siffra. Rådet är detsamma ändå: borsta av snön innan den "
            "hinner packa sig. Ett duktak bär inte som ett plåttak, och "
            "blötsnö fastnar även på ett sadeltak.",
            "Monteringsanvisningen säger att tältet ska stå mot en vägg för "
            "att tåla vind bättre — därför följer femton spännlinor med. En mörk "
            "duk i lä av ett plank är dessutom det läge där tältet syns "
            "minst.",
            "På gräs går markankarna hela vägen ner. På asfalt eller plattor "
            "gör de det inte, och då blir väggen och tyngder i hörnen det som "
            "håller tältet på plats.",
        ]),
        "skotsel": [DUK_SKOTSEL, STOMME_SKOTSEL, SPANN_SKOTSEL],
        "faq": [
            ("Vad skiljer det från det ljusgrå?",
             "Bara dukens färg. Mått, dörr, stomme och leveransinnehåll är "
             "identiska."),
            ("Kan jag gå in i tältet?",
             "Inte stående — nocken sitter på 165 cm och takfoten på 134 cm."),
            ("Går det att låsa?",
             "Nej. Dörren stängs med dragkedja och har inget beslag för "
             "hänglås."),
            ("Ingår förankring?",
             "Ja — sex markankare, sex skruvar och femton spännlinor. Verktyg "
             "ingår inte."),
            ("Blir en mörk duk varmare i solen?",
             "En mörk yta värms mer av sol än en ljus. Tältet är ventilerat "
             "genom dörröppningen, men förvara inget som är känsligt för "
             "värme i det under sommaren."),
        ],
    },

    # ══ 3. 5f6592ad — 162 × 221,5, mörkgrå ════════════════════════════════
    {
        "kort": "5f6592ad",
        "sku": "FP-garagetalt-162x222-morkgra",
        "name": "Garagetält 162 × 221,5 cm i mörkgrått – sadeltak och 10 kg/m² snölast",
        "slug": "garagetalt-162x222-cm-morkgra",
        "title": "Garagetält 162 × 221,5 cm, mörkgrått | Fyndplats",
        "meta": ("Garagetält på galvaniserad stålstomme, 162 × 221,5 × 163 "
                 "cm. Sadeltak, angiven snölast 10 kg/m², upprullbar "
                 "dragkedjedörr 130 × 126 cm."),
        "ingress":
            "<p><strong>3,6 kvadratmeter på marken och 163 cm i "
            "nock.</strong> Det är djupet som gör skillnaden: 221,5 cm räcker "
            "för en motorcykel eller ett par cyklar efter varandra i stället "
            "för bredvid varandra.</p>"
            "<p><strong>Dörren rullas upp och buntas i toppen.</strong> "
            "Öppningen är 130 × 126 cm, och invändigt mäter tältet "
            "152 × 212 × 160 cm — bottenramen tar några centimeter av "
            "yttermåttet.</p>"
            "<p><strong>Snölasten är angiven till 10 kg per "
            "kvadratmeter.</strong> Det är ett av två tält i familjen som har "
            "en siffra alls, och det är en gräns snarare än en garanti. Mer "
            "om vad det betyder i praktiken står längre ned.</p>"
            "<p>Samma tält finns "
            + lank("garagetalt-162x222-cm-ljusgra", "i ljusgrått")
            + ". Räcker inte ytan är "
            + lank("garagetalt-190x230-cm-220-cm-hogt",
                   "190 × 230 cm med 220 cm i nock")
            + " nästa storlek, och den är hög nog att gå in i.</p>",
        "eg": [
            "162 × 221,5 cm på marken, 163 cm i nock",
            "Invändigt 152 × 212 × 160 cm",
            "Sadeltak med nock på mitten",
            "Upprullbar dörr 130 × 126 cm med dragkedja",
            "Angiven snölast 10 kg/m²",
            "Angiven vindtålighet upp till Beaufort 5",
            "Galvaniserad stålstomme, UV-skyddad PE-duk",
            "Mörkgrå duk",
            "Sex markankare ingår",
        ],
        "spec": [
            "Yttermått (B × D × H): 162 × 221,5 × 163 cm",
            "Grundyta: 3,6 m²",
            "Invändigt (B × D × H): 152 × 212 × 160 cm",
            "Bottenram (B × D): 157 × 218 cm",
            "Dörr (B × H): 130 × 126 cm, upprullbar",
            "Tak: sadeltak",
            "Snölast: 10 kg/m²",
            "Vindtålighet: upp till Beaufort 5",
            "Stomme: galvaniserat stål",
            "Duk: PE, UV-skyddad",
            "Färg: mörkgrå",
            "Vikt med emballage: 17 kg",
            "Paketmått: 120 × 27 × 21 cm",
            "Montering: krävs",
            "Ingår: tält, 6 markankare, monteringsanvisning",
        ],
        "villkor": ("Vad 10 kg per kvadratmeter faktiskt betyder", [
            "Snölasten är angiven till 10 kg/m². Det är en gräns, inte en "
            "garanti — och det är ett lågt tal. Till jämförelse ligger "
            + lank("platbod-240x206-cm-snolast-30-kg-las-9-stodpelare",
                   "plåtboden i vårt sortiment med 30 kg/m²")
            + " tre gånger så högt, och även den behöver skottas vid "
              "rikligt snöfall.",
            "Det praktiska svaret är att snön ska bort medan den är lätt. En "
            "kvast räcker, och sadeltaket hjälper till genom att luta åt två "
            "håll. Ligger snön kvar och blir blöt väger den flera gånger mer "
            "än nyfallen snö gör.",
            "Vindtåligheten anges till Beaufort 5 — frisk bris. Det är "
            "vardagsväder på en öppen tomt, inte storm, så ställ tältet i lä "
            "och använd markankarna. Tältet väger sjutton kilo och står inte "
            "kvar av sin egen tyngd.",
        ]),
        "skotsel": [DUK_SKOTSEL, STOMME_SKOTSEL, SPANN_SKOTSEL],
        "faq": [
            ("Vad betyder snölasten 10 kg/m²?",
             "Det är den vikt taket ska klara per kvadratmeter enligt den "
             "angivna specifikationen. Behandla den som en gräns och inte "
             "som en garanti: borsta av snön innan den packar sig."),
            ("Kan jag gå in i tältet?",
             "Nocken sitter på 163 cm och invändiga höjden är 160 cm, så du "
             "kliver in något böjd. Dörren är 130 cm bred och 126 cm hög."),
            ("Får en motorcykel plats?",
             "Produktbilderna visar tältet med en motorcykel inne, och "
             "djupet är 212 cm invändigt. Mät din motorcykel mot det "
             "måttet innan du beställer — 212 cm är innermåttet, inte "
             "dörröppningen."),
            ("Ingår förankring?",
             "Sex markankare ingår. Spännlinor följer inte med till det "
             "här tältet."),
            ("Vad skiljer det från det ljusgrå?",
             "Bara dukens färg. Mått, dörr, snölast och leveransinnehåll är "
             "identiska."),
        ],
    },

    # ══ 4. 20c0942e — 162 × 221,5, ljusgrå ════════════════════════════════
    {
        "kort": "20c0942e",
        "sku": "FP-garagetalt-162x222-ljusgra",
        "name": "Garagetält 162 × 221,5 cm i ljusgrått – sadeltak och 10 kg/m² snölast",
        "slug": "garagetalt-162x222-cm-ljusgra",
        "title": "Garagetält 162 × 221,5 cm, ljusgrått | Fyndplats",
        "meta": ("Garagetält på galvaniserad stålstomme, 162 × 221,5 × 163 "
                 "cm i ljusgrått. Sadeltak, angiven snölast 10 kg/m², "
                 "upprullbar dörr 130 × 126 cm."),
        "ingress":
            "<p><strong>Den ljusa duken släpper in mer dagsljus.</strong> "
            "Ett duktält har inga fönster att räkna med, och skillnaden mot "
            "den mörka versionen märks när dörren är stängd och du letar "
            "efter något längst in.</p>"
            "<p><strong>162 × 221,5 cm på marken, 163 cm i nock.</strong> "
            "Invändigt blir det 152 × 212 × 160 cm. Dörren rullas upp och "
            "buntas i toppen, och öppningen är 130 × 126 cm.</p>"
            "<p><strong>Snölasten är angiven till 10 kg per "
            "kvadratmeter.</strong> Duken är UV-skyddad PE på galvaniserad "
            "stålstomme, och sex markankare följer med.</p>"
            "<p>Samma tält finns "
            + lank("garagetalt-162x222-cm-morkgra", "i mörkgrått")
            + ". Är det för stort är "
            + lank("garagetalt-120x179-cm-ljusgra",
                   "120 × 179 cm i samma ljusa ton")
            + " familjens minsta.</p>",
        "eg": [
            "162 × 221,5 cm på marken, 163 cm i nock",
            "Invändigt 152 × 212 × 160 cm",
            "Sadeltak med nock på mitten",
            "Upprullbar dörr 130 × 126 cm med dragkedja",
            "Angiven snölast 10 kg/m²",
            "Angiven vindtålighet upp till Beaufort 5",
            "Galvaniserad stålstomme, UV-skyddad PE-duk",
            "Ljusgrå duk",
            "Sex markankare ingår",
        ],
        "spec": [
            "Yttermått (B × D × H): 162 × 221,5 × 163 cm",
            "Grundyta: 3,6 m²",
            "Invändigt (B × D × H): 152 × 212 × 160 cm",
            "Bottenram (B × D): 157 × 218 cm",
            "Dörr (B × H): 130 × 126 cm, upprullbar",
            "Tak: sadeltak",
            "Snölast: 10 kg/m²",
            "Vindtålighet: upp till Beaufort 5",
            "Stomme: galvaniserat stål",
            "Duk: PE, UV-skyddad",
            "Färg: ljusgrå",
            "Vikt med emballage: 17 kg",
            "Paketmått: 120 × 27 × 21 cm",
            "Montering: krävs",
            "Ingår: tält, 6 markankare, monteringsanvisning",
        ],
        "villkor": ("Vad 10 kg per kvadratmeter faktiskt betyder", [
            "Snölasten är angiven till 10 kg/m². Det är en gräns och inte en "
            "garanti. Till jämförelse ligger "
            + lank("platbod-240x206-cm-snolast-30-kg-las-9-stodpelare",
                   "plåtboden i vårt sortiment med 30 kg/m²")
            + " tre gånger så högt, och även den ska skottas vid rikligt "
              "snöfall.",
            "Borsta av snön medan den är lätt. Sadeltaket lutar åt två håll "
            "och hjälper till, men blötsnö fastnar på duk och väger flera "
            "gånger mer än nyfallen snö.",
            "Vindtåligheten anges till Beaufort 5, alltså frisk bris. Ställ "
            "tältet i lä av en vägg eller ett plank och slå ner markankarna "
            "innan du fyller det.",
        ]),
        "skotsel": [DUK_SKOTSEL, STOMME_SKOTSEL, SPANN_SKOTSEL],
        "faq": [
            ("Vad betyder snölasten 10 kg/m²?",
             "Det är den vikt taket ska klara per kvadratmeter enligt den "
             "angivna specifikationen. Behandla den som en gräns: borsta av "
             "snön innan den hinner packa sig."),
            ("Är den ljusa duken tunnare?",
             "Nej. Duken är samma UV-skyddade PE i båda versionerna — det är "
             "bara färgen som skiljer."),
            ("Kan jag gå in i tältet?",
             "Invändiga höjden är 160 cm, så du kliver in något böjd. Dörren "
             "är 130 × 126 cm."),
            ("Ingår förankring?",
             "Sex markankare ingår. Spännlinor följer inte med till det "
             "här tältet."),
            ("Hur monteras det?",
             "Stommen skruvas ihop av galvaniserade rör och duken träs över "
             "och spänns fast. Verktyg ingår inte, och det går lättare med "
             "två personer eftersom duken ska sitta jämnt spänd."),
        ],
    },

    # ══ 5. 8bdba748 — 245 × 120, cykelgarage ══════════════════════════════
    {
        "kort": "8bdba748",
        "sku": "FP-cykelgarage-245-bagformat",
        "name": "Cykelgarage 245 cm brett med bågformat tak – 200 g/m² duk i ett stycke",
        "slug": "cykelgarage-245-cm-brett-bagformat-tak",
        "title": "Cykelgarage 245 cm brett, bågformat tak | Fyndplats",
        "meta": ("Cykelgarage 245 × 120 × 200 cm på galvaniserad stomme. "
                 "Bågformat tak, duk på 200 g/m² i ett stycke utan söm, "
                 "upprullbar dörr 157 × 160 cm."),
        "ingress":
            "<p><strong>245 cm brett och bara 120 cm djupt.</strong> Det är "
            "formen som skiljer det från resten: cyklarna står bredvid "
            "varandra i stället för på rad, och tältet tar en remsa längs "
            "väggen i stället för ett block ute på gräsmattan.</p>"
            "<p><strong>Taket är bågformat.</strong> Det är det enda i "
            "familjen som inte har sadeltak, och bågen är det som ger 200 cm "
            "i högsta punkten på ett så grunt tält — invändigt 240 × 115 × "
            "198 cm.</p>"
            "<p><strong>Duken väger 200 g/m² och är sydd i ett "
            "stycke.</strong> Sömlösheten är själva poängen: det "
            "finns ingen skarv i taket där vatten kan leta sig in. Dörren "
            "rullas upp och är 157 × 160 cm när den är öppen.</p>"
            "<p><strong>Ingen förankring ingår.</strong> Läs stycket om det "
            "längre ned innan du beställer — det är det enda tältet i "
            "familjen som levereras utan markankare.</p>"
            "<p>Behöver du gå in stående finns "
            + lank("garagetalt-190x230-cm-220-cm-hogt",
                   "garagetältet på 190 × 230 cm med 220 cm i nock")
            + ". Söker du något lättare för en enda cykel finns "
            + lank("cykeltalt-silverbelagd-oxford",
                   "cykeltältet i Oxfordduk på glasfiberstommar")
            + ", som packas i en bärväska mellan säsongerna.</p>",
        "eg": [
            "245 × 120 cm på marken, 200 cm i högsta punkten",
            "Bågformat tak — familjens enda",
            "Invändigt 240 × 115 × 198 cm",
            "Duk på 200 g/m², sydd i ett stycke utan söm i taket",
            "Upprullbar dragkedjedörr 157 × 160 cm",
            "Galvaniserad metallstomme",
            "15 cm bred kant längs marken",
            "Mörkgrå duk",
            "Ingen förankring ingår",
        ],
        "spec": [
            "Yttermått (B × D × H): 245 × 120 × 200 cm",
            "Grundyta: 2,9 m²",
            "Invändigt (B × D × H): 240 × 115 × 198 cm",
            "Bottenmått (B × D): 245 × 120 cm",
            "Dörr (B × H): 157 × 160 cm, upprullbar",
            "Tak: bågformat",
            "Duk: 200 g/m², i ett stycke",
            "Stomme: galvaniserad metall",
            "Kantbredd mot marken: 15 cm",
            "Färg: mörkgrå",
            "Snölast: anges inte",
            "Vikt med emballage: 12,6 kg",
            "Paketmått: 141 × 32 × 15 cm",
            "Montering: krävs",
            "Ingår: tält och monteringsanvisning",
        ],
        "villkor": ("Förankringen ingår inte — och den behövs", [
            "Leveransen består av tältet och monteringsanvisningen. Inga "
            "markankare, inga spännlinor, inga skruvar. Det är den enda "
            "produkten i familjen som saknar förankringsmaterial, och den "
            "väger 12,6 kg — minst av alla.",
            "Räkna alltså in markankare eller jordspett i beställningen. På "
            "gräs räcker vanliga tältpinnar av kraftigare slag; på asfalt "
            "eller plattor behövs i stället tyngder i hörnen eller spännlinor "
            "till något fast.",
            "Den 15 cm breda kanten längs marken är gjord för att belastas — "
            "den viks ut och kan läggas under plattor eller tyngder. Ett "
            "obelastat duktält på 2,9 kvadratmeter är i praktiken ett segel.",
            "Snölast anges inte för det här tältet, och vi gissar inte fram "
            "en siffra. Bågtaket är brantare i kanterna än ett sadeltak och "
            "släpper snö bättre där, men mitt på bågen ligger snön kvar. "
            "Borsta av den.",
        ]),
        "skotsel": [DUK_SKOTSEL, STOMME_SKOTSEL, SPANN_SKOTSEL],
        "faq": [
            ("Hur många cyklar får plats?",
             "Bredden är 240 cm invändigt och djupet 115 cm, alltså står "
             "cyklarna bredvid varandra. Produktbilderna visar två vuxencyklar "
             "i bredd med utrymme över."),
            ("Ingår markpinnar?",
             "Nej. Leveransen är tältet och monteringsanvisningen. Förankring "
             "får du köpa separat, och den behövs."),
            ("Är duken tät i taket?",
             "Duken är sydd i ett stycke, så det finns ingen söm i taket att "
             "läcka igenom. Den väger 200 g/m²."),
            ("Kan jag gå in i tältet?",
             "Invändiga höjden är 198 cm i bågens högsta punkt, men djupet är "
             "bara 115 cm — det är ett tält du går in i, inte ett du rör dig "
             "runt i."),
            ("Vad skiljer det från cykeltältet i Oxfordduk?",
             "Det här står på en galvaniserad metallstomme och är byggt för "
             "att stå kvar. Oxfordtältet har glasfiberstommar, är lättare och "
             "packas i en bärväska mellan säsongerna."),
        ],
    },

    # ══ 6. 0f5e3fea — 190 × 230, 2,2 m i nock ═════════════════════════════
    {
        "kort": "0f5e3fea",
        "sku": "FP-garagetalt-190x230-hogt",
        "name": "Garagetält 190 × 230 cm med 220 cm i nock – gå in stående",
        "slug": "garagetalt-190x230-cm-220-cm-hogt",
        "title": "Garagetält 190 × 230 cm, 220 cm högt | Fyndplats",
        "meta": ("Garagetält 190 × 230 × 220 cm på galvaniserad stålstomme "
                 "med Ø25 mm rör. Dörr 147 × 185 cm, bakre ventil, 16 "
                 "markankare och 4 spännlinor ingår."),
        "ingress":
            "<p><strong>220 cm i nock — det första tältet i familjen du går "
            "in i stående.</strong> Dörren är 147 cm bred och 185 cm hög, så "
            "du rullar in en gräsklippare utan att böja dig och kan vända dig "
            "om därinne.</p>"
            "<p><strong>190 × 230 cm på marken, 4,4 kvadratmeter.</strong> "
            "Invändigt blir det 184 × 225 cm med full höjd hela vägen upp. "
            "Rören i stommen är Ø25 mm galvaniserat stål.</p>"
            "<p><strong>Baktill sitter en ventil på 33 × 36 cm.</strong> Den "
            "är det som skiljer ett tält du kan ställa en gräsklippare i från "
            "ett som luktar bensin och fukt när du öppnar nästa gång.</p>"
            "<p><strong>Förankringen är den mest omfattande i "
            "familjen:</strong> 16 markankare, 12 expanderskruvar, 4 "
            "spännlinor och 12 gummispännare.</p>"
            "<p>Räcker inte ytan är "
            + lank("garagetalt-300x300-cm-9-kvm", "300 × 300 cm med 9 m²")
            + " nästa steg. Ska det bara rymma cyklar är "
            + lank("cykelgarage-245-cm-brett-bagformat-tak",
                   "cykelgaraget på 245 cm")
            + " grundare och tar mindre plats på djupet.</p>",
        "eg": [
            "190 × 230 cm på marken, 220 cm i nock",
            "Invändigt 184 × 225 × 220 cm",
            "Dörr 147 × 185 cm — gå in stående",
            "Bakre ventil 33 × 36 cm",
            "Stomrör Ø25 mm i galvaniserat stål",
            "Vattenavvisande polyesterduk med UV30+",
            "Angiven snölast 5 kg/m²",
            "16 markankare, 12 expanderskruvar, 4 spännlinor och 12 gummispännare ingår",
            "Mörkgrå duk",
        ],
        "spec": [
            "Yttermått (B × D × H): 190 × 230 × 220 cm",
            "Grundyta: 4,4 m²",
            "Invändigt (B × D × H): 184 × 225 × 220 cm",
            "Bottenmått (D × B): 230 × 190 cm",
            "Dörr (B × H): 147 × 185 cm, upprullbar",
            "Bakre ventil (B × H): 33 × 36 cm",
            "Tak: sadeltak",
            "Stomrör: Ø25 mm",
            "Snölast: 5 kg/m²",
            "Stomme: galvaniserat stål",
            "Duk: polyester, vattenavvisande, UV30+",
            "Färg: mörkgrå",
            "Vikt med emballage: 18,5 kg",
            "Paketmått: 135 × 35 × 18 cm",
            "Montering: krävs",
            "Ingår: tält, 16 markankare, 12 expanderskruvar, 4 spännlinor, 12 gummispännare, monteringsanvisning",
        ],
        "villkor": ("Fem kilo per kvadratmeter är familjens lägsta siffra", [
            "Snölasten är angiven till 5 kg/m². Det är det lägsta talet bland "
            "de tält i familjen som anger något alls, och det är en sjättedel "
            "av vad "
            + lank("platbod-240x206-cm-snolast-30-kg-las-9-stodpelare",
                   "plåtboden i vårt sortiment med 30 kg/m²")
            + " klarar. Behandla det som en gräns och inte som en garanti.",
            "I praktiken betyder det att snön ska bort så fort den lagt sig. "
            "Ett par centimeter blötsnö över 4,4 kvadratmeter blir tungt fort, "
            "och ett duktak ger efter innan det brister — det syns som en "
            "sänka i taket, och då är det redan för sent att vänta.",
            "Ska tältet stå kvar över vintern är det snöröjningen som avgör "
            "om det gör det helskinnat. Alternativet är att ta av duken och "
            "låta stommen stå — den tar ingen snölast alls när det inte sitter "
            "något tak på den.",
            "Fästpunkterna är av tre slag med olika uppgift. Markankarna "
            "går i jord, expanderskruvarna i hårt underlag som plattor "
            "eller betong där ankarna inte går ner, och spännlinorna med "
            "sina gummispännare håller duken mot stommen när det blåser.",
        ]),
        "skotsel": [DUK_SKOTSEL, STOMME_SKOTSEL, SPANN_SKOTSEL],
        "faq": [
            ("Kan jag gå in stående?",
             "Ja. Nocken sitter på 220 cm och dörren är 185 cm hög och 147 cm "
             "bred."),
            ("Är duken vattentät?",
             "Duken är angiven som vattenavvisande polyester med UV30+. Vi "
             "skriver inte mer än så: taket leder av regn, men "
             "förvara inget som absolut inte får bli fuktigt utan att packa "
             "in det."),
            ("Vad är ventilen bra för?",
             "Den sitter baktill och mäter 33 × 36 cm. Den ger ett "
             "luftutbyte, vilket spelar roll om du ställer in en gräsklippare "
             "eller något annat som avger fukt och lukt."),
            ("Vad betyder snölasten 5 kg/m²?",
             "Det är den vikt taket ska klara per kvadratmeter enligt den "
             "angivna specifikationen, och det är familjens lägsta siffra. Låt inte snön "
             "ligga kvar."),
            ("Vad ingår i förankringen?",
             "16 markankare, 12 expanderskruvar, 4 spännlinor och 12 "
             "gummispännare. Expanderskruvarna är för hårt underlag."),
        ],
    },

    # ══ 7. 6a419d8b — 300 × 300, 9 m² ═════════════════════════════════════
    {
        "kort": "6a419d8b",
        "sku": "FP-garagetalt-300x300-cm",
        "name": "Garagetält 300 × 300 cm med 9 m² golvyta – förstärkt stomme och tålig duk",
        "slug": "garagetalt-300x300-cm-9-kvm",
        "title": "Garagetält 300 × 300 cm, 9 m² | Fyndplats",
        "meta": ("Garagetält 300 × 300 × 210 cm med 9 m² golvyta. Förstärkt "
                 "galvaniserad stomme med extra stag, duk på 200 g/m², dörr "
                 "166 × 172 cm. Handskar ingår."),
        "ingress":
            "<p><strong>Nio kvadratmeter — dubbelt så mycket golv som "
            "familjens näst största.</strong> 300 × 300 cm rymmer ett "
            "hyllställ längs ena väggen och en åkgräsklippare bredvid, vilket "
            "är precis vad produktbilderna visar.</p>"
            "<p><strong>Stommen har extra stag.</strong> Det är den "
            "förstärkning som gör ett tre meter brett spann möjligt: ju "
            "bredare tältet är, desto mer måste stommen hålla emot av sig "
            "själv.</p>"
            "<p><strong>Duken väger 200 g/m² och är rivtålig.</strong> Kanten "
            "mot marken är 15 cm bred och avsedd att belastas, och fyra "
            "jordspett med spännlinor följer med.</p>"
            "<p><strong>Dörren är 166 × 172 cm och rullas upp mot "
            "taket.</strong> Ett par handskar ingår för monteringen — "
            "stommen är många meter galvaniserat rör som ska skruvas ihop.</p>"
            "<p>Behöver du mer än nio kvadratmeter finns "
            + lank("forradstalt-300x447-cm-13-kvm",
                   "förrådstältet på 300 × 447 cm")
            + ". Räcker hälften är "
            + lank("garagetalt-190x230-cm-220-cm-hogt",
                   "190 × 230 cm med 220 cm i nock")
            + " snabbare att ställa upp och lättare att flytta.</p>",
        "eg": [
            "300 × 300 cm på marken, 9 m² golvyta",
            "210 cm i nock",
            "Invändigt 290 × 290 × 197 cm",
            "Bottenram 295 × 295 cm",
            "Förstärkt galvaniserad stomme med extra stag",
            "Rivtålig duk på 200 g/m²",
            "Upprullbar dragkedjedörr 166 × 172 cm",
            "15 cm bred kant mot marken",
            "Fyra jordspett, fyra spännlinor och ett par handskar ingår",
        ],
        "spec": [
            "Yttermått (B × D × H): 300 × 300 × 210 cm",
            "Golvyta: 9 m²",
            "Invändigt (B × D × H): 290 × 290 × 197 cm",
            "Bottenram (B × D): 295 × 295 cm",
            "Dörr (B × H): 166 × 172 cm, upprullbar",
            "Kantbredd mot marken: 15 cm",
            "Tak: sadeltak",
            "Stomme: galvaniserat stål med extra stag",
            "Duk: 200 g/m², rivtålig",
            "Färg: mörkgrå",
            "Snölast: anges inte",
            "Vikt med emballage: 23 kg",
            "Paketmått: 157 × 34 × 18 cm",
            "Montering: krävs",
            "Ingår: tält, 4 jordspett, 4 spännlinor, ett par handskar, monteringsanvisning",
        ],
        "villkor": ("Nio kvadratmeter duk fångar mer väder", [
            "Ytan är det som gör skillnaden åt båda hållen. Nio kvadratmeter "
            "är gott om plats därinne — och nio kvadratmeter duk är också det "
            "som vinden tar tag i och som snön lägger sig på.",
            "Snölast anges inte för det här tältet, och vi gissar inte fram "
            "en. Rådet är detsamma som för de tält som har en siffra: borsta "
            "av snön medan den är lätt, och räkna med att det tar längre tid "
            "på ett tak av den här storleken.",
            "Fyra jordspett och fyra spännlinor ingår — färre än till "
            + lank("garagetalt-190x230-cm-220-cm-hogt",
                   "det mindre tältet på 190 × 230 cm")
            + ". Har du en blåsig tomt är extra förankring det första du bör "
              "komplettera med, och den 15 cm breda markkanten är gjord för "
              "att belastas.",
            "Handskarna som ingår är inte en artighet. Stommen är många meter "
            "galvaniserat rör med skarvar och skruv, och ett par händer utan "
            "skydd blir repiga långt innan tältet står.",
        ]),
        "skotsel": [DUK_SKOTSEL, STOMME_SKOTSEL, SPANN_SKOTSEL],
        "faq": [
            ("Får en bil plats?",
             "Golvytan är 9 m² och dörren 166 × 172 cm. Det är för smalt och "
             "för lågt för en personbil — produktbilderna visar tältet med "
             "hyllställ och åkgräsklippare, och det är den användningen "
             "måtten passar."),
            ("Hur högt är det invändigt?",
             "197 cm i nock invändigt, 210 cm utvändigt. Du går in stående, "
             "och dörröppningen är 172 cm hög."),
            ("Ingår förankring?",
             "Fyra jordspett, fyra spännlinor och ett par handskar. På en "
             "blåsig tomt bör du komplettera med fler."),
            ("Varför ingår handskar?",
             "Stommen är många meter galvaniserat rör som skruvas ihop, och "
             "kanterna är vassa på skarvarna."),
            ("Vad är skillnaden mot det största tältet?",
             "Ytan och höjden. "
             + lank("forradstalt-300x447-cm-13-kvm",
                    "Förrådstältet på 300 × 447 cm med 13,4 m² och 255 cm i nock")
             + " är nästa storlek upp, och det har ett nätfönster på sidan "
               "som det här saknar."),
        ],
    },

    # ══ 8. 95a9d7cc — 300 × 447, 13,4 m² ══════════════════════════════════
    {
        "kort": "95a9d7cc",
        "sku": "FP-forradstalt-300x447-cm",
        "name": "Förrådstält 300 × 447 cm med 13,4 m² – nätfönster och 200 cm takfot",
        "slug": "forradstalt-300x447-cm-13-kvm",
        "title": "Förrådstält 300 × 447 cm, 13,4 m² | Fyndplats",
        "meta": ("Förrådstält 300 × 447 × 255 cm med 13,4 m² golvyta. "
                 "Sadeltak, takfot 200 cm, dörr 237 × 190 cm, nätfönster "
                 "47 × 56 cm och 20 jordspett."),
        "ingress":
            "<p><strong>13,4 kvadratmeter — familjens största.</strong> "
            "300 × 447 cm är ett rum, inte ett skjul: en motorcykel och ett "
            "hyllställ samtidigt, med gång emellan.</p>"
            "<p><strong>Takfoten sitter på 200 cm.</strong> Det är det viktiga "
            "måttet i ett stort tält, för det säger hur mycket av ytan du kan "
            "gå upprätt på. Här är det hela golvet — nocken sitter på 255 cm "
            "och väggarna är fulla två meter.</p>"
            "<p><strong>Dörren är 237 cm bred.</strong> Den rullas upp och "
            "öppningen blir 237 × 190 cm, så en motorcykel eller en "
            "trädgårdstraktor rullar in utan att du behöver rikta in den.</p>"
            "<p><strong>Nätfönstret på 47 × 56 cm släpper in ljus och "
            "luft.</strong> Duken är tät hela vägen runt i övrigt, så det är "
            "fönstret som avgör om tältet är mörkt eller om du ser vad du "
            "gör därinne.</p>"
            "<p><strong>Tjugo jordspett och 28 gummiband ingår.</strong> Det "
            "är den största mängd förankring i familjen, och den behövs över "
            "en så här stor duk.</p>"
            "<p>Är det för stort är "
            + lank("garagetalt-300x300-cm-9-kvm", "300 × 300 cm med 9 m²")
            + " nästa storlek ned. Vill du hellre ha ett fast förråd finns "
            + lank("redskapsbod-metall-2-81-m2-skjutdorr-morkgra",
                   "redskapsboden i galvaniserad plåt med skjutdörr")
            + ".</p>",
        "eg": [
            "300 × 447 cm på marken, 13,4 m² golvyta",
            "255 cm i nock, takfot på 200 cm",
            "Sadeltak",
            "Upprullbar dragkedjedörr 237 × 190 cm",
            "Nätfönster 47 × 56 cm",
            "Galvaniserad metallstomme, vattentät och UV-beständig PE-duk",
            "Ljusgrå duk",
            "20 jordspett och 28 gummiband ingår",
            "Monteras, verktyg ingår inte",
        ],
        "spec": [
            "Yttermått (B × D × H): 300 × 447 × 255 cm",
            "Golvyta: 13,4 m²",
            "Takfotshöjd: 200 cm",
            "Dörr (B × H): 237 × 190 cm, upprullbar",
            "Fönster (B × H): 47 × 56 cm, nät",
            "Tak: sadeltak",
            "Stomme: galvaniserad metall",
            "Duk: PE, vattentät och UV-beständig",
            "Färg: ljusgrå",
            "Snölast: anges inte",
            "Vikt med emballage: 54,5 kg",
            "Paketmått: 195 × 34 × 20 cm",
            "Montering: krävs",
            "Ingår: tält, 20 jordspett, 28 gummiband, monteringsanvisning",
        ],
        "villkor": ("Tjugo jordspett över 13,4 kvadratmeter", [
            "Tjugo jordspett över 13,4 kvadratmeter är den tätaste "
            "förankringen i familjen, och den är dimensionerad för en duk som "
            "fångar mycket väder. Slå ner allihop, inte bara hörnen.",
            "Snölast anges inte för det här tältet. Vi gissar inte fram en "
            "siffra, och storleken gör frågan viktigare snarare än mindre: "
            "ett tak på 13,4 kvadratmeter samlar mer snö än ett på fyra, och "
            "det tar längre tid att göra rent.",
            "Sadeltaket leder av åt två håll, men nocken är lång och "
            "väggarna raka upp till takfoten på 200 cm. Det är i övergången "
            "mellan tak och vägg snön lägger sig och blir kvar.",
            "Tältet väger 54,5 kilo i emballaget och kommer i ett paket som "
            "är nästan två meter långt. Räkna med två personer både vid "
            "hemtransporten och vid resningen.",
        ]),
        "skotsel": [DUK_SKOTSEL, STOMME_SKOTSEL, SPANN_SKOTSEL],
        "faq": [
            ("Kan jag gå upprätt i hela tältet?",
             "Ja. Takfoten sitter på 200 cm, alltså är väggarna fulla två "
             "meter höga hela vägen ut, och nocken sitter på 255 cm."),
            ("Hur brett är det att köra in?",
             "Dörren är 237 cm bred och 190 cm hög när den är upprullad."),
            ("Vad har fönstret för funktion?",
             "Det är ett nätfönster på 47 × 56 cm som ger dagsljus och "
             "luftutbyte. Nätet gör att det kan stå öppet."),
            ("Går det att montera ensam?",
             "Vi rekommenderar två personer. Paketet väger 54,5 kg, duken är "
             "stor och den ska sitta jämnt spänd över stommen."),
            ("Ingår förankring?",
             "20 jordspett och 28 gummiband. Använd alla — en duk på 13,4 "
             "kvadratmeter fångar mycket vind."),
        ],
    },
]
