# -*- coding: utf-8 -*-
"""Runda 63 — åtta kattbäddar. Texten skrivs HÄR, inte inline i API-anropet.

Batch 64 mätte skillnaden: fem produkter skrivna inline gav nio fel som nådde
Wix, tre skrivna via fil gav noll. En sträng i ett JSON-anrop kan inte grep:as
innan den lämnar chatten, och API-svaret ekar tillbaka exakt det man skrev.

Alla siffror kommer ur leverantörens Technische Daten. Ingenting är påhittat.
Tre saker är MEDVETET utelämnade, och skälen står i LAGE.md:

  1. Ordet "rotting" om de fem som är PE- eller PVC-plast (Steg 5, punkt 1).
  2. Lasttalet på `f6e3098e`, som motsäger sig självt (Steg 5, punkt 4).
  3. "Lämplig även utomhus" på de två i vattenhyacint (Steg 5, punkt 7).

☠️ Och VIKTEN är fraktvikt, inte produktvikt. `165471af` bevisar det: tyskan
säger `Nettogewicht: 1,5 kg`, spec-raden säger 2,8 kg. Feedens kolumn heter
`Weight (incl. Package)`. Etiketten här heter därför "Fraktvikt" — utom där
leverantören själv anger nettovikten.
"""

# Absoluta korshänvisningar. En relativ blir https:/produkt/… med ETT
# snedstreck och är död.
BAS = "https://www.fyndplats.se/produkt/"


def lank(slug, text):
    return '<a href="%s%s">%s</a>' % (BAS, slug, text)


# Gemensamt om materialet. De fem konstrottingsidorna säger samma sak med
# samma ord — det är en materialupplysning, inte copy, och en omskrivning per
# sida är fem chanser att införa ett fel.
KONSTROTTING = (
    "Flätningen är konstrotting i PE-plast över en stomme av metall. Den ser ut "
    "som rotting men tål fukt och damm bättre, och den flisar sig inte när "
    "klorna får fäste."
)
KONSTROTTING_PVC = (
    "Flätningen är konstrotting i PVC över en stomme av metalltråd. Den ser ut "
    "som rotting men tål fukt och damm bättre, och den flisar sig inte när "
    "klorna får fäste."
)
VATTENHYACINT = (
    "Flätningen är torkat vattenhyacintgräs — ett äkta naturmaterial med "
    "synlig, oregelbunden struktur och en svag doft av hö de första veckorna."
)

SKOTSEL_FLAT = (
    "Dammsug flätningen med möbelmunstycke eller borsta ur den med en torr "
    "borste; kattsand och lösa hår fastnar i mönstret. Torka av med en lätt "
    "fuktad trasa vid behov och låt torka innan katten går tillbaka in."
)


def faq(rader):
    ut = ["<h2>Vanliga frågor</h2>"]
    for f, s in rader:
        ut.append("<p><strong>%s</strong></p><p>%s</p>" % (f, s))
    return "".join(ut)


def egenskaper(rader):
    return ("<p><strong>Egenskaper</strong></p><ul>"
            + "".join("<li>%s</li>" % r for r in rader) + "</ul>")


def spec(rader):
    return ("<h2>Tekniska specifikationer</h2><ul>"
            + "".join("<li>%s</li>" % r for r in rader) + "</ul>")


def skotsel(stycken):
    return ("<h2>Användning och skötsel</h2>"
            + "".join("<p>%s</p>" % s for s in stycken))


PRODUKTER = [
    # ------------------------------------------------------- öppna bäddar ---
    {
        "kort": "b3672df6",
        "id": "b3672df6-3677-4760-b991-ffda57971f45",
        "sokord": "kattbädd",
        "slug": "kattbadd-med-kattoron-50-cm",
        "sku": "FP-kattbadd-kattoron-50-cm",
        "name": "Kattbädd med kattöron 50 cm – öppen korg, avtagbar kudde",
        "title": "Kattbädd 50 cm med kattöron | Fyndplats",
        "meta": ("Öppen kattbädd på 50 × 50 cm med två flätade kattöron och en "
                 "avtagbar, tvättbar kudde. Kanten är 25 cm hög och tål 10 kg."),
        "ingress": (
            "<p>En öppen korg på 50 × 50 cm med kanten dragen upp i två små "
            "kattöron. Katter som helst ligger utsträckta och vill se rummet "
            "väljer ofta en låg, öppen bädd framför en sluten grotta — här är "
            "kanten bara 25 cm hög, så det går att kliva i utan hopp.</p>"),
        "eg": [
            "Öppen korg, 50 × 50 cm ytterkant och 48 × 48 cm invändigt",
            "Kanten 25 cm hög med två flätade kattöron",
            "Kudde på 50 × 50 cm, 5 cm tjock — går att ta ur och tvätta",
            "Tål 10 kg, alltså även en stor huskatt",
            "Levereras färdig, ingen montering",
        ],
        "spec": [
            "Mått (B × D × H): 50 × 50 × 25 cm",
            "Invändigt: 48 × 48 cm",
            "Öppning: Ø45 cm",
            "Kudde: 50 × 50 × 5 cm",
            "Maxlast: 10 kg",
            "Stomme: metall med flätning i PE-konstrotting",
            "Klädsel: polyester över PP-bomull",
            "Färg: ljusbrun",
            "Fraktvikt: 3,5 kg",
            "Paketmått: 51 × 51 × 26 cm",
        ],
        "skotsel": [
            "Ställ bädden där katten redan brukar sova — vid ett fönster, "
            "intill en radiator eller i ett hörn med uppsikt över rummet. Den "
            "låga kanten gör att en äldre katt eller en kattunge kommer i utan "
            "att hoppa.",
            KONSTROTTING,
            "Kudden dras ur och tvättas separat; flätningen borstas eller "
            "dammsugs. " + SKOTSEL_FLAT,
        ],
        "faq": [
            ("Hur stor katt får plats?",
             "Innermåttet är 48 × 48 cm och bädden tål 10 kg, så en normalstor "
             "huskatt ligger utsträckt med marginal. Två katter som gillar "
             "varandra får också plats, men då blir det trångt."),
            ("Går kudden att tvätta?",
             "Ja. Kudden är lös och tas ur helt."),
            ("Är det äkta rotting?",
             "Nej, det är konstrotting i PE-plast över en metallstomme. Den ser "
             "ut som rotting men tål fukt bättre och flisar sig inte."),
            ("Behöver den monteras?",
             "Nej, den kommer färdig i ett paket på 51 × 51 × 26 cm."),
            ("Vill du hellre ha något slutet?",
             "Katter som söker mörker och tak trivs bättre i en " +
             lank("kattigloo-flatad-50-cm", "flätad kattigloo på 50 cm") +
             " — samma bredd, men med kupol och en rund ingång."),
        ],
    },
    {
        "kort": "165471af",
        "id": "165471af-a1ed-4504-8b84-8c4c579f9f18",
        "sokord": "kattsäng",
        "slug": "kattsang-pa-ben-56-cm",
        "sku": "FP-kattsang-ben-56-cm",
        "name": "Kattsäng på ben 56 cm – luftig flätning, 35 cm hög",
        "title": "Kattsäng på ben, Ø56 cm | Fyndplats",
        "meta": ("Kattsäng på trebent stativ, Ø56 cm och 35 cm hög. Glesflätad "
                 "skål i ljus ton med tjock kudde. Tål 5 kg."),
        "ingress": (
            "<p>En rund, glesflätad skål på ett trebent stativ, 35 cm över "
            "golvet. Den glesa flätningen släpper igenom ljus och luft, så "
            "sängen ser lätt ut i rummet trots att skålen är hela 56 cm bred "
            "— och katten ligger högre än dammet och draget vid golvet.</p>"),
        "eg": [
            "Skål på Ø56 cm, öppningen Ø45 cm",
            "Trebent stativ, 35 cm total höjd",
            "Gles flätning som släpper igenom ljus och luft",
            "Tjock kudde på Ø39 cm i linnetyg",
            "Tål 5 kg, levereras färdig",
        ],
        "spec": [
            "Mått: Ø56 × 35 cm",
            "Öppning: Ø45 cm",
            "Kudde: Ø39 cm",
            "Maxlast: 5 kg",
            "Stomme: metalltråd med flätning i PVC-konstrotting",
            "Kudde: linne över PP-bomull",
            "Färg: beige",
            "Vikt: 1,5 kg",
            "Paketmått: 57 × 57 × 37 cm",
        ],
        "skotsel": [
            "Stativet är trebent och står stadigt på plant golv. Ställ sängen "
            "där katten kan se rummet — den glesa flätningen gör att den ser "
            "genom väggarna även när den ligger ner.",
            KONSTROTTING_PVC,
            "Kudden är tjock men inte tvättbar, så den borstas av och vädras i "
            "stället. " + SKOTSEL_FLAT,
        ],
        "faq": [
            ("Hur mycket tål den?",
             "Fem kilo. Det räcker för de flesta huskatter men inte för en "
             "riktigt tung hankatt."),
            ("Går kudden att tvätta?",
             "Nej. Leverantören anger uttryckligen att den tjocka kudden inte "
             "är tvättbar — borsta av den och vädra den i stället."),
            ("Står den stadigt?",
             "Stativet har tre ben och ska stå på plant golv. På en tjock matta "
             "blir den vinglig."),
            ("Är det äkta rotting?",
             "Nej, det är konstrotting i PVC över metalltråd."),
            ("Vill du ha ett slutet rum på höjden?",
             "En " + lank("kattgrotta-upphojd-58-cm", "upphöjd kattgrotta på 58 cm") +
             " står också på ben, men är ett slutet klot med en rund ingång."),
        ],
    },
    # ------------------------------------------------------ slutna grottor ---
    {
        "kort": "ad90a1cc",
        "id": "ad90a1cc-e7e3-4405-bcd3-9f2ca74e6894",
        "sokord": "kattigloo",
        "slug": "kattigloo-flatad-50-cm",
        "sku": "FP-kattigloo-flatad-50-cm",
        "name": "Kattigloo flätad 50 cm – kupol med rund ingång, tvättbar kudde",
        "title": "Kattigloo 50 cm med rund ingång | Fyndplats",
        "meta": ("Flätad kattigloo på Ø50 cm med kupolformat tak och en rund "
                 "ingång på 31 cm. Tvättbar kudde. För katter upp till 4 kg."),
        "ingress": (
            "<p>En sluten kupol med en rund ingång på 31 cm — bred nog att gå "
            "in i utan att kröka rygg, men med tak och väggar hela vägen runt. "
            "Katter som drar sig undan när det kommer folk väljer den här "
            "framför en öppen bädd, och den fungerar lika bra som mörkt "
            "sovrum mitt på dagen.</p>"),
        "eg": [
            "Sluten kupol, Ø50 cm och 31 cm hög",
            "Rund ingång på Ø31 cm — katten går in utan att böja sig",
            "Basen är Ø40 cm, så den tar liten golvyta",
            "Kudde på Ø50 cm som tas ur och tvättas",
            "För katter och valpar upp till 4 kg, ingen montering",
        ],
        "spec": [
            "Mått: Ø50 × 31 cm",
            "Bas: Ø40 cm",
            "Ingång: Ø31 cm",
            "Kudde: Ø50 cm, avtagbar och tvättbar",
            "För djur upp till 4 kg",
            "Stomme: stål med flätning i PE-konstrotting",
            "Klädsel: polyester",
            "Färg: ljusbrun",
            "Fraktvikt: 4 kg",
            "Paketmått: 51 × 51 × 34 cm",
        ],
        "skotsel": [
            "Ställ igloon där det är lugnt — en sluten bädd fyller sin "
            "funktion först när katten kan lita på att den får vara i fred "
            "där. Basen är smalare än kupolen, så den får plats mellan en "
            "soffa och en vägg.",
            KONSTROTTING,
            "Kudden dras ut genom ingången och tvättas. " + SKOTSEL_FLAT,
        ],
        "faq": [
            ("Hur stor katt får plats?",
             "Leverantören anger upp till 4 kg. Ingången är Ø31 cm, vilket är "
             "det mått som avgör i praktiken — en riktigt stor huskatt får "
             "tränga sig."),
            ("Går kudden att tvätta?",
             "Ja, kudden är lös och tvättas separat."),
            ("Är det äkta rotting?",
             "Nej, det är konstrotting i PE-plast över en stålstomme."),
            ("Behöver den monteras?",
             "Nej, den kommer färdig."),
            ("Vill du hellre ha något öppet?",
             "En " + lank("kattbadd-med-kattoron-50-cm", "kattbädd med kattöron") +
             " är lika bred men öppen upptill, och tål 10 kg."),
        ],
    },
    {
        "kort": "f6e3098e",
        "id": "f6e3098e-be11-43bd-9a89-80c65770b519",
        "sokord": "kattkorg",
        "slug": "kattkorg-i-tva-plan-40-cm",
        "sku": "FP-kattkorg-tva-plan-40-cm",
        "name": "Kattkorg i två plan 40 cm – grotta under, liggyta på taket",
        "title": "Kattkorg i två plan, Ø40 cm | Fyndplats",
        "meta": ("Flätad kattkorg på Ø40 cm i två plan: sluten grotta med "
                 "Ø21 cm ingång under och en liggyta med kudde på taket."),
        "ingress": (
            "<p>En tunnformad korg där katten får två platser i stället för en: "
            "en sluten grotta i botten med en rund ingång på 21 cm, och ett "
            "platt tak att ligga och titta ut från. Katter som byter plats med "
            "humöret slipper välja — mörkt när det är oroligt, uppsikt när det "
            "är lugnt.</p>"),
        "eg": [
            "Två plan: sluten grotta under, liggyta på taket",
            "Ø40 cm och 30 cm hög — får plats på en hylla eller i ett hörn",
            "Rund ingång på Ø21 cm",
            "Mjuk kudde på Ø32 cm i bomull",
            "Levereras färdig, ingen montering",
        ],
        "spec": [
            "Mått: Ø40 × 30 cm",
            "Ingång: Ø21 cm",
            "Kudde: Ø32 cm",
            "Plan: två (grotta i botten, liggyta på taket)",
            "Stomme: flätad PE-konstrotting",
            "Klädsel: polyester över PP-bomull",
            "Färg: ljusbrun",
            "Fraktvikt: 3,5 kg",
            "Paketmått: 42 × 42 × 32 cm",
        ],
        "skotsel": [
            "Ingången är Ø21 cm, och det är det måttet som avgör vilken katt "
            "som kommer in bekvämt — en kattunge eller en smal vuxen katt går "
            "rakt in, en tung huskatt tränger sig. Mät gärna över katten "
            "bakom frambenen innan du bestämmer dig.",
            KONSTROTTING,
            "Kudden tas ur genom ingången. " + SKOTSEL_FLAT,
        ],
        "faq": [
            ("Hur mycket tål taket?",
             "Leverantörens uppgifter om vikt går isär, så vi anger ingen "
             "maxlast här. Det mått som går att lita på är storleken: korgen "
             "är Ø40 cm och ingången Ø21 cm."),
            ("Vilken katt passar den till?",
             "Ingången på Ø21 cm är den verkliga gränsen. Kattungar och smalare "
             "vuxna katter går in utan besvär."),
            ("Är det äkta rotting?",
             "Nej, flätningen är konstrotting i PE-plast."),
            ("Behöver den monteras?",
             "Nej, den kommer färdig i ett paket på 42 × 42 × 32 cm."),
            ("Vill du ha två plan i något större?",
             "En " + lank("kattkoja-vattenhyacint-tva-plan",
                          "kattkoja i vattenhyacint") +
             " har också två liggytor, är fyrkantig och 41,5 cm hög — och "
             "flätad i äkta naturgräs."),
        ],
    },
    {
        "kort": "1ed0d9cb",
        "id": "1ed0d9cb-5f2e-4603-b7d5-ea6284ce779f",
        "sokord": "kattgrotta",
        "slug": "kattgrotta-upphojd-58-cm",
        "sku": "FP-kattgrotta-upphojd-58-cm",
        "name": "Kattgrotta upphöjd 58 cm – klotformad korg på ben, tål 10 kg",
        "title": "Upphöjd kattgrotta 58 cm på ben | Fyndplats",
        "meta": ("Klotformad kattgrotta på trebent stativ, Ø52 cm och 58 cm "
                 "hög. Ingång Ø38 cm, luftar under och tål 10 kg."),
        "ingress": (
            "<p>Ett flätat klot på ett smalt trebent stativ, 58 cm högt. "
            "Katten ligger inne i klotet med tak runt om men når ändå "
            "utsikten, och luften får cirkulera under bädden i stället för "
            "att fukten samlas mot golvet. Den mörka flätningen står emot "
            "smuts betydligt bättre än en ljus.</p>"),
        "eg": [
            "Klotformad grotta, Ø52 cm, total höjd 58 cm",
            "Rund ingång på Ø38 cm",
            "Trebent stativ som lyfter bädden från golvet",
            "Tål 10 kg — även en stor huskatt",
            "Matta på Ø39 cm ingår, levereras färdig",
        ],
        "spec": [
            "Mått: Ø52 × 58 cm",
            "Ingång: Ø38 cm",
            "Matta: Ø39 cm",
            "Maxlast: 10 kg",
            "Stomme: metalltråd med flätning i PE-konstrotting",
            "Matta: polyester över PP-bomull",
            "Färg: brun",
            "Fraktvikt: 4,2 kg",
            "Paketmått: 54 × 46 × 59 cm",
        ],
        "skotsel": [
            "Den upphöjda konstruktionen är poängen: katten ligger över "
            "golvdraget och luften kommer åt under bädden, så den torkar upp "
            "i stället för att bli fuktig undertill. Ställ den på plant golv "
            "— stativet har tre ben.",
            KONSTROTTING,
            "Mattan är tjock men inte tvättbar; borsta av den och vädra den. "
            + SKOTSEL_FLAT,
        ],
        "faq": [
            ("Hur mycket tål den?",
             "Tio kilo, alltså även en tung huskatt."),
            ("Går mattan att tvätta?",
             "Nej. Leverantören anger att den tjocka mattan inte är tvättbar. "
             "Borsta av den och vädra den i stället."),
            ("Varför står den på ben?",
             "För att luften ska komma åt under bädden. Katten slipper också "
             "golvdraget, och det är lättare att dammsuga under."),
            ("Är det äkta rotting?",
             "Nej, flätningen är konstrotting i PE-plast över metalltråd."),
            ("Vill du ha något öppet på samma höjd?",
             "En " + lank("kattsang-pa-ben-56-cm", "kattsäng på ben, Ø56 cm") +
             " står också på stativ men är en öppen skål i ljus, gles flätning."),
        ],
    },
    # ------------------------------------------ vattenhyacint och möbler ---
    {
        "kort": "e16338a9",
        "id": "e16338a9-ef5b-4420-a84e-99a486e96001",
        "sokord": "kattkoja",
        "slug": "kattkoja-vattenhyacint-tva-plan",
        "sku": "FP-kattkoja-vattenhyacint",
        "name": "Kattkoja i vattenhyacint – två liggytor, båda med tvättbar kudde",
        "title": "Kattkoja i vattenhyacint, två plan | Fyndplats",
        "meta": ("Fyrkantig kattkoja flätad i vattenhyacint, 37,5 × 37,5 × "
                 "41,5 cm. Rum inuti och liggyta på taket, två tvättbara kuddar."),
        "ingress": (
            "<p>En fyrkantig koja flätad i torkat vattenhyacintgräs, med ett "
            "rum inuti och en liggyta ovanpå. Båda planen har varsin kudde, "
            "och hela klädseln går i tvättmaskinen. Naturgräset ger en varmare "
            "och mer oregelbunden yta än plastflätning — den syns tydligt på "
            "nära håll och åldras vackrare.</p>"),
        "eg": [
            "Flätad i äkta vattenhyacintgräs, inte plast",
            "Två liggytor: rum inuti och plats ovanpå taket",
            "Två kuddar, båda tvättbara",
            "Dörröppning 19 × 23 cm, invändigt 36 × 36 × 31 cm",
            "Bär 16 kg — även en katt som hoppar upp på taket",
        ],
        "spec": [
            "Mått (B × D × H): 37,5 × 37,5 × 41,5 cm",
            "Invändigt: 36 × 36 × 31 cm",
            "Övre liggyta: 36 × 36 cm, 6 cm kant",
            "Dörröppning: 19 × 23 cm",
            "Kuddar: 36 × 36 × 3 cm, två stycken, tvättbara",
            "Bärighet: 16 kg",
            "Material: vattenhyacintgräs på spånskiva",
            "Klädsel: plysch, 100 % polyester",
            "Färg: natur och gräddvit",
            "Fraktvikt: 4,7 kg",
            "Paketmått: 75 × 42 × 17 cm",
        ],
        "skotsel": [
            "Kojan levereras platt i ett paket på 75 × 42 × 17 cm och skruvas "
            "ihop. Räkna med en kvart och en insexnyckel; delarna är få och "
            "monteringen görs på golvet.",
            VATTENHYACINT + " Gräset är känsligt för väta — kojan hör hemma "
            "inomhus, inte på en altan eller i ett uterum som blir fuktigt.",
            "Båda kuddarna dras ur och tvättas. Flätningen dammsugs med "
            "möbelmunstycke eller borstas ur torr; använd inte blöt trasa.",
        ],
        "faq": [
            ("Är det äkta naturmaterial?",
             "Ja. Flätningen är torkat vattenhyacintgräs på en stomme av "
             "spånskiva — inte plast."),
            ("Får katten plats på taket?",
             "Ja, den övre liggytan är 36 × 36 cm med en 6 cm hög kant runt "
             "om, och kojan bär 16 kg."),
            ("Går kuddarna att tvätta?",
             "Ja, båda två."),
            ("Kan den stå ute?",
             "Nej. Vattenhyacint och spånskiva tål inte väta. Ska katten ha "
             "ett hus utomhus behövs behandlat trä och tätt tak."),
            ("Behöver den monteras?",
             "Ja, den kommer platt i kartong och skruvas ihop."),
        ],
    },
    {
        "kort": "73cb432c",
        "id": "73cb432c-b86f-4bde-9900-97a844f40774",
        "sokord": "sittpuff",
        "slug": "sittpuff-vattenhyacint-katt",
        "sku": "FP-sittpuff-vattenhyacint",
        "name": "Sittpuff i vattenhyacint med kattgömma – trälock, tål 80 kg",
        "title": "Sittpuff i vattenhyacint med kattgömma | Fyndplats",
        "meta": ("Rund sittpuff på 44 cm i flätad vattenhyacint med lock av "
                 "paulowniaträ och en kattöppning på Ø20 cm i sidan. Tål 80 kg."),
        "ingress": (
            "<p>Utifrån en rund pall i flätat vattenhyacintgräs med ett lock av "
            "paulowniaträ; från sidan en öppning på 20 centimeter in till "
            "kattens eget rum. Möbeln gör alltså två jobb på samma golvyta — "
            "du sitter på locket medan katten sover under, och ingen ser att "
            "det är en kattmöbel.</p>"),
        "eg": [
            "Rund pall, 44 × 43 cm och 42 cm hög",
            "Lock av paulowniaträ, Ø38 cm",
            "Kattöppning på Ø20 cm i sidan, rummet inuti 41 × 40 × 33 cm",
            "Kudde på Ø38 cm inuti, avtagbar och tvättbar",
            "Flätad i äkta vattenhyacintgräs, ben som lyfter 12 cm från golvet",
        ],
        "spec": [
            "Mått (B × D × H): 44 × 43 × 42 cm",
            "Invändigt: 41 × 40 × 33 cm",
            "Kattöppning: Ø20 cm",
            "Lock: Ø38 cm paulowniaträ",
            "Kudde: Ø38 cm, 2 cm tjock, tvättbar",
            "Benhöjd över golv: 12 cm",
            "Material: vattenhyacintgräs på järnstomme",
            "Klädsel: flanell över fyllning",
            "Färg: ljusbrun, naturträ och grått",
            "Fraktvikt: 5 kg",
            "Paketmått: 48 × 48 × 44 cm",
        ],
        "skotsel": [
            "Pallen levereras omonterad och skruvas ihop; benen sätts på "
            "underifrån. Ställ den vid en fåtölj eller soffa så att locket "
            "kommer till användning — det är den placeringen som gör att "
            "möbeln bär sin golvyta två gånger.",
            VATTENHYACINT + " Gräset tål inte väta, så pallen hör hemma "
            "inomhus.",
            "Kudden inuti tas ut genom öppningen och tvättas. Locket torkas av "
            "med torr trasa; obehandlat paulowniaträ ska inte blötas. "
            + SKOTSEL_FLAT,
        ],
        "villkor": ("<h2>Så mycket tål den</h2><p>Locket är gjort att sitta på "
                    "och bär <strong>80 kg</strong>. Utrymmet under locket är "
                    "kattens och rymmer en katt på upp till 5 kg. Ställ dig "
                    "inte på locket — talet gäller att sitta, inte att stå.</p>"),
        "faq": [
            ("Går det att sitta på den på riktigt?",
             "Ja. Locket är av paulowniaträ och pallen bär 80 kg. Den är byggd "
             "som en sittpuff, inte som en kattmöbel med lock."),
            ("Hur stor katt får plats under?",
             "Rummet är 41 × 40 cm och 33 cm högt, och öppningen Ø20 cm. "
             "Leverantören anger katter upp till 5 kg."),
            ("Är det äkta naturmaterial?",
             "Ja, flätningen är torkat vattenhyacintgräs och locket är "
             "paulowniaträ. Stommen under är järn."),
            ("Kan den stå ute?",
             "Nej. Vattenhyacint och obehandlat trä tål inte väta."),
            ("Behöver den monteras?",
             "Ja, benen skruvas på."),
            ("Vill du ha samma idé i tyg?",
             "En " + lank("fotpall-katt-sammet-60-cm",
                          "fotpall i sammet med kattbädd") +
             " är rektangulär, 60 cm bred och klädd i grå sammetslook — men "
             "den är en fotpall, inte en sittplats."),
        ],
    },
    {
        "kort": "d82950a3",
        "id": "d82950a3-e470-4bdf-ba05-6dc39f8d251a",
        "sokord": "fotpall",
        "slug": "fotpall-katt-sammet-60-cm",
        "sku": "FP-fotpall-katt-sammet-60",
        "name": "Fotpall 60 cm med kattbädd inuti – sammetslook, uppfällbart lock",
        "title": "Fotpall med kattbädd, 60 cm | Fyndplats",
        "meta": ("Grå fotpall på 60 × 45 cm med en kattbädd inuti och "
                 "uppfällbart lock. Öppning 21,5 × 23 cm, furuben, tål 30 kg."),
        "ingress": (
            "<p>En stoppad fotpall på 60 × 45 cm i grå sammetslook, med en "
            "öppning i sidan in till en vadderad kattbädd. Locket fälls upp "
            "när du ska byta kudde, och furubenen lyfter pallen fem centimeter "
            "från golvet så att det inte blir fuktigt undertill. Utifrån ser "
            "den ut som en vanlig möbel.</p>"),
        "eg": [
            "Stoppad fotpall, 60 × 45 × 44,5 cm i grå sammetslook",
            "Kattbädd inuti: 56,5 × 41,5 × 36,5 cm",
            "Öppning i sidan, 21,5 × 23 cm",
            "Uppfällbart lock och uttagbar, tvättbar innerkudde",
            "Ben i furu som lyfter pallen 5 cm från golvet",
        ],
        "spec": [
            "Mått (B × D × H): 60 × 45 × 44,5 cm",
            "Invändigt: 56,5 × 41,5 × 36,5 cm",
            "Öppning: 21,5 × 23 cm",
            "Innerkudde: 56 × 41 × 2 cm, uttagbar och tvättbar",
            "Golvavstånd: 5 cm",
            "Maxlast: 30 kg ovanpå, 15 kg inuti",
            "Stomme: MDF med ben i furu",
            "Klädsel: plysch och mockaimitation över fyllning",
            "Färg: grå",
            "Fraktvikt: 5,5 kg",
            "Paketmått: 61 × 10 × 46,5 cm",
        ],
        "skotsel": [
            "Pallen levereras platt i ett paket som bara är 10 cm tjockt och "
            "skruvas ihop; benen sätts på underifrån och locket hängs på. "
            "Inget verktyg utöver den bifogade nyckeln behövs.",
            "Stommen är MDF, inte massivt trä — benen är furu. Torka av "
            "klädseln med en lätt fuktad trasa och låt torka; MDF tål inte "
            "att stå blött.",
            "Innerkudden lyfts ut genom locket och tvättas. Fäll upp locket "
            "då och då och dammsug ur bädden — kattsand och hår samlas i "
            "hörnen.",
        ],
        "villkor": ("<h2>Så mycket tål den</h2><p>Ovansidan bär "
                    "<strong>30 kg</strong> och utrymmet inuti 15 kg. Det "
                    "räcker för fötter och ben, för en filt eller för en katt "
                    "— men det är <strong>inte</strong> en sittplats för en "
                    "vuxen. Sätt dig inte på den.</p>"),
        "faq": [
            ("Går det att sitta på den?",
             "Nej. Ovansidan bär 30 kg och pallen är avsedd för fötterna. Vill "
             "du ha en möbel att sitta på finns en " +
             lank("sittpuff-vattenhyacint-katt",
                  "sittpuff i vattenhyacint med kattgömma") +
             " som bär 80 kg."),
            ("Hur kommer katten in?",
             "Genom öppningen i sidan, 21,5 × 23 cm. Locket är till för dig "
             "när kudden ska bytas."),
            ("Går kudden att tvätta?",
             "Ja, innerkudden lyfts ut och tvättas."),
            ("Vad är den gjord av?",
             "Stommen är MDF och benen furu. Klädseln är plysch och "
             "mockaimitation — inte äkta mocka."),
            ("Behöver den monteras?",
             "Ja, den kommer platt i kartong. Benen skruvas på."),
        ],
    },
]


def bygg(p):
    """Sätter ihop hela plainDescription för en produkt."""
    delar = [p["ingress"], egenskaper(p["eg"]), spec(p["spec"]),
             skotsel(p["skotsel"])]
    if p.get("villkor"):
        delar.append(p["villkor"])
    delar.append(faq(p["faq"]))
    return "".join(delar)


if __name__ == "__main__":
    import re
    for p in PRODUKTER:
        h = bygg(p)
        synlig = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()
        print("%s  namn %2d  titel %2d  meta %3d  html %4d  synlig %4d  %s"
              % (p["kort"], len(p["name"]), len(p["title"]), len(p["meta"]),
                 len(h), len(synlig), p["slug"]))
