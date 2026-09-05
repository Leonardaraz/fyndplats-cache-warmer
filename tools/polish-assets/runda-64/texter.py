# -*- coding: utf-8 -*-
"""Runda 64 — åtta fåtöljer. Texten skrivs HÄR, inte inline i API-anropet.

Alla siffror kommer ur leverantörens Technische Daten. Ingenting är påhittat.
Sju saker är MEDVETET utelämnade, och skälen står i LAGE.md:

  1. Artikelnumret `83F-028V00GY`, som står i b09d20b7:s egen brödtext.
  2. Ordet "gummi" om ca92e3ce — feedkolumnen kapade `Gummiholz` till `Gummi`.
  3. Ordet "bomull" om beacff5a — ingressen säger bomull, materialet polyester.
  4. Ordet "matstol" om beacff5a — brödtexten kallar den `Esszimmerstuhl`.
  5. Ordet "öronlappsfåtölj" om b09d20b7 — ryggen är 43 cm hög.
  6. Egenvikten på b01d8af2 och ca92e3ce, som motsäger sig själv.
  7. "Gungstol för barnen" om e76002c1, som samtidigt varnar för att gunga.
"""

BAS = "https://www.fyndplats.se/produkt/"


def lank(slug, text):
    return '<a href="%s%s">%s</a>' % (BAS, slug, text)


# --------------------------------------------------------- delade block ---
# Samma materialupplysning på de sidor som delar material. En omskrivning per
# sida vore lika många chanser att införa ett fel.
CHENILLE = (
    "Chenille är ett vävt tyg med kort, tät lugg som ger en matt yta och en "
    "mjuk känsla mot huden. Det är 100 % polyester, alltså inte ett naturtyg, "
    "och det tål vardagsslitage bättre än sammet."
)
MIKROFIBER = (
    "Klädseln är mikrofiber — ett tätvävt syntettyg som andas, är lätt att "
    "torka av och tål att sitta på dagligen."
)
SKOTSEL_TYG = (
    "Dammsug med möbelmunstycke med jämna mellanrum och torka bort fläckar "
    "med en lätt fuktad trasa och milt rengöringsmedel. Låt torka innan du "
    "sätter dig igen, och undvik att ställa fåtöljen i direkt solljus — "
    "syntettyger bleks av UV över tid."
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
    # ------------------------------------------------ reclinerfåtöljerna ---
    {
        "kort": "5e2dee74",
        "id": "5e2dee74-2d13-4add-b312-673ea0e08be7",
        "sokord": "reclinerfåtölj med gungfunktion",
        "slug": "reclinerfatolj-gungande-chenille",
        "sku": "FP-reclinerfatolj-gungande",
        "name": "Reclinerfåtölj som gungar – 155° liggläge, 360° snurr och sidofickor",
        "title": "Reclinerfåtölj med gungfunktion, 155° | Fyndplats",
        "meta": ("Manuell reclinerfåtölj i chenille som både gungar och snurrar "
                 "360°. Ryggen fälls till 155° med fotstödet, bär 150 kg."),
        "ingress": (
            "<p>De flesta reclinerfåtöljer gör en sak: de fäller ryggen. Den "
            "här gör tre. Ryggen går till 155° med fotstödet synkroniserat, "
            "hela stolen snurrar 360° på sin fot, och den vaggar mjukt fram "
            "och tillbaka även i upprätt läge. Regleringen är manuell — ingen "
            "sladd, ingen motor, inget som kan sluta fungera.</p>"),
        "eg": [
            "Ryggen fälls till 155° med fotstödet synkroniserat — manuellt reglage",
            "Vaggfunktion och 360° snurrfot, båda även i upprätt läge",
            "Sitsen är fjäderfylld, 20 cm tjock; ryggdynan 22 cm",
            "Två sidofickor på 30 × 25 cm för fjärrkontroll och bok",
            "Bär 150 kg och passar dig som är upp till 190 cm lång",
            "Behöver 30 cm fritt bakom sig för att kunna fällas",
            "Monteras på omkring en kvart",
        ],
        "spec": [
            "Mått upprätt (B × D × H): 93 × 91 × 104 cm",
            "Mått tillbakalutad (B × D × H): 93 × 162 × 83 cm",
            "Sits (B × D × H): 52 × 57 × 53 cm",
            "Ryggstöd (B × L): 90 × 62 cm",
            "Tjocklek: 20 cm sits, 22 cm rygg",
            "Armstöd: 20 × 61 cm, 57 cm över golv",
            "Sidofickor: 30 × 25 cm, två stycken",
            "Fritt utrymme bakom: 30 cm",
            "Maxlast: 150 kg",
            "Passar kroppslängd upp till 190 cm",
            "Material: chenille (100 % polyester), skum, flerskiktsskiva, metall",
            "Färg: gräddvit och svart",
            "Vikt: 42,6 kg",
            "Paketmått: 86 × 66 × 48 cm",
        ],
        "skotsel": [
            "Mät väggavståndet innan du bestämmer plats. Fåtöljen växer från "
            "91 till 162 cm i djup när ryggen fälls, och den behöver 30 cm "
            "fritt bakom sig — en fåtölj som står tätt mot väggen går inte att "
            "fälla helt.",
            CHENILLE,
            SKOTSEL_TYG,
        ],
        "faq": [
            ("Är den elektrisk?",
             "Nej. Ryggen och fotstödet regleras manuellt, så det finns varken "
             "sladd eller motor. Fördelen är att det inte finns någon "
             "elektronik som kan gå sönder; nackdelen är att du behöver "
             "kroppstyngden för att fälla den."),
            ("Hur mycket plats behöver den?",
             "93 cm bred alltid, och mellan 91 och 162 cm djup beroende på hur "
             "långt ryggen är fälld. Räkna dessutom med 30 cm fritt bakom."),
            ("Går det att gunga och ligga samtidigt?",
             "Ja, den här modellen vaggar i alla lägen. Det gör den inte lik "
             "en " +
             lank("tv-fatolj-mugghallare-135", "tv-fåtölj med mugghållare") +
             ", som uttryckligen inte ska vaggas medan ryggen är fälld."),
            ("Hur lång får man vara?",
             "Upp till 190 cm. Är du längre än så hamnar nacken ovanför "
             "ryggstödets kant när stolen är fälld."),
            ("Behöver den monteras?",
             "Ja, men lite. Den kommer i ett paket på 86 × 66 × 48 cm och tar "
             "omkring femton minuter att sätta ihop."),
        ],
    },
    {
        "kort": "e76002c1",
        "id": "e76002c1-7407-4f32-a488-74d781be52cf",
        "sokord": "tv-fåtölj med mugghållare",
        "slug": "tv-fatolj-mugghallare-135",
        "sku": "FP-tv-fatolj-mugghallare",
        "name": "Tv-fåtölj med två mugghållare – 135° liggläge och 360° snurrfot",
        "title": "Tv-fåtölj med mugghållare, 135° | Fyndplats",
        "meta": ("Tv-fåtölj i gråbeige mikrofiber med två mugghållare i armstöden. "
                 "Ryggen fälls till 135° med en sidospak. Bär 150 kg."),
        "ingress": (
            "<p>Två mugghållare på Ø 7,5 cm sitter infällda i armstöden, så "
            "koppen står stadigt även när ryggen är fälld. Du drar i en spak "
            "på sidan: ryggen går till 135° och fotstödet fälls upp i samma "
            "rörelse. Stolen snurrar också 360° på sin fot.</p>"),
        "eg": [
            "Två mugghållare på Ø 7,5 cm, infällda i armstöden",
            "Ryggen fälls till 135° med sidospak — fotstödet följer med",
            "360° snurrfot och vaggfunktion i upprätt läge",
            "Ryggdynan är 27 cm tjock",
            "Klädsel i mikrofiber, avtorkningsbar",
            "Bär 150 kg och passar dig som är upp till 185 cm lång",
            "Monteras på omkring tio minuter",
        ],
        "spec": [
            "Mått upprätt (B × D × H): 87 × 95 × 102 cm",
            "Mått i liggläge (B × D × H): 87 × 162 × 80 cm",
            "Sits (B × D × H): 45 × 53 × 46 cm",
            "Ryggstöd (B × D): 65 × 75 cm, 27 cm tjockt",
            "Armstöd: 21 × 43 cm, 15 cm över sitsen",
            "Mugghållare: Ø 7,5 cm, två stycken",
            "Maxlast: 150 kg",
            "Passar kroppslängd upp till 185 cm",
            "Material: mikrofiber, skum",
            "Färg: gråbeige",
            "Vikt: 49,8 kg",
            "Paketmått: 77 × 70 × 45 cm",
        ],
        "skotsel": [
            "Vagga inte fåtöljen medan ryggen är fälld. Vaggfunktionen är "
            "avsedd för upprätt läge; med ryggen nere flyttas tyngdpunkten "
            "bakåt och stolen blir instabil.",
            MIKROFIBER,
            SKOTSEL_TYG,
        ],
        "faq": [
            ("Var sitter mugghållarna?",
             "Infällda i armstöden, en på varje sida, Ø 7,5 cm. De är gjorda "
             "för en vanlig mugg eller burk, inte för en hög termos."),
            ("Kan man gunga i liggläge?",
             "Nej. Vaggfunktionen ska bara användas när ryggen är upprätt. "
             "Vill du ha en fåtölj som vaggar även fälld finns en " +
             lank("reclinerfatolj-gungande-chenille",
                  "reclinerfåtölj som gungar i alla lägen") + "."),
            ("Hur mycket väger den?",
             "49,8 kg. Det är den tyngsta av våra fåtöljer och den bör bäras "
             "av två personer."),
            ("Hur djup blir den fälld?",
             "162 cm, mot 95 cm upprätt. Bredden är 87 cm i båda lägena."),
            ("Behöver den monteras?",
             "Ja, cirka tio minuter. Paketet mäter 77 × 70 × 45 cm."),
        ],
    },
    {
        "kort": "17620f5b",
        "id": "17620f5b-b539-449d-a1ef-464fb9d185c1",
        "sokord": "reclinerfåtölj med fotpall",
        "slug": "reclinerfatolj-fotpall-130-grader",
        "sku": "FP-reclinerfatolj-fotpall",
        "name": "Reclinerfåtölj med fotpall – rygg till 130°, 360° snurr och stålram",
        "title": "Reclinerfåtölj med fotpall, 130° | Fyndplats",
        "meta": ("Reclinerfåtölj i mörkgrå mikrofiber med separat fotpall. "
                 "Ryggen går till 130°, sitsen bär 150 kg och pallen 50 kg."),
        "ingress": (
            "<p>Fotpallen är lös, inte inbyggd. Det gör två saker: du kan "
            "flytta undan den när du inte vill ha den i vägen, och du kan "
            "använda den som extra sittplats — men bara upp till 50 kg. "
            "Fåtöljen själv bär 150 kg, fälls till 130° och snurrar 360° på "
            "en pulverlackerad stålram.</p>"),
        "eg": [
            "Lös fotpall på 52 × 43 × 46 cm — kan flyttas eller ställas undan",
            "Ryggen justeras till 130°",
            "360° snurrfot",
            "Sitsen är 58 × 58 cm med 22 cm tjock dyna",
            "Pulverlackerad stålram med stomme i träfiberskiva",
            "Sitsen bär 150 kg, fotpallen 50 kg",
            "Behöver 18 cm fritt bakom sig",
            "Monteras — stålramen skruvas ihop",
        ],
        "spec": [
            "Mått upprätt (L × B × H): 78 × 91 × 103,5 cm",
            "Mått i liggläge (B × D × H): 78 × 99 × 94 cm",
            "Fotpall (B × D × H): 52 × 43 × 46 cm",
            "Sits (B × D × H): 58 × 58 × 50 cm, 22 cm tjock",
            "Ryggstödets höjd: 83 cm",
            "Fritt utrymme bakom: 18 cm",
            "Maxlast sits: 150 kg",
            "Maxlast fotpall: 50 kg",
            "Material: mikrofiber (100 % polyester), skum, stål, träfiberskiva",
            "Färg: mörkgrå och svart",
            "Vikt: 31,5 kg",
            "Paketmått: 87 × 38 × 65 cm",
        ],
        "skotsel": [
            "Sätt dig inte på fotpallen som om den vore en pall att sitta på. "
            "Den bär 50 kg — en tredjedel av vad sitsen klarar — och är gjord "
            "för benen.",
            MIKROFIBER,
            SKOTSEL_TYG,
        ],
        "faq": [
            ("Går det att sitta på fotpallen?",
             "Bara om du väger under 50 kg. Den är avsedd för benen, inte som "
             "sittplats. Fåtöljen själv bär 150 kg."),
            ("Kan pallen ställas undan?",
             "Ja, den är helt lös. Det skiljer den från en " +
             lank("snurrfatolj-fotpall-hojdjusterbar",
                  "snurrfåtölj vars fotpall går att höja och sänka") +
             ", där pallen i stället kan ställas i rätt höjd."),
            ("Hur mycket plats behöver den?",
             "78 cm bred, och mellan 91 och 99 cm djup. Räkna dessutom med "
             "18 cm fritt bakom ryggen."),
            ("Vad är stommen gjord av?",
             "En pulverlackerad stålram med stomme i träfiberskiva. Klädseln "
             "är mikrofiber i 100 % polyester."),
            ("Behöver den monteras?",
             "Ja. Den kommer i ett paket på 87 × 38 × 65 cm."),
        ],
    },
    # ------------------------------------------- fåtölj och pall i par ---
    {
        "kort": "b09d20b7",
        "id": "b09d20b7-8114-4a7d-be8c-27815a5d57a8",
        "sokord": "snurrfåtölj med fotpall",
        "slug": "snurrfatolj-fotpall-hojdjusterbar",
        "sku": "FP-snurrfatolj-fotpall",
        "name": "Snurrfåtölj med höjdjusterbar fotpall – chenille, båda snurrar 360°",
        "title": "Snurrfåtölj med höjdjusterbar fotpall | Fyndplats",
        "meta": ("Snurrfåtölj i grå chenille med fotpall som ställs steglöst "
                 "mellan 40 och 47 cm. Båda delarna snurrar 360°. Bär 120 kg."),
        "ingress": (
            "<p>Fotpallen går att ställa i höjd, mellan 40 och 47 cm, så du "
            "kan lägga benen i den vinkel som känns rätt i stället för den "
            "höjd som är låst från fabrik. Både fåtöljen och pallen snurrar "
            "360°, och stoppningen är dubbellagrad med skum och "
            "polyesterfiber.</p>"),
        "eg": [
            "Fotpallen ställs steglöst mellan 40 och 47 cm i höjd",
            "Både fåtöljen och pallen snurrar 360°",
            "Dubbellagrad stoppning av skum och polyesterfiber",
            "Sitsen är 44 × 48 cm med 18 cm tjock dyna",
            "Låg, svängd rygg på 43 cm — en loungefåtölj, inte en högryggad",
            "Stålram, bär 120 kg",
            "Delarna är märkta och monteringsanvisning följer med",
        ],
        "spec": [
            "Fåtölj (B × D × H): 74 × 86 × 85 cm",
            "Fotpall (B × D × H): 54 × 41 × 40–47 cm",
            "Sits (B × D × H): 44 × 48 × 50 cm, 18 cm tjock",
            "Ryggstöd (B × H × D): 71 × 43 × 16 cm",
            "Armstöd: 20 × 50 cm, 13 cm över sitsen",
            "Maxlast: 120 kg",
            "Material: chenille (100 % polyester), stål, skum, polyesterfiber",
            "Färg: grå och svart",
            "Vikt: 21 kg",
            "Paketmått: 76 × 69 × 55 cm",
        ],
        "skotsel": [
            "Fotpallen når mellan 40 och 47 cm medan sitsen ligger på 50 cm. "
            "Pallen hamnar alltså alltid något lägre än sitsen, i alla lägen — "
            "benen får en svag lutning nedåt i stället för att ligga rakt ut.",
            CHENILLE,
            SKOTSEL_TYG,
        ],
        "faq": [
            ("Hur högt går fotpallen?",
             "Mellan 40 och 47 cm. Sitsen ligger på 50 cm, så pallen når inte "
             "riktigt upp i sitshöjd i något läge."),
            ("Har den hög rygg?",
             "Nej. Ryggen är 43 cm hög räknat från sitsen — en låg "
             "loungefåtölj som stödjer ryggslutet men inte nacken."),
            ("Snurrar fotpallen också?",
             "Ja, båda delarna har 360° snurrfot."),
            ("Vad skiljer den från en fast fotpall?",
             "Höjden. En " +
             lank("reclinerfatolj-fotpall-130-grader",
                  "reclinerfåtölj med lös fotpall") +
             " har pallen i fast höjd men går i stället att fälla i ryggen."),
            ("Behöver den monteras?",
             "Ja. Delarna är märkta och en anvisning följer med. Paketet "
             "mäter 76 × 69 × 55 cm."),
        ],
    },
    {
        "kort": "b01d8af2",
        "id": "b01d8af2-517d-47cf-9286-fa40a49e669d",
        "sokord": "sammetsfåtölj med fotpall",
        "slug": "sammetsfatolj-fotpall-33-cm-ben",
        "sku": "FP-sammetsfatolj-fotpall-33",
        "name": "Sammetsfåtölj med fotpall – hög rygg, 33 cm stålben och ljusgrå klädsel",
        "title": "Sammetsfåtölj med fotpall, ljusgrå | Fyndplats",
        "meta": ("Sammetsfåtölj med lös fotpall i ljusgrått, smala stålben på "
                 "33 cm. Hög rygg, justerbara fotkåpor och bär 120 kg."),
        "ingress": (
            "<p>Benen är 33 cm höga och smala i stål, vilket gör att fåtöljen "
            "ser lättare ut än den är och att det går att dammsuga under den. "
            "Fotkåporna är justerbara, så stolen står stadigt även på ett golv "
            "som lutar. Fotpallen är lös och kan användas för sig.</p>"),
        "eg": [
            "Fåtölj och fotpall — använd dem tillsammans eller var för sig",
            "Smala stålben, 33 cm höga, med justerbara fotkåpor",
            "Hög rygg och stoppade armstöd",
            "Klädsel i sammetslook, 100 % polyester",
            "Sitsen är 48 × 51 cm med 10 cm tjock dyna",
            "Bär 120 kg",
            "Monteras — benen skruvas på",
        ],
        "spec": [
            "Fåtölj (L × B × H): 73 × 77,5 × 98 cm",
            "Fotpall (B × D × H): 48 × 36 × 37 cm",
            "Sits (B × D × H): 48 × 51 × 42 cm, 10 cm tjock",
            "Ryggstöd (L × B × H): 70 × 73 × 8 cm",
            "Armstöd (L × B × H): 46 × 6 × 20 cm",
            "Benhöjd: 33 cm",
            "Maxlast: 120 kg",
            "Material: stål, träfiberskiva, skum, sammetslook (100 % polyester)",
            "Färg: ljusgrå",
            "Paketmått: 83 × 71 × 37 cm",
        ],
        "skotsel": [
            "Justera fotkåporna innan du börjar använda fåtöljen. Ett golv som "
            "lutar någon millimeter räcker för att en stol på fyra smala ben "
            "ska vagga, och kåporna är till för just det.",
            "Klädseln är sammetslook i 100 % polyester — inte sammet av "
            "naturfiber. Den har sammetens lyster men tål mer slitage.",
            SKOTSEL_TYG,
        ],
        "faq": [
            ("Är det äkta sammet?",
             "Nej, det är sammetslook i 100 % polyester. Ytan liknar sammet "
             "men tåligheten är en syntetfibers."),
            ("Går fotpallen att använda för sig?",
             "Ja, den är helt fristående och mäter 48 × 36 × 37 cm."),
            ("Går det att dammsuga under den?",
             "Ja. Benen är 33 cm höga, så ett vanligt munstycke kommer under."),
            ("Behöver den monteras?",
             "Ja, men lite. Benen skruvas på; paketet mäter 83 × 71 × 37 cm."),
            ("Finns en liknande utan fotpall?",
             "Ja, en " +
             lank("fatolj-skandinavisk-stil-gummitra",
                  "fåtölj i skandinavisk stil med gummiträram") +
             " i samma prisklass, 68 cm bred och utan lös pall."),
        ],
    },
    # ------------------------------------------------- utan liggfunktion ---
    {
        "kort": "ca92e3ce",
        "id": "ca92e3ce-99b0-44c1-ae59-44245e5d2d0e",
        "sokord": "fåtölj i skandinavisk stil",
        "slug": "fatolj-skandinavisk-stil-gummitra",
        "sku": "FP-fatolj-skandinavisk-stil",
        "name": "Fåtölj i skandinavisk stil – gummiträram, S-fjädrar och 68 cm bredd",
        "title": "Fåtölj i skandinavisk stil, 68 cm | Fyndplats",
        "meta": ("Smal fåtölj på 68 cm med ram i gummiträ och S-fjädrar under "
                 "både sits och rygg. Klädsel i ljusgrå sammetslook, 120 kg."),
        "ingress": (
            "<p>68 cm bred — smal nog att få plats i ett hörn, framför ett "
            "fönster eller i en hall där en vanlig fåtölj tar för mycket "
            "golv. Under både sits- och ryggdynan sitter S-fjädrar, vilket är "
            "skillnaden mellan att sjunka ned i skum och att få stöd som "
            "fjädrar tillbaka.</p>"),
        "eg": [
            "68 cm bred — passar där en vanlig fåtölj blir för bred",
            "S-fjädrar under både sits- och ryggdyna",
            "Ram i gummiträ, ett hårt lövträ",
            "Sitsen är 55 × 53 cm med 19 cm tjock dyna",
            "Benhöjd 28 cm — går att dammsuga under",
            "Klädsel i sammetslook, 100 % polyester",
            "Bär 120 kg",
            "Monteras — benen skruvas på",
        ],
        "spec": [
            "Mått (B × D × H): 68 × 74 × 82 cm",
            "Sits (B × D × H): 55 × 53 × 44 cm, 19 cm tjock",
            "Ryggstöd (L × B): 50 × 52 cm, 11 cm tjockt",
            "Benhöjd: 28 cm",
            "Maxlast: 120 kg",
            "Material: sammetslook (100 % polyester), skum, gummiträ",
            "Färg: ljusgrå",
            "Paketmått: 69 × 34 × 61 cm",
        ],
        "skotsel": [
            "Ramen är gummiträ — ett hårt lövträ från gummiträdet, samma "
            "material som används i massiva bordsskivor. Det är alltså trä, "
            "inte gummi, och sköts som trä: torka av med lätt fuktad trasa och "
            "undvik att låta vatten stå kvar.",
            "S-fjädrarna behöver inget underhåll, men lyft fåtöljen i stället "
            "för att dra den — sidodrag i benen är det som med tiden lossar en "
            "träram.",
            SKOTSEL_TYG,
        ],
        "faq": [
            ("Är ramen gummi?",
             "Nej, den är gummiträ. Det är ett hårt lövträ från gummiträdet "
             "och har ingenting med gummimaterial att göra."),
            ("Vad gör S-fjädrarna för skillnad?",
             "De sitter under sits- och ryggdynan och ger ett fjädrande stöd. "
             "Utan dem vilar dynan direkt mot ramen och trycks ihop över tid."),
            ("Hur smal är den?",
             "68 cm bred och 74 cm djup. Det är omkring tio centimeter "
             "smalare än en normal fåtölj."),
            ("Har den fotpall?",
             "Nej. Vill du ha en pall på köpet finns en " +
             lank("sammetsfatolj-fotpall-33-cm-ben",
                  "sammetsfåtölj som levereras med fotpall") + "."),
            ("Behöver den monteras?",
             "Ja, benen skruvas på. Paketet mäter 69 × 34 × 61 cm."),
        ],
    },
    {
        "kort": "90caeb9d",
        "id": "90caeb9d-b664-4ac7-b1ff-4382b715afc0",
        "sokord": "djup fåtölj",
        "slug": "djup-fatolj-250-kg-manchesterlook",
        "sku": "FP-djup-fatolj-250-kg",
        "name": "Djup fåtölj i manchesterlook – 40 cm sittdyna, bär 250 kg, färdigmonterad",
        "title": "Djup fåtölj, 40 cm dyna och 250 kg | Fyndplats",
        "meta": ("Extra djup fåtölj på 130 × 130 cm med 40 cm tjock sittdyna "
                 "och ramlös helskumstomme. Bär 250 kg, kommer färdigmonterad."),
        "ingress": (
            "<p>Sittdynan är 40 centimeter tjock och sittytan 82 × 72 cm — så "
            "djup att du kan sitta med benen uppdragna i stället för rakt ned. "
            "Stommen är ramlös och byggd helt i elastiskt kärnskum, vilket är "
            "skälet till att den bär 250 kg utan att ha en enda träregel i "
            "sig. Den kommer färdigmonterad; inga verktyg behövs.</p>"),
        "eg": [
            "Sittyta på 82 × 72 cm — djup nog att sitta med benen uppdragna",
            "40 cm tjock sittdyna i tvålagers högdensitetsskum",
            "Ramlös konstruktion helt i elastiskt kärnskum",
            "Bär 250 kg",
            "Två prydnadskuddar, en ryggkudde och en nackrulle ingår",
            "Klädsel i manchesterlook, 100 % polyester",
            "Levereras färdigmonterad — inga verktyg",
        ],
        "spec": [
            "Mått (B × D × H): 130 × 130 × 82 cm",
            "Sits (B × D × H): 82 × 72 × 40 cm",
            "Sittdyna: 40 cm tjock",
            "Ryggstöd (L × B): 130 × 20 cm, ryggdyna 22 cm",
            "Armstödshöjd över golv: 62 cm",
            "Maxlast: 250 kg",
            "Ingår: två prydnadskuddar, en ryggkudde, en nackrulle",
            "Material: manchesterlook (100 % polyester), skum",
            "Färg: gräddvit",
            "Vikt: 24 kg",
            "Paketmått: 132 × 32 × 32 cm",
        ],
        "skotsel": [
            "Mät dörren innan du beställer. Paketet är 132 cm långt eftersom "
            "fåtöljen kommer färdigmonterad — den går inte att dela isär för "
            "att komma runt ett trapphörn.",
            "Skumstommen återtar sin form av sig själv, men vänd och klappa "
            "upp dynorna med några veckors mellanrum så att slitaget fördelas "
            "jämnt över hela sittytan.",
            SKOTSEL_TYG,
        ],
        "faq": [
            ("Hur bär den 250 kg utan ram?",
             "Konstruktionen är helt i elastiskt kärnskum i stället för skum "
             "på en träregelstomme. Skummet bär lasten och fjädrar tillbaka; "
             "det finns ingen ram som kan knäckas."),
            ("Hur mycket golv tar den?",
             "130 × 130 cm. Det är mer än en vanlig fåtölj och ungefär lika "
             "mycket som en liten tvåsitssoffa."),
            ("Ingår kuddarna?",
             "Ja — två prydnadskuddar, en ryggkudde och en nackrulle."),
            ("Behöver den monteras?",
             "Nej. Den kommer färdig och kan användas direkt ur kartongen."),
            ("Finns något mindre?",
             "Ja, en " +
             lank("vilstol-bjork-femstegs-fotstod",
                  "vilstol i björk med femstegs fotstöd") +
             " tar betydligt mindre golv och väger tio kilo."),
        ],
    },
    {
        "kort": "beacff5a",
        "id": "beacff5a-6a46-4784-9011-5de339001e2c",
        "sokord": "vilstol med fotstöd",
        "slug": "vilstol-bjork-femstegs-fotstod",
        "sku": "FP-vilstol-bjork-femstegs",
        "name": "Vilstol i björk med femstegs fotstöd – avtagbar dyna, väger 10,3 kg",
        "title": "Vilstol i björk med fotstöd i 5 lägen | Fyndplats",
        "meta": ("Vilstol med ram i björk och fotstöd som ställs i fem lägen. "
                 "Dynan är avtagbar och tvättbar. Bär 120 kg, väger 10,3 kg."),
        "ingress": (
            "<p>Ramen är björk i 60 × 22 mm profil och hela stolen väger "
            "10,3 kg — lätt nog att flytta med en hand mellan vardagsrummet "
            "och sovrummet. Fotstödet ställs i fem lägen, och dynan går att "
            "ta av och tvätta, vilket få vilstolar i den här klassen "
            "erbjuder.</p>"),
        "eg": [
            "Fotstödet ställs i fem lägen",
            "Avtagbar och tvättbar dyna",
            "Ram i björk, profil 60 × 22 mm",
            "Armstöd för stöd när du reser dig",
            "Väger 10,3 kg — går att flytta med en hand",
            "Högdensitetsskum i dynan",
            "Bär 120 kg",
            "Monteras — ramen skruvas ihop",
        ],
        "spec": [
            "Mått (L × B × H): 66,5 × 94 × 100 cm",
            "Ryggstöd (L × B × H): 75 × 55 × 71 cm",
            "Ryggstödets höjd: 71 cm",
            "Sits (L × B × H): 55,5 × 51,5 × 40 cm",
            "Fotdel (L × B): 55,5 × 33 cm",
            "Ramprofil: 60 × 22 mm björk",
            "Maxlast: 120 kg",
            "Material: polyester, björk, skum",
            "Färg: svart klädsel på ljus träram",
            "Vikt: 10,3 kg",
            "Paketmått: 81 × 60 × 23 cm",
        ],
        "skotsel": [
            "Dynan dras av och tvättas separat. Låt den lufttorka och lägg "
            "tillbaka den först när den är helt torr — fukt som ligger kvar "
            "mot träramen ger märken.",
            "Klädseln är polyester. Trä och syntettyg tål olika saker: torka "
            "träramen med lätt fuktad trasa och låt inte vatten stå kvar i "
            "skarvarna.",
            "Fäll fotstödet till sitt lägsta läge när stolen ska flyttas, så "
            "att inget hakar i en dörrkarm.",
        ],
        "faq": [
            ("Hur många lägen har fotstödet?",
             "Fem. Du fäller det i det läge som passar och det stannar där."),
            ("Går dynan att tvätta?",
             "Ja, den är avtagbar och tvättbar."),
            ("Är klädseln bomull?",
             "Nej, den är polyester. Ramen är björk."),
            ("Hur tung är den?",
             "10,3 kg. Det är den lättaste fåtöljen i den här gruppen och "
             "går att bära själv."),
            ("Finns något att sjunka ned i i stället?",
             "Ja, en " +
             lank("djup-fatolj-250-kg-manchesterlook",
                  "djup fåtölj med 40 cm sittdyna") +
             " är motsatsen: mjuk, färdigmonterad och betydligt större."),
        ],
    },
]


def bygg(p):
    """Sätter ihop hela plainDescription för en produkt."""
    delar = [p["ingress"], egenskaper(p["eg"]), spec(p["spec"]),
             skotsel(p["skotsel"]), faq(p["faq"])]
    return "".join(delar)


if __name__ == "__main__":
    import re
    for p in PRODUKTER:
        h = bygg(p)
        synlig = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()
        print("%s  namn %2d  titel %2d  meta %3d  sku %2d  html %4d  synlig %4d  %s"
              % (p["kort"], len(p["name"]), len(p["title"]), len(p["meta"]),
                 len(p["sku"]), len(h), len(synlig), p["slug"]))
