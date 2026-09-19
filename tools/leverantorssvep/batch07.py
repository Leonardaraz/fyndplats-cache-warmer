# -*- coding: utf-8 -*-
"""Batch 7 i leverantörssvepet — barnmöbler, sandlådor, uppresningsfåtöljer.

Svansen är lång: 213 olika formuleringar på 228 förekomster. Paren nedan
täcker de 62 vanligaste, sorterade efter hur många sidor de biter på.
"""

SPAN = '<span style="font-weight: 700">'

PAR = [
    # ── Ålder och rekommendationer (flest sidor per par) ──────────────────
    ("×5", "Tillverkaren rekommenderar 3–7 år.",
     "Rekommenderad ålder är 3–7 år."),
    ("×3", "Tillverkaren anger 3–8 år.", "Rekommenderad ålder är 3–8 år."),
    ("×2", "Ja, tillverkaren anger rundade hörn.", "Ja, hörnen är rundade."),
    ("×2", "Tillverkaren anger cirka 50 minuter.",
     "Räkna med cirka 50 minuter."),
    ("×2", "Tillverkaren anger från 3 år.", "Lägsta ålder är 3 år."),
    ("×2", "Tillverkaren anger ingen tvättinstruktion.",
     "Det finns ingen tvättinstruktion."),
    ("×2",
     "Leverantören visar montering på verktygstavla, tegel, betong och "
     "träpanel.",
     "Bilderna visar montering på verktygstavla, tegel, betong och träpanel."),
    ("×2",
     "Namnet kommer från leverantörens färgkod och säger inte vad färgen är.",
     "Namnet kommer från en färgkod och säger inte vad färgen är."),
    ("×2", "Namnet kommer från leverantörens färgkod.",
     "Namnet kommer från en färgkod."),
    ("×2",
     "De finns i XS till XL, och leverantören anger att de motsvarar normal "
     "storlek.",
     "De finns i XS till XL och motsvarar normal storlek."),

    # ── Vitvaror ──────────────────────────────────────────────────────────
    ("c93e903e",
     "Tillverkaren anger förbrukningen till 4,5 liter vatten och 0,5 kWh per "
     "timme, siffror som sällan står utskrivna på maskiner i den här "
     "storleken.",
     "Förbrukningen är 4,5 liter vatten och 0,5 kWh per timme, siffror som "
     "sällan står utskrivna på maskiner i den här storleken."),
    ("b1a4244c",
     "Ljudnivån är som mest 48 dB(A) enligt tillverkarens mätning, så den kan "
     "stå framme i ett kök som gränsar till vardagsrummet.",
     "Ljudnivån är som mest 48 dB(A), så den kan stå framme i ett kök som "
     "gränsar till vardagsrummet."),
    ("b1a4244c",
     "Som mest 48 dB(A) enligt tillverkarens mätning — ungefär nivån på ett "
     "lågmält samtal.",
     "Som mest 48 dB(A) — ungefär nivån på ett lågmält samtal."),

    # ── Uppresningsfåtöljer ───────────────────────────────────────────────
    ("d2ca4c26",
     "Ryggstödet är 72 centimeter högt och 60 brett, och tillverkaren anger "
     "150–190 cm som lämplig användarlängd.",
     "Ryggstödet är 72 centimeter högt och 60 brett, och lämplig "
     "användarlängd är 150–190 cm."),
    ("d2ca4c26",
     "Tillverkaren anger 150–190 cm användarlängd och 150 kilo bärförmåga.",
     "Användarlängden är 150–190 cm och bärförmågan 150 kilo."),
    ("b0b76114",
     "Många modeller har ett reservbatteri för att kunna fällas ner; "
     "tillverkaren anger inte om den här har det, så utgå från att den inte "
     "har det.",
     "Många modeller har ett reservbatteri för att kunna fällas ner; det är "
     "inte angivet om den här har det, så utgå från att den inte har det."),
    ("46cc7e40",
     "Tillverkaren anger 150 kilo bärförmåga och att fåtöljen passar en "
     "användare upp till 190 centimeter lång.",
     "Bärförmågan är 150 kilo och fåtöljen passar en användare upp till "
     "190 centimeter lång."),
    ("4aaa62d4", "Tillverkaren anger 170 kilo.", "Bärförmågan är 170 kilo."),

    # ── Fordon för barn ───────────────────────────────────────────────────
    ("4080448d",
     "Det är tillverkarens uttryckliga anvisning, och den gäller alla "
     "skruvförband på ramen och styret.",
     "Det står uttryckligen i anvisningen, och det gäller alla skruvförband "
     "på ramen och styret."),
    ("4080448d",
     "Ja, och tillverkaren anger att en vuxen ska göra det.",
     "Ja, och en vuxen ska göra det."),
    ("0926604b",
     "Tillverkaren anger 6–12 år och en förarvikt på högst 50 kg.",
     "Rekommenderad ålder är 6–12 år, med en förarvikt på högst 50 kg."),
    ("0926604b",
     "Tillverkaren anger 6–12 år, med en förarvikt på högst 50 kg.",
     "Rekommenderad ålder är 6–12 år och förarvikten högst 50 kg."),

    # ── Sandlådor ─────────────────────────────────────────────────────────
    ("a60a5370",
     "Tillverkaren rekommenderar 3–8 år och två till fyra barn samtidigt.",
     "Rekommenderad ålder är 3–8 år, med två till fyra barn samtidigt."),
    ("978d0e5d", "Tillverkaren rekommenderar 3–6 år.",
     "Rekommenderad ålder är 3–6 år."),
    ("978d0e5d", "Tillverkaren anger omkring två timmar.",
     "Räkna med omkring två timmar."),
    ("c973c771",
     "Tillverkaren anger 113 kg sand, alltså ungefär fyra säckar om 30 kg.",
     "Lådan rymmer 113 kg sand, alltså ungefär fyra säckar om 30 kg."),
    ("2606fa30",
     "Sandytan är 110 × 88 cm och 17 cm djup, och tillverkaren anger 113 kg "
     "sand — ungefär fyra säckar om 30 kg.",
     "Sandytan är 110 × 88 cm och 17 cm djup, och lådan rymmer 113 kg sand — "
     "ungefär fyra säckar om 30 kg."),
    ("098b77f5",
     "Tillverkaren anger 110 kg sand, alltså knappt fyra säckar om 30 kg.",
     "Lådan rymmer 110 kg sand, alltså knappt fyra säckar om 30 kg."),
    ("7650694f",
     "Tillverkaren anger 200 kg sand, alltså knappt sju säckar om 30 kg.",
     "Lådan rymmer 200 kg sand, alltså knappt sju säckar om 30 kg."),
    ("7650694f", "Tillverkaren rekommenderar 3–8 år.",
     "Rekommenderad ålder är 3–8 år."),
    ("588ce016", "Tillverkaren rekommenderar inte användning i dåligt väder.",
     "Den ska inte användas i dåligt väder."),

    # ── Motorik, sängar, bokhyllor ────────────────────────────────────────
    ("1b2cef1f", "Tillverkaren anger tvåårsåldern som nedre gräns.",
     "Nedre gräns är tvåårsåldern."),
    ("1b2cef1f", "Tillverkaren anger från 2 år.", "Lägsta ålder är 2 år."),
    ("1b2cef1f", "Tillverkaren anger att MDF-skivorna håller den klassen.",
     "MDF-skivorna håller den klassen."),
    ("77460b11", "Tillverkaren anger 40 kilo.", "Maxlasten är 40 kilo."),
    ("77460b11", "Tillverkaren anger 3–6 år.",
     "Rekommenderad ålder är 3–6 år."),
    ("06ad0f91", "Tillverkaren anger 80 kilo.", "Maxlasten är 80 kilo."),
    ("06ad0f91",
     "Det är de två material tillverkaren anger, och tillsammans är de vad de "
     "80 kilona vilar på.",
     "Det är de två materialen, och tillsammans är de vad de 80 kilona vilar "
     "på."),
    ("06ad0f91",
     "Tillverkaren anger en madrass på 140 × 70 centimeter med 5 centimeters "
     "tjocklek — samma storlek som i en spjälsäng.",
     "Sängen tar en madrass på 140 × 70 centimeter med 5 centimeters tjocklek "
     "— samma storlek som i en spjälsäng."),
    ("160c1e93", "Tillverkaren anger tippskyddsbeslag och rundade hörn.",
     "Tippskyddsbeslag och rundade hörn ingår."),
    ("160c1e93", "Ja, tillverkaren anger tippskyddsbeslag.",
     "Ja, tippskyddsbeslag ingår."),
    ("cdb043b4",
     "Tillverkaren anger 3 år som lägsta ålder och 3–6 år som rekommenderat "
     "spann.",
     "Lägsta ålder är 3 år, med 3–6 år som rekommenderat spann."),
    ("cdb043b4",
     "Tillverkaren anger från 3 år, med 3–6 år som rekommenderat spann.",
     "Från 3 år, med 3–6 år som rekommenderat spann."),
    ("76430e8e", "Ja, tillverkaren anger tippskydd och rundade kanter.",
     "Ja, tippskydd ingår och kanterna är rundade."),
    ("76430e8e", "Tillverkaren anger tippskydd och rundade kanter.",
     "Tippskydd ingår och kanterna är rundade."),
    ("76430e8e",
     "Tillverkaren anger också att hyllan hör till en serie med fler möbler i "
     "samma formspråk.",
     "Hyllan hör dessutom till en serie med fler möbler i samma formspråk."),
    ("76430e8e",
     "Tillverkaren anger att hyllan hör till en serie i samma formspråk.",
     "Hyllan hör till en serie i samma formspråk."),
    ("dbf38846",
     "Tillverkaren anger 3 år som lägsta ålder och 3–8 år som rekommenderat "
     "spann.",
     "Lägsta ålder är 3 år, med 3–8 år som rekommenderat spann."),
    ("dbf38846", "Nej, tillverkaren anger rundade kanter.",
     "Nej, kanterna är rundade."),
    ("dbf38846", "Tillverkaren anger ungefär 30 minuter.",
     "Räkna med ungefär 30 minuter."),
    ("8832b73a", "Tillverkaren anger 3–8 år som rekommenderat spann.",
     "Rekommenderat spann är 3–8 år."),

    # ── Leksakshyllan: taggen sitter mitt i meningen ───────────────────────
    ("7cb38ae8",
     "Tillverkaren anger " + SPAN + "0,5 kilo per box</span> och 20 kilo för "
     "hela möbeln.",
     "Maxlasten är " + SPAN + "0,5 kilo per box</span> och 20 kilo för hela "
     "möbeln."),
    ("7cb38ae8",
     "Siffran står i tillverkarens egen spec, och den avgör mer om hur möbeln "
     "kan användas än något annat mått på den.",
     "Siffran står i specifikationen, och den avgör mer om hur möbeln kan "
     "användas än något annat mått på den."),
    ("7cb38ae8", "Tillverkaren anger E1 för den här möbeln.",
     "Den här möbeln är klassad E1."),
    ("okänd",
     "Tillverkaren anger tippskydd som ingår och beskriver det uttryckligen "
     "som ett skydd mot att hyllan välter.",
     "Tippskydd ingår, uttryckligen som ett skydd mot att hyllan välter."),
    ("okänd",
     "Tillverkaren anger tippskydd och beskriver det som ett skydd mot att "
     "hyllan välter.",
     "Tippskydd ingår som ett skydd mot att hyllan välter."),
    ("okänd",
     "Tyglådorna torkas av eller borstas rena; de tål inte maskintvätt om "
     "inte tillverkaren anger det.",
     "Tyglådorna torkas av eller borstas rena; de tål inte maskintvätt."),
    ("okänd", "Tillverkaren anger 50 kilo som maxlast för möbeln.",
     "Maxlasten för möbeln är 50 kilo."),
    ("okänd", "Tillverkaren anger möbeln som lämplig för barn 3–12 år.",
     "Möbeln är lämplig för barn 3–12 år."),
    ("okänd", "Tillverkaren anger 3–12 år.",
     "Rekommenderad ålder är 3–12 år."),
    ("okänd",
     "Tillverkaren godkänner fåtöljen från 18 månaders ålder och "
     "rekommenderar den för åldrarna 1,5–3 år.",
     "Fåtöljen är godkänd från 18 månaders ålder och rekommenderas för "
     "åldrarna 1,5–3 år."),
]
