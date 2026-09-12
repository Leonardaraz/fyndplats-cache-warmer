# -*- coding: utf-8 -*-
"""Runda 134 — kundtexterna. En datafil; byggandet bor i bygg().

☠️ Skriv ALDRIG ut leverantörens namn, artikelnummer eller avsändarland.
☠️ Rör ALDRIG priset.
☠️ Mot kunden är VI leverantören — skriv aldrig "leverantören anger".
☠️ Ingen maxlast där källan saknar den (fem av sex). Ingen varuvikt alls —
   spec-tabellens `Vikt` är FRAKTVIKTEN (uppgift #488).
☠️ `668e0e0c` är en LÅDA, inte en tunna. Ordet "tunna" får inte stå i dess
   namn, slug, titel eller meta (uppgift #462).
"""
import os as _os
import sys as _sys

_sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), ".."))
import grindar as _G                                             # noqa: E402

NAMN = {
    "f6857ca0": "Kattbädd i sjögräs 43 cm på furuvagga – klösbar utsida och dyna",
    "09336fdf": "Klöstunna 50 cm i vattenhyacint – två plan, två hålor och dyna",
    "d0b80807": "Klöstunna 61 cm i sisal – två kojor och hoppplattform",
    "f4e6159e": "Klösträd 90 cm i beige – dubbel koja, topplatå och sidoplattform",
    "668e0e0c": "Klöstorn 81 cm i mörkgrått – fyrkantigt, två kojor och sisalpanel",
    "38022bcb": "Klösträd 109 cm med klöstunna i tre plan och bädd på toppen",
}

# ☠️ SLUGGEN VÄLJS SÅ ATT DET SOM SKILJER PRODUKTERNA ÅT RYMS FÖRE KAPNINGEN.
#    `grindar.sku_bas` kapar (uppgift #473, #489). Kontrollerat: de sex
#    kapade SKU:erna är olika varandra OCH olika runda 133:s tio.
SLUG = {
    "f6857ca0": "kattbadd-sjogras-43-cm",
    "09336fdf": "klostunna-50-cm-vattenhyacint",
    "d0b80807": "klostunna-61-cm-hoppplattform",
    "f4e6159e": "klostrad-90-cm-dubbelhala",
    "668e0e0c": "klostorn-81-cm-fyrkantigt",
    "38022bcb": "klostrad-109-cm-tunna-badd",
}

SKU = {pid: "FP-" + _G.sku_bas(slug) for pid, slug in SLUG.items()}

TITEL = {
    "f6857ca0": "Kattbädd i sjögräs 43 cm på furuvagga | Fyndplats",
    "09336fdf": "Klöstunna 50 cm i vattenhyacint med dyna | Fyndplats",
    "d0b80807": "Klöstunna 61 cm i sisal med hoppplattform | Fyndplats",
    "f4e6159e": "Klösträd 90 cm med dubbel koja och topplatå | Fyndplats",
    "668e0e0c": "Klöstorn 81 cm i mörkgrått med sisalpanel | Fyndplats",
    "38022bcb": "Klösträd 109 cm med klöstunna i tre plan | Fyndplats",
}

META = {
    "f6857ca0": ("Kattbädd i flätat sjögräs som ligger i en vagga av furu. "
                 "Utsidan går att klösa på, dynan följer med. Höjd 43 cm."),
    "09336fdf": ("Klöstunna 50 cm flätad i vattenhyacint kring en stålstomme. "
                 "Två plan, två hålor och en rund dyna på toppen. Ingen montering."),
    "d0b80807": ("Klöstunna 61 cm klädd i sisal med två plyschklädda kojor och "
                 "en hoppplattform vid sidan. Bred bas på 59 cm."),
    "f4e6159e": ("Klösträd 90 cm i beige med dubbel koja, topplatå, "
                 "sidoplattform och sisalytor att klösa på. Bär 10 kg."),
    "668e0e0c": ("Fyrkantigt klöstorn 81 cm i mörkgrå plysch med två kojor, "
                 "liggyta på toppen och en hög sisalpanel att klösa på."),
    "38022bcb": ("Klösträd 109 cm där klöstunnan har tre plan och tre hålor. "
                 "Bädd på toppen, plattform vid sidan och sisalklädd stam."),
}

SOKORD = {
    "f6857ca0": "kattbädd sjögräs",
    "09336fdf": "klöstunna vattenhyacint",
    "d0b80807": "klöstunna sisal",
    "f4e6159e": "klösträd 90 cm",
    "668e0e0c": "klöstorn mörkgrå",
    "38022bcb": "klösträd 109 cm",
}

INTRO = {
    "f6857ca0": (
        "En liggande cylinder i flätat sjögräsrep som vilar i en vagga av "
        "furu. Hela framsidan är öppen, så katten ser ut medan den ligger "
        "kvar inne — det är skillnaden mot en tunna med håla. Insidan är "
        "klädd i gräddvit plysch och en lös dyna på 37 × 27 cm följer med. "
        "Sjögräset på utsidan är till för att klösas på."),
    "09336fdf": (
        "Klöstunnan är flätad i vattenhyacint kring en stålstomme, och det "
        "syns: väggarna är styva men lätta, och flätverket ger katten något "
        "att hugga tag i hela vägen runt. Den är 50 cm hög med två plan, en "
        "håla till vardera, och en rund dyna på toppen. Den kommer hopmonterad."),
    "d0b80807": (
        "Två kojor ovanpå varandra i en tunna klädd i sisal, och en "
        "hoppplattform vid sidan som gör det lätt att ta sig upp. Insidan "
        "och kanterna är beige plysch. Basen är 59 cm i diameter — bredare "
        "än tunnan själv, vilket är det som håller den stadig när katten "
        "landar på plattformen."),
    "f4e6159e": (
        "Fyra ställen att vara på i en och samma möbel: topplatån med "
        "plyschkant, de två kojorna i tunnan under, och sidoplattformen "
        "mellan dem. Klösträdet är 90 cm högt, beige rakt igenom, och har "
        "sisalytor både på stammen och som en matta på tunnans sida. "
        "Hålorna in till kojorna är Ø14 cm."),
    "668e0e0c": (
        "Ett klöstorn med raka sidor, 45 × 45 cm i botten och 81 cm högt. "
        "Formen gör att det står tätt mot en vägg eller i ett hörn på ett "
        "sätt en rund tunna inte gör. Inuti delar en hylla utrymmet i två "
        "kojor, toppen är en liggyta med ett runt hål ned i den övre kojan, "
        "och hela ena sidan är en sisalpanel på 37 × 68,5 cm."),
    "38022bcb": (
        "Klöstunnan i mitten har tre plan och tre hålor, så katten kan gå "
        "uppåt inifrån i stället för att hoppa. Ovanför den sitter en rund "
        "bädd på en sisalklädd stam, och vid sidan en plattform som fungerar "
        "som mellansteg. Hela klösträdet är 109 cm högt och står på en "
        "sockel som mäter 60 × 44,5 cm."),
}

RUBRIK = {p: "Det här får du" for p in NAMN}

PUNKTER = {
    "f6857ca0": [
        "Öppen framsida — katten ligger inne men ser ut i rummet",
        "Utsidan är lindad i sjögräsrep och tål att klösas på",
        "Lös dyna på 37 × 27 cm ingår",
        "Vagga i furu som lyfter bädden från golvet",
        "Invändigt Ø35 cm och 40 cm djupt",
        "Levereras omonterad",
    ],
    "09336fdf": [
        "Två plan med en håla till vardera, Ø18 cm",
        "Flätad vattenhyacint kring en stomme av stål",
        "Rund dyna Ø38 cm på toppen, 6 cm tjock",
        "22 cm invändig höjd på varje plan",
        "Kommer hopmonterad — inget att skruva",
        "Ø40 cm och 50 cm hög",
    ],
    "d0b80807": [
        "Två kojor ovanpå varandra, dörrarna mäter 17,5 × 19,5 cm",
        "Hoppplattform på 30 × 18 cm vid sidan",
        "Sisal runt hela tunnan att klösa på",
        "Liggyta Ø35 cm överst",
        "Bas på Ø59 cm — bredare än tunnan",
        "Levereras omonterad",
    ],
    "f4e6159e": [
        "Fyra plan: topplatå, två kojor och en sidoplattform",
        "Topplatå Ø34 cm med plyschkant",
        "Två kojor på Ø33 × 22,5 cm var",
        "Hålorna är Ø14 cm — mät katten först",
        "Sisalstam på Ø6 cm och en klösmatta på 31 × 21 cm",
        "Bär 10 kg",
    ],
    "668e0e0c": [
        "Fyrkantig form, 45 × 45 cm i botten",
        "Två kojor på 42 × 42 × 33 cm var",
        "Dörröppningarna är 22 × 26 cm och 22 × 29 cm",
        "Liggyta på toppen med ett hål på Ø17 cm ned i övre kojan",
        "Sisalpanel på 37 × 68,5 cm längs ena sidan",
        "Levereras omonterad",
    ],
    "38022bcb": [
        "Klöstunna med tre plan och tre hålor på Ø16,5 cm",
        "Varje plan mäter Ø37 × 21 cm invändigt",
        "Rund bädd Ø40 cm på toppen, Ø28 cm invändigt",
        "Plattform på 38 × 25 cm som mellansteg",
        "Sisalklädd stam på Ø8,2 cm",
        "Sockel på 60 × 44,5 cm",
    ],
}

KATT_RUBRIK = {p: "Vilken katt den passar" for p in NAMN}

KATT = {
    "f6857ca0": (
        "Den är avsedd för katter under 5 kg. Öppningen är hela cylinderns "
        "framsida, alltså Ø35 cm, så det är inte ingången som sätter gränsen "
        "utan liggytan: 40 cm djup och 35 cm bred. En katt som gillar att "
        "ligga ihoprullad får gott om plats, en som helst sträcker ut sig "
        "helt får det trångt."),
    "09336fdf": (
        "Den här är avsedd för katter upp till 3,5 kg. Hålorna är Ø18 cm och varje plan är 22 cm högt invändigt — "
        "gott om utrymme för en liten eller ung katt, men en storvuxen katt "
        "kommer att tycka att takhöjden är knapp."),
    "d0b80807": (
        "Avsedd för katter upp till 5 kg. Dörrarna är 17,5 cm breda och "
        "19,5 cm höga, alltså rejält tilltagna, och kojan är Ø35 cm — en "
        "vuxen katt kan vända sig runt inne i den. Hoppplattformen gör "
        "vägen upp kortare för en katt som inte längre hoppar högt."),
    "f4e6159e": (
        "Den är avsedd för en eller två katter upp till 5 kg och bär 10 kg "
        "totalt. Läs hålmåttet innan du köper: ingångarna är Ø14 cm, "
        "vilket är en smal öppning. En "
        "spensligare katt tar sig igenom utan problem, en storvuxen gör det "
        "inte. Mät över bröstkorgen om du är osäker."),
    "668e0e0c": (
        "Den här är gjord för större katter — avsedd för katter under 6 kg, "
        "och det märks på måtten. Kojorna är 42 × 42 cm i fyrkant och 33 cm "
        "höga, och dörröppningarna 22 cm breda. En stor katt kan lägga sig "
        "raklång."),
    "38022bcb": (
        "Avsedd för katter under 5 kg. Hålorna är Ø16,5 cm och varje plan "
        "Ø37 × 21 cm invändigt, alltså lagom för en normalstor katt som "
        "hellre ligger ihoprullad än utsträckt. Bädden på toppen är öppen "
        "och rymligare, Ø28 cm invändigt."),
}

BRUK_RUBRIK = {p: "Att tänka på" for p in NAMN}

BRUK = {
    "f6857ca0": (
        "Den levereras omonterad — cylindern ska fästas i vaggan. Vaggan är "
        "furu och står på fyra fötter, så bädden lyfts från golvet och får "
        "luft runt om. Sjögräsrepet är lindat tätt och tål klor, men det är "
        "ett naturmaterial: räkna med att det luddar sig där katten klöser "
        "mest, precis som sisal gör."),
    "09336fdf": (
        "Den kommer färdig att ställa ned — det finns inget att skruva ihop. "
        "Vattenhyacinten är flätad kring en stålstomme, vilket är det som "
        "gör att tunnan håller formen trots att flätverket i sig är mjukt. "
        "Dynan ligger löst i toppen och går att lyfta ur."),
    "d0b80807": (
        "Den levereras omonterad, och plattformen skruvas fast i stolpen. "
        "Basen är bredare än tunnan med flit: en katt som hoppar upp på "
        "plattformen lägger sin vikt utanför tunnans mitt, och den extra "
        "diametern är motvikten. Ställ den på ett plant golv så att hela "
        "basen får kontakt."),
    "f4e6159e": (
        "Den levereras omonterad. Konstruktionen är spånskiva klädd i plysch "
        "med sisal på stammen och klösmattan — och i materiallistan ingår "
        "även papper, som används i stommen. Det betyder att den inte tål "
        "väta: torka av med en fuktig trasa, spola aldrig."),
    "668e0e0c": (
        "Den levereras omonterad. Hålet i toppen är Ø17 cm och leder rakt "
        "ned i den övre kojan, så katten kan gå in uppifrån i stället för "
        "genom dörren. Tornet är 81 cm högt på en 45 × 45 cm bas och har "
        "ingen väggrem — ställ det mot en vägg om katten brukar ta sats."),
    "38022bcb": (
        "Den levereras omonterad. Sockeln på 60 × 44,5 cm är vad som håller "
        "den på plats — någon "
        "väggrem följer inte med. Ställ den på plant golv och gärna i ett "
        "hörn. Bädden på toppen sitter på stammen och monteras sist."),
}

KORS_INGRESS = {p: "Passar inte den här?" for p in NAMN}
KORS_TEXT = {p: "Fler klösmöbler hos oss:" for p in NAMN}

# Alla mål är PUBLICERADE sidor ur runda 25 och 133 — aldrig en sida som
# fortfarande är utkast, för då länkar vi till en 404.
KORSLANK = {
    "f6857ca0": [("klostunna-49-cm-sjogras", "klöstunna 49 cm i sjögräs"),
                 ("klostunna-79-cm-sjogras", "klöstunna 79 cm i sjögräs")],
    "09336fdf": [("klostunna-49-cm-sjogras", "klöstunna 49 cm i sjögräs"),
                 ("klostunna-60-cm-ljusgra", "klöstunna 60 cm i ljusgrått")],
    "d0b80807": [("klostunna-70-cm-tre-plan", "klöstunna 70 cm med tre plan"),
                 ("klostunna-60-cm-ljusgra", "klöstunna 60 cm i ljusgrått")],
    "f4e6159e": [("klostunna-74-cm-beige", "klöstunna 74 cm i beige"),
                 ("klostunna-79-cm-sjogras", "klöstunna 79 cm i sjögräs")],
    "668e0e0c": [("klostunna-74-cm-morkgra", "klöstunna 74 cm i mörkgrått"),
                 ("klostunna-96-cm-gra", "klöstunna 96 cm i grått")],
    "38022bcb": [("klostunna-96-cm-cremevit", "klöstunna 96 cm i cremevitt"),
                 ("klostunna-96-cm-gra", "klöstunna 96 cm i grått")],
}

# ☠️ MATERIALRADEN ÄR OMSKRIVEN UR TYSKANS LISTA, inte ärvd ur spec-tabellen.
#    Fem av sex bar en förkortning där och två bar oöversatt tyska.
SPEC = {
    "f6857ca0": [("Höjd", "43 cm"), ("Mått", "41 × 38 × 43 cm"),
                 ("Invändigt", "Ø35 cm, 40 cm djupt"),
                 ("Öppning", "hela framsidan, Ø35 cm"),
                 ("Dyna", "37 × 27 cm, lös"),
                 ("Material", "furu, sjögräsrep och flanellmjuk polyester"),
                 ("Färg", "khakifärgat sjögräs mot gräddvit plysch, vagga i furu"),
                 ("Montering", "krävs"),
                 ("Rekommenderad kattvikt", "under 5 kg")],
    "09336fdf": [("Höjd", "50 cm"), ("Mått", "Ø40 × 50 cm"),
                 ("Antal plan", "2"), ("Antal hålor", "2"),
                 ("Håla", "Ø18 cm"),
                 ("Invändig höjd", "22 cm per plan"),
                 ("Dyna", "Ø38 cm, 6 cm tjock"),
                 ("Material", "stål, vattenhyacint och sammetslen polyester"),
                 ("Färg", "ljus naturton"),
                 ("Montering", "ingen"),
                 ("Rekommenderad kattvikt", "under 3,5 kg")],
    "d0b80807": [("Höjd", "61 cm"), ("Mått", "60 × 60 × 61 cm"),
                 ("Antal kojor", "2"),
                 ("Dörröppning", "17,5 × 19,5 cm"),
                 ("Koja invändigt", "Ø35 cm"),
                 ("Plattform", "30 × 18 cm"),
                 ("Liggyta överst", "Ø35 cm"),
                 ("Bas", "Ø59 cm"),
                 ("Material", "spånskiva, plysch och sisal"),
                 ("Färg", "beige plysch mot gråbrun sisal"),
                 ("Montering", "krävs"),
                 ("Rekommenderad kattvikt", "under 5 kg")],
    "f4e6159e": [("Höjd", "90 cm"), ("Mått", "55 × 39 × 90 cm"),
                 ("Antal plan", "4"), ("Antal kojor", "2"),
                 ("Håla", "Ø14 cm"),
                 ("Koja invändigt", "Ø33 × 22,5 cm per plan"),
                 ("Topplatå", "Ø34 cm"),
                 ("Sidoplattform", "30 × 21 cm"),
                 ("Klösmatta", "31 × 21 cm"),
                 ("Stam", "Ø6 cm"),
                 ("Material", "spånskiva, papper, bomullsvadd, plysch och sisal"),
                 ("Färg", "beige"),
                 ("Maxlast", "10 kg"),
                 ("Montering", "krävs"),
                 ("Rekommenderad kattvikt", "en eller två katter under 5 kg")],
    "668e0e0c": [("Höjd", "81 cm"), ("Mått", "45 × 45 × 81 cm"),
                 ("Form", "fyrkantig"),
                 ("Antal kojor", "2"),
                 ("Koja invändigt", "42 × 42 × 33 cm per plan"),
                 ("Dörröppning", "22 × 26 cm övre, 22 × 29 cm nedre"),
                 ("Hål i toppen", "Ø17 cm"),
                 ("Liggyta överst", "42 × 42 cm"),
                 ("Sisalpanel", "37 × 68,5 cm"),
                 ("Material", "spånskiva, kortlugg plysch och sisal"),
                 ("Färg", "mörkgrå plysch med sisal i naturton"),
                 ("Montering", "krävs"),
                 ("Rekommenderad kattvikt", "under 6 kg")],
    "38022bcb": [("Höjd", "109 cm"), ("Mått", "60 × 44,5 × 109 cm"),
                 ("Klöstunna", "Ø39 × 80 cm"),
                 ("Antal plan i tunnan", "3"), ("Antal hålor", "3"),
                 ("Håla", "Ø16,5 cm"),
                 ("Plan invändigt", "Ø37 × 21 cm"),
                 ("Bädd överst", "Ø40 cm, Ø28 cm invändigt"),
                 ("Plattform", "38 × 25 cm"),
                 ("Stam", "Ø8,2 cm"),
                 ("Sockel", "60 × 44,5 cm"),
                 ("Material", "spånskiva, plysch och sisal"),
                 ("Färg", "gräddvit plysch mot grå sisal"),
                 ("Montering", "krävs"),
                 ("Rekommenderad kattvikt", "under 5 kg")],
}

SKOTSEL = {
    "f6857ca0": (
        "Dynan lyfts ur och skakas eller dammsugs. Sjögräsrepet borstas rent "
        "i repets riktning — lossa löst ludd med handen i stället för att "
        "dra i det, så följer inte hela varvet med. Furuvaggan torkas av "
        "med en lätt fuktad trasa. Inget av materialen tål att blötläggas."),
    "09336fdf": (
        "Dynan lyfts ur och skakas. Flätverket dammsugs med mjukt munstycke "
        "— vattenhyacint samlar damm i flätans veck. Torka av med en lätt "
        "fuktad trasa vid behov och låt torka helt innan katten går in igen; "
        "ett naturmaterial som blir liggande fuktigt kan mögla."),
    "d0b80807": (
        "Plyschen dammsugs eller borstas med en gummiborste, som tar hårstrån "
        "bättre än en vanlig borste. Sisalen borstas i fiberns riktning. Klipp "
        "av lösa sisaltrådar med sax i stället för att dra — ett ryck lossar "
        "hela varvet."),
    "f4e6159e": (
        "Dammsug plyschen och borsta sisalen i fiberns riktning. Torka bara "
        "av med en lätt fuktad trasa: stommen innehåller både spånskiva och "
        "papper och tål ingen väta. Klösmattan går att byta plats med genom "
        "att vända möbeln, så slitaget fördelas."),
    "668e0e0c": (
        "Sisalpanelen är den yta som slits — borsta i fiberns riktning och "
        "klipp lösa trådar med sax. Plyschen dammsugs eller borstas med en "
        "gummiborste. Hylla och kojor nås genom dörröppningarna; hålet i "
        "toppen gör det lättare att komma åt den övre kojan med munstycket."),
    "38022bcb": (
        "Bädden på toppen dammsugs eller borstas. Tunnans tre plan nås ett i "
        "taget genom hålorna — ett smalt munstycke är enda sättet att komma "
        "åt det nedersta. Sisalen på stammen och tunnan borstas i fiberns "
        "riktning, och lösa trådar klipps av."),
}

FAQ = {
    "f6857ca0": [
        ("Ingår dynan?",
         "Ja. En lös dyna på 37 × 27 cm ligger i botten och går att lyfta ur "
         "för rengöring."),
        ("Är den en klösmöbel eller en bädd?",
         "Båda. Utsidan är lindad i sjögräsrep som katten kan klösa på, och "
         "insidan är en plyschklädd bädd. Den har ingen separat klöspelare."),
        ("Behöver den monteras?",
         "Ja. Cylindern fästs i vaggan; verktyg och beskrivning följer med."),
    ],
    "09336fdf": [
        ("Behöver den monteras?",
         "Nej. Den kommer färdig att ställa ned."),
        ("Hur stora är hålorna?",
         "Ø18 cm, en per plan. Invändigt är varje plan 22 cm högt."),
        ("Tål vattenhyacint att katten klöser på den?",
         "Ja, flätverket är gjort för det och ger bra grepp. Som alla "
         "naturmaterial luddar det sig där katten klöser mest."),
    ],
    "d0b80807": [
        ("Varför är basen bredare än tunnan?",
         "För att motverka att möbeln tippar när katten landar på "
         "hoppplattformen, som sitter ut från mitten. Basen mäter Ø59 cm mot "
         "tunnans Ø35 cm."),
        ("Hur stora är dörrarna?",
         "17,5 cm breda och 19,5 cm höga, lika på båda kojorna."),
        ("Behöver den monteras?",
         "Ja. Plattformen skruvas fast i stolpen och tunnan i basen."),
    ],
    "f4e6159e": [
        ("Hur stora är hålorna in till kojorna?",
         "Ø14 cm. Det är en smal öppning — mät katten över bröstkorgen innan "
         "du köper om den är storvuxen."),
        ("Hur mycket bär den?",
         "10 kg totalt, alltså en eller två katter under 5 kg."),
        ("Vad är klösytorna gjorda av?",
         "Sisal, både på stammen och på klösmattan som mäter 31 × 21 cm."),
    ],
    "668e0e0c": [
        ("Är den rund eller fyrkantig?",
         "Fyrkantig. Bottenytan är 45 × 45 cm och sidorna är raka, så den "
         "står tätt mot vägg eller i ett hörn."),
        ("Vad är hålet i toppen till?",
         "Det är en genomgång på Ø17 cm ned i den övre kojan, så katten kan "
         "gå in uppifrån i stället för genom dörren."),
        ("Hur stor katt passar den?",
         "Den är avsedd för katter under 6 kg. Kojorna är 42 × 42 cm och "
         "33 cm höga."),
    ],
    "38022bcb": [
        ("Hur många plan har klöstunnan?",
         "Tre, med en håla till vardera. Hålorna är Ø16,5 cm och varje plan "
         "mäter Ø37 × 21 cm invändigt."),
        ("Följer det med väggrem?",
         "Nej. Stabiliteten kommer från sockeln, som mäter 60 × 44,5 cm — "
         "bredare än tunnan ovanför."),
        ("Går bädden på toppen att ta av?",
         "Bädden skruvas fast på stammen vid monteringen och sitter kvar. "
         "Den är Ø40 cm utvändigt och Ø28 cm invändigt."),
    ],
}

SOKORDSLISTA = {
    "f6857ca0": ["kattbädd sjögräs", "kattgrotta", "kattbädd med dyna",
                 "klösbädd", "kattmöbel furu"],
    "09336fdf": ["klöstunna vattenhyacint", "klöstunna 50 cm", "kattmöbel rotting",
                 "klöstunna två plan", "klöstunna utan montering"],
    "d0b80807": ["klöstunna sisal", "klöstunna 61 cm", "klöstunna två kojor",
                 "klösmöbel med plattform", "kattmöbel bred bas"],
    "f4e6159e": ["klösträd 90 cm", "klösträd dubbel koja", "klösträd beige",
                 "klösträd med topplatå", "klösmöbel fyra plan"],
    "668e0e0c": ["klöstorn mörkgrå", "klöstorn 81 cm", "fyrkantigt klöstorn",
                 "kattmöbel stor katt", "klösmöbel sisalpanel"],
    "38022bcb": ["klösträd 109 cm", "klösträd med bädd", "klöstunna tre plan",
                 "högt klösträd", "klösmöbel med plattform"],
}

BAS = "https://www.fyndplats.se"


def _p(t):
    return "<p>" + t + "</p>"


def bygg(pid):
    """Bygger plainDescription. Ordningen speglar runda 133 exakt.

    ☠️ BLOCKORDNINGEN ÄR INTE FRI. Butikens flikdelare är en allowlist på fyra
       strängar (`grindar.FLIKAR_SOM_KRAVS`); allt efter en träff hamnar i den
       fliken. Korslänkarna måste därför ligga FÖRE `Tekniska specifikationer`.
    """
    d = []
    d.append(_p(INTRO[pid]))

    d.append("<h2>" + RUBRIK[pid] + "</h2>")
    d.append("<ul>" + "".join("<li>" + x + "</li>" for x in PUNKTER[pid]) + "</ul>")

    d.append("<h2>" + KATT_RUBRIK[pid] + "</h2>")
    d.append(_p(KATT[pid]))

    d.append("<h2>" + BRUK_RUBRIK[pid] + "</h2>")
    d.append(_p(BRUK[pid]))

    d.append("<h2>" + KORS_INGRESS[pid] + "</h2>")
    # ☠️ ABSOLUT URL, ALDRIG ROTRELATIV (uppmätt runda 132): en href som börjar
    #    på "/produkt/" skrivs om av Wix till "https:/produkt/…".
    lankar = ", ".join(
        '<a href="{}/produkt/{}">{}</a>'.format(BAS, s, t)
        for s, t in KORSLANK[pid]
    )
    d.append(_p(KORS_TEXT[pid] + " " + lankar + "."))

    d.append("<h2>Tekniska specifikationer</h2>")
    d.append("<ul>" + "".join(
        "<li><strong>{}:</strong> {}</li>".format(e, v) for e, v in SPEC[pid]
    ) + "</ul>")

    d.append("<h2>Användning och skötsel</h2>")
    d.append(_p(SKOTSEL[pid]))

    d.append("<h2>Vanliga frågor</h2>")
    for f, s in FAQ[pid]:
        d.append("<p><strong>" + f + "</strong></p>")
        d.append(_p(s))

    return "".join(d)
