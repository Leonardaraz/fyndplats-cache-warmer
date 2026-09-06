# -*- coding: utf-8 -*-
"""Runda 86 — sju trädgårdsskåp i trä.

☠️ Batch 64 mätte skillnaden: fem produkter skrivna inline i API-anropet gav
NIO fel som nådde Wix, tre skrivna via fil gav noll. Texten skrivs därför HÄR.

☠️ RUNDANS GRIND ÄR MAXLASTEN, OCH DEN SPRIDER SIG ÖVER EN FAKTOR ÅTTA.
   `c9a24404` och `bb112e08` bär 6 kg per hyllplan, `364bc564` bär 20,
   `8b00022f` 40, och `43e312b7` har TRE olika tal i samma spec (5 kg i det
   lilla facket, 30 kg på den nedre hyllan, 10 kg på bordet). `d6666869`
   anger INGET tal alls. Att kopiera grannens siffra är rundans naturligaste
   fel, och en för hög maxlast på ett hyllplan i gran är inte kosmetika.

☠️ `d6666869` HAR INGEN MAXLAST ATT SLÅ UPP, och får därför ingen. Samma
   regel som runda 84:s batteristorlek: en uppgift källan inte ger får inte
   uppstå i vår text, och avsaknaden får inte heller bli sidans rubrik.

☠️ FÖRANKRINGEN INGÅR I BARA TVÅ AV SJU. `43e312b7` och `8b00022f` levereras
   med L-järn och markpinnar; de fem andra har bara monteringsanvisning i
   sin `Lieferumfang`. Ett 1,9 m högt skåp i gran som väger 24,5 kg är lätt
   för sin höjd, och att alla sju vore förankringsklara är en mening som
   skriver sig själv om man inte läser varje `Lieferumfang` för sig.

☠️ TRE AV DE SVENSKA FÄRGRADERNA ÄR FEL. Importen satte `Grün, Braun, Beige`
   på det GRÅ skåpet `43e312b7`, `Grün, Orange, Weiß` på det grå-vita
   `bb112e08`, och `Braun` på det naturfärgade `364bc564`. Tyskans
   `Technische Daten` och bilden säger samma sak i alla tre fallen, och det
   är den källan som gäller.

☠️ `Vikt` I DEN MASKINSATTA FLIKEN ÄR PAKETVIKT, INTE PRODUKTVIKT. Det syns
   bara på `1e11480e`, som har båda: tyskan säger `Gewicht: 23 kg`, den
   svenska raden säger `28,7 kg`. Feedens kolumn heter `Weight (incl.
   Package)`, alltså är ALLA sju radernas tal paketvikter. Raden heter
   därför `Vikt med emballage` på varenda sida — och `1e11480e`, som är den
   enda där produktvikten är känd, får båda talen.

☠️ `364bc564` SÄGER TVÅ SAKER OM SINA HYLLOR. Brödtexten och `Technische
   Daten` säger "3 Regalböden"; leverantörens EGEN bild säger "zwei
   eingebaute Regale bieten drei getrennte Ablageflächen", och hyllhöjderna
   räknas upp som tre fack (42 / 39,5 / 61 cm). Två hyllplan i ett skåp med
   botten ger tre fack. Texten säger det som går att räkna: tre fack.

⚠️ INGEN SIDA SÄGER NÅGOT OM BYGGLOV. Skåpen har 0,3–1,0 m² fotavtryck och
   är möbler, inte byggnader — men var gränsen går är en fråga om tomt,
   kommun och avstånd till granne, och ett påstående i en produkttext blir
   juridisk rådgivning vi inte kan stå för. Fotavtrycket står i specen;
   bedömningen är kundens.

⚠️ "VÄDERBESTÄNDIG" ÄR INTE "VATTENTÄT". Tyskan använder `wetterfest` om
   lackerad gran. Trä som står ute rör sig, och en skarv släpper in vatten
   till slut. Sidorna säger att taket leder bort regn och att skåpet tål att
   stå ute — aldrig att innehållet håller sig torrt oavsett väder.
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
# ⚠️ Skötseln är verkligen densamma för lackerad gran, och att skriva sju
#    varianter av samma råd hade varit sju tillfällen att skriva ett fel.
#    Det som SKILJER (tak, förankring, maxlast) står per produkt.
TRA_SKOTSEL = ("Borsta av skåpet ett par gånger om året och skölj med vatten. "
               "Lackerad gran tål vatten och en mjuk borste, men inte "
               "högtryckstvätt: strålen driver in vatten i skarvarna och "
               "lyfter färgen från ändträet.")
LACK_SKOTSEL = ("Se över färgen varje vår. Trä som står ute rör sig, och det "
                "är i skarvar och skruvhål lacken släpper först. En bättring "
                "där tar tio minuter; ett fuktskadat skåp går inte att laga.")
BOTTEN_SKOTSEL = ("Lyft ut det som är blött innan du stänger dörren. Blöta "
                  "krukor och en fuktig slang gör mer åt insidan av ett "
                  "träskåp än regnet på utsidan gör åt taket.")


PRODUKTER = [
    # ══ 1. c9a24404 — 115 cm, naturträ ════════════════════════════════════
    {
        "kort": "c9a24404",
        "sku": "FP-tradgardsskap-115-natur",
        "name": "Trädgårdsskåp i trä 115 cm – naturträ, två hyllplan och öppet fack",
        "slug": "tradgardsskap-tra-115-cm-naturtra",
        "title": "Trädgårdsskåp i trä 115 cm, naturträ | Fyndplats",
        "meta": ("Lågt trädgårdsskåp i lackerad gran, 75 × 56 × 115 cm. Två "
                 "hyllplan och ett öppet fack bakom en låsbar dörr, lutande "
                 "tak och 6 kg per hyllplan."),
        "ingress":
            "<p><strong>115 cm högt — det låga skåpet i familjen.</strong> "
            "Det går under ett fönster, bakom ett räcke eller mot en "
            "altankant utan att skymma något, och tar 75 × 56 cm på marken.</p>"
            "<p><strong>Bakom dörren sitter två hyllplan och ett öppet fack.</strong> "
            "Hyllorna tar krukor, handskar och sekatörer; det öppna facket "
            "bredvid går hela vägen ned, så en spade eller en kratta får plats "
            "stående.</p>"
            "<p><strong>Varje hyllplan bär 6 kg.</strong> Det räcker för "
            "krukor, snören och handredskap — men inte för en säck jord eller "
            "en batteridriven häcksax. Tyngden ställer du på botten.</p>"
            "<p>Samma skåp finns "
            + lank("tradgardsskap-tra-115-cm-gratt", "i grått med vita lister")
            + ", och behöver du något högre finns i den publicerade delen av "
              "sortimentet "
            + lank("tradgardsforrad-147-cm-sex-hyllor",
                   "ett trädgårdsförråd på 147 cm med sex hyllor")
            + ".</p>",
        "eg": [
            "75 × 56 cm på marken, 115 cm högt",
            "Två hyllplan och ett öppet fack för långskaftat",
            "Låsbar dörr",
            "Lutande tak som leder bort regnvatten",
            "Lackerad gran, naturträfärgad",
            "6 kg per hyllplan",
            "Monteras, verktyg och förankring ingår inte",
        ],
        "spec": [
            "Yttermått (B × D × H): 75 × 56 × 115 cm",
            "Invändigt (B × D × H): 68 × 50 × 112 cm",
            "Vänstra hyllplanet: 34 × 46,5 cm",
            "Hyllplan: två, plus ett öppet fack",
            "Maxlast: 6 kg per hyllplan",
            "Tak: lutande",
            "Dörrar: en, låsbar",
            "Material: gran med väderbeständig lackering",
            "Färg: naturträ",
            "Vikt med emballage: 19 kg",
            "Paketmått: 117 × 13 × 74 cm",
            "Montering: krävs",
            "Ingår: skåp och monteringsanvisning",
        ],
        "villkor": ("Sex kilo per hylla — så fördelar du vikten", [
            "Hyllplanen bär 6 kg vardera. Det är ett riktigt tal för ett skåp "
            "i den här storleken, och det är samtidigt mindre än en tiolitersp"
            "åse jord. Lägg det lätta och det du vill nå snabbt på hyllorna.",
            "Botten är den starka ytan. Där ställer du dunkar, säckar och det "
            "som väger — och där står också långskaftat i det öppna facket, "
            "med tyngdpunkten nere.",
            "Fördelningen är inte en detalj i ett lågt skåp: ju högre upp "
            "tyngden ligger, desto lättare tippar det när dörren står öppen "
            "och någon lutar sig in.",
        ]),
        "skotsel": [TRA_SKOTSEL, LACK_SKOTSEL, BOTTEN_SKOTSEL],
        "faq": [
            ("Går det att låsa?",
             "Dörren har ett beslag för hänglås. Hänglåset ingår inte."),
            ("Hur mycket tål hyllorna?",
             "6 kg per hyllplan. Tyngre saker ställer du på botten, som är "
             "skåpets starkaste yta."),
            ("Kan det stå ute hela året?",
             "Ja, skåpet är byggt för att stå ute och taket lutar så att regn "
             "rinner av. Trä som står ute rör sig ändå, så se över lacken "
             "varje vår — särskilt i skarvar och kring skruvhål."),
            ("Ingår markpinnar eller väggfäste?",
             "Nej. Med skåpet följer monteringsanvisning, inget "
             "förankringsmaterial. Står det blåsigt hos dig bör du förankra "
             "det, och då får du köpa beslagen separat."),
        ],
    },

    # ══ 2. bb112e08 — 115 cm, grått ════════════════════════════════════════
    {
        "kort": "bb112e08",
        "sku": "FP-tradgardsskap-115-gra",
        "name": "Trädgårdsskåp i trä 115 cm – grått med vita lister, två hyllplan",
        "slug": "tradgardsskap-tra-115-cm-gratt",
        "title": "Trädgårdsskåp i trä 115 cm, grått | Fyndplats",
        "meta": ("Lågt trädgårdsskåp i lackerad gran, 75 × 56 × 115 cm. Grå "
                 "stomme med vita lister, två hyllplan, öppet fack och 6 kg "
                 "per hyllplan."),
        "ingress":
            "<p><strong>Grå stomme, vita lister och mörkt tak.</strong> Samma "
            "låga skåp som naturträvarianten, i en yta som tar upp färgen på "
            "en vitmålad husvägg i stället för att bryta mot den.</p>"
            "<p><strong>115 cm högt och 75 × 56 cm på marken.</strong> Det går "
            "under ett fönster eller bakom ett altanräcke, och innehåller två "
            "hyllplan plus ett öppet fack där en spade står upprätt.</p>"
            "<p><strong>Varje hyllplan bär 6 kg.</strong> Krukor, snören och "
            "handredskap på hyllorna; säckar och dunkar på botten.</p>"
            "<p>Vill du ha ådringen synlig finns "
            + lank("tradgardsskap-tra-115-cm-naturtra",
                   "samma skåp i naturfärgat trä")
            + ", och i den publicerade delen av sortimentet finns "
            + lank("tradgardsforrad-147-cm-sex-hyllor",
                   "ett trädgårdsförråd på 147 cm med sex hyllor")
            + ".</p>",
        "eg": [
            "Grå stomme med vita lister, mörkt tak",
            "75 × 56 cm på marken, 115 cm högt",
            "Två hyllplan och ett öppet fack för långskaftat",
            "Låsbar dörr",
            "Lutande tak som leder bort regnvatten",
            "6 kg per hyllplan",
            "Monteras, verktyg och förankring ingår inte",
        ],
        "spec": [
            "Yttermått (B × D × H): 75 × 56 × 115 cm",
            "Invändigt (B × D × H): 68 × 50 × 112 cm",
            "Vänstra hyllplanet: 34 × 46,5 cm",
            "Hyllplan: två, plus ett öppet fack",
            "Maxlast: 6 kg per hyllplan",
            "Tak: lutande",
            "Dörrar: en, låsbar",
            "Material: gran med väderbeständig lackering",
            "Färg: grå stomme, vita lister, mörkt tak",
            "Vikt med emballage: 19 kg",
            "Paketmått: 117 × 13 × 74 cm",
            "Montering: krävs",
            "Ingår: skåp och monteringsanvisning",
        ],
        "villkor": ("Sex kilo per hylla — så fördelar du vikten", [
            "Hyllplanen bär 6 kg vardera. Det räcker för krukor, snören och "
            "handredskap, men inte för en säck jord — och skillnaden är "
            "större än den låter när hyllan sitter i ett skåp som är 115 cm "
            "högt.",
            "Botten är den starka ytan. Dunkar, säckar och allt tungt hör "
            "hemma där, tillsammans med det långskaftade som står i det öppna "
            "facket.",
            "Ju högre upp tyngden ligger, desto lättare tippar skåpet när "
            "dörren står öppen och någon lutar sig in efter något längst bak.",
        ]),
        "skotsel": [TRA_SKOTSEL, LACK_SKOTSEL, BOTTEN_SKOTSEL],
        "faq": [
            ("Vad är det för färg egentligen?",
             "Stommen är grå, listerna vita och taket mörkt. Det är en målad "
             "yta, inte betsat trä, så ådringen syns svagt genom färgen."),
            ("Hur mycket tål hyllorna?",
             "6 kg per hyllplan. Tyngre saker ställer du på botten."),
            ("Är det samma skåp som naturträmodellen?",
             "Ja, samma mått och samma inredning — 75 × 56 × 115 cm, två "
             "hyllplan och ett öppet fack. Det är ytan som skiljer."),
            ("Ingår markpinnar eller väggfäste?",
             "Nej. Med skåpet följer monteringsanvisning, inget "
             "förankringsmaterial."),
        ],
    },

    # ══ 3. 1e11480e — 77 cm brett, fönster ════════════════════════════════
    {
        "kort": "1e11480e",
        "sku": "FP-tradgardsskap-77-fonster",
        "name": "Trädgårdsskåp 77 cm brett med fönster – tre hörnhyllor och asfalttak",
        "slug": "tradgardsskap-77-cm-fonster-hornhyllor",
        "title": "Trädgårdsskåp 77 cm brett med fönster | Fyndplats",
        "meta": ("Smalt trädgårdsskåp i gran, 77 × 54,2 cm på marken. Fönster "
                 "för ventilation, tre uttagbara hörnhyllor och asfalttak. "
                 "0,30 m² golvyta."),
        "ingress":
            "<p><strong>77 cm brett och 54,2 cm djupt — det tar en vägg, "
            "inte en gräsmatta.</strong> Golvytan är 0,30 kvadratmeter, "
            "ungefär en halv pall, och invändigt är skåpet 63 × 41 cm och "
            "136 cm högt.</p>"
            "<p><strong>Tre hörnhyllor, inte hela hyllplan.</strong> De "
            "sitter i ena sidan och lämnar resten av skåpet fritt ända ned "
            "till botten. Handredskap och krukor på hyllorna, spadar och "
            "krattor stående bredvid — utan att det ena är i vägen för det "
            "andra.</p>"
            "<p><strong>Fönstret högst upp släpper ut fukt.</strong> Ett "
            "stängt träskåp där en blöt slang läggs in blir instängt; "
            "ventilationen är skillnaden mellan torrt och unket.</p>"
            "<p>Behöver du mer höjd finns "
            + lank("tradgardsskap-191-cm-sadeltak-tva-dorrar",
                   "modellen på 191,5 cm med sadeltak")
            + ", och i den publicerade delen av sortimentet "
            + lank("tradgardsskap-tra-179-cm-tva-fack",
                   "ett bredare skåp med fyra flyttbara hyllor")
            + ".</p>",
        "eg": [
            "77 × 54,2 cm på marken — 0,30 m² golvyta",
            "Fönster högst upp för ventilation",
            "Tre uttagbara hörnhyllor, 6 kg vardera",
            "34 cm mellan hyllorna",
            "Fritt utrymme ned till botten för långskaftat",
            "Asfalttak och gran med två lager vattenavvisande färg",
            "Monteras, förankring ingår inte",
        ],
        "spec": [
            "Yttermått (B × D × H): 77 × 54,2 × 179 cm",
            "Stommens mått (B × D): 67 × 45 cm",
            "Invändigt (B × D × H): 63 × 41 × 136 cm",
            "Golvyta: 0,30 m²",
            "Höjd till takfoten: 153 cm",
            "Hyllor: tre uttagbara hörnhyllor",
            "Avstånd mellan hyllorna: 34 cm",
            "Maxlast: 6 kg per hylla",
            "Tak: asfalt",
            "Ventilation: fönster",
            "Material: gran, två lager vattenavvisande färg",
            "Färg: naturträ med grönt tak",
            "Vikt: 23 kg",
            "Vikt med emballage: 28,7 kg",
            "Paketmått: 97,5 × 28,5 × 69 cm",
            "Montering: krävs",
            "Ingår: skåp och monteringsanvisning",
        ],
        "villkor": ("Hörnhyllor i stället för hyllplan — vad det ger", [
            "Hyllorna sitter i ena hörnet och går inte tvärs igenom skåpet. "
            "Det låter som en begränsning och är motsatsen: resten av "
            "utrymmet står fritt från botten till tak, så en kratta eller ett "
            "spadskaft får plats stående utan att du behöver ta ut något.",
            "Hyllorna bär 6 kg vardera och sitter 34 cm isär. De är gjorda "
            "för handredskap, handskar, snören och små krukor — inte för "
            "säckar.",
            "Alla tre går att lyfta ut. Behöver du höjd för en dunk eller en "
            "hopfälld trädgårdsstol tar du bort den som är i vägen och "
            "sätter tillbaka den efteråt.",
        ]),
        "skotsel": [
            TRA_SKOTSEL,
            "Håll fönstret fritt. Det är skåpets enda ventilation, och en "
            "hylla eller en säck som ställs framför det stänger av precis den "
            "funktion som håller innehållet torrt.",
            BOTTEN_SKOTSEL,
        ],
        "faq": [
            ("Hur mycket ryms det?",
             "Golvytan är 0,30 kvadratmeter och invändigt mäter skåpet "
             "63 × 41 cm och 136 cm i höjd. Det tar en uppsättning "
             "handredskap, några krukor och långskaftade verktyg stående."),
            ("Går hyllorna att flytta?",
             "De går att lyfta ut helt. De sitter 34 cm isär och bär 6 kg "
             "vardera."),
            ("Vad väger skåpet?",
             "Själva skåpet väger 23 kg. Paketet väger 28,7 kg, så räkna med "
             "att vara två när det ska bäras hem."),
            ("Vad är fönstret till för?",
             "Ventilation. Ett stängt träskåp blir fuktigt av blöta redskap, "
             "och fönstret släpper ut luften i stället för att låta den "
             "stanna."),
            ("Ingår markpinnar eller väggfäste?",
             "Nej. Med skåpet följer monteringsanvisning, inget "
             "förankringsmaterial. Skåpet är smalt och högt, så står det "
             "blåsigt hos dig bör du förankra det — och då får du köpa "
             "beslagen separat."),
        ],
    },

    # ══ 4. d6666869 — 191,5 cm, sadeltak ══════════════════════════════════
    {
        "kort": "d6666869",
        "sku": "FP-tradgardsskap-191-sadeltak",
        "name": "Trädgårdsskåp 191,5 cm med sadeltak – två dörrar som öppnas var för sig",
        "slug": "tradgardsskap-191-cm-sadeltak-tva-dorrar",
        "title": "Trädgårdsskåp 191,5 cm med sadeltak | Fyndplats",
        "meta": ("Högt trädgårdsskåp i massiv gran, 79 × 49 cm på marken och "
                 "191,5 cm högt. Sadeltak med takpapp, två hyllplan och två "
                 "dörrar som låses var för sig."),
        "ingress":
            "<p><strong>191,5 cm högt — familjens högsta.</strong> Det står "
            "i ögonhöjd och tar ändå bara 79 × 49 cm på marken, alltså "
            "mindre golvyta än de flesta lägre skåp med samma innehåll.</p>"
            "<p><strong>Två dörrar som låses var för sig.</strong> Den ena "
            "öppnar hyllsektionen, den andra facket under. Du kommer åt rätt "
            "del utan att öppna hela skåpet, och kan låsa den ena medan den "
            "andra står öppen.</p>"
            "<p><strong>Sadeltaket är klätt med takpapp.</strong> Ett tak med "
            "två fall leder bort både regn och snö åt var sitt håll i stället "
            "för att samla vatten i en enda ränna.</p>"
            "<p>Invändigt finns två hyllplan och en nisch där långskaftade "
            "redskap står upprätt. Vill du ha ett smalare skåp finns "
            + lank("tradgardsskap-77-cm-fonster-hornhyllor",
                   "modellen på 77 cm med fönster")
            + ", och i den publicerade delen av sortimentet "
            + lank("tradgardsskap-tra-179-cm-tva-fack",
                   "ett bredare skåp med fyra flyttbara hyllor")
            + ".</p>",
        "eg": [
            "191,5 cm högt — 79 × 49 cm på marken",
            "Två dörrar som öppnas och låses var för sig",
            "Två hyllplan och en nisch för långskaftade redskap",
            "Sadeltak klätt med takpapp",
            "Massiv gran, naturfärgad",
            "Monteringsmaterial ingår",
            "Förankring ingår inte",
        ],
        "spec": [
            "Yttermått (B × D × H): 79 × 49 × 191,5 cm",
            "Grundyta (B × D): 67 × 43 cm",
            "Tak (B × D): 79 × 49 cm",
            "Dörrar: två, 61 × 70 cm vardera, låses var för sig",
            "Hyllplan: två, plus nisch för långskaftat",
            "Tak: sadeltak med takpapp",
            "Material: massiv gran",
            "Färg: naturträ",
            "Vikt med emballage: 24,5 kg",
            "Paketmått: 93,5 × 68 × 26,5 cm",
            "Montering: krävs, monteringsmaterial ingår",
            "Ingår: skåp, monteringssats och monteringsanvisning",
        ],
        "villkor": ("Högt och smalt — det som avgör var det får stå", [
            "Skåpet är 191,5 cm högt och bara 49 cm djupt. Det är en "
            "proportion som passar mot en vägg och illa fritt på en "
            "gräsmatta: ju smalare basen är i förhållande till höjden, desto "
            "mindre tål konstruktionen sidokrafter.",
            "Ställ det mot en vägg eller ett plank, och helst på ett fast "
            "underlag. En platta eller ett trädäck ger skåpet ett plant stöd "
            "under hela grundytan på 67 × 43 cm; en gräsmatta ger efter olika "
            "mycket i olika hörn.",
            "Med skåpet följer monteringssats och anvisning — men inget "
            "material för att förankra det i mark eller vägg. Står det "
            "blåsigt hos dig är det första du bör komplettera med.",
        ]),
        "skotsel": [
            TRA_SKOTSEL,
            "Se över takpappen varje vår. Sadeltakets nock är den skarv som "
            "arbetar mest, och en spik som lossat där syns långt innan vattnet "
            "gör det.",
            LACK_SKOTSEL,
        ],
        "faq": [
            ("Går dörrarna att öppna var för sig?",
             "Ja. Båda dörrarna har egen låsning, så du kan öppna den ena och "
             "hålla den andra stängd."),
            ("Hur mycket tål hyllorna?",
             "Det finns ingen angiven maxlast för hyllplanen, och vi gissar "
             "inte fram en. Håll dig till handredskap och krukor på hyllorna "
             "och ställ det tunga på botten."),
            ("Vilket underlag behöver det?",
             "Ett plant och fast underlag under hela grundytan på 67 × 43 cm. "
             "En platta eller ett trädäck är bättre än gräs — skåpet är "
             "191,5 cm högt och bara 49 cm djupt."),
            ("Ingår markpinnar eller väggfäste?",
             "Nej. Monteringssats och anvisning ingår, men inget "
             "förankringsmaterial."),
        ],
    },

    # ══ 5. 43e312b7 — 182 cm, grått, fällbart bord ════════════════════════
    {
        "kort": "43e312b7",
        "sku": "FP-tradgardsskap-182-bord",
        "name": "Trädgårdsskåp grått 182 cm med fällbart bord – krokar och markpinnar",
        "slug": "tradgardsskap-gratt-182-cm-fallbart-bord",
        "title": "Trädgårdsskåp 182 cm med fällbart bord | Fyndplats",
        "meta": ("Grått trädgårdsskåp i gran, 78 × 52,5 × 182 cm. Fällbart "
                 "bord på 40 × 40 cm, krokar i sidorna och på dörren, "
                 "avtagbar hylla samt L-järn och markpinnar."),
        "ingress":
            "<p><strong>Ett fällbart bord på utsidan.</strong> Bordet mäter "
            "40 × 40 cm, sitter 75 cm över marken och bär 10 kg — tillräckligt "
            "för att kruka om, ställa ned en verktygslåda eller lägga upp en "
            "sax medan du gör något annat. Fällt ligger det platt mot "
            "skåpet.</p>"
            "<p><strong>Krokar i sidorna och på insidan av dörren.</strong> "
            "Det som hänger tar ingen hyllyta, och en spade på en krok är "
            "lättare att få tag i än en spade i en hög.</p>"
            "<p><strong>Den övre hyllan går att ta bort.</strong> Utan den "
            "blir skåpet fritt i höjd för långskaftade redskap; med den blir "
            "det två nivåer. Den nedre hyllan bär 30 kg, det lilla facket "
            "5 kg.</p>"
            "<p>Grå stomme med vita lister, 78 × 52,5 cm på marken och 182 cm "
            "högt. Vill du ha samma höjd med sadeltak finns "
            + lank("tradgardsskap-191-cm-sadeltak-tva-dorrar",
                   "modellen på 191,5 cm")
            + ", och i den publicerade delen av sortimentet "
            + lank("tradgardsforrad-147-cm-sex-hyllor",
                   "ett trädgårdsförråd med sex hyllor och fyra fönster")
            + ".</p>",
        "eg": [
            "Fällbart bord 40 × 40 cm, 75 cm högt, bär 10 kg",
            "Krokar i sidorna och på insidan av dörren",
            "Avtagbar övre hylla — full höjd för långskaftat",
            "Nedre hyllan bär 30 kg, det lilla facket 5 kg",
            "78 × 52,5 cm på marken, 182 cm högt",
            "Grå stomme med vita lister",
            "L-järn och markpinnar ingår",
        ],
        "spec": [
            "Yttermått (B × D × H): 78 × 52,5 × 182 cm",
            "Invändigt (B × D × H): 61 × 38 × 128 cm",
            "Bottenmått (B × D): 65 × 42 cm",
            "Dörr (B × H): 54 × 127 cm",
            "Höjd till takfoten: 155 cm",
            "Fällbart bord (B × D × H): 40 × 40 × 75 cm",
            "Markfrigång: 3 cm",
            "Maxlast: 30 kg nedre hyllan, 10 kg bordet, 5 kg lilla facket",
            "Tak: lutande",
            "Material: massiv gran med skyddande färg",
            "Färg: grå med vita lister",
            "Vikt med emballage: 31 kg",
            "Paketmått: 95 × 30 × 68 cm",
            "Montering: krävs",
            "Ingår: skåp, fyra markpinnar och monteringsanvisning",
        ],
        "villkor": ("Tre olika maxlaster — och vilken som gäller var", [
            "Skåpet har tre tal, inte ett. Den nedre hyllan bär 30 kg, det "
            "fällbara bordet 10 kg och det lilla facket 5 kg. Det är stor "
            "skillnad, och den som läser ett av talen och antar att det gäller "
            "överallt lastar fel på två av tre ytor.",
            "Bordets 10 kg är det tal som är lättast att överskrida utan att "
            "tänka på det. En full 10-literskruka jord väger mer än så, och "
            "bordet sitter på ett gångjärn i en skåpsida — inte på ben.",
            "Det tunga hör hemma på den nedre hyllan eller på botten. Där "
            "ligger tyngdpunkten lågt, och det spelar roll i ett skåp som är "
            "182 cm högt och 52,5 cm djupt.",
        ]),
        "skotsel": [
            TRA_SKOTSEL,
            "Fäll upp bordet när du inte använder det. Ett vågrätt bräde ute "
            "samlar vatten, löv och snö; fällt mot skåpet rinner regnet av "
            "det som av väggen.",
            LACK_SKOTSEL,
        ],
        "faq": [
            ("Hur mycket bär det fällbara bordet?",
             "10 kg. Det räcker för en verktygslåda eller en kruka i taget — "
             "men inte för en full säck jord."),
            ("Går den övre hyllan att ta bort?",
             "Ja. Utan den blir skåpet fritt i höjd, vilket är poängen om du "
             "förvarar krattor och spadar stående."),
            ("Ingår förankring?",
             "Ja, fyra markpinnar och L-järn följer med. Det är två av sju "
             "skåp här som har det, så kontrollera vad som ingår om du "
             "jämför med en annan modell."),
            ("Vad är det för färg?",
             "Grå stomme med vita lister och mörkt tak. Ytan är målad, inte "
             "betsad."),
        ],
    },

    # ══ 6. 364bc564 — 160 cm, lamelldörrar ════════════════════════════════
    {
        "kort": "364bc564",
        "sku": "FP-tradgardsskap-160-lamell",
        "name": "Trädgårdsskåp 160 cm med lamelldörrar – tre fack och 20 kg per fack",
        "slug": "tradgardsskap-160-cm-lamelldorrar",
        "title": "Trädgårdsskåp 160 cm med lamelldörrar | Fyndplats",
        "meta": ("Trädgårdsskåp i massiv gran, 87 × 46,5 × 160 cm. Två "
                 "lamelldörrar som ventilerar, två hyllplan som ger tre fack "
                 "och 20 kg per fack."),
        "ingress":
            "<p><strong>Dörrarna är lamellklädda och släpper igenom luft.</strong> "
            "Det är skillnaden mot ett tätt skåp: fukten från en blöt slang "
            "eller ett par leriga stövlar går ut i stället för att stanna "
            "kvar och sätta sig i träet.</p>"
            "<p><strong>Två hyllplan delar skåpet i tre fack.</strong> Facken "
            "är 42 cm, 39,5 cm och 61 cm höga uppifrån och ner, så det "
            "understa tar en dunk eller en hopfälld stol medan de två övre "
            "tar krukor och handredskap.</p>"
            "<p><strong>Varje fack bär 20 kg.</strong> Det är mer än de flesta "
            "trädgårdsskåp i den här storleken klarar, och det är därför de "
            "tunga sakerna inte behöver stå på botten.</p>"
            "<p>87 cm brett och 46,5 cm djupt, med bitumenklätt tak. Behöver "
            "du bredare finns "
            + lank("tradgardsskap-139-cm-brett-dubbeldorr",
                   "modellen på 139 cm med dubbeldörr")
            + ", och i den publicerade delen av sortimentet "
            + lank("tradgardsskap-tra-179-cm-tva-fack",
                   "ett högre skåp med fyra flyttbara hyllor")
            + ".</p>",
        "eg": [
            "Två lamelldörrar som ventilerar skåpet",
            "Två hyllplan, tre fack: 42 / 39,5 / 61 cm höga",
            "20 kg per fack",
            "87 × 46,5 cm på marken, 160 cm högt",
            "Tak klätt med bitumenpapp",
            "Massiv gran, naturfärgad",
            "Monteras, förankring ingår inte",
        ],
        "spec": [
            "Yttermått (B × D × H): 87 × 46,5 × 160 cm",
            "Golvyta: 0,31 m²",
            "Dörrar: två lamelldörrar, 36,9 × 140,6 cm vardera",
            "Hyllplan: två, vilket ger tre fack",
            "Hyllplanens mått (B × D): 77 × 35,5 cm, 1 cm tjocka",
            "Fackhöjder uppifrån och ner: 42 / 39,5 / 61 cm",
            "Maxlast: 20 kg per fack",
            "Tak: bitumenpapp",
            "Material: massiv gran",
            "Färg: naturträ",
            "Vikt med emballage: 31,7 kg",
            "Paketmått: 159 × 53 × 15,5 cm",
            "Montering: krävs",
            "Ingår: skåp och monteringsanvisning",
        ],
        "villkor": ("Lamelldörrar — vad ventilationen kostar och ger", [
            "Lameller släpper igenom luft, och det är hela poängen i ett skåp "
            "som får in blöta redskap. Fukt som inte kommer ut blir kondens, "
            "och kondens i ett stängt träskåp är det som får handtag att mögla "
            "och metall att rosta.",
            "Priset är att lamellerna också släpper igenom damm och drivsnö. "
            "Det som absolut måste hållas rent — dynor, textilier, "
            "elverktyg — hör hemma i ett tätt skåp, inte här.",
            "Facken bär 20 kg vardera, mer än de flesta skåp i den här "
            "storleken. Det understa facket är 61 cm högt och tar det som är "
            "både tungt och skrymmande.",
        ]),
        "skotsel": [
            TRA_SKOTSEL,
            "Borsta ur lamellerna. Springorna samlar löv, frön och spindelväv, "
            "och en igensatt lamell ventilerar inte — då har du ett tätt skåp "
            "som ser ut att vara ventilerat.",
            LACK_SKOTSEL,
        ],
        "faq": [
            ("Hur många hyllplan har skåpet?",
             "Två hyllplan, som tillsammans med botten ger tre fack. "
             "Fackhöjderna är 42 / 39,5 / 61 cm uppifrån och ner."),
            ("Hur mycket tål varje fack?",
             "20 kg. Det är mer än de flesta trädgårdsskåp i den här "
             "storleken klarar."),
            ("Blir det inte blött inuti när dörrarna släpper igenom luft?",
             "Regn kommer inte in genom lamellerna på det sätt en vindpust "
             "gör, men drivsnö och damm gör det. Skåpet är byggt för "
             "trädgårdsredskap, inte för dynor och elektronik."),
            ("Ingår markpinnar eller väggfäste?",
             "Nej. Med skåpet följer monteringsanvisning, inget "
             "förankringsmaterial."),
        ],
    },

    # ══ 7. 8b00022f — 139 cm brett, dubbeldörr ════════════════════════════
    {
        "kort": "8b00022f",
        "sku": "FP-tradgardsskap-139-dubbel",
        "name": "Trädgårdsskåp 139 cm brett med dubbeldörr – asfalttak och bord ingår",
        "slug": "tradgardsskap-139-cm-brett-dubbeldorr",
        "title": "Trädgårdsskåp 139 cm brett med dubbeldörr | Fyndplats",
        "meta": ("Brett trädgårdsskåp i gran, 139 × 75 × 160 cm. Dubbeldörr "
                 "med två låsbultar, vattentätt asfalttak, 40 kg maxlast och "
                 "ett fristående trädgårdsbord på köpet."),
        "ingress":
            "<p><strong>139 cm brett — det är dubbelt så brett som de smala "
            "skåpen.</strong> Bredden är vad som gör att en gräsklippare, en "
            "hopfälld trädgårdsmöbel eller en hink med slang får plats "
            "stående bredvid varandra i stället för ovanpå varandra.</p>"
            "<p><strong>Dubbeldörren öppnar hela fronten.</strong> Två dörrar "
            "på 54 × 132 cm vardera och två låsbultar; med båda öppna kommer "
            "du åt hela bottenytan på 124,5 × 65 cm på en gång.</p>"
            "<p><strong>Ett fristående bord ingår.</strong> Det står bredvid "
            "skåpet och går lika bra att sitta på som att kruka om på — och "
            "det är den delen som gör skåpet till en arbetsplats i stället "
            "för bara en förvaring.</p>"
            "<p>Grå stomme med vita lister, vattentätt asfalttak och 6 cm "
            "höga fötter som håller botten från marken. Behöver du något "
            "smalare finns "
            + lank("tradgardsskap-160-cm-lamelldorrar",
                   "modellen på 87 cm med lamelldörrar")
            + ", och i den publicerade delen av sortimentet "
            + lank("redskapsbod-gran-0-5-m2-tva-fonster",
                   "en redskapsbod i gran med två fönster")
            + ".</p>",
        "eg": [
            "139 × 75 cm på marken, 160 cm högt",
            "Dubbeldörr, 54 × 132 cm per dörr, två låsbultar",
            "Bottenyta 124,5 × 65 cm",
            "Fristående trädgårdsbord ingår",
            "Vattentätt asfalttak",
            "6 cm höga fötter håller botten från marken",
            "L-järn och markpinnar ingår",
        ],
        "spec": [
            "Yttermått (B × D × H): 139 × 75 × 160 cm",
            "Bottenmått (B × D): 124,5 × 65 cm",
            "Dörrar: två, 54 × 132 cm vardera",
            "Låsning: två låsbultar",
            "Fothöjd: 6 cm",
            "Maxlast: 40 kg",
            "Tak: asfalt, vattentätt",
            "Material: lackerad gran",
            "Färg: grå med vita lister",
            "Vikt med emballage: 50 kg",
            "Paketmått: 145,5 × 18,5 × 76 cm",
            "Montering: krävs",
            "Ingår: skåp, trädgårdsbord, fyra markpinnar och "
            "monteringsanvisning",
        ],
        "villkor": ("Bredden avgör vad som får plats stående", [
            "Bottenytan är 124,5 × 65 cm. Det är den siffra du ska mäta mot, "
            "inte yttermåttet: taket skjuter ut, så skåpet tar 139 × 75 cm i "
            "luften men bara 124,5 × 65 cm att ställa saker på.",
            "En bred botten är skillnaden mot ett smalt skåp med samma volym. "
            "Saker som står bredvid varandra går att ta ut ett i taget; saker "
            "som står bakom varandra kräver att du flyttar det främre först.",
            "Maxlasten är 40 kg. Det är familjens högsta tal, och det gäller "
            "skåpet — inte bordet, som är en fristående möbel med egna ben.",
        ]),
        "skotsel": [
            TRA_SKOTSEL,
            "Ta in bordet över vintern om du kan. Det är den del som står "
            "utan tak över sig, och en vinter i väta gör mer åt en vågrät "
            "skiva än åt en lodrät vägg.",
            LACK_SKOTSEL,
        ],
        "faq": [
            ("Vad är det som ingår utöver skåpet?",
             "Ett fristående trädgårdsbord, fyra markpinnar, L-järn och "
             "monteringsanvisning."),
            ("Hur mycket tål skåpet?",
             "40 kg. Det är den högsta maxlasten bland trädgårdsskåpen här."),
            ("Vilket mått ska jag mäta platsen mot?",
             "Yttermåttet 139 × 75 cm, eftersom taket skjuter ut. Vill du veta "
             "vad som får plats INUTI är bottenmåttet 124,5 × 65 cm det du "
             "räknar på."),
            ("Står skåpet direkt på marken?",
             "Nej, det står på 6 cm höga fötter. Det håller botten från "
             "markfukt, men fötterna behöver ett plant underlag för att skåpet "
             "ska stå rakt."),
        ],
    },
]
