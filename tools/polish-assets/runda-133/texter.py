# -*- coding: utf-8 -*-
"""Runda 133 — kundtexterna. En datafil; byggandet bor i bygg().

☠️ Skriv ALDRIG ut leverantörens namn, artikelnummer eller avsändarland.
☠️ Rör ALDRIG priset.
☠️ Mot kunden är VI leverantören — skriv aldrig "leverantören anger".
☠️ Ingen maxlast där källan saknar den (fem av tio). Ingen varuvikt alls.
"""
import os as _os
import sys as _sys

_sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), ".."))
import grindar as _G                                             # noqa: E402

NAMN = {
    "b6bf627f": "Klöstunna 49 cm i sjögräs och sisal – två hålor, max 20 kg",
    "a33447f9": "Klöstunna 79 cm i sjögräs och sisal – tre hålor, max 20 kg",
    "e7a9abb7": "Klöstunna 74 cm i mörkgrått – tre ingångar och liggplats på toppen",
    "f2e06b7a": "Klöstunna 74 cm i beige – tre ingångar och liggplats på toppen",
    "bd0d7f9e": "Klöstunna 70 cm i ljusgrått med grå kanter – tre hålor",
    "d9310184": "Klöstunna 70 cm i ljusbrunt med gräddvita kanter – tre hålor",
    "efa9c03e": "Klöstunna 70 cm i ljusgrått med mörkgrå kanter – tre hålor",
    "e43b623c": "Klöstunna 60 cm i ljusgrått – två hålor, max 10 kg",
    "d85ade1b": "Klöstunna 96 cm i cremevitt – tre hålor, tvättbar bädd, max 20 kg",
    "ec29ad45": "Klöstunna 96 cm i grått – tre hålor, tvättbar bädd, max 20 kg",
}

# ☠️ SLUGGEN ÄR VALD SÅ ATT DET SOM SKILJER SYSKONEN ÅT RYMS FÖRE KAPNINGEN.
#    `grindar.sku_bas` kapar, och runda 129 fick fyra sidor som delade SKU
#    (uppgift #489). Verifierat mot hela katalogen 2026-09-11: 57 sidor,
#    5 649 produkter, noll slugkrockar och noll krockar de tio emellan.
SLUG = {
    "b6bf627f": "klostunna-49-cm-sjogras",
    "a33447f9": "klostunna-79-cm-sjogras",
    "e7a9abb7": "klostunna-74-cm-morkgra",
    "f2e06b7a": "klostunna-74-cm-beige",
    "bd0d7f9e": "klostunna-70-cm-gra-kant",
    "d9310184": "klostunna-70-cm-ljusbrun",
    "efa9c03e": "klostunna-70-cm-morkgra-kant",
    "e43b623c": "klostunna-60-cm-ljusgra",
    "d85ade1b": "klostunna-96-cm-cremevit",
    "ec29ad45": "klostunna-96-cm-gra",
}

SKU = {pid: "FP-" + _G.sku_bas(slug) for pid, slug in SLUG.items()}

TITEL = {
    "b6bf627f": "Klöstunna 49 cm i sjögräs och sisal | Fyndplats",
    "a33447f9": "Klöstunna 79 cm i sjögräs och sisal | Fyndplats",
    "e7a9abb7": "Klöstunna 74 cm i mörkgrått – tre ingångar | Fyndplats",
    "f2e06b7a": "Klöstunna 74 cm i beige – tre ingångar | Fyndplats",
    "bd0d7f9e": "Klöstunna 70 cm i ljusgrått med grå kanter | Fyndplats",
    "d9310184": "Klöstunna 70 cm i ljusbrunt med gräddvit kant | Fyndplats",
    "efa9c03e": "Klöstunna 70 cm i ljusgrått med mörkgrå kant | Fyndplats",
    "e43b623c": "Klöstunna 60 cm i ljusgrått – två hålor | Fyndplats",
    "d85ade1b": "Klöstunna 96 cm i cremevitt med tvättbar bädd | Fyndplats",
    "ec29ad45": "Klöstunna 96 cm i grått med tvättbar bädd | Fyndplats",
}

META = {
    "b6bf627f": ("Klöstunna 49 cm med två hålor, klädd i flätat sjögräs och "
                 "sisal. Katten klöser på utsidan och sover inuti. Bär 20 kg."),
    "a33447f9": ("Klöstunna 79 cm i flätat sjögräs och sisal med tre hålor. "
                 "De två övre planen är förbundna inuti. Bär 20 kg."),
    "e7a9abb7": ("Klöstunna 74 cm i mörkgrått med tre ingångar och en öppen "
                 "liggplats på toppen. Sisalpanel att klösa på. Ingen montering."),
    "f2e06b7a": ("Klöstunna 74 cm i beige med tre ingångar och öppen liggplats "
                 "på toppen. Beige sisalyta att klösa på. Ingen montering."),
    "bd0d7f9e": ("Klöstunna 70 cm klädd i ljusgrå sisal med grå kanter. Tre "
                 "hålor i spiral och en mjuk liggyta överst."),
    "d9310184": ("Klöstunna 70 cm i ljusbrun sisal med gräddvita kanter. Tre "
                 "hålor i spiral och en mjuk liggyta överst."),
    "efa9c03e": ("Klöstunna 70 cm i ljusgrå sisal med mörkgrå kanter. Tre "
                 "hålor i spiral och en mjuk liggyta överst."),
    "e43b623c": ("Klöstunna 60 cm i ljusgrått med två hålor och plyschklädda "
                 "innerytor. Sisal runt hela utsidan. Bär 10 kg."),
    "d85ade1b": ("Klöstunna 96 cm i cremevitt med tre kattformade hålor, tre "
                 "hängande leksaker och avtagbar tvättbar bädd. Bär 20 kg."),
    "ec29ad45": ("Klöstunna 96 cm i grått med tre kattformade hålor, tre "
                 "hängande leksaker och avtagbar tvättbar bädd. Bär 20 kg."),
}

SOKORD = {
    "b6bf627f": "klöstunna sjögräs",
    "a33447f9": "klöstunna 79 cm",
    "e7a9abb7": "klöstunna mörkgrå",
    "f2e06b7a": "klöstunna beige",
    "bd0d7f9e": "klöstunna grå",
    "d9310184": "klöstunna ljusbrun",
    "efa9c03e": "klöstunna mörkgrå kant",
    "e43b623c": "klöstunna 60 cm",
    "d85ade1b": "klöstunna cremevit",
    "ec29ad45": "klöstunna 96 cm grå",
}

INTRO = {
    "b6bf627f": (
        "En klöstunna gör två saker samtidigt: den ger katten något eget att "
        "klösa på, och en mörk plats att dra sig undan i. Den här är 49 cm "
        "hög och har två hålor — en i varje plan. Nedre halvan är klädd i "
        "flätat sjögräs i korgbindning, övre halvan i finrandig sisal, och "
        "kanterna är gräddvit plysch. Den tål 20 kg."),
    "a33447f9": (
        "Samma flätade sjögräs och sisal som den lägre modellen, men 79 cm "
        "hög och med tre hålor i stället för två. De två övre planen är "
        "förbundna med ett hål inuti, så katten kan gå mellan dem utan att "
        "kliva ut. Kanterna är gräddvit plysch och tunnan tål 20 kg."),
    "e7a9abb7": (
        "Tre ingångar på tre plan, och en öppen liggplats med plyschkant "
        "överst — den här klöstunnan är 74 cm hög och ger katten fyra olika "
        "ställen att vara på. Utsidan är mörkgrå med en ljusgrå sisalpanel "
        "att klösa på. Den kommer färdig att ställa ned, ingen montering."),
    "f2e06b7a": (
        "Tre ingångar på tre plan och en öppen liggplats med plyschkant "
        "överst. Klöstunnan är 74 cm hög och har en bred gräddvit "
        "plyschpanel mellan de beige sisalytorna, där katten kan klösa i "
        "stället för på soffan. Den kommer färdig att ställa ned, ingen "
        "montering."),
    "bd0d7f9e": (
        "Tre runda hålor i spiral runt tunnan, så att katten kan klättra "
        "uppåt inifrån i stället för att hoppa. Den är 70 cm hög, klädd i "
        "ljusgrå sisal med grå plyschkanter, och har en mjuk liggyta överst. "
        "Ingen montering behövs."),
    "d9310184": (
        "Tre runda hålor i spiral runt tunnan, så att katten kan klättra "
        "uppåt inifrån i stället för att hoppa. Den är 70 cm hög, klädd i "
        "ljusbrun sisal med gräddvita plyschkanter, och har en mjuk liggyta "
        "överst. Ingen montering behövs."),
    "efa9c03e": (
        "Tre runda hålor i spiral runt tunnan, så att katten kan klättra "
        "uppåt inifrån i stället för att hoppa. Den är 70 cm hög, klädd i "
        "ljusgrå sisal med mörkgrå plyschkanter, topp och sockel, och har "
        "en mjuk liggyta överst. Ingen montering behövs."),
    "e43b623c": (
        "En låg klöstunna på 60 cm med två hålor — en nere och en uppe. "
        "Insidan är plyschklädd i båda planen och hela utsidan är lindad med "
        "sisal, så katten klöser på tunnan i stället för på möblerna. Överst "
        "finns en plan liggyta. Den tål 10 kg och kräver ingen montering."),
    "d85ade1b": (
        "Nästan en meter hög, med tre kattformade hålor ovanför varandra och "
        "ett hängande tygmustips i var och en. Överst ligger en rund bädd som "
        "går att ta av och maskintvätta — den delen blir smutsig först, och "
        "här slipper du tvätta hela möbeln. Hela tunnan är lindad med sisal "
        "och bär 20 kg. Den kommer färdigmonterad."),
    "ec29ad45": (
        "Nästan en meter hög, med tre kattformade hålor ovanför varandra och "
        "ett hängande tygmustips i var och en. Överst ligger en rund bädd som "
        "går att ta av och maskintvätta — den delen blir smutsig först, och "
        "här slipper du tvätta hela möbeln. Hela tunnan är lindad med sisal "
        "och bär 20 kg. Den kommer färdigmonterad."),
}

RUBRIK = {p: "Det här får du" for p in NAMN}

PUNKTER = {
    "b6bf627f": [
        "Två hålor med Ø14 cm ingång, en per plan",
        "Nedre halvan i flätat sjögräs, övre i sisal",
        "Plyschklädd liggyta överst, Ø35 cm",
        "Kanter i gräddvit plysch runt varje öppning",
        "Tål 20 kg",
    ],
    "a33447f9": [
        "Tre hålor med Ø17 cm ingång",
        "De två övre planen förbundna inuti med ett Ø17 cm hål",
        "Nedre delen i flätat sjögräs, övre i sisal",
        "Kanter i gräddvit plysch runt varje öppning",
        "Tål 20 kg",
    ],
    "e7a9abb7": [
        "Tre ingångar på 18 × 18 cm, en per plan",
        "Planen förbundna inuti med hål på 18 × 18 cm",
        "Öppen liggplats med plyschkant överst",
        "Ljusgrå sisalpanel längs sidan att klösa på",
        "Kommer färdig att ställa ned — ingen montering",
    ],
    "f2e06b7a": [
        "Tre ingångar på 18 × 18 cm, en per plan",
        "Planen förbundna inuti med hål på 18 × 18 cm",
        "Öppen liggplats med plyschkant överst, 37 × 37 cm",
        "Beige sisalytor på sidorna att klösa på",
        "Kommer färdig att ställa ned — ingen montering",
    ],
    "bd0d7f9e": [
        "Tre runda hålor på Ø17 cm, placerade i spiral",
        "De två övre planen förbundna inuti, Ø17,5 cm",
        "Ljusgrå sisal runt hela utsidan",
        "Grå plyschkanter och mjuk liggyta överst",
        "Ingen montering behövs",
    ],
    "d9310184": [
        "Tre runda hålor på Ø17 cm, placerade i spiral",
        "De två övre planen förbundna inuti, Ø17,5 cm",
        "Ljusbrun sisal runt hela utsidan",
        "Gräddvita plyschkanter och mjuk liggyta överst",
        "Ingen montering behövs",
    ],
    "efa9c03e": [
        "Tre runda hålor på Ø17 cm, placerade i spiral",
        "De två övre planen förbundna inuti, Ø17,5 cm",
        "Ljusgrå sisal runt hela utsidan",
        "Mörkgrå plyschkanter, topp och sockel",
        "Ingen montering behövs",
    ],
    "e43b623c": [
        "Två hålor med Ø17 cm ingång",
        "Nedre rummet Ø33 × 27 cm, övre Ø33 × 24 cm",
        "Plan liggyta överst, Ø32,5 cm",
        "Sisal runt hela utsidan",
        "Tål 10 kg och kräver ingen montering",
    ],
    "d85ade1b": [
        "Tre kattformade hålor, 18 × 19 cm var",
        "Varje våning är Ø35 × 27 cm invändigt",
        "Tre hängande tygmustips, ett per håla",
        "Avtagbar och maskintvättbar bädd överst, Ø38 cm",
        "Sisal runt hela utsidan, tål 20 kg",
    ],
    "ec29ad45": [
        "Tre kattformade hålor, 18 × 19 cm var",
        "Varje våning är Ø35 × 27 cm invändigt",
        "Tre hängande tygmustips, ett per håla",
        "Avtagbar och maskintvättbar bädd överst, Ø38 cm",
        "Sisal runt hela utsidan, tål 20 kg",
    ],
}

KATT_RUBRIK = {p: "Vilken katt den passar" for p in NAMN}

KATT = {
    "b6bf627f": (
        "Hålorna är Ø14 cm, alltså en smal öppning. Tunnan passar en till "
        "två katter på upp till 5 kg. En "
        "stor eller kraftigt byggd katt bör du mäta över bröstkorgen först — "
        "kommer den inte igenom öppningen spelar resten ingen roll."),
    "a33447f9": (
        "Öppningarna är Ø17 cm och tunnan rymmer en till två katter på upp "
        "till 5 kg. Att de två övre planen hänger ihop inuti gör den bättre "
        "för två katter än en modell där varje håla är ett slutet rum — de "
        "kan byta plats utan att gå ut och in."),
    "e7a9abb7": (
        "Ingångarna är 18 × 18 cm och tunnan är gjord för katter under "
        "4,5 kg. Med tre ingångar och en liggplats på toppen fungerar den "
        "för två katter som gillar att ha var sitt hörn."),
    "f2e06b7a": (
        "Ingångarna är 18 × 18 cm — fyrkantiga, inte runda — och tunnan är "
        "gjord för katter under 4,5 kg. Tre ingångar plus liggplatsen "
        "överst ger fyra ställen att välja mellan."),
    "bd0d7f9e": (
        "Öppningarna är Ø17 cm och tunnan är gjord för katter under 5 kg. "
        "Spiralen gör att katten kan ta sig uppåt inifrån, vilket är lättare "
        "för en äldre katt än att hoppa upp utvändigt."),
    "d9310184": (
        "Öppningarna är Ø17 cm och tunnan är gjord för katter under 5 kg. "
        "Spiralen gör att katten kan ta sig uppåt inifrån, vilket är lättare "
        "för en äldre katt än att hoppa upp utvändigt."),
    "efa9c03e": (
        "Öppningarna är Ø17 cm och tunnan är gjord för katter under 5 kg. "
        "Spiralen gör att katten kan ta sig uppåt inifrån, vilket är lättare "
        "för en äldre katt än att hoppa upp utvändigt."),
    "e43b623c": (
        "Öppningen är Ø17 cm och tunnan tål 10 kg. Rummen är Ø33 cm breda "
        "och 24 respektive 27 cm höga, alltså gott om plats för en katt att "
        "ligga hoprullad i. Mät katten över bröstkorgen om den är kraftigt "
        "byggd."),
    "d85ade1b": (
        "Hålorna är 18 cm breda och 19 cm höga, och tunnan är gjord för "
        "katter upp till omkring 6 kg. Den bär 20 kg, så två katter kan "
        "använda den samtidigt utan att den blir överbelastad."),
    "ec29ad45": (
        "Hålorna är 18 cm breda och 19 cm höga, och tunnan är gjord för "
        "katter upp till omkring 6 kg. Den bär 20 kg, så två katter kan "
        "använda den samtidigt utan att den blir överbelastad."),
}

BRUK_RUBRIK = {p: "Att tänka på" for p in NAMN}

_STAENDE = (
    "Tunnan står fritt på golvet och ska inte fästas i väggen. Ställ den "
    "mot en vägg eller i ett hörn — dels står den stadigare, dels vill de "
    "flesta katter ha ryggen fri när de sover. Undvik att ställa den på en "
    "matta som glider.")

BRUK = {
    "b6bf627f": (
        "Med 49 cm är den låg nog att stå under ett fönster utan att skymma. "
        + _STAENDE),
    "a33447f9": (
        "79 cm är tillräckligt högt för att katten ska få den utsikt den "
        "brukar leta efter. " + _STAENDE),
    "e7a9abb7": (
        "Sisalpanelen sitter på en sida. Vänd den utåt i rummet, annars "
        "klöser katten på det som är närmast i stället. " + _STAENDE),
    "f2e06b7a": (
        "Sisalytorna är de beige partierna — den breda gräddvita panelen "
        "är mjuk plysch. Vrid tunnan så att en beige sida vetter mot "
        "rummet, annars klöser katten på det som är närmast i stället. "
        + _STAENDE),
    "bd0d7f9e": (
        "Hålorna sitter i spiral, så vrid tunnan tills den nedersta öppningen "
        "vetter mot rummet. " + _STAENDE),
    "d9310184": (
        "Hålorna sitter i spiral, så vrid tunnan tills den nedersta öppningen "
        "vetter mot rummet. " + _STAENDE),
    "efa9c03e": (
        "Hålorna sitter i spiral, så vrid tunnan tills den nedersta öppningen "
        "vetter mot rummet. " + _STAENDE),
    "e43b623c": (
        "Den låga höjden gör den enkel att placera — den får plats bredvid "
        "en soffa eller under ett bord. " + _STAENDE),
    "d85ade1b": (
        "På nästan en meter spelar underlaget roll. "
        + _STAENDE),
    "ec29ad45": (
        "På nästan en meter spelar underlaget roll. "
        + _STAENDE),
}

# ☠️ FÄRGRADEN SKRIVS BARA DÄR DET ÄR SAMMA MODELL. `e7a9abb7` och `f2e06b7a`
#    delar mått, vikt och paketmått men har OLIKA antal ingångar (tre mot två,
#    räknat på bild 1 och 2 på båda) — uppgift #504. De har därför ingen
#    färgrad, bara en neutral korslänk.
FARGRAD = {
    # ☠️ Grupp B tillkom vid Steg 9, när måttritningen visade att f2e06b7a
    #    har TRE ingångar och inte två. Se matt.FARGSYSKON.
    "e7a9abb7": "Samma modell finns även i beige.",
    "f2e06b7a": "Samma modell finns även i mörkgrått.",
    "b6bf627f": ("Samma serie finns även som 79 cm hög med tre hålor."),
    "a33447f9": ("Samma serie finns även som 49 cm hög med två hålor."),
    "bd0d7f9e": ("Samma modell finns även i ljusbrunt med gräddvita kanter "
                 "och i ljusgrått med mörkgrå kanter."),
    "d9310184": ("Samma modell finns även i ljusgrått med grå kanter och i "
                 "ljusgrått med mörkgrå kanter."),
    "efa9c03e": ("Samma modell finns även i ljusgrått med grå kanter och i "
                 "ljusbrunt med gräddvita kanter."),
    "d85ade1b": "Samma modell finns även i grått.",
    "ec29ad45": "Samma modell finns även i cremevitt.",
}

KORS_INGRESS = {p: "Passar inte den här?" for p in NAMN}
KORS_TEXT = {p: "Fler klöstunnor hos oss:" for p in NAMN}

KORSLANK = {
    "b6bf627f": [("klostunna-79-cm-sjogras", "samma serie, 79 cm med tre hålor"),
                 ("klostunna-60-cm-ljusgra", "låg modell på 60 cm")],
    "a33447f9": [("klostunna-49-cm-sjogras", "samma serie, 49 cm med två hålor"),
                 ("klostunna-96-cm-cremevit", "96 cm med tvättbar bädd")],
    "e7a9abb7": [("klostunna-74-cm-beige", "samma tunna i beige"),
                 ("klostunna-70-cm-gra-kant", "70 cm med tre runda hålor")],
    "f2e06b7a": [("klostunna-74-cm-morkgra", "samma tunna i mörkgrått"),
                 ("klostunna-60-cm-ljusgra", "låg modell på 60 cm")],
    "bd0d7f9e": [("klostunna-70-cm-ljusbrun", "samma modell i ljusbrunt"),
                 ("klostunna-70-cm-morkgra-kant", "samma modell med mörkgrå kanter")],
    "d9310184": [("klostunna-70-cm-gra-kant", "samma modell med grå kanter"),
                 ("klostunna-70-cm-morkgra-kant", "samma modell med mörkgrå kanter")],
    "efa9c03e": [("klostunna-70-cm-gra-kant", "samma modell med grå kanter"),
                 ("klostunna-70-cm-ljusbrun", "samma modell i ljusbrunt")],
    "e43b623c": [("klostunna-49-cm-sjogras", "49 cm i sjögräs och sisal"),
                 ("klostunna-70-cm-gra-kant", "70 cm med tre runda hålor")],
    "d85ade1b": [("klostunna-96-cm-gra", "samma modell i grått"),
                 ("klostunna-79-cm-sjogras", "79 cm i sjögräs och sisal")],
    "ec29ad45": [("klostunna-96-cm-cremevit", "samma modell i cremevitt"),
                 ("klostunna-79-cm-sjogras", "79 cm i sjögräs och sisal")],
}

SPEC = {
    "b6bf627f": [("Höjd", "49 cm"), ("Mått", "35,5 × 35,5 × 49 cm"),
                 ("Antal hålor", "2"), ("Ingång", "Ø14 cm"),
                 ("Liggyta överst", "Ø35 cm"),
                 ("Material", "spånskiva, plysch, sisal och sjögräs"),
                 ("Färg", "khakifärgat sjögräs och taupe sisal med gräddvita kanter"),
                 ("Maxlast", "20 kg"),
                 ("Rekommenderad kattvikt", "1–2 katter under 5 kg")],
    "a33447f9": [("Höjd", "79 cm"), ("Mått", "45 × 45 × 79 cm"),
                 ("Antal hålor", "3"), ("Ingång", "Ø17 cm"),
                 ("Hål mellan de två övre planen", "Ø17 cm"),
                 ("Material", "spånskiva, plysch, sisal och sjögräs"),
                 ("Färg", "khakifärgat sjögräs och taupe sisal med gräddvita kanter"),
                 ("Maxlast", "20 kg"),
                 ("Rekommenderad kattvikt", "1–2 katter under 5 kg")],
    "e7a9abb7": [("Höjd", "74 cm"), ("Mått", "40 × 40 × 74 cm"),
                 ("Antal ingångar", "3"), ("Ingång", "18 × 18 cm"),
                 ("Hål mellan planen", "18 × 18 cm"),
                 ("Material", "spånskiva, sammetslen polyester och sisal"),
                 ("Färg", "mörkgrå med ljusgrå panel och vita kanter"),
                 ("Montering", "ingen"),
                 ("Rekommenderad kattvikt", "under 4,5 kg")],
    "f2e06b7a": [("Höjd", "74 cm"), ("Mått", "40 × 40 × 74 cm"),
                 ("Antal ingångar", "3"), ("Ingång", "18 × 18 cm"),
                 ("Hål mellan planen", "18 × 18 cm"),
                 ("Liggyta överst", "37 × 37 cm"),
                 ("Material", "spånskiva, sammetslen polyester och sisal"),
                 ("Färg", "beige med gräddvit panel och vita kanter"),
                 ("Montering", "ingen"),
                 ("Rekommenderad kattvikt", "under 4,5 kg")],
    "bd0d7f9e": [("Höjd", "70 cm"), ("Mått", "Ø38 × 70 cm"),
                 ("Antal hålor", "3"), ("Ingång", "Ø17 cm"),
                 ("Hål mellan de två övre planen", "Ø17,5 cm"),
                 ("Material", "spånskiva, plysch och sisal"),
                 ("Färg", "ljusgrå sisal med grå kanter"),
                 ("Montering", "ingen"),
                 ("Rekommenderad kattvikt", "under 5 kg")],
    "d9310184": [("Höjd", "70 cm"), ("Mått", "Ø38 × 70 cm"),
                 ("Antal hålor", "3"), ("Ingång", "Ø17 cm"),
                 ("Hål mellan de två övre planen", "Ø17,5 cm"),
                 ("Material", "spånskiva, plysch och sisal"),
                 ("Färg", "ljusbrun sisal med gräddvita kanter"),
                 ("Montering", "ingen"),
                 ("Rekommenderad kattvikt", "under 5 kg")],
    "efa9c03e": [("Höjd", "70 cm"), ("Mått", "Ø38 × 70 cm"),
                 ("Antal hålor", "3"), ("Ingång", "Ø17 cm"),
                 ("Hål mellan de två övre planen", "Ø17,5 cm"),
                 ("Material", "spånskiva, plysch och sisal"),
                 ("Färg", "ljusgrå sisal med mörkgrå kanter"),
                 ("Montering", "ingen"),
                 ("Rekommenderad kattvikt", "under 5 kg")],
    "e43b623c": [("Höjd", "60 cm"), ("Mått", "Ø35 × 60 cm"),
                 ("Antal hålor", "2"), ("Ingång", "Ø17 cm"),
                 ("Nedre rummet", "Ø33 × 27 cm"),
                 ("Övre rummet", "Ø33 × 24 cm"),
                 ("Liggyta överst", "Ø32,5 cm"),
                 ("Material", "spånskiva, plysch, PP-bomull och sisal"),
                 ("Färg", "ljusgrå"), ("Maxlast", "10 kg"),
                 ("Montering", "ingen")],
    "d85ade1b": [("Höjd", "96 cm"), ("Mått", "Ø38 × 96 cm"),
                 ("Antal hålor", "3"), ("Ingång", "18 × 19 cm"),
                 ("Våning invändigt", "Ø35 × 27 cm"),
                 ("Bädd överst", "Ø38 × 6 cm, avtagbar och maskintvättbar"),
                 ("Leksaker", "3 hängande tygmustips"),
                 ("Material", "spånskiva, MDF, plysch, PP-bomull och sisal"),
                 ("Färg", "cremevit med beige bädd"), ("Maxlast", "20 kg"),
                 ("Montering", "ingen, levereras färdigmonterad"),
                 ("Rekommenderad kattvikt", "upp till 6 kg")],
    "ec29ad45": [("Höjd", "96 cm"), ("Mått", "Ø38 × 96 cm"),
                 ("Antal hålor", "3"), ("Ingång", "18 × 19 cm"),
                 ("Våning invändigt", "Ø35 × 27 cm"),
                 ("Bädd överst", "Ø38 × 6 cm, avtagbar och maskintvättbar"),
                 ("Leksaker", "3 hängande tygmustips"),
                 ("Material", "spånskiva, MDF, plysch, PP-bomull och sisal"),
                 ("Färg", "grå med grå bädd"), ("Maxlast", "20 kg"),
                 ("Montering", "ingen, levereras färdigmonterad"),
                 ("Rekommenderad kattvikt", "upp till 6 kg")],
}

_SKOTSEL_SISAL = (
    "Dammsug sisalen med möbelmunstycke när den börjar se luddig ut — lösa "
    "fibrer hör till och betyder att den används. Plyschen borstar du ren "
    "med en torr klädborste; torka fläckar med en fuktig trasa och låt "
    "lufttorka. Blöt aldrig ned stommen, den är av spånskiva och sväller av "
    "vatten.")

SKOTSEL = {
    "b6bf627f": _SKOTSEL_SISAL + (
        " Det flätade sjögräset tål samma behandling, men gå försiktigt med "
        "munstycket så att du inte drar loss en tråd ur flätningen."),
    "a33447f9": _SKOTSEL_SISAL + (
        " Det flätade sjögräset tål samma behandling, men gå försiktigt med "
        "munstycket så att du inte drar loss en tråd ur flätningen."),
    "e7a9abb7": _SKOTSEL_SISAL,
    "f2e06b7a": _SKOTSEL_SISAL,
    "bd0d7f9e": _SKOTSEL_SISAL,
    "d9310184": _SKOTSEL_SISAL,
    "efa9c03e": _SKOTSEL_SISAL,
    "e43b623c": _SKOTSEL_SISAL,
    "d85ade1b": (
        "Bädden på toppen tar du av och maskintvättar när den behöver det — "
        "det är den delen som blir smutsig först. " + _SKOTSEL_SISAL),
    "ec29ad45": (
        "Bädden på toppen tar du av och maskintvättar när den behöver det — "
        "det är den delen som blir smutsig först. " + _SKOTSEL_SISAL),
}

_FAQ_GEMENSAM = [
    ("Hur får jag katten att använda den?",
     "Ställ den där katten redan brukar sova, inte där du helst vill ha den. "
     "Strö lite kattmynta i den nedersta hålan och låt den stå ifred några "
     "dagar. Lyft aldrig in katten — det gör tunnan till något som händer "
     "med den i stället för ett gömställe den valt själv."),
    ("Kan den stå i ett hörn?",
     "Ja, och den står stadigare så. Katter vill oftast ha ryggen fri när de "
     "sover, så ett hörn är sällan ett sämre läge än mitt i rummet."),
]

FAQ = {
    "b6bf627f": [
        ("Är Ø14 cm för trångt för en vanlig katt?",
         "För en normalstor katt går det bra, men öppningen är smal. Är "
         "katten kraftigt byggd eller väger över 5 kg "
         "bör du mäta över bröstkorgen först, eller välja en modell med "
         "Ø17 eller Ø18 cm ingång."),
        ("Vad är skillnaden mot den 79 cm höga?",
         "Samma material och samma utförande, men den högre modellen har "
         "en håla till, och ett hål inuti mellan de två översta planen."),
    ] + _FAQ_GEMENSAM,
    "a33447f9": [
        ("Vad betyder det att planen är förbundna inuti?",
         "De två övre planen har ett hål på Ø17 cm mellan sig, så katten kan "
         "klättra mellan dem inifrån utan att gå ut. Det nedersta planet nås "
         "genom sin egen håla."),
        ("Fungerar den för två katter?",
         "Ja. Tre hålor och den inre förbindelsen gör att två katter kan "
         "byta plats utan att mötas i en öppning."),
    ] + _FAQ_GEMENSAM,
    "e7a9abb7": [
        ("Hur många öppningar har den?",
         "Tre, en per plan, plus den öppna liggplatsen på toppen. Ingångarna "
         "är 18 × 18 cm."),
        ("Behöver den monteras?",
         "Nej. Den kommer hel och ska bara ställas ned."),
    ] + _FAQ_GEMENSAM,
    "f2e06b7a": [
        ("Hur många öppningar har den?",
         "Tre ingångar, en per plan, och dessutom den öppna liggplatsen "
         "överst. Varje ingång är 18 × 18 cm."),
        ("Behöver den monteras?",
         "Nej. Den kommer hel och ska bara ställas ned."),
    ] + _FAQ_GEMENSAM,
    "bd0d7f9e": [
        ("Varför sitter hålorna i spiral?",
         "För att katten ska kunna klättra uppåt inuti tunnan i stället för "
         "att hoppa upp utvändigt. Det är skonsammare för en äldre katt."),
        ("Vad skiljer den från de andra två i samma färgfamilj?",
         "Bara kanterna. Den här har grå plyschkanter; syskonen har "
         "gräddvita respektive mörkgrå. Mått och konstruktion är lika."),
    ] + _FAQ_GEMENSAM,
    "d9310184": [
        ("Varför sitter hålorna i spiral?",
         "För att katten ska kunna klättra uppåt inuti tunnan i stället för "
         "att hoppa upp utvändigt. Det är skonsammare för en äldre katt."),
        ("Vad skiljer den från de andra två i samma färgfamilj?",
         "Bara färgen. Den här är ljusbrun med gräddvita kanter; syskonen är "
         "ljusgrå med grå respektive mörkgrå kanter."),
    ] + _FAQ_GEMENSAM,
    "efa9c03e": [
        ("Varför sitter hålorna i spiral?",
         "För att katten ska kunna klättra uppåt inuti tunnan i stället för "
         "att hoppa upp utvändigt. Det är skonsammare för en äldre katt."),
        ("Vad skiljer den från de andra två i samma färgfamilj?",
         "Bara kanterna. Den här har mörkgrå kanter, topp och sockel; "
         "syskonen har grå respektive gräddvita."),
    ] + _FAQ_GEMENSAM,
    "e43b623c": [
        ("Hur stora är rummen inuti?",
         "Det nedre är Ø33 × 27 cm och det övre Ø33 × 24 cm. Båda rymmer en "
         "hoprullad katt med marginal."),
        ("Vad tål den?",
         "10 kg. Det räcker för en katt på liggytan överst, men den är inte "
         "byggd för två vuxna katter samtidigt — välj en modell med 20 kg "
         "maxlast om ni är fler än en katt i hushållet."),
    ] + _FAQ_GEMENSAM,
    "d85ade1b": [
        ("Går bädden att tvätta?",
         "Ja, den tas av och maskintvättas. Följ tvättrådet i etiketten och "
         "låt den lufttorka innan du lägger tillbaka den."),
        ("Sitter leksakerna fast?",
         "De tre mustipsen hänger i varsin håla. Kolla dem då och då som du "
         "gör med alla kattleksaker, och ta bort ett som börjar lossna."),
    ] + _FAQ_GEMENSAM,
    "ec29ad45": [
        ("Går bädden att tvätta?",
         "Ja, den tas av och maskintvättas. Följ tvättrådet i etiketten och "
         "låt den lufttorka innan du lägger tillbaka den."),
        ("Sitter leksakerna fast?",
         "De tre mustipsen hänger i varsin håla. Kolla dem då och då som du "
         "gör med alla kattleksaker, och ta bort ett som börjar lossna."),
    ] + _FAQ_GEMENSAM,
}

# Meta-nyckelordslistan. `SOKORD` är HUVUDordet (settings.keywords, isMain),
# listan nedan är meta-taggen. ☠️ Klart-kriteriet kräver att BÅDA skrivs om —
# importen lämnar leverantörens TYSKA rubrik i settings.keywords, och Steg 7
# rörde tidigare bara seoData.tags. Runda 132 fick städa det i Steg 13.
SOKORDSLISTA = {
    "b6bf627f": "klöstunna, kattunna sisal, klösmöbel sjögräs, katthus tunna, klöspelare katt",
    "a33447f9": "klöstunna 79 cm, kattunna tre plan, klösmöbel sjögräs, katttorn sisal, klöspelare",
    "e7a9abb7": "klöstunna mörkgrå, kattunna tre ingångar, klösmöbel sisal, katthus tunna, klöspelare",
    "f2e06b7a": "klöstunna beige, kattunna två ingångar, klösmöbel sisal, katthus tunna, klöspelare",
    "bd0d7f9e": "klöstunna grå, kattunna sisal, klösmöbel tre hålor, katthus tunna, klöspelare katt",
    "d9310184": "klöstunna ljusbrun, kattunna sisal, klösmöbel tre hålor, katthus tunna, klöspelare",
    "efa9c03e": "klöstunna mörkgrå kant, kattunna sisal, klösmöbel tre hålor, katthus tunna, klöspelare",
    "e43b623c": "klöstunna 60 cm, låg kattunna, klösmöbel sisal, katthus tunna, klöspelare katt",
    "d85ade1b": "klöstunna cremevit, kattorn 96 cm, klösmöbel med bädd, katthus tunna, klöspelare",
    "ec29ad45": "klöstunna grå 96 cm, kattorn sisal, klösmöbel med bädd, katthus tunna, klöspelare",
}

BAS = "https://www.fyndplats.se"


def _p(t):
    return "<p>" + t + "</p>"


def bygg(pid):
    """Bygger plainDescription. Ordningen speglar runda 132 exakt."""
    d = []
    d.append(_p(INTRO[pid]))

    d.append("<h2>" + RUBRIK[pid] + "</h2>")
    d.append("<ul>" + "".join("<li>" + x + "</li>" for x in PUNKTER[pid]) + "</ul>")

    d.append("<h2>" + KATT_RUBRIK[pid] + "</h2>")
    d.append(_p(KATT[pid]))

    d.append("<h2>" + BRUK_RUBRIK[pid] + "</h2>")
    d.append(_p(BRUK[pid]))

    d.append("<h2>" + KORS_INGRESS[pid] + "</h2>")
    # ☠️ ABSOLUT URL, ALDRIG ROTRELATIV. Uppmätt i runda 132: en href som
    #    börjar på "/produkt/" skrivs om av Wix till "https:/produkt/…" —
    #    med ETT snedstreck, alltså en adress vars värdnamn blir "produkt".
    lankar = ", ".join(
        '<a href="{}/produkt/{}">{}</a>'.format(BAS, s, t)
        for s, t in KORSLANK[pid]
    )
    rad = KORS_TEXT[pid] + " " + lankar + "."
    if pid in FARGRAD:
        rad = FARGRAD[pid] + " " + rad
    d.append(_p(rad))

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
