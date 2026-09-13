# -*- coding: utf-8 -*-
"""Runda 142 — namn, slug, SEO och brödtext för elva boxningsprodukter.

☠️ TEXTEN SKRIVS I EN FIL FÖRST. Batch 64 mätte nio fel mot noll: en sträng
som skrivs direkt i ett JSON-anrop kan inte läsas av en grind innan den lämnar
chatten, och API-svaret ekar tillbaka exakt det man skrev.

⚠️ ORDNINGEN I HTML:EN ÄR INTE FRI. `splitFlikar` lägger allt EFTER en
flikrubrik i den fliken, ända till nästa. Korslänken står därför FÖRE
`<h2>Tekniska specifikationer</h2>`, aldrig efter (runda 120).
"""

BAS = "https://www.fyndplats.se/produkt/"

SLUG = {
    "56cca82a": "punchingboll-125-145-cm-handskar",
    "ce8813ce": "punchingboll-133-151-cm-svart",
    "93073695": "punchingboll-viktsack-125-145-cm",
    "4fe5959f": "punchingboll-136-154-cm-fyra-lagen",
    "136a4671": "punchingboll-147-165-cm-fyllbar-fot",
    "2730de6f": "punchingboll-145-180-cm-svart",
    "2a13cbbe": "punchingboll-reflexstang-160-205-cm",
    "95f6280b": "boxningssack-135-cm-sugproppar",
    "c8f6b93f": "boxningssack-rod-155-205-cm-reflexstang",
    "a8daef42": "boxningssack-svart-155-205-cm-reflexstang",
    "f0430bc5": "boxningsstation-160-230-cm-svart",
}

# SKU:n ar RAKNAD ur husregeln (grindar.sku_bas), aldrig skriven for hand
# (#483). Noll krockar mot 2 746 publicerade sidor och mot batchen internt.
SKU = {
    "56cca82a": "FP-punchingboll-125-145-cm",
    "ce8813ce": "FP-punchingboll-133-151-cm",
    "93073695": "FP-punchingboll-viktsack",
    "4fe5959f": "FP-punchingboll-136-154-cm",
    "136a4671": "FP-punchingboll-147-165-cm",
    "2730de6f": "FP-punchingboll-145-180-cm",
    "2a13cbbe": "FP-punchingboll-reflexstang",
    "95f6280b": "FP-boxningssack-135-cm",
    "c8f6b93f": "FP-boxningssack-rod-155-205",
    "a8daef42": "FP-boxningssack-svart-155",
    "f0430bc5": "FP-boxningsstation-160-230",
}

WIX_VARIANT = {
    "56cca82a": "7044b243-828b-48f4-9d53-528c643d565c",
    "ce8813ce": "778959b6-18c9-4e4f-a5a3-ea1cc0d47320",
    "93073695": "80c9781b-da84-43b5-8855-0c448ceb8924",
    "4fe5959f": "38d2d1c8-3664-4eb5-84b8-79cb3516ad12",
    "136a4671": "48413f26-8d61-426a-a1d7-095212067395",
    "2730de6f": "e85cf854-1446-41a5-abf1-08a9001274da",
    "2a13cbbe": "70b68e86-4970-4b69-8608-7566f9911d76",
    "95f6280b": "5b2d8031-b902-4f0c-abcd-3586d8c7d1c9",
    "c8f6b93f": "32518749-0725-46c2-b521-f102cb53630c",
    "a8daef42": "a0f41058-35b1-43ac-ba21-26cba23364fc",
    "f0430bc5": "556460ee-b373-4b75-9ff4-86443f4583b2",
}

NAMN = {
    "56cca82a": "Punchingboll 125–145 cm med boxhandskar och pump, fyra höjder",
    "ce8813ce": "Punchingboll 133–151 cm svart med sugpropp och fjädrande stång",
    "93073695": "Punchingboll 125–145 cm med viktsäck på 15 kg och boxhandskar",
    "4fe5959f": "Punchingboll 136–154 cm i fyra lägen med boxhandskar",
    "136a4671": "Punchingboll 147–165 cm med fyllbar fot och sugproppar",
    "2730de6f": "Punchingboll 145–180 cm svart med fyllbar fot",
    "2a13cbbe": "Punchingboll med reflexstång 160–205 cm och 12 sugproppar",
    "95f6280b": "Fristående boxningssäck 135 cm med tio sugproppar, förfylld",
    "c8f6b93f": "Boxningssäck röd 155–205 cm med roterande arm och boll",
    "a8daef42": "Boxningssäck svart 155–205 cm med roterande arm och boll",
    "f0430bc5": "Boxningsstation 160–230 cm svart med två bollar och reflexstång",
}

TITEL = {
    "56cca82a": "Punchingboll 125–145 cm med handskar och pump | Fyndplats",
    "ce8813ce": "Punchingboll 133–151 cm svart med sugpropp | Fyndplats",
    "93073695": "Punchingboll med viktsäck 15 kg, 125–145 cm | Fyndplats",
    "4fe5959f": "Punchingboll 136–154 cm i fyra lägen | Fyndplats",
    "136a4671": "Punchingboll 147–165 cm med fyllbar fot | Fyndplats",
    "2730de6f": "Punchingboll 145–180 cm svart | Fyndplats",
    "2a13cbbe": "Punchingboll med reflexstång 160–205 cm | Fyndplats",
    "95f6280b": "Fristående boxningssäck 135 cm, förfylld | Fyndplats",
    "c8f6b93f": "Boxningssäck röd 155–205 cm med roterande arm | Fyndplats",
    "a8daef42": "Boxningssäck svart 155–205 cm med roterande arm | Fyndplats",
    "f0430bc5": "Boxningsstation 160–230 cm med två bollar | Fyndplats",
}

META = {
    "56cca82a": ("Punchingboll i fyra höjder mellan 125 och 145 cm. Foten "
                 "fylls med 15 kg vatten eller 20 kg sand. Boxhandskar och "
                 "luftpump ingår."),
    "ce8813ce": ("Svart punchingboll som ställs mellan 133 och 151 cm. Foten "
                 "rymmer 16,5 kg vatten eller 33 kg sand och har sugpropp i "
                 "botten. Handskar och pump ingår."),
    "93073695": ("Punchingboll 125–145 cm med en viktsäck på 15 kg runt foten "
                 "för extra stadga. Foten fylls med 12 kg vatten eller 20 kg "
                 "sand. Handskar och pump ingår."),
    "4fe5959f": ("Punchingboll med fyra fasta höjder: 136, 142, 148 och "
                 "154 cm. Foten är 48 cm bred, fylls med vatten eller sand och "
                 "har sugproppar. Boxhandskar ingår."),
    "136a4671": ("Punchingboll som ställs mellan 147 och 165 cm. Foten rymmer "
                 "15 kg vatten, 25 kg sand eller 20 kg av båda och sitter fast "
                 "med sugproppar mot släta golv."),
    "2730de6f": ("Svart punchingboll med stor höjdmarginal: 145 till 180 cm. "
                 "Foten fylls med 15 kg vatten eller 25 kg sand och har "
                 "sugproppar i botten."),
    "2a13cbbe": ("Punchingboll med roterande reflexstång på 95–140 cm höjd. "
                 "Ställs mellan 160 och 205 cm, foten har 12 sugproppar "
                 "och fylls med vatten eller sand."),
    "95f6280b": ("Förfylld boxningssäck på 135 cm som står fritt på golvet "
                 "med tio sugproppar. Ingen fyllning och ingen borrning "
                 "behövs — säcken är klar att använda."),
    "c8f6b93f": ("Röd boxningssäck med roterande arm och boll, justerbar "
                 "mellan 155 och 205 cm. Foten rymmer 30 kg vatten eller "
                 "35 kg sand. Pump och innerhandskar ingår."),
    "a8daef42": ("Svart boxningssäck med roterande arm och boll, justerbar "
                 "mellan 155 och 205 cm. Foten rymmer 30 kg vatten eller "
                 "35 kg sand. Pump och innerhandskar ingår."),
    "f0430bc5": ("Boxningsstation med säck, två bollar och reflexstång på "
                 "samma pelare. Höjden ställs mellan 160 och 230 cm. Foten "
                 "fylls med 30 kg vatten eller 45 kg sand."),
}

SOKORD = {
    "56cca82a": ["punchingboll", "punchingboll med handskar", "boxboll ställ"],
    "ce8813ce": ["punchingboll", "punchingboll svart", "boxboll höjdjusterbar"],
    "93073695": ["punchingboll", "punchingboll med viktsäck", "boxboll hemma"],
    "4fe5959f": ["punchingboll", "punchingboll fyra höjder", "boxboll golv"],
    "136a4671": ["punchingboll", "punchingboll fyllbar fot", "boxboll sugproppar"],
    "2730de6f": ["punchingboll", "punchingboll 180 cm", "boxboll svart"],
    "2a13cbbe": ["punchingboll med reflexstång", "reflexstång boxning",
                 "punchingboll"],
    "95f6280b": ["fristående boxningssäck", "boxningssäck utan borrning",
                 "boxningssäck 135 cm"],
    "c8f6b93f": ["boxningssäck med roterande arm", "fristående boxningssäck",
                 "boxningssäck röd"],
    "a8daef42": ["boxningssäck med roterande arm", "fristående boxningssäck",
                 "boxningssäck svart"],
    "f0430bc5": ["boxningsstation", "fristående boxningssäck med speedball",
                 "boxningsstation hemma"],
}
