# -*- coding: utf-8 -*-
"""Runda 137 — FACIT. Varje tal här är LÄST ur leverantörens `Technische
Daten` eller ur måttritningen (källposition 3), aldrig härlett.

☠️ DEN SVENSKA SPEC-RADEN ÄR INTE EN KÄLLA. Importen skriver en `Material`-rad
   som motsäger den tyska på SJU av åtta produkter — `Polyester` där källan
   säger lammull och sisal, och `Sparticles, Sisal, Plush, Felt` (engelska,
   plus ett ord som inte finns) på `f5f71f5d`. Bygg ur TYSKAN.

☠️ `Vikt` i den svenska raden är FRAKTVIKTEN, inte varans (uppgift #488).
   Den står därför inte i den här filen och får inte nå kundtexten.
"""

WIX = {
    "c7bd00b9": "c7bd00b9-22b6-4973-b5cb-a85fc19200a0",
    "a73a1a1c": "a73a1a1c-fe9d-4080-bc29-45a97d000ebd",
    "f5f71f5d": "f5f71f5d-9db1-4361-8c2e-8c7fa6c41128",
    "dd3b541b": "dd3b541b-339c-4c12-90f9-0bd2fdaee06b",
    "f489937f": "f489937f-8076-4423-8aec-ea8fa9b6d68c",
    "5616c567": "5616c567-5370-410c-b29d-177d1823c29a",
    "1ae60dbc": "1ae60dbc-2a66-4211-9bd7-be8323576d26",
    "819bf51c": "819bf51c-59b0-454d-b30b-de530a004e85",
}

VARIANT = {
    "c7bd00b9": "9a405133-a6d3-4d70-8c80-08556af4c2b1",
    "a73a1a1c": "b89497aa-395e-44f2-95e6-dc748181f8b2",
    "f5f71f5d": "0bd3af3a-36b8-470f-886b-74097f7636f9",
    "dd3b541b": "4b8a1ce1-6fd0-4815-8b46-8ffafd7ea553",
    "f489937f": "63567503-9299-4ee1-8781-d68d00f5ca51",
    "5616c567": "3edb7d4f-ba1d-4dce-8564-765fbfc13fa9",
    "1ae60dbc": "8319fb50-7103-428f-bad4-5324fabd157e",
    "819bf51c": "b74f5dee-4fe8-4a8c-8a4e-30c9e04406b1",
}

# Läst 2026-09-12. Steg 13 läser tillbaka mot de här talen — priset rörs aldrig.
PRIS = {
    "c7bd00b9": 1199, "a73a1a1c": 1119,
    "f5f71f5d": 849,  "dd3b541b": 859,
    "f489937f": 859,  "5616c567": 819,
    "1ae60dbc": 839,  "819bf51c": 879,
}

# (rätt huvudord, [ord som INTE får stå i namn/titel/meta])
TYP = {
    "c7bd00b9": ("klösträd", ["klöstunna", "klöstorn", "klöspelare", "husdjurstrappa"]),
    "a73a1a1c": ("klösträd", ["klöstunna", "klöstorn", "klöspelare", "husdjurstrappa"]),
    "f5f71f5d": ("klösträd", ["klöstunna", "klöstorn", "klöspelare", "husdjurstrappa"]),
    "dd3b541b": ("klösträd", ["klöstunna", "klöstorn", "klöspelare", "husdjurstrappa"]),
    "f489937f": ("klöspelare", ["klöstunna", "klöstorn", "klösträd", "husdjurstrappa"]),
    "5616c567": ("klöspelare", ["klöstunna", "klöstorn", "klösträd", "husdjurstrappa"]),
    "1ae60dbc": ("husdjurstrappa", ["klöstunna", "klöstorn", "klösträd"]),
    "819bf51c": ("husdjurstrappa", ["klöstunna", "klöstorn", "klösträd"]),
}

# Färgen som kunden FAKTISKT får, avläst ur bild 1 och 2 — inte ur den
# svenska spec-raden, som står kvar på tyska på alla åtta.
FARG = {
    "c7bd00b9": "ek och cremevit",
    "a73a1a1c": "grått och cremevitt",
    "f5f71f5d": "cremevitt",
    "dd3b541b": "grått",
    "f489937f": "mörkgrått med ljusgrå kudde",
    "5616c567": "ljusbrunt med gräddvit kudde",
    "1ae60dbc": "beige",
    # ☠️ Tre kanaler, tre svar: spec `Grau`, alt-text `schwarz+grau`,
    #    bilden ljusgrå steg + mörkgrå stammar. Bilden vinner.
    "819bf51c": "ljusgrått med mörkgrå stammar",
}

# Alla tal som får förekomma i texten, per produkt. Ett tal utanför listan
# är ett OHÄRLETT TAL och fälls av grinden.
TAL = {
    # Gesamtmaße 40 × 40 × 230–250 · bas 40 × 40 · sittpinne Ø34
    # kudde 32,5 × 20 × 0,5 · hängmatta Ø30 × 12 · stolpe Ø8,5 · katt < 5 kg
    "c7bd00b9": {40, 230, 250, 34, 32.5, 20, 0.5, 30, 12, 8.5, 5},
    "a73a1a1c": {40, 230, 250, 34, 32.5, 20, 0.5, 30, 12, 8.5, 5},
    # Gesamtmaße 48 × 48 × 90 · koja 30 × 30 × 28 · ingång Ø18
    # plan 2: 48 × 48 · hängmatta 35 × 35 · toppbädd 48 × 28 × 8
    # stolpe Ø5,5 · boll Ø4 × 10 · katt < 4 kg
    "f5f71f5d": {48, 90, 30, 28, 18, 35, 8, 5.5, 4, 10},
    "dd3b541b": {48, 90, 30, 28, 18, 35, 8, 5.5, 4, 10},
    # Gesamtmaße 45 × 45 × 91 · topplatta 45 × 36 × 8 · bottenplatta 45 × 45
    # mellanplan Ø35,5 · pelare Ø16,5 · bär 10 kg · katt < 5 kg
    "f489937f": {45, 91, 36, 8, 35.5, 16.5, 10, 5},
    "5616c567": {45, 91, 36, 8, 35.5, 16.5, 10, 5},
    # Gesamtmaße 60 × 40 × 66 · steg 40 × 15 (1:a/4:e), 40 × 30 (2:a/3:e)
    # stephöjd 18 / 33 / 50 / 66 · hus invändigt 38 × 27 × 30 · ingång Ø16
    # boll Ø4 · stam Ø2,5 (huset) och Ø6,7 (övriga) · katt upp till 5 kg
    "1ae60dbc": {60, 40, 66, 15, 30, 18, 33, 50, 38, 27, 16, 4, 2.5, 6.7, 5},
    "819bf51c": {60, 40, 66, 15, 30, 18, 33, 50, 38, 27, 16, 4, 2.5, 6.7, 5},
}

# Par av färgsyskon — varje sida ska korslänka till sitt syskon ÅT BÅDA HÅLL
# (uppgift #480: en enkelriktad korslänk är ett halvgjort jobb).
SYSKON = {
    "c7bd00b9": "a73a1a1c", "a73a1a1c": "c7bd00b9",
    "f5f71f5d": "dd3b541b", "dd3b541b": "f5f71f5d",
    "f489937f": "5616c567", "5616c567": "f489937f",
    "1ae60dbc": "819bf51c", "819bf51c": "1ae60dbc",
}

# ☠️ ORD SOM INTE FÅR NÅ KUNDTEXTEN, med skälet. Se STEG2-5.md.
FORBJUDNA_PASTAENDEN = {
    # dd3b541b:s tyska text säger `Katzentoilette`; bilden visar en sluten
    # koja med Ø18 cm-hål och en katt liggande inne i den. Syskonet säger
    # `Katzenhöhle`. Texten är hopklistrad från en annan produkt.
    "dd3b541b": ["kattlåda", "toalett", "kattoalett"],
    # `höhenverstellbar` står i Beschreibung OCH i båda alt-texterna, men
    # Technische Daten ger FASTA stephöjder och bilden en styv ram. Det som
    # källan stödjer är att trappan kan byggas med tre steg i stället för
    # fyra — skriv det, inte marknadsordet.
    "1ae60dbc": ["höjdjusterbar", "höjdställbar", "steglös"],
    "819bf51c": ["höjdjusterbar", "höjdställbar", "steglös"],
}

# ⚠️ Stammarnas material är INTE avgjort. 1ae60dbc:s närbild visar jutevarv;
#    819bf51c:s visar en jämn mörkgrå yta utan varv, och Technische Daten är
#    identisk för båda. Ingen av sidorna påstår därför ett stammaterial —
#    bara grovleken, som är mätt.
OAVGJORT = {
    "1ae60dbc": "stammaterial (jute i bild, ej i spec)",
    "819bf51c": "stammaterial (mörkgrå yta, ej i spec)",
}

if __name__ == "__main__":
    fel = []
    for pid in WIX:
        for d in (VARIANT, PRIS, TYP, FARG, TAL, SYSKON):
            if pid not in d:
                fel.append("%s saknas i en facit-tabell" % pid)
        if SYSKON.get(SYSKON.get(pid)) != pid:
            fel.append("%s: syskonlänken går inte åt båda håll" % pid)
    for x in fel:
        print("☠️", x)
    print("matt.py: %d produkter, %d fel" % (len(WIX), len(fel)))
    raise SystemExit(1 if fel else 0)
