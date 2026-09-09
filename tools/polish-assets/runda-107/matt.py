# -*- coding: utf-8 -*-
"""Runda 107 — tvåplansstall med löpgård. RÅA MÅTT, inget härlett.

Svepet 2026-09-09: 5 580 produkter lästa, 56 sidor, `avhuggen: false`.
2 410 publicerade, unika = lästa. Måttsvepet mot alla publicerade sidor:
1 902 bär en läsbar måtttrippel, kontrollmätningen hittar båda de kända
sidorna (`27dc50ae` 110×50×86 och `f3fdcd4a` 90×53×59), och **noll krockar**
mot rundans sju yttermått.

Alla sju stod `visible:false`, `revision:1` vid svepet — orörda av den andra
sessionen.

☠️ LEVERANTÖREN BLANDAR INNER- OCH YTTERMÅTT MELLAN SYSKONSIDOR.
   `a75fcfde` och `c0770388` är SAMMA bur i två färger. Bevis ur deras egna
   spec-block: dörrarna är identiska till millimetern (30×26, 30×25, 29×47,5)
   och rampen likaså (61×14,8). Skillnaden ligger i vad som mäts:

       a75fcfde:  "Maße der Auslaufbox (unter dem Haupthaus): 74L x 45,5B x 35H"
       c0770388:  "Größe der Auslaufbox: 70L x 41B x 32H (unter dem Haupthaus)"
                  + "Innenabmessungen des Hauses: 70L x 41B x 48H"

   c0770388 anger dessutom huset BÅDE utvändigt (74×45×49) och invändigt
   (70×41×48) — alltså är 70×41 innermåttet på exakt samma låda som a75fcfde
   beskriver som 74×45,5 utvändigt.

   **Grinden räknar på INNERMÅTTET**, för det är den yta djuret faktiskt har.
   Räknat på yttermåttet blev de två syskonen 0,99 mot 0,86 m² och fem mot
   fyra marsvin — två svar på samma bur. Det är samma klass av fel som
   runda 106:s ytterhöjd: ett mått som är för generöst släpper igenom en bur
   som inte klarar kravet.

⚠️ `delar` RÄKNAR BARA BOTTENPLANET (runbookens regel: hyllplan och våningar
   räknas inte in i golvytan). Huset ovanpå står i `ovan`.
"""

# ── SJVFS 2019:15 bilaga 1:3 tabell 1 — KANINER ──────────────────────────────
# (maxvikt kg, minsta yta m², per djur vid grupp, avelshona, per avelshona,
#  kortaste sida m, minsta höjd m)
L80_KANIN = [
    (2.0,  0.5, 0.30, 0.7, 0.7, 0.5, 0.5),
    (3.5,  0.7, 0.35, 0.8, 0.8, 0.6, 0.6),
    (4.5,  0.8, 0.40, 0.9, 0.9, 0.7, 0.8),
    (6.0,  0.9, 0.45, 1.0, 1.0, 0.7, 0.8),
    (99.0, 1.0, 0.50, 1.2, 1.2, 0.8, 0.9),
]
KANIN_NORMAL = L80_KANIN[1]

# ── SJVFS 2019:15 bilaga 1:4 tabell 1 — GNAGARE ──────────────────────────────
# art -> (minsta yta m², per djur vid grupp m², avelshona m², kortaste sida m,
#         minsta höjd m)
L80_GNAGARE = {
    "Marsvin":      (0.30, 0.15,  0.25,   0.40, 0.25),
    "Guldhamster":  (0.12, 0.06,  0.15,   0.25, 0.20),
    "Dvärghamster": (0.09, 0.045, 0.045,  0.20, 0.20),
    "Chinchilla":   (0.50, 0.25,  0.50,   0.50, 1.00),
    "Degu":         (0.30, 0.15,  0.20,   0.40, 0.40),
    "Brun råtta":   (0.18, 0.06,  0.08,   0.30, 0.30),
    "Gerbil":       (0.12, 0.06,  0.15,   0.25, 0.20),
    "Husmus":       (0.09, 0.018, 0.0275, 0.20, 0.20),
}

# id -> (tysk titel, slug, pris, i lager, yttermått (L,B,H),
#        delar på BOTTENPLANET [(namn, L, B, fri höjd)], ovan [...],
#        färg, wixProductId, anm)
UTKAST = {
    # ── modell P: 230 × 53 × 93,5, hus i mitten + tre markboxar (färgpar) ────
    "a75fcfde": ("Kleintierstall mit Freigehege inkl. Rampe Asphaltdach Tannenholz",
                 "kleintierstall-mit-freigehege-inkl-rampe-asphaltdach-tannenholz",
                 3179, True, (230, 53, 93.5),
                 [("löpbox under huset", 70, 41, 32),
                  ("löpbox sida 1", 70, 41, 60),
                  ("löpbox sida 2", 70, 41, 60)],
                 [("hus", 70, 41, 48)],
                 "Schwarz+Weiß+Gelb", "a75fcfde-93e2-4a74-bc08-12d0e7d242bd",
                 "☠️ Egna spec-blocket anger YTTERmått (74×45,5). Innermåtten här "
                 "är hämtade ur färgsyskonet c0770388, som anger båda för samma "
                 "låda. Dörrar och ramp är identiska till millimetern."),
    "c0770388": ("Hasenstall 2 Etagen Kaninchenstall Holz 230 x 53 x 93,5 cm Winterfest",
                 "hasenstall-2-etagen-kaninchenstall-holz-230-x-53-x-93-5-cm-winterfest",
                 3119, True, (230, 53, 93.5),
                 [("löpbox under huset", 70, 41, 32),
                  ("löpbox sida 1", 70, 41, 60),
                  ("löpbox sida 2", 70, 41, 60)],
                 [("hus", 70, 41, 48)],
                 "Hellgrau+Dunkelgrau+Schwarz", "c0770388-55ba-492b-a030-4d2e7b7c5e8b",
                 "☠️ Leverantören: 'Die großzügige Fläche von 1,2 m² bietet 2–4 "
                 "kleinen Kaninchen bequem Platz'. Bottenytan är 0,86 m², och L80 "
                 "ger NOLL kaniner — sidoboxarnas 41 cm är under dvärgkaninens "
                 "50 cm kortaste sida."),

    # ── modell Q: 141 × 60 × 86, hus + två markboxar ─────────────────────────
    "2253c509": ("Kleintierstall mit Freigehege, herausnehmbare Bodenwanne",
                 "kleintierstall-mit-freigehege-herausnehmbare-bodenwanne-2",
                 1949, True, (141, 60, 86),
                 [("löpbox under huset", 69, 54.5, 40),
                  ("löpbox sida", 69, 54.5, 62)],
                 [("hus", 69, 54.5, 44)],
                 "Orange", "2253c509-6d6f-4abe-936a-51f193d4bac8",
                 "⚠️ Sluggen bär '-2': leverantören ger samma tyska titel som "
                 "runda 106:s 1f7ebf33, men det är en annan modell (141×60×86 "
                 "mot 125,5×100×49)."),

    # ── modell R: 156 × 58 × 68, hus + två markboxar (färgpar) ───────────────
    "2435c4d1": ("Kaninchenstall aus Tannenholz, Kleintierhaus mit Asphaltdach",
                 "kaninchenstall-aus-tannenholz-kleintierhaus-mit-asphaltdach",
                 1649, True, (156, 58, 68),
                 [("löpbox under huset", 72, 50, 26.5),
                  ("löpbox sida", 80, 50, 56)],
                 [("hus", 72, 50, 41.5)],
                 "Hellgrau", "2435c4d1-77bd-4357-be37-e4a350939cdf",
                 "Identisk tysk brödtext med dcdf889d så när som på färgen — "
                 "bevisat färgsyskon. Har fodertråg 25 × 6,5 × 8 cm."),
    "dcdf889d": ("Kleintierstall Kleintierkäfig Kleintierhaus mit Asphaltdach",
                 "kleintierstall-kleintierkafig-kleintierhaus-mit-asphaltdach",
                 1519, True, (156, 58, 68),
                 [("löpbox under huset", 72, 50, 26.5),
                  ("löpbox sida", 80, 50, 56)],
                 [("hus", 72, 50, 41.5)],
                 "Orange", "dcdf889d-292d-4ee6-8093-3acae635612b",
                 "Färgsyskon till 2435c4d1, 130 kr billigare."),

    # ── modell S: 123,5 × 62,6 × 92,5, hus ovanpå + två markboxar (färgpar) ──
    "525e6acf": ("Hasenstall 2 Etagen Kaninchenstall mit wasserdicht Bitumendach",
                 "hasenstall-2-etagen-kaninchenstall-mit-wasserdicht-bitumendach",
                 1669, True, (123.5, 62.6, 92.5),
                 [("löpbox under huset", 54, 53, 32),
                  ("löpbox sida", 53, 61, 58)],
                 [("hus", 54.5, 53, 63)],
                 "Orange+Schwarz", "525e6acf-1516-4a79-9216-dc687e297595",
                 "✅ BOTTENFRÅGAN AVGJORD PÅ BILDERNA: syskonen motsäger inte varandra, "
                 "de beskriver var sin halva. Löpgården är BOTTENLÖS (står på gräset), "
                 "huset har en UTDRAGBAR BOTTENBRICKA. Bild 1 på båda visar den öppna "
                 "ramen under löpgården och brickans handtag under huset. Att skriva "
                 "bara det ena hade varit fel om den andra halvan."),
    "079f2901": ("Hasenstall 2 Etagen Kaninchenstall aus Holz 123,5x62,6x92,5 cm",
                 "hasenstall-2-etagen-kaninchenstall-aus-holz-123-5x62-6x92-5-cm",
                 1649, True, (123.5, 62.6, 92.5),
                 [("löpbox under huset", 54, 53, 32),
                  ("löpbox sida", 53, 61, 58)],
                 [("hus", 54.5, 53, 63)],
                 "Grau+Weiß", "079f2901-47fd-497a-b923-c26c68a9efad",
                 "Färgsyskon till 525e6acf — samma konstruktion, bevisat på bild 1. "
                 "⚠️ MÅTTRITNINGEN (bild 3) SÄGER EMOT SIN EGEN SPEC-TEXT: ritningen "
                 "har 122 × 53 × 92 och 48,5 cm, spec-texten 123,5 × 62,6 × 92,5 och "
                 "54 cm. Syskonets ritning stämmer mot spec-texten på varje tal. "
                 "TEXTEN gäller; ritningens tal skrivs inte ut."),
}

# ☠️ Ingen produkt i den här rundan har BARA ytterhöjd angiven — alla delytors
#    fria höjd står i leverantörens spec. Runda 106:s BARA_YTTERHOJD-lista är
#    därför tom här, och det är ett MÄTT påstående, inte ett antagande:
#    varje `delar`-rad ovan har sin höjd ur en egen "H"-uppgift.
BARA_YTTERHOJD = set()


# ── Steg 4: bilder som INTE ska följa med till kunden ────────────────────────
# ☠️ Alla tre är granskade i kontaktarket, inte antagna.
BORTTAGNA_BILDER = {
    # Samma foto på TVÅ olika produkter, och det visar en fristående gånghage
    # med bågtak som inte ingår i någondera. Hagen i bilden är dessutom den
    # ORANGEA modellen, så den kan på sin höjd visa en av de två.
    "2253c509": [4],
    "dcdf889d": [4],
    # Tysk text inbränd i pixlarna: "GEEIGNET FÜR VERSCHIEDENE KLEINTIERE" med
    # ikonerna Kaninchen / Hühner / Enten. Både språket och löftet är fel —
    # L80-grinden ger noll kaniner, och höns och ankor är en annan storleksklass.
    "525e6acf": [4],
}
