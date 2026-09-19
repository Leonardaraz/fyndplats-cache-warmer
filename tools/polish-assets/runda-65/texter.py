# -*- coding: utf-8 -*-
"""Runda 65 — åtta fåtöljer. Texten skrivs HÄR, inte inline i API-anropet.

Alla siffror kommer ur leverantörens Technische Daten och måttritningarna.
Åtta saker är MEDVETET utelämnade, och skälen står i LAGE.md:

  1. Artikelnumret `83B-912V00GY`, som står i 89c89322:s egen brödtext.
  2. Ordet "massagestol" om 3dab61f0 — dess tekniska not kallar den det.
  3. Ordet "säng" om db645ff8 — utfälld är den 108 cm, inte en sovplats.
  4. Egenvikten på 88425b27, som motsäger sig (10,4 mot 12 kg).
  5. Spec-tabellens mått på 88425b27 — måttritningen säger något annat.
  6. Ordet "massivt trä" om 88425b27 och bb7b7bd4 — båda är böjd fanér.
  7. Ryggsmärta som säljargument på 03c9d570.
  8. Ordet "bomull" — inget i rundan är bomull.
"""

BAS = "https://www.fyndplats.se/produkt/"


def lank(slug, text):
    return '<a href="%s%s">%s</a>' % (BAS, slug, text)


# --------------------------------------------------------- delade block ---
CHENILLE = (
    "Chenille är ett vävt tyg med kort, tät lugg som ger en matt yta och en "
    "mjuk känsla mot huden. Det är 100 % polyester, alltså inte ett naturtyg, "
    "och det tål vardagsslitage bättre än sammet."
)
CHENILLE_MELERAD = (
    "Chenille är ett vävt tyg med tät, nopprig yta. Det här är en melerad "
    "kvalitet där ljusa och mörka trådar ligger om varandra, så tonen blir "
    "spräcklig snarare än enfärgad. Det är 100 % polyester, alltså inte ett "
    "naturtyg, och det tål vardagsslitage bättre än sammet."
)
KONSTLADER = (
    "Klädseln är konstläder — en plastbelagd väv, inte skinn. Den torkas av "
    "med en fuktad trasa och tål spill bättre än ett tyg, men den andas inte "
    "på samma sätt och bör hållas borta från direkt värme."
)
BOJTRA = (
    "Ramen är böjd träfanér: tunna skikt trä limmade och formade under tryck. "
    "Det är inte massivt trä, och det är avsikten — fanéret fjädrar lätt när "
    "du sätter dig, vilket ger stolen dess mjuka rörelse."
)
SKOTSEL_TYG = (
    "Dammsug med möbelmunstycke med jämna mellanrum och torka bort fläckar "
    "med en lätt fuktad trasa och milt rengöringsmedel. Låt torka innan du "
    "sätter dig igen, och undvik direkt solljus — syntettyger bleks av UV."
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
    {
        "kort": "db645ff8",
        "id": "db645ff8-54a6-43be-8c37-97f2d9ba4a73",
        "sokord": "golvfåtölj",
        "slug": "golvfatolj-fallbar-13-lagen",
        "sku": "FP-golvfatolj-fallbar-13",
        "name": "Golvfåtölj med ryggen i 13 lägen – fälls platt till 108 cm, väger 7 kg",
        "title": "Golvfåtölj, ryggen i 13 lägen | Fyndplats",
        "meta": ("Golvfåtölj i blått med ryggen låsbar i 13 lägen. Fälls helt "
                 "platt till 108 × 55 cm, väger 7 kg och bär 120 kg."),
        "ingress": (
            "<p>Ryggen låses i tretton fasta lägen, från nästan upprätt till "
            "helt platt. Fälld ut blir den 108 × 55 cm och 12 cm tjock — en "
            "plats att ligga och läsa på, inte en bädd. Hela stolen väger "
            "7 kg och har inga ben, så den flyttas med en hand och ställs "
            "undan mot en vägg.</p>"),
        "eg": [
            "Ryggen låses i 13 fasta lägen",
            "Fälls helt platt till 108 × 55 cm, 12 cm tjock",
            "Uppställd 55 × 71 × 53,5 cm — sitter direkt på golvet",
            "12 cm stoppning i högdensitetsskum",
            "Klädsel i polyesterflanell, lätt att torka av",
            "Väger 7 kg och bär 120 kg",
            "Kommer färdig — ingen montering",
        ],
        "spec": [
            "Mått uppställd (B × D × H): 55 × 71 × 53,5 cm",
            "Mått helt utfälld (B × L × H): 55 × 108 × 14 cm",
            "Stoppning: 12 cm högdensitetsskum",
            "Ryggens lägen: 13 fasta steg",
            "Maxlast: 120 kg",
            "Material: metall, polyester, skum",
            "Färg: blå",
            "Vikt: 7 kg",
            "Paketmått: 112 × 14 × 51 cm",
        ],
        "skotsel": [
            "Den är gjord för att sitta i på golvet — framför soffbordet, vid "
            "fönstret eller i sovrummet. Utfälld är den 108 cm lång, alltså "
            "en liggplats för överkroppen och inte en sovplats i full längd.",
            "Utan ben vilar hela vikten mot golvet. På ett hårt golv lägger du "
            "en matta under; på en matta kan luggen tryckas ned där bottnen "
            "vilar, vilket reser sig igen när stolen flyttas.",
            SKOTSEL_TYG,
        ],
        "faq": [
            ("Går den att sova i?",
             "Nej. Utfälld är den 108 cm lång, alltså inte en sovplats i full "
             "längd. Den är gjord för att sitta och halvligga i."),
            ("Hur många ryggvinklar har den?",
             "Tretton fasta lägen, från nästan upprätt till helt platt."),
            ("Hur mycket väger den?",
             "7 kg. Den lyfts och flyttas med en hand."),
            ("Behöver den monteras?",
             "Nej, den kommer färdig i ett paket på 112 × 14 × 51 cm."),
            ("Vill du hellre sitta högre?",
             "En " + lank("liten-fatolj-60-cm-chenille",
                          "liten fåtölj på 60 cm i chenille") +
             " har sitthöjd 50 cm och tar knappt mer golv."),
        ],
    },
    {
        "kort": "88425b27",
        "id": "88425b27-09e9-4264-87ab-a18fbb5a12fb",
        "sokord": "fåtölj med fotpall",
        "slug": "fatolj-fotpall-bojtra-linnelook",
        "sku": "FP-fatolj-fotpall-bojtra",
        "name": "Fåtölj med fotpall i böjd träfanér – linnelook, sitthöjd 39 cm",
        "title": "Fåtölj med fotpall i böjd träfanér | Fyndplats",
        "meta": ("Fåtölj och lös fotpall med ram i böjd träfanér och klädsel i "
                 "linnelook. Låg sitthöjd på 39 cm. Stolen bär 120 kg."),
        "ingress": (
            "<p>Ramen är böjd träfanér i ljus ton, och sitthöjden ligger på "
            "39 cm — lägre än en matstol, ungefär som en djup soffa. Det gör "
            "att man sitter tillbakalutad snarare än upprätt. Fotpallen är "
            "lös och har samma ram, så den kan stå för sig när den inte "
            "används.</p>"),
        "eg": [
            "Fåtölj och lös fotpall med samma ram i böjd träfanér",
            "Låg sitthöjd, 39 cm över golv",
            "Avtagbar dyna i linnelook med nackkudde på 55 × 24 cm",
            "Fotkåpor som skyddar golvet",
            "Stolen bär 120 kg, fotpallen 30 kg",
            "Monteras — ramen skruvas ihop",
        ],
        "spec": [
            "Fåtölj (B × D × H): 66,5 × 80 × 99 cm",
            "Fotpall (B × D × H): 51 × 45 × 40 cm",
            "Sits (L × B): 55 × 53 cm",
            "Sitthöjd: 39 cm",
            "Ryggstöd (B × H): 55 × 71 cm",
            "Nackkudde: 55 × 24 cm",
            "Maxlast stol: 120 kg",
            "Maxlast fotpall: 30 kg",
            "Material: linnelook (100 % polyester), böjd träfanér, skum",
            "Färg: grå dyna på ljus ram",
            "Paketmått: 73 × 58 × 27 cm",
        ],
        "skotsel": [
            "Sätt dig inte på fotpallen. Den bär 30 kg — en fjärdedel av vad "
            "stolen klarar — och är gjord för benen.",
            BOJTRA,
            SKOTSEL_TYG,
        ],
        "faq": [
            ("Hur högt sitter man?",
             "39 cm över golvet. Det är lägre än en matstol och ungefär som "
             "en djup soffa, så man sitter tillbakalutad."),
            ("Går det att sitta på fotpallen?",
             "Bara om du väger under 30 kg. Den är avsedd för benen."),
            ("Är ramen massivt trä?",
             "Nej, den är böjd träfanér — tunna skikt trä limmade och formade "
             "under tryck. Det ger ramen dess fjädring."),
            ("Hur stor är fotpallen?",
             "51 × 45 cm och 40 cm hög — alltså en centimeter högre än sitsen, "
             "så benen ligger rakt ut när du lägger upp dem."),
            ("Hur skiljer den sig från den andra i samma ram?",
             "En " + lank("loungefatolj-bjorkfaner-vippande",
                          "loungefåtölj i björkfanér") +
             " har högre rygg (105 cm mot 99), tjockare dyna (12 cm mot "
             "nackkuddens 24) och levereras utan fotpall."),
        ],
    },
    {
        "kort": "03c9d570",
        "id": "03c9d570-247d-4b0f-abd9-1a958fca1d09",
        "sokord": "liten fåtölj",
        "slug": "liten-fatolj-60-cm-chenille",
        "sku": "FP-liten-fatolj-60-cm",
        "name": "Liten fåtölj 60 cm i chenille – svarta metallben och 35 cm rygg",
        "title": "Liten fåtölj 60 cm i chenille | Fyndplats",
        "meta": ("Liten fåtölj på bara 60 × 57 cm med klädsel i chenille och "
                 "svarta metallben. Sitthöjd 50 cm, låg rygg, bär 120 kg."),
        "ingress": (
            "<p>60 cm bred och 57 cm djup — mindre än de flesta fåtöljer och "
            "smal nog för ett sminkbord, en hall eller en läshörna där en "
            "vanlig fåtölj blir i vägen. Ryggen är låg, 35 cm räknat från "
            "sitsen, och böjd runt kroppen tillsammans med de inbyggda "
            "armstöden.</p>"),
        "eg": [
            "60 × 57 cm — tar mindre golv än en vanlig fåtölj",
            "Låg, böjd rygg på 35 cm med inbyggda armstöd",
            "Sitthöjd 50 cm, alltså vanlig stolshöjd",
            "Dyna 9 cm tjock, rygg 5 cm",
            "Fyra svarta metallben",
            "Klädsel i chenille, bär 120 kg",
            "Monteras — benen skruvas på",
        ],
        "spec": [
            "Mått (B × D × H): 60 × 57 × 83 cm",
            "Sits (B × D × H): 48 × 46 × 50 cm",
            "Ryggstöd (B × H): 54 × 35 cm",
            "Tjocklek: 9 cm sits, 5 cm rygg",
            "Armstöd: 30 × 4 cm, 65 cm över golv",
            "Maxlast: 120 kg",
            "Material: chenille (100 % polyester), flerskiktsskiva, skum, metall",
            "Färg: gråbeige med svarta ben",
            "Vikt: 11 kg",
            "Paketmått: 63 × 34 × 52 cm",
        ],
        "skotsel": [
            "Ryggen är 35 cm hög räknat från sitsen. Den stödjer ryggslutet "
            "och nedre delen av ryggen, inte skuldror eller nacke — det är en "
            "stol att sitta i en stund, inte att somna i.",
            CHENILLE,
            SKOTSEL_TYG,
        ],
        "faq": [
            ("Hur liten är den?",
             "60 cm bred och 57 cm djup. En vanlig fåtölj är oftast 70–80 cm "
             "bred, så den tar ungefär en fjärdedel mindre golv."),
            ("Har den hög rygg?",
             "Nej. Ryggen är 35 cm hög räknat från sitsen och stödjer "
             "ryggslutet, inte nacken."),
            ("Går den att använda vid ett bord?",
             "Ja. Sitthöjden är 50 cm och armstöden ligger 65 cm över golvet, "
             "så den passar vid ett sminkbord eller skrivbord."),
            ("Behöver den monteras?",
             "Ja, benen skruvas på. Paketet mäter 63 × 34 × 52 cm."),
            ("Finns något bredare att sjunka ned i?",
             "En " + lank("snurrfatolj-armlos-35-cm-dyna",
                          "armlös snurrfåtölj med 35 cm tjock sittdyna") +
             " är 70 cm bred och betydligt mjukare."),
        ],
    },
    {
        "kort": "bb7b7bd4",
        "id": "bb7b7bd4-652a-4157-99e2-b6794f0d828b",
        "sokord": "loungefåtölj",
        "slug": "loungefatolj-bjorkfaner-vippande",
        "sku": "FP-loungefatolj-bjorkfaner",
        "name": "Loungefåtölj i björkfanér – vippande ram, 12 cm dyna och 105 cm rygg",
        "title": "Loungefåtölj i björkfanér, 105 cm | Fyndplats",
        "meta": ("Loungefåtölj med ram i björkfanér som fjädrar mjukt upp och "
                 "ner. Hög rygg på 105 cm, 12 cm tjock dyna, väger 10 kg."),
        "ingress": (
            "<p>Ramen i björkfanér är avsiktligt fjädrande: den ger en mjuk "
            "upp-och-ner-rörelse när du lutar dig bakåt, utan gångjärn eller "
            "mekanik som kan gå sönder. Ryggen är 105 cm hög och både sits "
            "och rygg har 12 cm tjock stoppning. Hela stolen väger 10 kg.</p>"),
        "eg": [
            "Fjädrande ram i björkfanér ger en mjuk vippande rörelse",
            "Hög rygg, 105 cm över golv",
            "12 cm tjock stoppning i både sits och rygg",
            "Svängda armstöd, 51 cm över golv",
            "Klädsel i sammetslook, 100 % polyester",
            "Väger 10 kg — lätt att flytta",
            "Rekommenderad maxlast 120 kg",
            "Monteras — ramen skruvas ihop",
        ],
        "spec": [
            "Mått (B × D × H): 67 × 83 × 105 cm",
            "Sits (B × D × H): 55 × 45 × 45 cm, 12 cm tjock",
            "Ryggstöd (H × B): 74 × 55 cm, 12 cm tjockt",
            "Armstödshöjd över golv: 51 cm",
            "Rekommenderad maxlast: 120 kg",
            "Material: sammetslook (100 % polyester), björkfanér, skum",
            "Färg: gräddvit dyna på ljus ram",
            "Vikt: 10 kg",
            "Paketmått: 81 × 60 × 23 cm",
        ],
        "skotsel": [
            "Vippfunktionen kommer ur ramens fjädring, inte ur en mekanism. "
            "Rörelsen är därför mjuk och begränsad — några centimeter, inte en "
            "gungstols utslag.",
            BOJTRA,
            SKOTSEL_TYG,
        ],
        "faq": [
            ("Hur mycket vippar den?",
             "Några centimeter. Rörelsen kommer ur att ramen fjädrar, inte "
             "ur ett gångjärn, så det är en mjuk vaggning och inte en gungstol."),
            ("Är ramen massiv björk?",
             "Nej, det är björkfanér — tunna skikt limmade och formade under "
             "tryck. Fjädringen förutsätter fanér."),
            ("Hur tjock är stoppningen?",
             "12 cm i både sits och rygg."),
            ("Vad väger den?",
             "10 kg, så den går att flytta med en hand."),
            ("Finns samma ram med fotpall?",
             "Ja, en " + lank("fatolj-fotpall-bojtra-linnelook",
                              "fåtölj med fotpall i böjd träfanér") +
             " har lägre rygg (99 cm) och levereras med lös fotpall."),
        ],
    },
    {
        "kort": "89c89322",
        "id": "89c89322-92fb-447c-8ec8-ca9c911ae887",
        "sokord": "snurrfåtölj",
        "slug": "snurrfatolj-armlos-35-cm-dyna",
        "sku": "FP-snurrfatolj-armlos-35-cm",
        "name": "Armlös snurrfåtölj i chenille – 35 cm tjock sittdyna och 360° fot",
        "title": "Armlös snurrfåtölj, 35 cm dyna | Fyndplats",
        "meta": ("Armlös snurrfåtölj i grågrön chenille med 35 cm tjock sittdyna "
                 "och 360° fot. Sitsen är 70 cm bred och stolen bär 120 kg."),
        "ingress": (
            "<p>Sittdynan är 35 centimeter tjock och ryggen 30 — det är mer "
            "stoppning än de flesta fåtöljer har tillsammans. Utan armstöd "
            "blir hela bredden på 70 cm sittyta, så du kan sitta med benen "
            "uppdragna åt vilket håll som helst. Foten snurrar 360°.</p>"),
        "eg": [
            "35 cm tjock sittdyna och 30 cm tjock rygg",
            "Armlös — hela bredden på 70 cm är sittyta",
            "360° snurrfot på en sockel som mäter 61 × 61 cm",
            "Sitsdjup 59 cm, sitthöjd 41 cm",
            "Stomme i E1-klassad skiva med stålmekanism",
            "Klädsel i chenille, bär 120 kg",
            "Monteras i några steg",
        ],
        "spec": [
            "Mått (B × D × H): 70 × 90 × 70 cm",
            "Sits (B × D × H): 70 × 59 × 41 cm",
            "Sittdyna: 35 cm tjock",
            "Ryggstöd (B × H): 70 × 38 cm, 30 cm tjockt",
            "Sockel: 61 × 61 × 5,5 cm",
            "Maxlast: 120 kg",
            "Material: chenille (100 % polyester), skum, flerskiktsskiva, metall",
            "Färg: grågrön",
            "Vikt: 19,5 kg",
            "Paketmått: 104 × 15 × 77 cm",
        ],
        "skotsel": [
            "Räkna med upp till 72 timmar innan skummet har återtagit sin "
            "fulla form. Stolen packas ihoptryckt — paketet är bara 15 cm "
            "tjockt — och dynorna reser sig efter hand när de fått luft.",
            CHENILLE_MELERAD,
            SKOTSEL_TYG,
        ],
        "faq": [
            ("Varför ser den platt ut när den kommer?",
             "Den packas ihoptryckt i ett paket på 15 cm. Skummet behöver upp "
             "till 72 timmar på sig att expandera helt."),
            ("Har den armstöd?",
             "Nej, den är armlös. Det är därför hela bredden på 70 cm är "
             "sittyta."),
            ("Hur tjock är sittdynan?",
             "35 cm. Ryggen är 30 cm tjock."),
            ("Snurrar den hela varvet?",
             "Ja, 360° på en sockel som mäter 61 × 61 cm."),
            ("Finns något mindre?",
             "En " + lank("liten-fatolj-60-cm-chenille",
                          "liten fåtölj på 60 cm") +
             " i samma tyg tar tio centimeter mindre bredd och har armstöd."),
        ],
    },
    {
        "kort": "3dab61f0",
        "id": "3dab61f0-8347-4496-b2e1-c07597cb0eb1",
        "sokord": "reclinerfåtölj i konstläder",
        "slug": "konstladerfatolj-med-fotpall-svart",
        "sku": "FP-konstladerfatolj-fotpall",
        "name": "Reclinerfåtölj i svart konstläder med fotpall – ryggen låses med vred",
        "title": "Reclinerfåtölj i konstläder med fotpall | Fyndplats",
        "meta": ("Reclinerfåtölj i svart konstläder med lös fotpall på egen fot. "
                 "Ryggen låses steglöst med ett vred. Stolen bär 120 kg."),
        "ingress": (
            "<p>Ryggen fälls och låses med ett vred på sidan, steglöst hela "
            "vägen till sitt yttersta läge — inte i fasta hack. Fotpallen är "
            "lös och står på en egen rund fot, så den kan flyttas dit benen "
            "vill ha den. Båda delarna är klädda i svart konstläder som "
            "torkas av med en fuktad trasa.</p>"),
        "eg": [
            "Ryggen låses steglöst med ett vred",
            "Lös fotpall på egen rund fot, 43 × 38 × 41,5 cm",
            "Sits 52 × 52 cm, sitthöjd 48 cm",
            "Rund fotplatta med diameter 60 cm",
            "Klädsel i konstläder, avtorkningsbar",
            "Stolen bär 120 kg, fotpallen 100 kg",
            "Monteras",
        ],
        "spec": [
            "Fåtölj (L × B × H): 78 × 67 × 98 cm",
            "Sits (B × D): 52 × 52 cm",
            "Sitthöjd: 48 cm",
            "Fotpall (L × B × H): 43 × 38 × 41,5 cm",
            "Fotplattans diameter: 60 cm",
            "Maxlast stol: 120 kg",
            "Maxlast fotpall: 100 kg",
            "Material: konstläder, trä, skum, stål",
            "Färg: svart",
            "Vikt: 18 kg",
            "Paketmått: 77 × 66 × 42,5 cm",
        ],
        "skotsel": [
            "Vredet låser ryggen i det läge du väljer. Vrid tillbaka innan du "
            "reser dig, så att ryggen inte fjädrar upp när tyngden lättar.",
            KONSTLADER,
            "Fotplattan är 60 cm i diameter. På ett mjukt golv kan den ge "
            "märken efter en tid; en tunn filtplatta under jämnar ut trycket.",
        ],
        "faq": [
            ("Hur låses ryggen?",
             "Med ett vred på sidan. Den låses steglöst hela vägen till sitt "
             "yttersta läge, inte i fasta hack."),
            ("Går det att sitta på fotpallen?",
             "Ja. Den bär 100 kg, vilket är ovanligt mycket för en fotpall — "
             "de flesta i den här klassen klarar 30 till 50 kg."),
            ("Är det äkta skinn?",
             "Nej, det är konstläder. Det torkas av med en fuktad trasa."),
            ("Hur mycket golv tar den?",
             "78 × 67 cm, plus fotpallen på 43 × 38 cm."),
            ("Finns en större med snurrfot?",
             "En " + lank("reclinerfatolj-snurrfot-130-grader",
                          "reclinerfåtölj med 360° snurrfot") +
             " fälls till 130° och bär 150 kg, men behöver 80 cm fritt bakom."),
        ],
    },
    {
        "kort": "eb400961",
        "id": "eb400961-4c09-4113-b4e1-dc77a266c87d",
        "sokord": "fåtölj på medar",
        "slug": "fatolj-pa-medar-konstlader-22-cm",
        "sku": "FP-fatolj-medar-konstlader",
        "name": "Fåtölj på medar i konstläder – 22 cm sittdyna och 64 cm bred sits",
        "title": "Fåtölj på medar, 22 cm sittdyna | Fyndplats",
        "meta": ("Fåtölj med stålmedar i stället för bakben, klädd i "
                 "vattenavvisande konstläder. 22 cm tjock sittdyna, bär 120 kg."),
        "ingress": (
            "<p>Stolen står på medar av stål i stället för fyra ben — ramen "
            "går i ett svep från framkant till rygg. Konstruktionen fjädrar "
            "något när du sätter dig, och den lämnar inga fyra märken i "
            "mattan. Sittdynan är 22 cm tjock och sitsen 64 cm bred.</p>"),
        "eg": [
            "Stålmedar i stället för bakben — ramen går i ett svep",
            "22 cm tjock sittdyna och 20 cm tjock ryggdyna",
            "Bred sits, 64 cm",
            "Vattenavvisande konstläder med knappstoppning",
            "Mjukt stoppade armstöd, 64 cm över golv",
            "Plastfötter som skyddar golvet från repor",
            "Bär 120 kg",
            "Monteras på omkring tio minuter",
        ],
        "spec": [
            "Mått (B × D × H): 80 × 79 × 84 cm",
            "Sits (B × D × H): 64 × 53 × 47 cm",
            "Sittdyna: 22 cm tjock",
            "Ryggstöd (B × H): 64 × 47 cm, ryggdyna 20 cm",
            "Armstöd: 23 × 14 cm, 64 cm över golv",
            "Maxlast: 120 kg",
            "Material: konstläder, skum, stål",
            "Färg: svart med silverfärgad ram",
            "Vikt: 19,5 kg",
            "Paketmått: 74 × 48 × 71 cm",
        ],
        "skotsel": [
            "Medarna vilar mot golvet i hela sin längd i stället för på fyra "
            "punkter. Det fördelar tyngden, men det betyder också att stolen "
            "skjuts i stället för att lyftas om man drar i den — lyft när den "
            "ska flyttas, så att plastfötterna inte river i golvet.",
            KONSTLADER,
            SKOTSEL_TYG,
        ],
        "faq": [
            ("Vad betyder medar?",
             "Att ramen går i ett svep från framkanten bakåt i stället för att "
             "sluta i fyra ben. Konstruktionen fjädrar något när du sätter dig."),
            ("Är det äkta skinn?",
             "Nej, det är konstläder. Ytan är vattenavvisande och torkas av "
             "med en fuktad trasa."),
            ("Hur bred är sitsen?",
             "64 cm, vilket är brett för en fåtölj. Stolen är 80 cm bred totalt."),
            ("Fälls ryggen?",
             "Nej, ryggen är fast. Vill du ha en som fälls finns en " +
             lank("konstladerfatolj-med-fotpall-svart",
                  "reclinerfåtölj i konstläder med fotpall") + "."),
            ("Behöver den monteras?",
             "Ja, cirka tio minuter. Paketet mäter 74 × 48 × 71 cm."),
        ],
    },
    {
        "kort": "2823c605",
        "id": "2823c605-50a0-4205-9b17-5442aee19168",
        "sokord": "reclinerfåtölj med snurrfot",
        "slug": "reclinerfatolj-snurrfot-130-grader",
        "sku": "FP-reclinerfatolj-snurrfot",
        "name": "Reclinerfåtölj med 360° snurrfot – 130° liggläge, fotpall och 150 kg",
        "title": "Reclinerfåtölj med snurrfot, 130° | Fyndplats",
        "meta": ("Reclinerfåtölj i grått konstläder med 360° snurrfot i böjt "
                 "trä och lös fotpall. Ryggen går till 130°, bär 150 kg."),
        "ingress": (
            "<p>Ryggen fälls till 130° och foten snurrar hela varvet på en "
            "bas i böjt trä. Fotpallen är lös och har samma bas. Räkna med "
            "80 cm fritt bakom stolen — den behöver mer utrymme än de flesta, "
            "eftersom hela stolen lutar bakåt när ryggen fälls.</p>"),
        "eg": [
            "Ryggen fälls till 130°",
            "360° snurrfot på bas i böjt trä",
            "Lös fotpall med samma bas, 48 × 43 × 38 cm",
            "Hög rygg och utsvängda armstöd med tjock stoppning",
            "Behöver 80 cm fritt bakom sig",
            "Klädsel i konstläder, bär 150 kg",
            "Monteras",
        ],
        "spec": [
            "Mått upprätt (B × D × H): 76 × 85 × 104 cm",
            "Mått fullt tillbakalutad (B × D × H): 76 × 117 × 89 cm",
            "Fotpall (B × D × H): 48 × 43 × 38 cm",
            "Sits (B × D × H): 56 × 53 × 45 cm, 13 cm tjock",
            "Ryggstöd (B × D × H): 82 × 64 × 14 cm",
            "Armstöd: 52 × 13 × 11 cm",
            "Fritt utrymme bakom: 80 cm",
            "Maxlast: 150 kg",
            "Material: konstläder, skum, böjt trä",
            "Färg: grå",
            "Vikt: 26 kg",
            "Paketmått: 84 × 64 × 48 cm",
        ],
        "skotsel": [
            "Mät väggavståndet först. Stolen behöver 80 cm fritt bakom sig — "
            "betydligt mer än en vanlig reclinerfåtölj — och djupet växer från "
            "85 till 117 cm när ryggen fälls.",
            KONSTLADER,
            "Basen är böjt trä. Torka av den med en lätt fuktad trasa och låt "
            "inte vatten stå kvar i skarvarna.",
        ],
        "faq": [
            ("Hur mycket plats behöver den bakom sig?",
             "80 cm fritt. Det är mer än de flesta reclinerfåtöljer kräver, så "
             "den passar bättre fritt i rummet än tätt mot en vägg."),
            ("Hur djup blir den fälld?",
             "117 cm, mot 85 cm upprätt. Bredden är 76 cm i båda lägena."),
            ("Snurrar fotpallen också?",
             "Ja, den har samma bas i böjt trä."),
            ("Är det äkta skinn?",
             "Nej, det är konstläder. Det torkas av med en fuktad trasa."),
            ("Finns en som tar mindre plats?",
             "En " + lank("konstladerfatolj-med-fotpall-svart",
                          "reclinerfåtölj i svart konstläder med fotpall") +
             " är 78 × 67 cm och låser ryggen med ett vred i stället."),
        ],
    },
]


def bygg(p):
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
