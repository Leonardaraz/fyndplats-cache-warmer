# -*- coding: utf-8 -*-
"""Runda 122 Steg 9 — en alt-text per bild, skriven efter att bilden granskats.

Alla tjugo bilder är genomgångna. Utfallet:

  * **Noll tysk text i pixlarna.** Ingen av de tjugo bär inbränd säljtext.
  * **Noll leverantörslogotyper**, varken i övre vänstra hörnet eller någon
    annanstans (uppgift #282).
  * ⚠️ `CAUTION / ACHTUNG / ATTENTION / CUIDADO` är GJUTET i hinkarnas plast
    på samtliga modeller. Det sitter FYSISKT på varan — Leonards regel:
    "om märket sitter fysiskt på varan så gör vi inget åt det, det är så
    produkten ser ut". Ingen bild plockas bort för det.
  * ☠️ Tre livsstilsbilder visar mopp, trasor och sprayflaskor som INTE ingår
    (`0cbffcd9` bild 2 och 4, `740fa6d0` bild 2). Det är hanterat i texten,
    inte genom att ta bort bilden — de är de enda bilderna som visar vagnen
    i bruk, och en produkt utan bruksbild säljer sämre.
"""

# Inga bilder plockas bort i den här rundan.
BEHALL = {}

ALT = {
    "6490e360": [
        "Moppvagn med blå och röd hink och press mellan dem, på grått chassi med fyra hjul",
        "Moppvagnen står på ett trägolv i ett kök, med båda hinkarna på plats",
        "Måttritning: vagnen 73 × 45 × 92 cm och hinken 37,5 × 35 × 31,5 cm",
        "Närbild på det grå skjuthandtaget och pressens svarta greppgummi",
        "Närbild på chassit underifrån med två av de fyra svängbara hjulen",
    ],
    "0cbffcd9": [
        "Städvagn med grå ram, blå sopsäck med lock, två plan och orange och blå hink",
        "Städvagnen används i en korridor, med mopp och skaft som inte ingår",
        "Måttritning: vagnen 111 cm lång, 63,3 cm bred och 103 cm hög",
        "Närbild på pressen mellan den orange och den blå hinken, med flaskor på övre planet",
        "Pressen används: moppen trycks ur ner i den orange hinken",
    ],
    "740fa6d0": [
        "Städvagn med svart ram, blå sopsäck med lock, två plan och orange och blå hink",
        "Städvagnen står i ett ljust rum lastad med mopp, trasor och flaskor som inte ingår",
        "Måttritning: vagnen 111 cm lång, 63,3 cm bred och 103 cm hög",
        "Närbild på det svarta chassit med två av de fem hjulen och hinkarnas nederkant",
        "Närbild på den öppna svarta backen som hänger på mellanplanet",
    ],
    "832f9eec": [
        "Städvagn med ljus ram, två stora hinkar med press och två små i trådkorg",
        "Städvagnen används på ett golv med moppskaft och moppställ som inte ingår",
        "Måttritning: vagnen 93 cm lång, 80 cm bred och 97 cm hög",
        "Närbild på den blå sopsäckens överkant med tryckknappar och bärande ram",
        "Närbild på ett av de fyra hjulen med metallaxel och blå hjulkåpa",
    ],
}

if __name__ == "__main__":
    fel = []
    for pid, rader in ALT.items():
        if len(rader) != 5:
            fel.append(f"{pid}: {len(rader)} alt-texter, väntade 5")
        for i, t in enumerate(rader, 1):
            if not t.strip():
                fel.append(f"{pid} bild {i}: tom alt-text")
            if len(t) > 125:
                fel.append(f"{pid} bild {i}: {len(t)} tecken (max 125)")
    print(f"{sum(len(v) for v in ALT.values())} alt-texter, {len(fel)} fel")
    for f in fel:
        print("  ☠️", f)
