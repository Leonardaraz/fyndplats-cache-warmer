# -*- coding: utf-8 -*-
"""Runda 106 — smådjursstall i trä. RÅA MÅTT, inget härlett.

Svepet 2026-09-08: 3 149 utkast lästa, 3 149 unika, `avhuggen: false`.
47 träffar på huvudordet (Kleintierstall · Hasenstall · Kaninchenstall ·
Kleintierkäfig · Nagerkäfig). Alla 47 har 5 bilder och EN variant; alla utom
`d93d729a` ligger i lager.

☠️ FAMILJEN ÄR INTE ALLA 47. Åtta av träffarna är INOMHUSBURAR i metall,
   plast eller trä-med-akrylfront — en annan produkttyp med annan text, andra
   sökord och andra publicerade konkurrenter (hamsterburarna i runda 45–47).
   De står här ändå, märkta `typ`, eftersom svepet hittade dem och nästa runda
   ska slippa göra om mätningen.

⚠️ HÖJDEN I `delar` ÄR DEN FRIA HÖJDEN I DELYTAN, inte husets ytterhöjd.
   Där leverantören bara anger ytterhöjden står det i `anm` — den siffran är
   alltid för hög, och en grind som råkar använda den släpper igenom en bur
   som inte klarar kravet.

⚠️ `delar` RÄKNAR BARA BOTTENPLANET. Runbookens regel, ordagrant: "Hyllplan
   och våningar räknas INTE in i golvytan — bara bottenytan, och höjden mäts
   per delyta." Övervåningen är alltså kaninens hylla (8 kap. 21 §), inte
   golvyta. Vilken delyta som ligger på bottenplanet står i `delar`; huset
   ovanpå står i `ovan` så att det inte försvinner ur mätningen.
"""

# ── SJVFS 2019:15 bilaga 1:3 tabell 1 — KANINER ──────────────────────────────
# (maxvikt kg, minsta yta m², per djur vid grupphållning m², avelshona m. kull,
#  per avelshona vid grupp, kortaste sida m, minsta höjd m)
L80_KANIN = [
    (2.0,  0.5, 0.30, 0.7, 0.7, 0.5, 0.5),
    (3.5,  0.7, 0.35, 0.8, 0.8, 0.6, 0.6),
    (4.5,  0.8, 0.40, 0.9, 0.9, 0.7, 0.8),
    (6.0,  0.9, 0.45, 1.0, 1.0, 0.7, 0.8),
    (99.0, 1.0, 0.50, 1.2, 1.2, 0.8, 0.9),
]

# ── SJVFS 2019:15 bilaga 1:4 tabell 1 — GNAGARE ──────────────────────────────
# art -> (minsta yta m², per djur vid grupp m², avelshona m. kull m²,
#         kortaste sida m, minsta höjd m)
L80_GNAGARE = {
    "Marsvin":        (0.30, 0.150, 0.250,  0.40, 0.25),
    "Guldhamster":    (0.12, 0.060, 0.150,  0.25, 0.20),
    "Dvärghamster":   (0.09, 0.045, 0.045,  0.20, 0.20),
    "Chinchilla":     (0.50, 0.250, 0.500,  0.50, 1.00),
    "Degu":           (0.30, 0.150, 0.200,  0.40, 0.40),
    "Brun råtta":     (0.18, 0.060, 0.080,  0.30, 0.30),
    "Gerbil":         (0.12, 0.060, 0.150,  0.25, 0.20),
    "Husmus":         (0.09, 0.018, 0.0275, 0.20, 0.20),
    "Gräsmus":        (0.09, 0.030, 0.075,  0.20, 0.20),
}

# ⚠️ Runbookens utgångspunkt när leverantören inte anger vikt: 0,7 m² —
#    normalstor sällskapskanin (2–3,5 kg). "Marknadsförd för 1–2 kaniner" ger
#    ändå 0,7 (2 × 0,35). Kravraden blir alltså (0,7 m², 0,6 m sida, 0,6 m höjd).
KANIN_NORMAL = L80_KANIN[1]

# ── UTKASTEN ────────────────────────────────────────────────────────────────
# id8: (namn, slug, pris, lager, sku, variantid8, färg_de, ytter(L,B,H),
#       delar[(namn, L, B, fri höjd)], ovan[(namn, L, B, H)], typ, anm)
#
# typ: "stall"  = trähus/hage för utomhusbruk (RUNDANS FAMILJ)
#      "burM"   = inomhusbur i metall/plast
#      "burT"   = inomhusbur i trä med glas-/akrylfront
UTKAST = {
    # ── modell A: 210 × 45,5 × 84,5, hus mitt på, en löpbox på varje sida ──
    "512a4396": ("Kleintierstall mit 2 Freiluftgehegen Asphaltdach Tannenholz Grau +",
                 "kleintierstall-mit-2-freiluftgehegen-asphaltdach-tannenholz-grau",
                 1639, True, "FP-kleintierstall-mit-2", "6c7edfff", "Grau+Schwarz",
                 (210, 45.5, 84.5),
                 [("löpbox vänster", 68, 37, 55), ("löpbox höger", 68, 37, 55)],
                 [("hus", 68, 37, 52)], "stall", ""),
    "beb5d127": ("Kleintierstall mit 2 Freiluftgehegen Tannenholz Grau + Schwarz",
                 "kleintierstall-mit-2-freiluftgehegen-tannenholz-grau-schwarz",
                 1669, True, "FP-kleintierstall-mit-2", "b08bdd96", "Natur+Grün",
                 (210, 45.5, 84.5),
                 [("löpbox vänster", 71, 43, 57), ("löpbox höger", 71, 43, 57)],
                 [("hus", 76, 45, 84)], "stall",
                 "☠️ TRE olika färgbesked: namnet 'Grau + Schwarz', tyska Farbe "
                 "'Natur+Grün', svenska Färg 'Weiß, Grün, Braun'. Och huset anges "
                 "76×45×84 i ett skåp vars YTTERhöjd är 84,5 — omöjligt."),

    # ── modell B: 230 × 53 × 93,5 ──────────────────────────────────────────
    "c0770388": ("Hasenstall 2 Etagen Kaninchenstall Holz 230 x 53 x 93,5 cm Winterfest",
                 "hasenstall-2-etagen-kaninchenstall-holz-230-x-53-x-93-5-cm-winterfest",
                 3119, True, "FP-hasenstall-2-etagen", "50e2b99f",
                 "Hellgrau+Dunkelgrau+Schwarz", (230, 53, 93.5),
                 [("löpbox under huset", 70, 41, 32),
                  ("löpbox sida 1", 70, 41, 60), ("löpbox sida 2", 70, 41, 60)],
                 [("hus (innermått)", 70, 41, 48)], "stall", ""),
    "a75fcfde": ("Kleintierstall mit Freigehege inkl. Rampe Asphaltdach Tannenholz",
                 "kleintierstall-mit-freigehege-inkl-rampe-asphaltdach-tannenholz",
                 3179, True, "FP-kleintierstall-mit", "1febdb0b", "Schwarz+Weiß+Gelb",
                 (230, 53, 93.5),
                 [("löpbox under huset", 74, 45.5, 35),
                  ("löpbox sida 1", 72, 45.5, 64), ("löpbox sida 2", 72, 45.5, 64)],
                 [("hus", 74, 45.5, 50)], "stall", ""),

    # ── modell C: 259 × 64 × 92 ────────────────────────────────────────────
    "f75b26c4": ("Kleintierstall, Kaninchenstall, Außengehege, Stall, Rampe",
                 "kleintierstall-kaninchenstall-au-engehege-stall-rampe",
                 4269, True, "FP-kleintierstall", "8d4948d6", "Weiß+Grau+Schwarz",
                 (259, 64, 92),
                 [("löpbox under huset", 51, 53, 36.5), ("löpbox mitten", 145, 53, 62.5)],
                 [("hus", 51, 53, 54)], "stall",
                 "Leverantören: 'Geeignet für 2-4 Kaninchen'."),

    # ── modell D: 123,5 × 62,6 × 92,5 (färgpar) ────────────────────────────
    "079f2901": ("Hasenstall 2 Etagen Kaninchenstall aus Holz 123,5x62,6x92,5 cm",
                 "hasenstall-2-etagen-kaninchenstall-aus-holz-123-5x62-6x92-5-cm",
                 1649, True, "FP-hasenstall-2-etagen", "c62b6c9b", "Grau+Weiß",
                 (123.5, 62.6, 92.5),
                 [("löpbox under huset", 54, 53, 32), ("löpbox sida", 53, 61, 58)],
                 [("hus", 54.5, 53, 63)], "stall", ""),
    "525e6acf": ("Hasenstall 2 Etagen Kaninchenstall mit wasserdicht Bitumendach",
                 "hasenstall-2-etagen-kaninchenstall-mit-wasserdicht-bitumendach",
                 1669, True, "FP-hasenstall-2-etagen", "0aaf62f3", "Orange+Schwarz",
                 (123.5, 62.6, 92.5),
                 [("löpbox under huset", 54, 53, 32), ("löpbox sida", 53, 61, 58)],
                 [("hus", 54.5, 53, 63)], "stall", ""),

    # ── modell E: 147 × 54 × 84 ────────────────────────────────────────────
    "6d806998": ("Hasenstall 2 Etagen Kaninchenstall Holz Kaninchenkäfig mit",
                 "hasenstall-2-etagen-kaninchenstall-holz-kaninchenkafig-mit",
                 1699, True, "FP-hasenstall-2-etagen", "95b3b8b9", "Gelb+Weiß",
                 (147, 54, 84),
                 [("löpbox under huset", 69, 43.5, 31), ("löpbox sida", 68.5, 43.5, 61.5)],
                 [("hus", 69, 43.5, 50)], "stall", ""),

    # ── modell F: 150 × 52 × 68 ────────────────────────────────────────────
    "ad8fcc1c": ("Hasenstall 2 Ebenen Kaninchenstall Tannenholz Winterfest",
                 "hasenstall-2-ebenen-kaninchenstall-tannenholz-winterfest",
                 1899, True, "FP-hasenstall-2-ebenen", "0f3221a1", "Gelb",
                 (150, 52, 68),
                 [("löpbox under huset", 72, 45, 27), ("sidorum", 76, 45, 53)],
                 [("hus", 72, 45, 38)], "stall", ""),

    # ── modell G: 156 × 58 × 68 (färgpar) ──────────────────────────────────
    "2435c4d1": ("Kaninchenstall aus Tannenholz, Kleintierhaus mit Asphaltdach",
                 "kaninchenstall-aus-tannenholz-kleintierhaus-mit-asphaltdach",
                 1649, True, "FP-kaninchenstall-aus", "48090fa1", "Hellgrau",
                 (156, 58, 68),
                 [("löpbox under huset", 72, 50, 26.5), ("löpbox sida", 80, 50, 56)],
                 [("hus", 72, 50, 41.5)], "stall", ""),
    "dcdf889d": ("Kleintierstall Kleintierkäfig Kleintierhaus mit Asphaltdach",
                 "kleintierstall-kleintierkafig-kleintierhaus-mit-asphaltdach",
                 1519, True, "FP-kleintierstall", "145fe501", "Orange",
                 (156, 58, 68),
                 [("löpbox under huset", 72, 50, 26.5), ("löpbox sida", 80, 50, 56)],
                 [("hus", 72, 50, 41.5)], "stall", ""),

    # ── modell H: 150 × 45 × 85 ────────────────────────────────────────────
    "8c6ef998": ("Kleintierstall, Kleintierkäfig, Outdoor-Kaninchenstall",
                 "kleintierstall-kleintierkafig-outdoor-kaninchenstall",
                 1519, True, "FP-kleintierstall", "196a39c1", "Orange+Grün",
                 (150, 45, 85),
                 [("löpbox under huset", 72, 39, 34), ("löpbox sida", 72, 39, 64)],
                 [("hus", 72, 39, 48.5)], "stall", ""),

    # ── modell I: 141 × 60 × 86 ────────────────────────────────────────────
    "2253c509": ("Kleintierstall mit Freigehege, herausnehmbare Bodenwanne",
                 "kleintierstall-mit-freigehege-herausnehmbare-bodenwanne-2",
                 1949, True, "FP-kleintierstall-mit", "a43ccf88", "Orange",
                 (141, 60, 86),
                 [("löpbox under huset", 69, 54.5, 40), ("löpbox sida", 69, 54.5, 62)],
                 [("hus", 69, 54.5, 44)], "stall", ""),

    # ── modell J: 122 × 63 × 92 ────────────────────────────────────────────
    "1d344d6d": ("Kleintierstall mit Freigehege u. Rampe 122 cm x 63 cm x 92 cm",
                 "kleintierstall-mit-freigehege-u-rampe-122-cm-x-63-cm-x-92-cm",
                 1769, True, "FP-kleintierstall-mit", "c27c5ae3", "Hellgelb+Dunkelgrau",
                 (122, 63, 92),
                 [("löpbox under huset", 52, 48, 32), ("löpbox sida", 62, 51, 61)],
                 [("hus", 52, 48, 52)], "stall",
                 "Leverantören avstår själv från ett djurantal: 'Der Käufer muss die "
                 "Anzahl der Tiere bestimmen'."),

    # ── modell K: 123 × 63 × 112 ───────────────────────────────────────────
    "4f5d5afe": ("Kleintierstall Kleintierhaus Nagerstall, wetterbeständig, 2",
                 "kleintierstall-kleintierhaus-nagerstall-wetterbestandig-2",
                 2569, True, "FP-kleintierstall", "211edaaa", "Orange",
                 (123, 63, 112),
                 [("löpgård", 120, 60, 51)],
                 [("hus vänster", 70, 60, 51.5), ("hus höger", 50, 60, 51.5)], "stall",
                 "☠️ Leverantörens egna m²-tal motsäger dess egna cm-tal: 'Fläche "
                 "0,27 m² (Haupthaus)' mot 70×60 = 0,42 m², och '0,44 m² "
                 "(Auslaufbox)' mot 120×60 = 0,72 m²."),

    # ── modell L: 136,4 × 50 × 93, två staplade burar (tre färger) ─────────
    "a1f87d83": ("Hasenstall Kaninchenstall aus Holz mit 2 Etagen Asphaltdach",
                 "hasenstall-kaninchenstall-aus-holz-mit-2-etagen-asphaltdach",
                 2449, True, "FP-hasenstall", "407da16a", "Grau",
                 (136.4, 50, 93),
                 [("nedre bur", 122, 42, 36)],
                 [("övre bur", 122, 42, 36)], "stall",
                 "Prisavvikare: 2 449 mot syskonens 1 879/1 899, identiska mått."),
    "8869a0f7": ("Hasenstall winterfest 2 Etagen Kaninchenstall Holz Bodenwanne",
                 "hasenstall-winterfest-2-etagen-kaninchenstall-holz-bodenwanne",
                 1879, True, "FP-hasenstall-winterfest-2", "d0d012e5", "Orange",
                 (136.4, 50, 93),
                 [("nedre bur", 122, 42, 36)],
                 [("övre bur", 122, 42, 36)], "stall", ""),
    "07b3ee0e": ("Kleintierstall für Meerschweinchen und Zwergkaninchen, doppelstöckig",
                 "kleintierstall-fur-meerschweinchen-und-zwergkaninchen-doppelstockig",
                 1899, True, "FP-kleintierstall-fur", "c8b8d3bc", "Grau+Weiß",
                 (136.4, 50, 93),
                 [("nedre bur", 122, 42, 36)],
                 [("övre bur", 122, 42, 36)], "stall",
                 "Namnet lovar marsvin OCH dvärgkanin."),

    # ── modell M: 108 × 58 × 73,5 på hjul (tre färger) ────────────────────
    "a2acfed0": ("Kleintierstall für Zwergkaninchen, Meerschweinchen, mit Rädern, 108 x",
                 "kleintierstall-fur-zwergkaninchen-meerschweinchen-mit-radern-108-x-3",
                 1849, True, "FP-kleintierstall-fur", "14847dd6", "Gelb",
                 (108, 58, 73.5),
                 [("löpgård", 65.5, 50.5, 44.5)],
                 [("hus", 38, 50.5, 61.5)], "stall",
                 "Leverantören: 'Geeignet für 2 Zwergkaninchen'."),
    "d40ec79e": ("Kleintierstall für Zwergkaninchen, Meerschweinchen, mit Rädern, 108 x",
                 "kleintierstall-fur-zwergkaninchen-meerschweinchen-mit-radern-108-x-2",
                 1659, True, "FP-kleintierstall-fur", "7a04a3dd", "Grau",
                 (108, 58, 73.5),
                 [("löpgård", 65.5, 50.5, 44.5)],
                 [("hus", 38, 50.5, 61.5)], "stall",
                 "Leverantören: 'Geeignet für 2 Zwergkaninchen'."),
    "8acfd813": ("Kleintierstall für Zwergkaninchen, Meerschweinchen, mit Rädern, 108 x",
                 "kleintierstall-fur-zwergkaninchen-meerschweinchen-mit-radern-108-x",
                 1779, True, "FP-kleintierstall-fur", "7ffbef06", "Kaffee",
                 (108, 58, 73.5),
                 [("löpgård", 65.5, 50.5, 44.5)],
                 [("hus", 38, 50.5, 61.5)], "stall",
                 "Leverantören: 'Geeignet für 2 Zwergkaninchen'."),

    # ── modell N: 125,5 × 100 × 49, låg markhage med hus (färgpar) ────────
    "b54e7a23": ("Hasenstall Kaninchenstall Holz Kaninchenkäfig mit aufklappbar",
                 "hasenstall-kaninchenstall-holz-kaninchenkafig-mit-aufklappbar",
                 1649, True, "FP-hasenstall", "cecfb9b3", "Grau+Grün",
                 (125.5, 100, 49),
                 [("löpgård", 92, 78, 44.5), ("hus", 88, 38.5, 37)], [], "stall",
                 "⚠️ Husets '88L' mäts TVÄRS produktens längd: 38,5 + 92 = 130,5 cm "
                 "mot yttermåttet 125,5, alltså ände mot ände med ~5 cm överlapp "
                 "under takutsprånget. Måttritningen (bild 3) märker just 39 och 92 "
                 "längs längden. Båda golven ligger på marken och räknas — men "
                 "husets 38,5 cm är 1,5 cm under marsvinets kortaste sida (40 cm), "
                 "så grinden godkänner bara löpgårdens 0,72 m². Leverantörens "
                 "'Bodenfläche 1,1178 m², 121,5 × 92 cm' är bottenbrickans "
                 "yttermått, inte fri golvyta."),
    "1f7ebf33": ("Kleintierstall mit Freigehege, herausnehmbare Bodenwanne",
                 "kleintierstall-mit-freigehege-herausnehmbare-bodenwanne",
                 1659, True, "FP-kleintierstall-mit", "cc70125c", "Orange+Grün",
                 (125.5, 100, 49),
                 [("löpgård", 92, 78, 44.5), ("hus", 88, 38.5, 37)], [], "stall",
                 "Samma modell som b54e7a23, annan färg. ☠️ Bär PawHut-loggan "
                 "FYSISKT på husfronten (bild 1 och 4); den grå syskonsidan gör det "
                 "inte. Loggan sitter på varan och rörs inte (Leonards regel)."),

    # ── modell O: 181 × 100 × 48, bottenlös markhage (färgpar) ────────────
    "a4c0595f": ("Hasenstall Kaninchenstall aus Holz Winterfest Kaninchenkäfig mit",
                 "hasenstall-kaninchenstall-aus-holz-winterfest-kaninchenkafig-mit",
                 1499, True, "FP-hasenstall", "676a8c71", "Natur",
                 (181, 100, 48),
                 [("hela hagen", 181, 100, 48)], [], "stall",
                 "⚠️ 48 cm är YTTERhöjden; fri höjd är lägre. Bottenlös markhage."),
    "7eebd0eb": ("Kleintierstall, Kleintiergehege, Freigehege, Kleintierkäfig mit Tür",
                 "kleintierstall-kleintiergehege-freigehege-kleintierkafig-mit-tur",
                 1339, True, "FP-kleintierstall", "ee59caf6", "Grau",
                 (181, 100, 48),
                 [("hela hagen", 181, 100, 48)], [], "stall",
                 "⚠️ 48 cm är YTTERhöjden. Samma modell som a4c0595f, annan färg."),

    # ── modell P: 309 × 79 × 86 ────────────────────────────────────────────
    "5ac1815c": ("Kleintierstall Kleintierkäfig, 2 Freigehegen, 2 Rampen, 309 cm x 79",
                 "kleintierstall-kleintierkafig-2-freigehegen-2-rampen-309-cm-x-79",
                 2739, True, "FP-kleintierstall", "c0729128", "Natur",
                 (309, 79, 86),
                 [("löpgård 1", 103, 73, 59), ("löpgård 2", 103, 73, 59)],
                 [("hus", 0, 0, 0)], "stall",
                 "☠️ Husets mått SAKNAS helt i spec-blocket — bara hagarna och "
                 "dörrarna anges. Måste mätas ur bilden eller lämnas obeskrivet."),

    # ── modell Q: 123 × 120 × 52, markhage med litet hus ──────────────────
    "edc81021": ("Kleintierstall mit Freigehege, aufklappbares Dach, wetterbeständig",
                 "kleintierstall-mit-freigehege-aufklappbares-dach-wetterbestandig",
                 1899, True, "FP-kleintierstall-mit", "a4e3fd8c", "Natur",
                 (123, 120, 52),
                 [("hage", 123, 120, 52)], [("hus (inne i hagens fotavtryck)", 42.5, 42.5, 47)], "stall",
                 "⚠️ 52 cm är YTTERhöjden. Måttritningen (bild 3) märker 123 och 120 "
                 "som de två markmåtten, alltså ligger huset INNE i det fotavtrycket "
                 "— dess yta får inte adderas, annars räknas samma golv två gånger."),

    # ── modell R: 110 × 105 × 50, hopfällbar markhage ──────────────────────
    "117691b5": ("Kleintierkäfig, Kaninchenstall, aufklappbares Dach, Tannenholz, 110 x",
                 "kleintierkafig-kaninchenstall-aufklappbares-dach-tannenholz-110-x",
                 1259, True, "FP-kleintierkafig", "f0c7d1a6", "Grau",
                 (110, 105, 50),
                 [("hage", 110, 105, 50)], [], "stall",
                 "⚠️ 50 cm är YTTERhöjden. Leverantörens 'Fläche 1,15 m²' mot "
                 "110 × 105 = 1,155 m² — alltså yttermåttet, inte fri golvyta."),

    # ── modell S: 112 × 50 × 54, ett plan (färgpar) ───────────────────────
    "20d5c17d": ("Hasenstall Winterfest Kaninchenstall aus Holz 112x50x54 cm",
                 "hasenstall-winterfest-kaninchenstall-aus-holz-112x50x54-cm-2",
                 1349, True, "FP-hasenstall-winterfest", "a38ea51a", "Natur+Schwarz",
                 (112, 50, 54),
                 [("hus", 107, 41, 45)], [], "stall",
                 "☠️ Svenska Färg säger 'Grün, Rot, Blau' medan tyska Farbe säger "
                 "'Natur+Schwarz'. Och paketmåttet 119,5 × 15 × 54,5 är orimligt "
                 "smalt (15 cm) för ett 50 cm djupt hus."),
    "5096db33": ("Hasenstall Winterfest Kaninchenstall aus Holz 112x50x54 cm",
                 "hasenstall-winterfest-kaninchenstall-aus-holz-112x50x54-cm",
                 1649, True, "FP-hasenstall-winterfest", "815a0470", "Grau+Schwarz",
                 (112, 50, 54),
                 [("hus", 107, 41, 45)], [], "stall",
                 "Samma modell som 20d5c17d, annan färg — men 300 kr dyrare."),

    # ── modell T: 90 × 45 × 65 upphöjt, ett plan (färgpar) ────────────────
    "0cd30b65": ("Hasenstall erhöhter Kaninchenstall aus Holz mit aufklappbar",
                 "hasenstall-erhohter-kaninchenstall-aus-holz-mit-aufklappbar-2",
                 919, True, "FP-hasenstall-erhohter", "b3b7535d", "Orange",
                 (90, 45, 65),
                 [("hus", 80, 38, 37)], [], "stall",
                 "Upphöjt 22 cm över marken. Material: KIEFERNholz (tall), inte "
                 "Tanne — svenska spec-raden säger ändå 'Kiefernholz, Asphalt'."),
    "6e637343": ("Hasenstall erhöhter Kaninchenstall aus Holz mit aufklappbar",
                 "hasenstall-erhohter-kaninchenstall-aus-holz-mit-aufklappbar",
                 899, True, "FP-hasenstall-erhohter", "f474dda7", "Grau+Weiß",
                 (90, 45, 65),
                 [("hus", 80, 38, 37)], [], "stall",
                 "☠️ Tyska: Kiefernholz. Svenska spec-raden: 'Tanne'. Samma modell "
                 "som 0cd30b65, där svenska raden säger Kiefernholz — de två "
                 "syskonen motsäger alltså varandra om materialet."),

    # ── modell U: 115 × 44,3 × 65, ett plan ───────────────────────────────
    "389da1d6": ("Hasenstall Kaninchenstall aus Holz mit aufklappbarem Dach, 2 Türen",
                 "hasenstall-kaninchenstall-aus-holz-mit-aufklappbarem-dach-2-turen",
                 1339, True, "FP-hasenstall", "4d8505a5", "Hellgelb+Grün",
                 (115, 44.3, 65),
                 [("hus", 115, 44.3, 44)], [], "stall", ""),

    # ── modell V: 105 × 57,5 × 51,5, två rum bredvid varandra ────────────
    "c78d5a19": ("Hasenstall Kaninchenstall aus Holz mit Freilaufgehege, Rampe, 3",
                 "hasenstall-kaninchenstall-aus-holz-mit-freilaufgehege-rampe-3",
                 1269, True, "FP-hasenstall", "fde15454", "Weiß+Grau+Braun",
                 (105, 57.5, 51.5),
                 [("huvudbur", 48.5, 53.5, 37), ("löpbur", 51.5, 53, 49.5)], [], "stall",
                 "Leverantörens egna ytor: 0,26 m² + 0,29 m². ☠️ Svenska spec-raden "
                 "säger Material: 'Metall' på ett hus av tannenholz."),

    # ── modell W: 91,5 × 53,3 × 73 på hjul (färgpar) ─────────────────────
    "efe14f20": ("Kleintierstall mit 2 Ebenen 4 Rollen versiegeltes Tannenholz Grau",
                 "kleintierstall-mit-2-ebenen-4-rollen-versiegeltes-tannenholz-grau",
                 1599, True, "FP-kleintierstall-mit-2", "fedd9f8a", "Grau",
                 (91.5, 53.3, 73),
                 [("undre plan", 48.5, 26.5, 0)],
                 [("hus", 27.5, 26, 24.5), ("övre plan", 48.5, 39.5, 0)], "stall",
                 "☠️ Höjden på de två planen anges INTE — bara plattformarnas L×B. "
                 "Huset är 27,5 × 26 × 24,5 cm, alltså mindre än en skokartong."),
    "0d75b83d": ("Kleintierstall mit 2 Ebenen 4 Rollen versiegeltes Tannenholz Natur",
                 "kleintierstall-mit-2-ebenen-4-rollen-versiegeltes-tannenholz-natur",
                 1499, True, "FP-kleintierstall-mit-2", "a6222474", "Natur",
                 (91.5, 53.3, 73),
                 [("undre plan", 48.5, 26.5, 0)],
                 [("hus", 27.5, 26, 24.5), ("övre plan", 48.5, 39.5, 0)], "stall",
                 "Samma modell som efe14f20, annan färg."),

    # ── modell X: 90 × 45 × 90 / 90 × 45 × 80 ────────────────────────────
    "5d79afbe": ("Kleintierstall 2 Ebenen wetterbeständig Tannenholz Grün + Natur",
                 "kleintierstall-2-ebenen-wetterbestandig-tannenholz-grun-natur",
                 1219, True, "FP-kleintierstall-2-ebenen", "f6da70b3", "Gelb+Grün",
                 (90, 45, 90),
                 [("bottenplan", 80, 40, 0)], [], "stall",
                 "☠️ INGA delytehöjder alls i spec-blocket — bara dörrar och bricka. "
                 "Bottenplanets höjd går inte att härleda."),
    "a8a4c7f1": ("Kleintierstall 2 Ebenen wetterbeständig Tannenholz Natur + Grün",
                 "kleintierstall-2-ebenen-wetterbestandig-tannenholz-natur-grun",
                 1199, True, "FP-kleintierstall-2-ebenen", "38d68c01", "Gelb+Grün",
                 (90, 45, 80),
                 [("bottenbox", 80, 40, 40)], [("hus", 0, 0, 0)], "stall",
                 "Bottenboxen anges 80 × 40 × 40. Husets mått saknas."),

    # ── modell Y: 51 × 42 × 43, minsta i familjen ────────────────────────
    "626be705": ("Kleintierstall Kleintierhaus mit Rampe Holz Grün + Natur",
                 "kleintierstall-kleintierhaus-mit-rampe-holz-grun-natur",
                 799, True, "FP-kleintierstall", "e779ebb1", "Natur+Grün",
                 (51, 42, 43),
                 [("hus", 46, 39, 30)], [], "stall",
                 "Upphöjt 8 cm. Framkant 43 cm, bakkant 38 cm — pulpettak."),

    # ── INOMHUSBURAR — annan familj, mätta men inte rundans ──────────────
    "f8ca8cb6": ("Kleintierkäfig 4-stöckiger Nagerkäfig mit anhebbarem Tablett Rampen",
                 "kleintierkafig-4-stockiger-nagerkafig-mit-anhebbarem-tablett-rampen",
                 1359, True, "FP-kleintierkafig-4", "56d335d5", "Grau",
                 (52, 52, 115), [("botten", 49, 49, 15)], [], "burM", ""),
    "d93d729a": ("Kleintierkäfig mit 4 Räder Käfig 3 Öffnungen 2 Plattformen Metall",
                 "kleintierkafig-mit-4-rader-kafig-3-offnungen-2-plattformen-metall",
                 1629, False, "FP-kleintierkafig-mit-4", "c495f7a1", "Schwarz+Weiß+Grau",
                 (81.2, 52.7, 110), [("botten", 81.2, 52.7, 0)], [], "burM",
                 "SLUT I LAGER. Leverantören: 'nicht für Hamster oder Ratten geeignet'."),
    "a93e2e5a": ("Kleintierkäfig mit Hängematte, Nagetierkäfig mit Rollen, 4-stöckiger",
                 "kleintierkafig-mit-hangematte-nagetierkafig-mit-rollen-4-stockiger",
                 1639, True, "FP-kleintierkafig-mit", "b55a5295", "Grau",
                 (80, 52, 128), [("botten", 80, 52, 0)], [], "burM", ""),
    "7ca4d50b": ("Kleintierkäfig, Balkon, Rampe, Futtertrog, Wasserflasche",
                 "kleintierkafig-balkon-rampe-futtertrog-wasserflasche",
                 1359, True, "FP-kleintierkafig-balkon", "62d2fec4", "Weiß+Beige+Blau",
                 (173, 88, 63),
                 [("bur", 88, 88, 49), ("löpgård", 86, 88, 43)], [], "burM", ""),
    "79afd14f": ("Kleintierkäfig, Haustierkäfig mit 4 Ebenen, Futterschale",
                 "kleintierkafig-haustierkafig-mit-4-ebenen-futterschale",
                 1499, True, "FP-kleintierkafig", "efe80e6c", "Beige",
                 (69, 44, 120), [("botten", 69, 44, 0)], [], "burM", ""),
    "c1c1d34c": ("Kleintierkäfig Nagekäfig, Tannenholz, inkl. Zubehör und Tränke, 100 x",
                 "kleintierkafig-nagekafig-tannenholz-inkl-zubehor-und-tranke-100-x",
                 1469, True, "FP-kleintierkafig-nagekafig", "81f1749e", "Natur",
                 (100, 50, 50),
                 [("vänster rum", 30.5, 46, 45), ("höger rum", 63, 46, 45)], [], "burT", ""),
    "13fe619f": ("Kleintierkäfig Nagerkäfig, mit Zubehör, Tannenholz,100 cm x 52 cm x",
                 "kleintierkafig-nagerkafig-mit-zubehor-tannenholz-100-cm-x-52-cm-x",
                 1499, True, "FP-kleintierkafig", "7e4a18fa", "Dunkelgrau",
                 (100, 52, 50), [("botten", 100, 52, 0)], [], "burT", ""),
    "8847f712": ("Kleintierkäfig, Nagerkäfig, Nagerheim mit 1 Rampe, 1 Wippe",
                 "kleintierkafig-nagerkafig-nagerheim-mit-1-rampe-1-wippe",
                 1529, True, "FP-kleintierkafig", "85961b7a", "Naturholz",
                 (115, 60, 55), [("botten", 75.5, 58, 0)], [], "burT", ""),
}

# ☠️ DE STALL VARS ENDA HÖJDMÅTT ÄR PRODUKTENS YTTERHÖJD.
#    En grind som läser det här ur en kommentarstext driftar första gången någon
#    skriver om kommentaren — det hände i den här rundan: `1f7ebf33` fick en ny
#    `anm` om PawHut-loggan och tappade samtidigt sin yttermåttsflagga, medan
#    färgsyskonet `b54e7a23` behöll sin. Två identiska produkter fick två domar.
#    Listan är därför DATA, och `l80-grind.py` asserterar att den stämmer med den
#    mekaniska kontrollen "någon delyta har exakt produktens ytterhöjd".
BARA_YTTERHOJD = {"a4c0595f", "7eebd0eb", "edc81021", "117691b5"}

# ── PUBLICERADE KONKURRENTER i samma domän (svepet 2026-09-08) ───────────────
# 2 404 publicerade sidor lästa, 2 404 unika, `avhuggen: false`.
# Kontrollmätning: en känd publicerad sida hittades (hamsterbur/kaninhydda).
PUBLICERADE = {
    "4cc04232": "Kaninhydda i trä med två plan, 0,81 m² bottenyta",
    "711cad58": "Kaninbur 92 cm med rastgård och asfalttak",
    "290af543": "Kaninhus utomhus 122 × 93,5 cm – rastgård 1,02 m² och fällbart tak",
    "14a20f23": "Kaninbur 90 cm på hjul med ramp, grå",
    "80fbb644": "Kaninbur 90 cm på hjul med ramp, gul",
    "faa61f7f": "Kaninhus 144 cm i två plan med bitumentak",
    "1ba178fa": "Marsvinshydda 90 cm med två plan – ramp, asfalttak och bricka",
    "11e948fa": "Marsvinshydda utomhus 157 cm – två plan, ramp, hjul och asfalttak",
    "27dc50ae": "Kaninbur inomhus i trä med hjul – 2 våningar, 110x50x86 cm, grå",
    "f3fdcd4a": "Marsvinsbur inomhus i trä 90 × 53 × 59 cm – ramp, hydda och hjul",
    "69452dd2": "Kaninbur för utomhus i trä – 2 våningar med rastgård, ramp och tak",
    "c1e3be18": "Rasthage för smådjur 220 × 103 cm med tak och markspett",
    "3d4d40c1": "Smådjurshage 120 × 60 cm – 24 paneler, 0,72 m²",
    "738f4b56": "Kaninhage inomhus 175 × 105 cm med övervåning – 47 paneler",
    "b4b0e122": "Modulär smådjursbur – 27 paneler, transparent hage för kanin och marsvin",
    "fee40f78": "Smådjursbur 150 cm med fem plan – hängmatta, ramper och hjul",
}
