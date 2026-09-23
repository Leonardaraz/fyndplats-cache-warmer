# -*- coding: utf-8 -*-
"""Batch 6 i leverantörssvepet — byggd ur den RÅA plainDescription.

☠️ Batch 5 lärde: den avtaggade meningen ljuger om vad som går att byta.
   Paren nedan är hämtade ur rå HTML, så inline-<span> syns och kan
   antingen tas med i paret eller undvikas genom att kapa fragmentet.
"""

SPAN = '<span style="font-weight: 700">'

PAR = [
    # ── Växthus ───────────────────────────────────────────────────────────
    ("5f7566a1",
     "Tillverkaren anger taklasten till 40 kg/m² och vindtåligheten till "
     "12 m/s, och rekommenderar en placering i lä av en vägg eller ett plank.",
     "Taklasten är 40 kg/m² och vindtåligheten 12 m/s, och växthuset ska helst "
     "placeras i lä av en vägg eller ett plank."),
    ("5f7566a1",
     "Tillverkaren anger 40 kg/m² taklast och 12 m/s vindtålighet.",
     "Taklasten är 40 kg/m² och vindtåligheten 12 m/s."),

    # ── Redskapsbodar, fem färgsyskon ─────────────────────────────────────
    ("bodar",
     "Priset skiljer sig eftersom leverantören prissätter kulörerna olika.",
     "Priset skiljer sig mellan kulörerna."),

    # ── Säsong och eld ────────────────────────────────────────────────────
    ("4c02e4dc",
     "Tillverkaren anger högst åtta timmar i sträck för motorns skull.",
     "Kör den högst åtta timmar i sträck för motorns skull."),
    ("eldkorgar",
     "Nej. Leverantören anger uttryckligen att den inte får användas på "
     "trägolv, gräs eller löv.",
     "Nej. Den får uttryckligen inte användas på trägolv, gräs eller löv."),
    ("eeaaa482",
     "Leverantören anger 500 °C som gräns för den värmetåliga lackeringen.",
     "Gränsen för den värmetåliga lackeringen är 500 °C."),
    ("f6a7bc98",
     "Leverantören anger att den lackerade stålkonstruktionen tål temperaturer "
     "upp till 500 °C.",
     "Den lackerade stålkonstruktionen tål temperaturer upp till 500 °C."),

    # ── Soffor och sängar ─────────────────────────────────────────────────
    ("baddsoffor",
     'Tillverkaren märker soffan "Made in EU".',
     'Soffan är märkt "Made in EU".'),
    ("4f922e8d",
     "Tillverkaren visar en robotdammsugare som går fritt under sängen; en "
     "förvaringslåda under säng gör det inte.",
     "En robotdammsugare går fritt under sängen; en förvaringslåda under säng "
     "gör det inte."),
    ("4f922e8d",
     "Tillverkaren visar en robotdammsugare som går under; en förvaringslåda "
     "under säng gör det inte.",
     "En robotdammsugare går under; en förvaringslåda under säng gör det "
     "inte."),
    ("4f922e8d",
     "Tillverkaren anger ingen avtagbar klädsel.",
     "Klädseln är inte avtagbar."),
    ("834b263f",
     "i stället för att anpassa dig efter tillverkarens uppdelning i smått och "
     "stort.",
     "i stället för att anpassa dig efter en färdig uppdelning i smått och "
     "stort."),
    ("79ac9a1e",
     "medföljer enligt tillverkarens ritning.",
     "medföljer enligt måttritningen."),
    ("023c1a01",
     "Tillverkarens ritning visar sju olika uppställningar av samma delar.",
     "Måttritningen visar sju olika uppställningar av samma delar."),
    ("77a5c07e",
     "Tillverkaren anger inget bäddmått för det läget, så räkna med en "
     "tillfällig liggyta snarare än en gästsäng",
     "Det finns inget angivet bäddmått för det läget, så räkna med en "
     "tillfällig liggyta snarare än en gästsäng"),

    # ── Bord och hyllor ───────────────────────────────────────────────────
    ("8211fa8f",
     "det står i tillverkarens manual.",
     "det står i manualen."),
    ("4009d67f",
     "Tillverkaren anger 20 kilo totalt: 10 kilo i facken och 5 kilo på "
     "vardera skivan.",
     "Maxlasten är 20 kilo totalt: 10 kilo i facken och 5 kilo på vardera "
     "skivan."),
    ("f757393c",
     "Tillverkaren anger massiv bambu som material, i både skiva och fot.",
     "Materialet är massiv bambu, i både skiva och fot."),
    ("f757393c",
     "Ja, tillverkaren anger massiv bambu.",
     "Ja, det är massiv bambu."),
    ("c0910da2",
     "Hängkopparna som syns på bilderna står inte i leverantörens "
     "innehållsförteckning",
     "Hängkopparna som syns på bilderna står inte i innehållsförteckningen"),

    # ── Två par som MÅSTE bära taggen för att kunna matcha ────────────────
    ("90a96877",
     "Tillverkaren anger " + SPAN + "25 kilo</span> som total maxlast.",
     "Total maxlast är " + SPAN + "25 kilo</span>."),
    ("7e487213",
     "Tillverkaren anger 50 kilo när bordet är helt utfällt och <span",
     "Maxlasten är 50 kilo när bordet är helt utfällt och <span"),
]
