# -*- coding: utf-8 -*-
"""Batch 10 i leverantörssvepet — sista svansen.

Två par från batch 9 bommade igen på en tagg inne i meningen. De tas här om
som korta fragment, samma medicin som batch 5 och 6.
"""

PAR = [
    # ── Omtag: taggen låg mitt i meningen ─────────────────────────────────
    ("kläder", " hos leverantören", ""),
    ("kläder", "leverantörens färgkod, och färgen är en vanlig mellangrå.",
     "en färgkod, och färgen är en vanlig mellangrå."),

    # ── Massage, verktyg, belysning ───────────────────────────────────────
    ("massage", "tillverkaren delar in i fyra intervall",
     "de delas in i fyra intervall"),
    ("okänd", "Tillverkaren anger upp till 120 minuter på batteriet med "
     "2000 mAh.",
     "Batteriet på 2000 mAh räcker upp till 120 minuter."),
    ("okänd",
     "Tillverkaren anger 10 kN draghållfasthet och 20 kN skjuvhållfasthet på "
     "härdat stål.",
     "Draghållfastheten är 10 kN och skjuvhållfastheten 20 kN på härdat "
     "stål."),
    ("okänd",
     "Tillverkaren beskriver samma lock som stöd när du vill luta arbetsytan "
     "mot dig.",
     "Samma lock fungerar som stöd när du vill luta arbetsytan mot dig."),
    ("okänd",
     "Ett midjebälte med spänne, tydligt synligt på tillverkarens bilder, "
     "även om deras skrivna specifikation inte nämner det.",
     "Ett midjebälte med spänne, tydligt synligt på produktbilderna, även om "
     "den skrivna specifikationen inte nämner det."),
    ("okänd",
     "Tillverkaren gör även en mörkbrun, men den ingår inte i vårt sortiment.",
     "Det finns även en mörkbrun, men den ingår inte i vårt sortiment."),
    ("lampa",
     "Tillverkarens bilder visar dessutom en fotströmbrytare på sladden, så "
     "du slipper böja dig ner.",
     "Produktbilderna visar dessutom en fotströmbrytare på sladden, så du "
     "slipper böja dig ner."),
    ("lampa", "tillverkarens bilder visar dessutom en fotströmbrytare på "
     "sladden",
     "produktbilderna visar dessutom en fotströmbrytare på sladden"),
    ("klösträd",
     "Tillverkaren anger det som ett krav, och ett 2,5 meter högt torn på en "
     "60 × 45 cm platta behöver det.",
     "Det är ett krav, och ett 2,5 meter högt torn på en 60 × 45 cm platta "
     "behöver det."),

    # ── Spec-celler ───────────────────────────────────────────────────────
    ("leksak", "tillverkaren anger från 3 år", "från 3 år"),
    ("liggunderlag", "tillverkaren anger 3,5–5", "3,5–5"),
    ("liggunderlag", "Tillverkaren anger 3,5–5.", "Värdet är 3,5–5."),
    ("okänd", "(tillverkaren)", "(angiven uppgift)"),

    # ── Fordon, elektronik ────────────────────────────────────────────────
    ("cykel",
     "Kontrollera båda innan du beställer, helst med tillverkaren av cykeln.",
     "Kontrollera båda innan du beställer, helst mot cykelns egen "
     "specifikation."),
    ("okänd", "Tillverkarens datablad anger 20 W.", "Databladet anger 20 W."),
    ("obd", "Tillverkaren anger att BMW och Tesla inte stöds.",
     "BMW och Tesla stöds inte."),
    ("obd", "Verkstadsdata anges i båda enheterna beroende på tillverkare.",
     "Verkstadsdata anges i båda enheterna beroende på bilmärke."),
    ("okänd",
     "Tillverkaren avråder från användning i extremt väder som snöstorm eller "
     "kraftigt regn.",
     "Den ska inte användas i extremt väder som snöstorm eller kraftigt "
     "regn."),

    # ── Barn ──────────────────────────────────────────────────────────────
    ("barn",
     "Tillverkaren anger 18–36 månader, alltså ungefär 1–3 år, med en "
     "maxbelastning på 25 kg.",
     "Rekommenderad ålder är 18–36 månader, alltså ungefär 1–3 år, med en "
     "maxbelastning på 25 kg."),
    ("barn", "Tillverkaren anger 3–5 år (37–60 månader) och en maxlast på "
     "30 kg.",
     "Rekommenderad ålder är 3–5 år (37–60 månader), med en maxlast på "
     "30 kg."),
    ("barn", "Tillverkaren anger 37–72 månader, alltså ungefär 3 till 6 år.",
     "Rekommenderad ålder är 37–72 månader, alltså ungefär 3 till 6 år."),
    ("barn", "Tillverkaren rekommenderar från 7 år.",
     "Rekommenderad ålder är från 7 år."),
    ("barn",
     "Tillverkaren rekommenderar den från 14 år (14+), bland annat på grund "
     "av den snabba motorn och smådelar.",
     "Rekommenderad ålder är från 14 år (14+), bland annat på grund av den "
     "snabba motorn och smådelar."),
    ("vägg",
     "Montera den inte i hålvägg – tillverkaren avråder uttryckligen från "
     "det.",
     "Montera den inte i hålvägg – det avråds uttryckligen."),
    ("vägg", "Tillverkaren avråder från hålvägg.", "Hålvägg ska undvikas."),

    # ── Djur ──────────────────────────────────────────────────────────────
    ("höns",
     "Tillverkaren rekommenderar att den kombineras med ett hönshus i trä som "
     "ställs inuti eller intill gården, så att hönsen har någonstans att sova "
     "och värpa.",
     "Kombinera den med ett hönshus i trä som ställs inuti eller intill "
     "gården, så att hönsen har någonstans att sova och värpa."),
    ("okänd", "Tillverkaren anger inte hopfällda mått.",
     "Hopfällda mått är inte angivna."),
    ("klösträd", "Tillverkaren anger att trädet passar katter under 4,5 kg.",
     "Trädet passar katter under 4,5 kg."),
    ("klösträd",
     "Tillverkaren räknar bottenplattan som en nivå och marknadsför den "
     "därför som femnivå.",
     "Bottenplattan räknas som en nivå, och trädet marknadsförs därför som "
     "femnivå."),
    ("klösträd",
     "Max belastning är 15 kg och tillverkaren rekommenderar katter upp till "
     "5 kg.",
     "Max belastning är 15 kg, och trädet passar katter upp till 5 kg."),
    ("klösträd",
     "Tillverkarens materialdeklaration anger jute, och närbilderna visar en "
     "luddig, brunaktig lina som stämmer med det.",
     "Materialdeklarationen anger jute, och närbilderna visar en luddig, "
     "brunaktig lina som stämmer med det."),
    ("klösträd",
     "Det är byggt för kattungar och mindre katter – tillverkaren "
     "rekommenderar katter under 3,6 kg.",
     "Det är byggt för kattungar och mindre katter – rekommendationen är "
     "katter under 3,6 kg."),
    ("hundbädd",
     "Liggytan är 122 × 92 cm, alltså XL-format som rymmer även storvuxna "
     "raser, och tillverkaren anger 50 kg som högsta belastning.",
     "Liggytan är 122 × 92 cm, alltså XL-format som rymmer även storvuxna "
     "raser, och högsta belastning är 50 kg."),

    # ── Övrigt ────────────────────────────────────────────────────────────
    ("okänd", "Tillverkaren anger att monteringsbeslagen följer med.",
     "Monteringsbeslagen följer med."),
    ("hylla", "Tillverkaren anger 130 kg totalt och 40 kg per hyllplan.",
     "Maxlasten är 130 kg totalt och 40 kg per hyllplan."),
    ("affischställ",
     "Tillverkaren marknadsför stället som A3 – mät gärna din affisch först, "
     "eftersom en standard-A3 (29,7 × 42 cm) är något längre än affischytan.",
     "Stället marknadsförs som A3 – mät gärna din affisch först, eftersom en "
     "standard-A3 (29,7 × 42 cm) är något längre än affischytan."),
    ("pedaler",
     "Ja, pedalerna har en universalgänga på 14 mm som passar de flesta "
     "mountainbikes och racercyklar enligt tillverkarens uppgifter.",
     "Ja, pedalerna har en universalgänga på 14 mm som passar de flesta "
     "mountainbikes och racercyklar."),
    ("okänd", "Tillverkaren uppger att den känner igen över 10 000 arter.",
     "Den känner igen över 10 000 arter."),
    ("bordsskydd",
     "Enligt tillverkaren innehåller materialet inga skadliga kemikalier.",
     "Materialet innehåller inga skadliga kemikalier."),
]
