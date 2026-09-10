# -*- coding: utf-8 -*-
"""Runda 116 — ENDA källan till rundans tal, färger och löften.

☠️ TVÅ GRUPPER MED SAMMA TAL PÅ SEX AXLAR, OCH ÄNDÅ OLIKA MASKINER.
   Grupp B:s spec säger 77 × 44 × 102, liggdel 55 × 35 × 50, korg 47 × 30 × 20,
   10 kg — ordagrant samma som den PUBLICERADE `hundvagn-regnskydd-mugghallare`.
   Måttritningarna avgjorde: grupp B har TRE hjul (ett fram, två bak), den
   publicerade sidan FYRA (två små framhjul). Samma tal, olika chassin —
   uppgift #407:s klass, den här gången med en ritning som bevis.

☠️ TALET 4 KG BETYDER OLIKA SAKER I DE TVÅ GRUPPERNA, och det är den
   farligaste förväxlingen i rundan:

   - Grupp A: 4 kg är HUNDENS maxvikt.
   - Grupp B: leverantörens brödtext skriver "Leicht (4 kg)" om VAGNEN — och
     spec-kolumnen säger 5,9 kg. Talet är alltså både fel OCH förväxlingsbart.

   Därför får `4 kg` aldrig stå i grupp B:s text. Textgrinden fäller på det.
"""

# ── Grupp A: fyrhjulig kompaktvagn, hundens maxvikt 4 kg ──────────────────
A = ["40f46441", "adc81917", "cbb38884"]
# ── Grupp B: trehjuling med korg och kudde, hundens maxvikt 10 kg ─────────
B = ["eb02039b", "3b0aca0a", "1f311250", "0fdf9aba"]
ALLA = A + B

GRUPP = {k: ("A" if k in A else "B") for k in ALLA}

# ☠️ FÄRGEN ÄR LÄST UR EN ZOOM, inte ur leverantörens fält. `1f311250` står som
#    "Kaffee" hos leverantören medan renderingen är tydligt DAMMROSA
#    (medel-RGB 144,125,118 på ett rent tygparti). Kunden köper det hon ser på
#    fotot, och fotot är leverantörens egen rendering av just den artikeln.
FARG = {
    "40f46441": "röd",
    "adc81917": "grå",
    "cbb38884": "blå",
    "eb02039b": "röd",
    "3b0aca0a": "blå",
    "1f311250": "dammrosa",
    "0fdf9aba": "ljusgrå",
}

# ☠️ BESTÄMD FORM ÄR EN TABELL, INTE ETT PÅHÄNGT "a". `FARG[k] + "a"` gav
#    **"den dammrosaa hundvagnen"** i alt-texten — och textgrinden såg
#    ingenting, för ett böjningsfel är varken ett tal, ett märke eller ett
#    förbjudet ord. Det som fångade det var att texten låg i en FIL och lästes
#    med ögon; `dammrosa` är dessutom oböjligt, vilket ingen regel kan gissa.
FARG_BEST = {
    "40f46441": "röda",
    "adc81917": "grå",
    "cbb38884": "blå",
    "eb02039b": "röda",
    "3b0aca0a": "blå",
    "1f311250": "dammrosa",
    "0fdf9aba": "ljusgrå",
}

# Måtten per grupp. Alla tal kommer ur produktens egen spec ELLER ur
# måttritningen; ingenting är räknat fram eller avrundat.
MATT = {
    "A": {
        "yttermatt": "67 × 45 × 96 cm",
        "hopfalld": "86 × 45 × 24 cm",
        "invandigt": "52 × 32 × 48 cm med sufflett, 52 × 32 × 22 cm utan",
        "liggdel": "52 × 32 cm",
        "natfonster": "26 × 17 cm fram och bak",
        "korg": "36 × 25 × 12 cm",
        "hjul": "6 tum",
        "maxvikt_hund": "4 kg",
        "kroppslangd": "32 cm",
        "vikt": "6,1 kg",
    },
    "B": {
        "yttermatt": "77 × 44 × 102 cm",
        "hopfalld": "87 × 44 × 30 cm",
        "invandigt": "55 × 35 × 50 cm med sufflett, 55 × 35 × 25 cm utan",
        "liggdel": "55 × 35 cm",
        "natfonster": "20 × 18 cm fram, 19 × 26 cm bak",
        "korg": "47 × 30 × 20 cm",
        "bakdorr": "33 × 40 cm",
        "hjul": "17 cm",
        "maxvikt_hund": "10 kg",
        "vikt": "5,9 kg",
    },
}

# Paketmått per produkt. ⚠️ Grupp B levereras i TVÅ olika kartonger trots att
# produktmåtten är identiska på sex axlar — röd och dammrosa i den ena, blå och
# ljusgrå i den andra. Det är en packningsdetalj hos leverantören, inte ett
# tecken på två modeller: måttritningen är densamma för alla fyra.
PAKET = {
    "40f46441": "38 × 18,5 × 84 cm",
    "adc81917": "38 × 18,5 × 84 cm",
    "cbb38884": "38 × 18,5 × 84 cm",
    "eb02039b": "38 × 19 × 82 cm",
    "1f311250": "38 × 19 × 82 cm",
    "3b0aca0a": "39 × 17 × 75,5 cm",
    "0fdf9aba": "39 × 17 × 75,5 cm",
}

# Konstruktion — det som skiljer grupperna åt för kunden.
HJULBILD = {
    "A": "fyra hjul: två svängbara framhjul och två bakhjul med broms",
    "B": "tre hjul: ett svängbart framhjul och två bakhjul med broms",
}

MATERIAL = {"A": "stålram med klädsel i oxfordtyg",
            "B": "stålram med klädsel i oxfordtyg och nätpaneler i nylon"}

# ☠️ LEVERANSOMFATTNINGEN ÄR KONTRAKTET. Båda grupperna: vagnen + anvisning.
#    Ingen skål, ingen kudde som separat tillbehör, inget regnskydd.
INGAR = {k: ["vagnen", "monterings- och bruksanvisning"] for k in ALLA}

# Egenskaper som FÅR skrivas, per grupp. Allt annat är påhitt.
EGENSKAPER = {
    "A": ["sufflett i fyra lägen", "nätfönster fram och bak",
          "två säkerhetskopplingar", "mugghållare på handtaget",
          "förvaringskorg under sitsen", "viks ihop med ett handgrepp"],
    "B": ["reflexband", "nätfönster fram och bak", "två säkerhetskopplingar",
          "mugghållare på handtaget", "stor förvaringskorg under sitsen",
          "bakdörr med dragkedja", "vadderad liggdel"],
}

# ⚠️ Grupp B kräver montering, grupp A gör det inte. Leverantörens egen text
#    säger "Montage erforderlich" bara på B.
MONTERING = {"A": False, "B": True}

# Publicerade FÄRGSYSKON — samma chassi, redan live. Måste korslänkas, och
# deras sökord får inte tas.
SYSKON_LIVE = {
    "A": ("hundvagn-hopfallbar-liten-hund-sufflett-broms",
          "hopfällbara hundvagnen i svart"),
    "B": None,          # ingen publicerad sida delar grupp B:s chassi
}

# Publicerade GRANNAR som slåss om samma ord utan att vara samma vara.
GRANNAR = {
    "hundvagn-tre-hjul-lasbart-framhjul": "joggingvagn med stora ekerhjul, 10 kg",
    "hundvagn-regnskydd-mugghallare": "fyrhjulig vagn med regnskydd, 10 kg",
}


def kontroll():
    """☠️ FÄLLER om tabellerna glider isär eller om ett tal saknar hemvist."""
    if sorted(FARG) != sorted(ALLA):
        raise SystemExit("☠️ FARG täcker inte exakt rundans sju produkter")
    if len(set(FARG[k] for k in A)) != len(A):
        raise SystemExit("☠️ TVÅ PRODUKTER I GRUPP A DELAR FÄRGNAMN")
    if len(set(FARG[k] for k in B)) != len(B):
        raise SystemExit("☠️ TVÅ PRODUKTER I GRUPP B DELAR FÄRGNAMN")
    for g in ("A", "B"):
        for f in ("yttermatt", "hopfalld", "invandigt", "korg", "hjul",
                  "maxvikt_hund", "vikt"):
            if not MATT[g].get(f):
                raise SystemExit(f"☠️ MATT[{g}] saknar {f}")
    # ☠️ Den farliga förväxlingen: 4 kg får inte finnas som tal i grupp B.
    if "4 kg" in " ".join(MATT["B"].values()):
        raise SystemExit("☠️ TALET 4 KG STÅR I GRUPP B — det är grupp A:s "
                         "hundvikt och leverantörens felaktiga vagnvikt")
    if MATT["A"]["hjul"] == MATT["B"]["hjul"]:
        raise SystemExit("☠️ GRUPPERNA HAR SAMMA HJULSTORLEK — kontrollera "
                         "att raderna inte kopierats")
    if not MONTERING["B"] or MONTERING["A"]:
        raise SystemExit("☠️ MONTERING är omkastad mot leverantörens text")
    if sorted(FARG_BEST) != sorted(ALLA):
        raise SystemExit("☠️ FARG_BEST täcker inte exakt rundans sju produkter")
    for k, v in FARG_BEST.items():
        if v.endswith("aa") or not v.startswith(FARG[k][:3]):
            raise SystemExit(f"☠️ {k}: bestämd form {v!r} ser ut som ett "
                             f"påhängt 'a' på {FARG[k]!r}")
    if sorted(PAKET) != sorted(ALLA):
        raise SystemExit("☠️ PAKET täcker inte exakt rundans sju produkter")
    print(f"matt.kontroll: {len(A)} i grupp A, {len(B)} i grupp B, "
          f"{len(set(FARG.values()))} distinkta färgnamn   OK")


if __name__ == "__main__":
    kontroll()
    for g, ks in (("A", A), ("B", B)):
        print(f"\n── grupp {g} — {HJULBILD[g]}")
        print(f"   {MATT[g]['yttermatt']}, hopfälld {MATT[g]['hopfalld']}, "
              f"hund upp till {MATT[g]['maxvikt_hund']}, vagnen väger "
              f"{MATT[g]['vikt']}")
        for k in ks:
            print(f"   {k}  {FARG[k]}")
